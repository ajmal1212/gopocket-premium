import { getCurrentFrappeDateTime, getFrappeInstance, getFrappeToken, getFrappeUrl } from "./frappe";

/**
 * Client for the `IPO` doctype on the Frappe site.
 *
 * The three statuses are not three views of one record shape - they carry
 * genuinely different fields, and the UI has to reflect that:
 *
 *   Open      bid_start/bid_end_timestamp, isin, overall_subscription and the
 *             `ipo_categories` child table (price band + lot size). No
 *             opening_date/closing_date, no rta_link.
 *   Upcoming  logo and (usually) document_url, nothing more. Only a couple
 *             have a bid_start_timestamp; the rest have no dates at all.
 *   Closed    opening/closing/allotment dates, listing_timestamp, issue_price,
 *             listing_price, listing_return and rta_link.
 *
 * Every timestamp is a naive "YYYY-MM-DD HH:MM:SS" string in IST. They are
 * parsed by string surgery rather than `new Date()` because Cloudflare Workers
 * run in UTC - constructing a Date would shift a 00:00 date across the day
 * boundary and break the "last day" badge by 5.5 hours.
 */

/** One row of the `ipo_categories` child table (doctype: `IPO Category`). */
export interface IpoCategoryRow {
  name?: string;
  idx?: number;
  category?: string;
  category_label?: string;
  category_sub_text?: string;
  lot_size?: number;
  min_bid_quantity?: number;
  min_price?: number;
  max_price?: number;
  bid_cut_off_timestamp?: string | null;
}

export interface IpoDoc {
  name: string;
  company_name?: string;
  symbol?: string;
  search_id?: string;
  isin?: string | null;
  company_code?: number;
  status?: string;
  is_sme?: number;
  is_listed?: number;
  is_pre_apply?: number;
  logo_url?: string | null;
  document_url?: string | null;
  rta_link?: string | null;
  issue_price?: number;
  listing_price?: number;
  listing_return?: number;
  overall_subscription?: number;
  tick_size?: number;
  opening_date?: string | null;
  closing_date?: string | null;
  allotment_date?: string | null;
  listing_timestamp?: string | null;
  bid_start_timestamp?: string | null;
  bid_end_timestamp?: string | null;
  ipo_categories?: IpoCategoryRow[];
  modified?: string;
}

export interface IpoCategory {
  id: string;
  code: string;
  label: string;
  subText: string;
  lotSize: number;
  minBidQuantity: number;
  minPrice: number;
  maxPrice: number;
  /** Lot size x the top of the band - what one lot actually costs at cut-off. */
  minInvestment: number;
  cutOff: string;
}

export type IpoStatus = "Open" | "Upcoming" | "Closed";

export interface FormattedIpo {
  id: string;
  name: string;
  symbol: string;
  isin: string;
  status: IpoStatus;
  isSme: boolean;
  isPreApply: boolean;
  isListed: boolean;
  logo: string;
  documentUrl: string;
  rtaLink: string;

  /** Display-ready band, e.g. "₹79 - ₹84". "" when no category rows exist. */
  priceBand: string;
  minPrice: number;
  maxPrice: number;
  /** Retail lot, taken from the IND / IND_SME row when present. */
  lotSize: number;
  minInvestment: number;
  categories: IpoCategory[];

  /** 0 means "not reported yet" - the UI shows a dash, never "0.00x". */
  subscription: number;
  subscriptionLabel: string;

  issuePrice: number;
  listingPrice: number;
  listingReturn: number;

  /** Raw "YYYY-MM-DD" (or "") for sorting; the *Label fields are for display. */
  openDate: string;
  closeDate: string;
  allotmentDate: string;
  listingDate: string;
  openLabel: string;
  closeLabel: string;
  allotmentLabel: string;
  listingLabel: string;

  /**
   * Whether the row has anything to expand into. False for issues that carry
   * only a logo and an offer-document link, whose panel would be empty.
   */
  hasDetail: boolean;

  /** True when bidding closes today in IST. Drives the "Last day" badge. */
  isLastDay: boolean;
}

/* -------------------------------------------------------------------------- */
/* Formatting helpers                                                          */
/* -------------------------------------------------------------------------- */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Pulls the date half out of a Frappe timestamp: "2026-09-16 17:00:00" -> "2026-09-16". */
function datePart(value?: string | null): string {
  const match = (value || "").trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[1]}-${match[2]}-${match[3]}` : "";
}

/** "2026-09-16" -> "16 Sep". Pure string work, so the host timezone cannot shift it. */
export function formatDayMonth(value?: string | null): string {
  const date = datePart(value);
  if (!date) return "";
  const [, month, day] = date.split("-");
  return `${Number(day)} ${MONTHS[Number(month) - 1] ?? month}`;
}

/** "2026-09-16" -> "16 Sep 2026". */
export function formatFullDate(value?: string | null): string {
  const date = datePart(value);
  if (!date) return "";
  const [year, month, day] = date.split("-");
  return `${Number(day)} ${MONTHS[Number(month) - 1] ?? month} ${year}`;
}

/** Indian digit grouping: 200000 -> "2,00,000". */
export function formatInr(value: number): string {
  if (!Number.isFinite(value)) return "0";
  const rounded = Math.round(value * 100) / 100;
  const [whole, fraction] = String(rounded).split(".");
  const last3 = whole.slice(-3);
  const rest = whole.slice(0, -3);
  const grouped = rest ? `${rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",")},${last3}` : last3;
  return fraction ? `${grouped}.${fraction}` : grouped;
}

/**
 * Frappe file paths are public on this site (verified: /files/*.png serves 200
 * without a token), so the logo is hot-linked rather than proxied. Returns ""
 * when absent, letting the caller fall back to a monogram tile instead of
 * shipping a broken <img>.
 */
function logoUrl(path?: string | null): string {
  const value = (path || "").trim();
  if (!value) return "";
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  const clean = value.startsWith("/") ? value : `/${value}`;
  const encoded = clean
    .split("/")
    .map((segment) => (/%[0-9A-Fa-f]{2}/.test(segment) ? segment : encodeURIComponent(segment)))
    .join("/");
  return `${getFrappeUrl()}${encoded}`;
}

function formatCategory(row: IpoCategoryRow, index: number): IpoCategory {
  const lotSize = Number(row.lot_size) || 0;
  const maxPrice = Number(row.max_price) || 0;
  const minBidQuantity = Number(row.min_bid_quantity) || lotSize;

  return {
    id: `ipo-cat-${row.name || index}`,
    code: (row.category || "").trim(),
    label: (row.category_label || "").trim() || "Investor",
    subText: (row.category_sub_text || "").trim(),
    lotSize,
    minBidQuantity,
    minPrice: Number(row.min_price) || 0,
    maxPrice,
    // The real entry ticket is the minimum *bid* quantity, which for HNI rows is
    // several lots, not one. Using lot_size here would understate HNI by ~14x.
    minInvestment: minBidQuantity * maxPrice,
    cutOff: formatFullDate(row.bid_cut_off_timestamp),
  };
}

export function formatIpo(doc: IpoDoc, today: string): FormattedIpo {
  const rawStatus = (doc.status || "").trim();
  const status: IpoStatus = rawStatus === "Open" || rawStatus === "Upcoming" ? rawStatus : "Closed";

  const categories = (Array.isArray(doc.ipo_categories) ? doc.ipo_categories : [])
    .slice()
    .sort((a, b) => (a.idx ?? 0) - (b.idx ?? 0))
    .map(formatCategory)
    .filter((entry) => entry.lotSize > 0 || entry.maxPrice > 0);

  const bandPrices = categories.filter((entry) => entry.maxPrice > 0);
  const minPrice = bandPrices.length ? Math.min(...bandPrices.map((entry) => entry.minPrice || entry.maxPrice)) : 0;
  const maxPrice = bandPrices.length ? Math.max(...bandPrices.map((entry) => entry.maxPrice)) : 0;

  // The retail row is the headline lot everywhere in the UI; HNI rows only show
  // inside the detail panel's category breakdown.
  const retail = categories.find((entry) => entry.code === "IND" || entry.code === "IND_SME") || categories[0];

  const subscription = Number(doc.overall_subscription) || 0;

  // Open IPOs date from the bid window; closed ones from opening/closing_date.
  const openDate = datePart(doc.bid_start_timestamp) || datePart(doc.opening_date);
  const closeDate = datePart(doc.bid_end_timestamp) || datePart(doc.closing_date);
  const allotmentDate = datePart(doc.allotment_date);
  const listingDate = datePart(doc.listing_timestamp);

  const issuePrice = Number(doc.issue_price) || 0;
  const listingPrice = Number(doc.listing_price) || 0;

  /*
   * Whether there is anything worth expanding the row for. Many upcoming issues
   * hold nothing but a logo and a link to the offer document - and that link is
   * already on the row itself - so their panel would open on a single sentence
   * explaining that there is nothing to see. Those rows are left inert instead.
   * The offer document deliberately does not count towards this.
   */
  const hasDetail =
    categories.length > 0 ||
    maxPrice > 0 ||
    subscription > 0 ||
    issuePrice > 0 ||
    listingPrice > 0 ||
    Boolean(openDate || closeDate || allotmentDate || listingDate);

  return {
    id: doc.name,
    name: (doc.company_name || doc.name || "").trim() || "Untitled IPO",
    symbol: (doc.symbol || "").trim(),
    isin: (doc.isin || "").trim(),
    status,
    isSme: Boolean(doc.is_sme),
    isPreApply: Boolean(doc.is_pre_apply),
    isListed: Boolean(doc.is_listed),
    logo: logoUrl(doc.logo_url),
    documentUrl: (doc.document_url || "").trim(),
    rtaLink: (doc.rta_link || "").trim(),

    priceBand:
      maxPrice > 0
        ? minPrice && minPrice !== maxPrice
          ? `₹${formatInr(minPrice)} - ₹${formatInr(maxPrice)}`
          : `₹${formatInr(maxPrice)}`
        : "",
    minPrice,
    maxPrice,
    lotSize: retail?.lotSize ?? 0,
    minInvestment: retail?.minInvestment ?? 0,
    categories,

    subscription,
    subscriptionLabel: subscription > 0 ? `${subscription.toFixed(2)}x` : "",

    issuePrice,
    listingPrice,
    listingReturn: Number(doc.listing_return) || 0,

    openDate,
    closeDate,
    allotmentDate,
    listingDate,
    openLabel: formatDayMonth(openDate),
    closeLabel: formatDayMonth(closeDate),
    allotmentLabel: formatFullDate(allotmentDate),
    listingLabel: formatFullDate(listingDate),

    hasDetail,
    isLastDay: status === "Open" && closeDate !== "" && closeDate === today,
  };
}

/* -------------------------------------------------------------------------- */
/* Fetching                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * `ipo_categories` is a child table, so it is absent from list responses and
 * only arrives from the single-document endpoint. The price band and lot size
 * come from it, so the open IPOs - the only ones that have rows - are re-fetched
 * individually. There are never more than a dozen, and they run concurrently.
 */
const LIST_FIELDS = [
  "name",
  "company_name",
  "symbol",
  "isin",
  "status",
  "is_sme",
  "is_listed",
  "is_pre_apply",
  "logo_url",
  "document_url",
  "rta_link",
  "issue_price",
  "listing_price",
  "listing_return",
  "overall_subscription",
  "opening_date",
  "closing_date",
  "allotment_date",
  "listing_timestamp",
  "bid_start_timestamp",
  "bid_end_timestamp",
  "modified",
];

async function fetchIpoListViaNativeFetch(): Promise<IpoDoc[]> {
  const params = new URLSearchParams({
    fields: JSON.stringify(LIST_FIELDS),
    limit_page_length: "0",
    order_by: "modified desc",
  });

  const res = await fetch(`${getFrappeUrl()}/api/resource/IPO?${params.toString()}`, {
    headers: {
      Authorization: `token ${getFrappeToken()}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) throw new Error(`HTTP error ${res.status}: ${res.statusText}`);
  const json = await res.json();
  return json.data || [];
}

/** Mirrors the transport fallback used throughout frappe.ts: SDK, then fetch. */
async function fetchIpoList(): Promise<IpoDoc[]> {
  try {
    const docs = await getFrappeInstance()
      .db()
      .getDocList<IpoDoc>("IPO", {
        fields: LIST_FIELDS as any,
        limit: 0,
        orderBy: { field: "modified", order: "desc" },
      });
    if (docs) return docs;
  } catch (error) {
    console.warn("Frappe SDK IPO list failed, trying native fetch...", error);
  }

  try {
    return await fetchIpoListViaNativeFetch();
  } catch (error) {
    console.error("All IPO fetch strategies failed:", error);
    return [];
  }
}

async function fetchIpoDoc(name: string): Promise<IpoDoc | null> {
  try {
    const res = await fetch(`${getFrappeUrl()}/api/resource/IPO/${encodeURIComponent(name)}`, {
      headers: {
        Authorization: `token ${getFrappeToken()}`,
        "Content-Type": "application/json",
      },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return (json?.data ?? null) as IpoDoc | null;
  } catch (error) {
    console.error(`Frappe IPO document fetch failed for ${name}:`, error);
    return null;
  }
}

/**
 * Mainboard issues sort ahead of SME ones, then by the date that matters for
 * that status. This is the order the trading app's dashboard uses, and it puts
 * the issue closing soonest at the top of the Open tab.
 */
function byBoardThenDate(direction: "asc" | "desc", key: "closeDate" | "openDate" | "listingDate") {
  return (a: FormattedIpo, b: FormattedIpo) => {
    if (a.isSme !== b.isSme) return a.isSme ? 1 : -1;
    const left = a[key];
    const right = b[key];
    // Undated records sink to the bottom of their group rather than sorting as "".
    if (!left && !right) return a.name.localeCompare(b.name);
    if (!left) return 1;
    if (!right) return -1;
    if (left !== right) return direction === "asc" ? left.localeCompare(right) : right.localeCompare(left);
    return a.name.localeCompare(b.name);
  };
}

/**
 * Closed issues read as a reverse-chronological feed of recent offers: the most
 * recent opening date first, so the issues that just finished bidding top the
 * list and the oldest sits at the bottom. Several issues routinely open on the
 * same day, so mainboard sorts ahead of SME and then by name - a total order, so
 * the list never reshuffles between requests.
 */
function byOpeningDateDesc(a: FormattedIpo, b: FormattedIpo) {
  if (a.openDate !== b.openDate) return (b.openDate || "").localeCompare(a.openDate || "");
  if (a.isSme !== b.isSme) return a.isSme ? 1 : -1;
  return a.name.localeCompare(b.name);
}

export interface IpoBoard {
  open: FormattedIpo[];
  upcoming: FormattedIpo[];
  closed: FormattedIpo[];
}

export async function getIpoBoard(): Promise<IpoBoard> {
  const docs = await fetchIpoList();
  const today = getCurrentFrappeDateTime().slice(0, 10);

  const openDocs = docs.filter((doc) => (doc.status || "").trim() === "Open");

  // Only the open issues need their child table, so only they are re-fetched.
  const detailed = await Promise.all(openDocs.map((doc) => fetchIpoDoc(doc.name)));
  const detailById = new Map<string, IpoDoc>();
  detailed.forEach((doc, index) => {
    if (doc) detailById.set(openDocs[index].name, doc);
  });

  const all = docs.map((doc) => formatIpo(detailById.get(doc.name) ?? doc, today));

  return {
    open: all.filter((ipo) => ipo.status === "Open").sort(byBoardThenDate("asc", "closeDate")),
    upcoming: all.filter((ipo) => ipo.status === "Upcoming").sort(byBoardThenDate("asc", "openDate")),
    // Every closed issue, not a recent slice: the tab is the archive people
    // search when checking an allotment against an issue from months back.
    closed: all.filter((ipo) => ipo.status === "Closed").sort(byOpeningDateDesc),
  };
}
