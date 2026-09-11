import { getFrappeInstance, getFrappeToken, getFrappeUrl } from "@/lib/frappe";

/**
 * A company's latest shareholding pattern - the quarterly filing every listed
 * company makes with NSE - read two ways from Frappe:
 *
 * - `fetchShareholding`: the headline split (promoter, public, employee
 *   trusts) from the "Nse Share Holding Master" doctype. One small row, fast
 *   enough to render with the page.
 * - `fetchShareholdingBreakdown`: the full pattern - FII, DII, retail and
 *   their sub-categories, the major holders - from the filing's XBRL, which
 *   Frappe parses on request. Slower and far larger, so the page loads it
 *   separately.
 */

const DOCTYPE = "Nse Share Holding Master";
const FIELDS = ["date", "pr_and_prgrp", "public_val", "employee_trusts"];
/** Per attempt. The page renders alongside this lookup, so a slow answer is dropped, not waited on. */
const TIMEOUT_MS = 2000;

interface ShareholdingRow {
  date?: string;
  pr_and_prgrp?: number;
  public_val?: number;
  employee_trusts?: number;
}

export interface Shareholding {
  /** The quarter the filing covers, as a reader would write it: "30 Jun 2026". */
  asOf: string;
  promoter: number;
  public: number;
  employeeTrusts: number;
}

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

/**
 * The doctype's `date` is text - "30-JUN-2026" - so it can't be ordered in the
 * query without sorting alphabetically. Parsed here instead.
 */
const parseDate = (value: string | undefined): Date | null => {
  const match = value?.trim().match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/);
  if (!match) return null;
  const month = MONTHS.indexOf(match[2].toUpperCase());
  return month < 0 ? null : new Date(Date.UTC(Number(match[3]), month, Number(match[1])));
};

/** A figure the page can draw: a number between 0 and 100. */
const percentage = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100 ? value : null;

/**
 * Whether to try the SDK first. On Workers it fails every time - axios passes
 * fetch a `cache` option the runtime rejects ("Unsupported cache mode") - and
 * this runs on every stock page, so after the first failure the isolate stops
 * trying and stops logging it. Under Node (astro dev) the SDK works and is used.
 */
let sdkUsable = true;

/**
 * Transport fallback only, mirroring the rest of lib/frappe.ts: the SDK rides
 * on axios, which isn't always usable inside a Worker, so a plain fetch stands
 * behind it. Either answer is used as-is, an empty one included.
 */
async function queryRows(symbol: string): Promise<ShareholdingRow[]> {
  const filters = [["symbol", "=", symbol]];

  if (sdkUsable) {
    try {
      const request = getFrappeInstance()
        .db()
        .getDocList<ShareholdingRow>(DOCTYPE, { fields: FIELDS as never, filters: filters as never, limit: 4 });
      return (await Promise.race([
        request,
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timed out")), TIMEOUT_MS)),
      ])) as ShareholdingRow[];
    } catch (error) {
      sdkUsable = false;
      console.warn("Frappe SDK shareholding query failed; using native fetch from here on.", error);
    }
  }

  const params = new URLSearchParams({
    fields: JSON.stringify(FIELDS),
    filters: JSON.stringify(filters),
    limit_page_length: "4",
  });
  const response = await fetch(`${getFrappeUrl()}/api/resource/${encodeURIComponent(DOCTYPE)}?${params}`, {
    headers: { Authorization: `token ${getFrappeToken()}` },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) return [];
  const body = (await response.json()) as { data?: ShareholdingRow[] };
  return body.data ?? [];
}

/**
 * The newest filing for an NSE symbol, or null when there is none, it can't be
 * reached in time, or its figures don't add up to something drawable. A stock
 * page renders without this section rather than with a broken one.
 */
export async function fetchShareholding(symbol: string): Promise<Shareholding | null> {
  let rows: ShareholdingRow[];
  try {
    rows = await queryRows(symbol);
  } catch (error) {
    console.error(`Shareholding lookup failed for ${symbol}:`, error);
    return null;
  }

  // One row per company in practice; newest first in case a quarter is ever
  // kept alongside the last.
  const latest = rows
    .map((row) => ({ row, date: parseDate(row.date) }))
    .filter((entry): entry is { row: ShareholdingRow; date: Date } => entry.date !== null)
    .sort((a, b) => b.date.getTime() - a.date.getTime())[0];
  if (!latest) return null;

  const promoter = percentage(latest.row.pr_and_prgrp);
  const publicShare = percentage(latest.row.public_val);
  if (promoter === null || publicShare === null) return null;

  return {
    asOf: formatDate(latest.date),
    promoter,
    public: publicShare,
    employeeTrusts: percentage(latest.row.employee_trusts) ?? 0,
  };
}

/* ------------------------------------------------------------------------ */

/**
 * Frappe parses the filing's XBRL on request (gopocket.api.get_xbrl_data) and
 * answers with just the four facts read below, as value/contextRef pairs
 * (10-80 KB). What a page needs is a few dozen numbers, so that is all that is
 * kept, per symbol, for as long as a quarterly filing can reasonably be
 * assumed current.
 */
const XBRL_METHOD = "gopocket.api.get_xbrl_data";
const BREAKDOWN_TIMEOUT_MS = 5000;
const BREAKDOWN_TTL_MS = 6 * 60 * 60 * 1000;
/** A symbol with no filing is asked about again sooner - a new listing may have filed since. */
const MISS_TTL_MS = 30 * 60 * 1000;

interface Fact {
  value: string;
  contextRef: string;
}

interface XbrlMessage {
  status?: string;
  metadata?: { DateOfReport?: string };
  by_fact_name?: Record<string, Fact[] | undefined>;
}

export interface HolderGroup {
  key: "promoters" | "fii" | "dii" | "public" | "government" | "trusts";
  label: string;
  /** Percent of the company's shares, 0-100. */
  percent: number;
  /** The categories inside the group, largest first; empty when there is only one. */
  parts: { label: string; percent: number }[];
}

export interface MajorHolder {
  name: string;
  percent: number;
  /** What kind of holder - "Promoter", "Mutual fund" - when the filing says. */
  kind: string;
}

export interface ShareholdingBreakdown {
  asOf: string;
  /** Total number of shareholders, when the filing gives it. */
  shareholders: number | null;
  groups: HolderGroup[];
  majorHolders: MajorHolder[];
}

type GroupSpec = {
  key: HolderGroup["key"];
  label: string;
  /** The SEBI format's context for the group total. */
  total: string;
  /** What to call whatever the listed categories don't account for. */
  rest: string;
  parts: [context: string, label: string][];
};

/**
 * How the filing's categories roll up. Each group is one of the SEBI format's
 * totals with the categories that make it up. The format's names are kept
 * verbatim so a new filing lines up without mapping code; categories a filing
 * doesn't use are simply absent.
 */
const GROUPS: GroupSpec[] = [
  {
    key: "promoters",
    label: "Promoters",
    total: "ShareholdingOfPromoterAndPromoterGroup",
    // Unlisted Indian categories are split from foreign ones via the
    // format's "Indian" subtotal - see `summarise`.
    rest: "Other Indian promoters",
    parts: [
      ["IndividualsOrHinduUndividedFamily", "Individuals & HUF"],
      ["CentralGovernmentOrStateGovernments", "Central & state governments"],
      ["FinancialInstitutionsOrBanks", "Financial institutions & banks"],
      ["OtherIndianShareholders", "Companies, LLPs & trusts"],
    ],
  },
  {
    key: "fii",
    label: "Foreign institutions",
    total: "InstitutionsForeign",
    rest: "Other foreign institutions",
    parts: [
      ["InstitutionsForeignPortfolioInvestorCategoryOne", "Foreign portfolio investors - Cat. I"],
      ["InstitutionsForeignPortfolioInvestorCategoryTwo", "Foreign portfolio investors - Cat. II"],
      ["ForeignDirectInvestment", "Foreign direct investment"],
      ["SovereignWealthFundsForeign", "Foreign sovereign wealth funds"],
      ["ForeignVentureCapitalInvestors", "Foreign venture capital"],
      ["OverseasDepositories", "Overseas depositories"],
      ["OtherInstitutionsForeign", "Other foreign institutions"],
    ],
  },
  {
    key: "dii",
    label: "Domestic institutions",
    total: "InstitutionsDomestic",
    rest: "Other institutions",
    parts: [
      ["MutualFundsOrUTI", "Mutual funds"],
      ["InsuranceCompanies", "Insurance companies"],
      ["ProvidentFundsOrPensionFunds", "Provident & pension funds"],
      ["AlternativeInvestmentFunds", "Alternative investment funds"],
      ["Banks", "Banks"],
      ["NBFCsRegisteredWithRBI", "NBFCs"],
      ["SovereignWealthFundsDomestic", "Sovereign wealth funds"],
      ["VentureCapitalFunds", "Venture capital funds"],
      ["AssetReconstructionCompanies", "Asset reconstruction companies"],
      ["OtherFinancialInstitutions", "Other financial institutions"],
      ["OtherInstitutionsDomestic", "Other institutions"],
    ],
  },
  {
    key: "public",
    label: "Retail & others",
    total: "NonInstitutions",
    rest: "Others",
    parts: [
      ["ResidentIndividualShareholdersHoldingNominalShareCapitalUpToRsTwoLakh", "Individuals - up to ₹2 lakh"],
      ["ResidentIndividualShareholdersHoldingNominalShareCapitalInExcessOfRsTwoLakh", "Individuals - above ₹2 lakh"],
      ["BodiesCorporate", "Bodies corporate"],
      ["NonResidentIndians", "Non-resident Indians"],
      ["DirectorsAndDirectorsRelatives", "Directors & relatives"],
      ["KeyManagerialPersonnel", "Key managerial personnel"],
      ["AssociateCompaniesOrSubsidiaries", "Associate companies"],
      ["InvestorEducationAndProtectionFund", "Investor Education & Protection Fund"],
      ["RelativesOfPromotersOtherThanPromoterGroup", "Relatives of promoters"],
      ["ForeignNationals", "Foreign nationals"],
      ["ForeignCompanies", "Foreign companies"],
      ["OtherNonInstitutions", "Others"],
    ],
  },
  {
    key: "government",
    label: "Government",
    total: "Governments",
    rest: "Others",
    parts: [
      ["CentralGovernmentOrPresidentOfIndia", "Central government"],
      ["StateGovernmentsOrGovernors", "State governments"],
      [
        "ShareholdingByCompaniesOrBodiesCorporateWhereCentralOrStateGovernmentIsPromoter",
        "Government-promoted companies",
      ],
    ],
  },
  { key: "trusts", label: "Employee trusts", total: "EmployeeBenefitsTrusts", rest: "Others", parts: [] },
];

/** A named holder's category, from the context the filing lists them under. */
const KINDS: [RegExp, string][] = [
  // The promoter section's own contexts. Its government one is distinct from
  // the public section's CentralGovernmentOrPresidentOfIndia - SBI's
  // President of India is its promoter, not a government shareholder.
  [/^(IndividualsOrHUF|OthersIndianShareholders|CentralGovernmentOrStateGovernments|.*Promoter)/i, "Promoter"],
  [/MutualFunds/, "Mutual fund"],
  [/Insurance/, "Insurance company"],
  [/ProvidentFunds|Pension/, "Pension fund"],
  [/ForeignPortfolioInvestor/, "Foreign portfolio investor"],
  [/ForeignDirectInvestment/, "Foreign direct investor"],
  [/Foreign/, "Foreign institution"],
  [/AlternativeInvestment/, "Alternative investment fund"],
  [/Banks/, "Bank"],
  [/Government/, "Government"],
  [/BodiesCorporate/, "Corporate"],
  [/Individual/, "Individual"],
];

/** Anything under this share of the company is noise in a breakdown: 0.005%. */
const NEGLIGIBLE = 0.005;

const formatDate = (date: Date) =>
  date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

const breakdownCache = new Map<string, { at: number; value: ShareholdingBreakdown | null }>();

/**
 * The full pattern for an NSE symbol, or null when Frappe has no filing for it,
 * can't be reached in time, or the figures don't add up. Callers fall back to
 * the headline split.
 */
export async function fetchShareholdingBreakdown(symbol: string): Promise<ShareholdingBreakdown | null> {
  const cached = breakdownCache.get(symbol);
  if (cached && Date.now() - cached.at < (cached.value ? BREAKDOWN_TTL_MS : MISS_TTL_MS)) return cached.value;

  let value: ShareholdingBreakdown | null;
  try {
    const message = await queryXbrl(symbol);
    value = message ? summarise(message) : null;
  } catch (error) {
    // Unreachable is not the same as absent, so it isn't remembered.
    console.error(`Shareholding breakdown failed for ${symbol}:`, error);
    return null;
  }
  breakdownCache.set(symbol, { at: Date.now(), value });
  return value;
}

/** SDK first, native fetch behind it - the same arrangement, and the same Worker caveat, as `queryRows`. */
async function queryXbrl(symbol: string): Promise<XbrlMessage | null> {
  if (sdkUsable) {
    try {
      const request = getFrappeInstance().call().get<{ message?: XbrlMessage }>(XBRL_METHOD, { symbol });
      const body = await Promise.race([
        request,
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timed out")), BREAKDOWN_TIMEOUT_MS)),
      ]);
      return body?.message?.status === "success" ? body.message : null;
    } catch (error) {
      // A missing filing is an error response too (HTTP 417). Only a failure
      // with no HTTP status means the SDK itself can't be used here.
      const status = (error as { httpStatus?: number } | null)?.httpStatus;
      if (status && status >= 400 && status < 500) return null;
      if (status) throw error;
      // Slow isn't broken: asking again over fetch would only double the wait.
      if (error instanceof Error && error.message === "timed out") throw error;
      sdkUsable = false;
      console.warn("Frappe SDK shareholding query failed; using native fetch from here on.", error);
    }
  }

  const response = await fetch(`${getFrappeUrl()}/api/method/${XBRL_METHOD}?symbol=${encodeURIComponent(symbol)}`, {
    headers: { Authorization: `token ${getFrappeToken()}` },
    signal: AbortSignal.timeout(BREAKDOWN_TIMEOUT_MS),
  });
  // 417 is Frappe's answer for a symbol with no filing. A 5xx is Frappe
  // having trouble, which is thrown rather than remembered as "no filing".
  if (response.status >= 400 && response.status < 500) return null;
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const body = (await response.json()) as { message?: XbrlMessage };
  return body.message?.status === "success" ? body.message : null;
}

function summarise(message: XbrlMessage): ShareholdingBreakdown | null {
  const facts = message.by_fact_name ?? {};
  // Keyed case-insensitively: filers' tools don't agree on capitalisation
  // (SBI files "CentralGovernmentOrStateGovernmentS").
  const byContext = (name: string) =>
    new Map((facts[name] ?? []).map((fact) => [fact.contextRef.toLowerCase(), fact.value]));

  const shares = byContext("ShareholdingAsAPercentageOfTotalNumberOfShares");
  /** A category total as a percent of the company, or null when the filing doesn't have the category. */
  const total = (context: string): number | null => {
    const raw = shares.get(`${context}_ContextI`.toLowerCase());
    const value = raw === undefined ? NaN : Number.parseFloat(raw) * 100;
    return Number.isFinite(value) && value >= 0 && value <= 100 ? value : null;
  };

  const groups: HolderGroup[] = [];
  for (const group of GROUPS) {
    const parts = group.parts
      .map(([context, label]) => ({ label, percent: total(context) ?? 0 }))
      .filter((part) => part.percent >= NEGLIGIBLE);
    const partsSum = parts.reduce((sum, part) => sum + part.percent, 0);
    const percent = total(group.total) ?? partsSum;

    // Whatever the listed categories don't account for - a category newer
    // than this map - is kept as one remainder. For promoters the format's
    // "Indian" subtotal separates foreign promoters from that remainder.
    const addRest = (label: string, value: number) => {
      if (value < 0.01) return;
      const existing = parts.find((part) => part.label === label);
      if (existing) existing.percent += value;
      else parts.push({ label, percent: value });
    };
    const indian = group.key === "promoters" ? total("Indian") : null;
    if (indian !== null) {
      addRest(group.rest, indian - partsSum);
      addRest("Foreign promoters", percent - indian);
    } else {
      addRest(group.rest, percent - partsSum);
    }

    // Promoters are always shown, even at 0% - "no promoter group" is itself
    // worth knowing. The other groups only when they hold something.
    if (percent >= NEGLIGIBLE || group.key === "promoters") {
      groups.push({
        key: group.key,
        label: group.label,
        percent,
        parts: parts.length > 1 ? parts.sort((a, b) => b.percent - a.percent) : [],
      });
    }
  }

  // The groups are the whole company. If they don't come to ~100%, the filing
  // uses a structure this map doesn't know, and a wrong chart is worse than
  // the headline split the caller falls back to.
  const covered = groups.reduce((sum, group) => sum + group.percent, 0);
  if (covered < 97 || covered > 103) return null;

  const date = message.metadata?.DateOfReport?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!date) return null;
  const asOf = formatDate(new Date(Date.UTC(Number(date[1]), Number(date[2]) - 1, Number(date[3]))));

  const count = Number.parseInt(byContext("NumberOfShareholders").get("shareholdingpattern_contexti") ?? "", 10);

  return {
    asOf,
    shareholders: Number.isFinite(count) ? count : null,
    groups,
    majorHolders: majorHolders(facts, shares),
  };
}

/**
 * Everyone the filing names - promoters, and anyone else holding over 1% -
 * with their stake, largest first. Rows the filing marks as a category ("FII",
 * "HUF") rather than a holder are left out, as are names with no stake given
 * (a depository holding shares on behalf of ADR holders).
 */
function majorHolders(facts: Record<string, Fact[] | undefined>, shares: Map<string, string>): MajorHolder[] {
  const categories = new Set(
    (facts.WhetherACategoryOrMoreThan1PercentageOfShareholding ?? [])
      .filter((fact) => fact.value === "Category")
      .map((fact) => fact.contextRef),
  );

  const holders = new Map<string, MajorHolder>();
  for (const fact of facts.NameOfTheShareholder ?? []) {
    if (categories.has(fact.contextRef)) continue;
    const context = fact.contextRef.replace(/^D_/, "");
    const percent = Number.parseFloat(shares.get(context.toLowerCase()) ?? "") * 100;
    const name = fact.value.trim();
    if (!name || !Number.isFinite(percent) || percent < NEGLIGIBLE) continue;

    const prefix = context.replace(/_Context\w*$/, "");
    const kind = KINDS.find(([pattern]) => pattern.test(prefix))?.[1] ?? "";
    // The same holder can be filed under two contexts; keep the larger stake.
    const key = name.toLowerCase();
    if ((holders.get(key)?.percent ?? -1) < percent) holders.set(key, { name, percent, kind });
  }

  return [...holders.values()].sort((a, b) => b.percent - a.percent).slice(0, 10);
}
