/**
 * Regenerate src/data/nse-companies.json - NSE symbol to company name, as
 * headlines write it - which the stock page's news matching reads.
 *
 * NSE refuses non-browser clients, so download the equity list in a browser
 * first and pass its path:
 *
 *   https://nsearchives.nseindia.com/content/equities/EQUITY_L.csv
 *
 *   node scripts/update-nse-companies.mjs ~/Downloads/EQUITY_L.csv
 *
 * Worth re-running every few months, so newly listed companies get news.
 */
import { readFileSync, writeFileSync } from "node:fs";

const input = process.argv[2];
if (!input) {
  console.error("usage: node scripts/update-nse-companies.mjs <path to EQUITY_L.csv>");
  process.exit(1);
}
const output = new URL("../src/data/nse-companies.json", import.meta.url);

/** One CSV row; a quoted field may contain commas. */
const parse = (line) => {
  const fields = [];
  let current = "";
  let quoted = false;
  for (const ch of line) {
    if (ch === '"') quoted = !quoted;
    else if (ch === "," && !quoted) {
      fields.push(current);
      current = "";
    } else current += ch;
  }
  fields.push(current);
  return fields.map((field) => field.trim());
};

/**
 * "The Indian Hotels Company Limited" -> "Indian Hotels". Headlines drop the
 * legal suffix, a leading "The", a trailing "Company" and "(India)", and a
 * name is only useful for matching in the form headlines use.
 */
const shorten = (name) =>
  name
    .replace(/\s+/g, " ")
    .replace(/^The\s+/i, "")
    .replace(/\s*\b(Limited|Ltd\.?)\s*$/i, "")
    .replace(/\s*\((India|I)\)\s*$/i, "")
    .replace(/\s+(Company|Co\.)\s*$/i, "")
    .trim();

const companies = {};
for (const line of readFileSync(input, "utf8").trim().split(/\r?\n/).slice(1)) {
  const [symbol, name] = parse(line);
  if (symbol && name) companies[symbol] = shorten(name);
}

const sorted = Object.fromEntries(
  Object.keys(companies)
    .sort()
    .map((symbol) => [symbol, companies[symbol]]),
);
writeFileSync(output, JSON.stringify(sorted, null, 2) + "\n");
console.log(`Wrote ${Object.keys(sorted).length} companies to src/data/nse-companies.json`);
