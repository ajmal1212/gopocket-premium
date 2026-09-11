/**
 * Formatting for feed values, shared by the server render and the scripts that
 * keep it live - the two must print a number identically, or the first tick
 * visibly reformats every figure on the page.
 */

/** Feed values are strings; a missing or malformed one is null, never NaN. */
export const num = (value: string | undefined): number | null => {
  if (!value) return null;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const DASH = "—";

/*
 * Built once and reused. `toLocaleString` with options constructs a fresh
 * Intl.NumberFormat on every call - locale data lookup and all - and a market
 * depth update formats some thirty-five numbers several times a second, which
 * profiled as more main-thread time than the rest of the panel's script put
 * together.
 */
const priceFormat = new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const quantityFormat = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

/** A price, Indian digit grouping, always two decimals: 1,020.50. */
export const price = (value: number | null): string => (value === null ? DASH : priceFormat.format(value));

/** A quantity or volume, Indian grouping, no decimals: 17,35,800. */
export const quantity = (value: number | null): string => (value === null ? DASH : quantityFormat.format(value));

/** A share of the whole, two decimals: 53.75%. */
export const percent = (value: number | null): string => (value === null ? DASH : `${value.toFixed(2)}%`);
