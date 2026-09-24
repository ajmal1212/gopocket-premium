import type { StockFilters } from "@/lib/contracts";

/**
 * Filter options for /stocks, copied from the Select fields on Contract Master.
 * They double as an allow-list: a value that isn't here is dropped from the
 * URL, so a hand-edited query string can't reach Frappe or mint a new cache
 * entry for every typo. When an option is added to the doctype, add it here.
 */
export const STOCK_EXCHANGES = ["NSE", "BSE"] as const;

export const STOCK_SECTORS = [
  "Automobile and Auto Components",
  "Capital Goods",
  "Chemicals",
  "Construction",
  "Construction Materials",
  "Consumer Durables",
  "Consumer Services",
  "Diversified",
  "Fast Moving Consumer Goods",
  "Financial Services",
  "Forest Materials",
  "Healthcare",
  "Information Technology",
  "Media, Entertainment & Publication",
  "Metals & Mining",
  "Oil, Gas & Consumable Fuels",
  "Power",
  "Realty",
  "Services",
  "Telecommunication",
  "Textiles",
  "Unclassified",
  "Utilities",
];

export const STOCK_INDUSTRIES = [
  "Aerospace & Defense",
  "Agricultural Food & other Products",
  "Agricultural, Commercial & Construction Vehicles",
  "Auto Components",
  "Automobiles",
  "Banks",
  "Beverages",
  "Capital Markets",
  "Cement & Cement Products",
  "Chemicals & Petrochemicals",
  "Cigarettes & Tobacco Products",
  "Commercial Services & Supplies",
  "Construction",
  "Consumable Fuels",
  "Consumer Durables",
  "Diversified",
  "Diversified FMCG",
  "Diversified Metals",
  "Electrical Equipment",
  "Engineering Services",
  "Entertainment",
  "Ferrous Metals",
  "Fertilizers & Agrochemicals",
  "Finance",
  "Financial Technology (Fintech)",
  "Food Products",
  "Gas",
  "Healthcare Equipment & Supplies",
  "Healthcare Services",
  "Household Products",
  "Industrial Manufacturing",
  "Industrial Products",
  "Insurance",
  "IT - Hardware",
  "IT - Services",
  "IT - Software",
  "Leisure Services",
  "Media",
  "Metals & Minerals Trading",
  "Minerals & Mining",
  "Non - Ferrous Metals",
  "Oil",
  "Other Construction Materials",
  "Other Consumer Services",
  "Other Utilities",
  "Paper, Forest & Jute Products",
  "Personal Products",
  "Petroleum Products",
  "Pharmaceuticals & Biotechnology",
  "Power",
  "Printing & Publication",
  "Realty",
  "Retailing",
  // Two spaces, exactly as the doctype spells it - the filter is an exact match.
  "Telecom -  Equipment & Accessories",
  "Telecom - Services",
  "Textiles & Apparels",
  "Transport Infrastructure",
  "Transport Services",
  "Unclassified",
];

export const CAP_BANDS = ["Large cap", "Mid cap", "Small cap", "Micro cap", "Unknown"];

export const STOCK_SORTS: { value: StockFilters["sort"]; label: string }[] = [
  { value: "mcap-desc", label: "Market cap ↓" },
  { value: "mcap-asc", label: "Market cap ↑" },
  { value: "name-asc", label: "Symbol A–Z" },
];

export const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export const STOCKS_PER_PAGE = 10;

const pick = (params: URLSearchParams, key: string, allowed: string[]) =>
  params.getAll(key).filter((value) => allowed.includes(value));

/** Longest symbol search kept; NSE symbols run to 20 characters at most. */
const MAX_QUERY = 20;

export function parseStockFilters(params: URLSearchParams): StockFilters {
  const exchange = params.get("exchange");
  // Symbols are upper-case letters, digits, "&" and "-" - anything else can't match one.
  const query = (params.get("q") || "")
    .toUpperCase()
    .replace(/[^A-Z0-9&-]/g, "")
    .slice(0, MAX_QUERY);
  const letter = (params.get("letter") || "").toUpperCase();
  const sort = params.get("sort");
  return {
    exchange: exchange === "BSE" ? "BSE" : "NSE",
    query,
    letter: LETTERS.includes(letter) ? letter : "",
    sectors: pick(params, "sector", STOCK_SECTORS),
    industries: pick(params, "industry", STOCK_INDUSTRIES),
    capBands: pick(params, "cap", CAP_BANDS),
    sort: STOCK_SORTS.some((option) => option.value === sort) ? (sort as StockFilters["sort"]) : "mcap-desc",
  };
}

/** A page number from ?page=, or 1 for anything that isn't a positive integer. */
export function parsePage(params: URLSearchParams): number {
  const page = Number(params.get("page"));
  return Number.isInteger(page) && page > 1 ? page : 1;
}

/**
 * The /stocks address for a set of filters and a page. Defaults are left out,
 * so the unfiltered first page is plain /stocks.
 */
export function stockListHref(filters: StockFilters, page = 1): string {
  const params = new URLSearchParams();
  if (filters.query) params.set("q", filters.query);
  if (filters.exchange !== "NSE") params.set("exchange", filters.exchange);
  if (filters.letter) params.set("letter", filters.letter);
  filters.sectors.forEach((value) => params.append("sector", value));
  filters.industries.forEach((value) => params.append("industry", value));
  filters.capBands.forEach((value) => params.append("cap", value));
  if (filters.sort !== "mcap-desc") params.set("sort", filters.sort);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/stocks?${query}` : "/stocks";
}
