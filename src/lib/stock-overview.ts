import type { Contract } from "@/lib/contracts";
import type { Shareholding } from "@/lib/shareholding";
import type { Tick } from "@/lib/feed/types";

/**
 * Prose, key facts and Q&A for a stock page, built from the data the page has
 * already fetched.
 *
 * Why this exists: every /stocks page rendered price widgets and nothing a
 * reader - or a crawler - could read. Written copy lives in src/data/stocks.ts
 * and covers three companies, so the other ~9,600 pages carried no text at all,
 * which is what keeps them out of the index.
 *
 * The rule this file follows, and the line between a data page and spun
 * content: EVERY sentence states something the data actually supports, and a
 * sentence whose data is missing is dropped rather than hedged. Two stocks with
 * different data therefore get a different *shape* of page, not the same
 * sentence with the numbers swapped. Nothing here is padded, and nothing is
 * asserted that the feed or the filing did not say.
 *
 * No new requests: everything comes from arguments the caller already has.
 */

export interface StockFact {
  label: string;
  value: string;
}

export interface StockFaq {
  question: string;
  answer: string;
}

export interface StockOverview {
  paragraphs: string[];
  facts: StockFact[];
  faqs: StockFaq[];
  /**
   * False when the data was too thin to say anything beyond the company's own
   * name, in which case the caller renders nothing. A one-sentence stub helps
   * no one and is exactly the thin content this is meant to avoid.
   */
  worthShowing: boolean;
}

export interface StockOverviewInput {
  contract: Contract;
  displayName: string;
  quote: Tick | null;
  shareholding: Shareholding | null;
  /** Curated sector, when src/data/stocks.ts has one for this symbol. */
  sector?: string;
  /**
   * Hand-written copy from src/data/stocks.ts, where it exists. It replaces the
   * generated opening line rather than sitting beside it - both say what the
   * company is and where it trades, and the written one says it better.
   */
  editorialDescription?: string;
  previousClose: number | null;
}

/* -------------------------------------------------------------------------- */
/* Formatting                                                                  */
/* -------------------------------------------------------------------------- */

/** Indian digit grouping: 200000 -> "2,00,000". */
function grouped(value: number): string {
  const [whole, fraction] = String(value).split(".");
  const last3 = whole.slice(-3);
  const rest = whole.slice(0, -3);
  const body = rest ? `${rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",")},${last3}` : last3;
  return fraction ? `${body}.${fraction}` : body;
}

const rupees = (value: number) => `₹${grouped(Math.round(value * 100) / 100)}`;

/** 45700000 -> "4.57 crore". The unit Indian readers actually use. */
function indianScale(value: number): string {
  if (value >= 1e7) return `${(value / 1e7).toFixed(2)} crore`;
  if (value >= 1e5) return `${(value / 1e5).toFixed(2)} lakh`;
  return grouped(Math.round(value));
}

/** Parses a feed field, which arrives as text and may be absent or unusable. */
function num(value: string | undefined): number | null {
  if (!value) return null;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

/* -------------------------------------------------------------------------- */
/* Segment                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * What the series on the end of a trading symbol means, in words. This is the
 * one fact that genuinely separates otherwise-identical pages: an SME listing
 * on NSE Emerge is a different proposition from a Nifty constituent, and the
 * trade-for-trade segment tells a reader delivery is compulsory.
 */
const SEGMENTS: Record<string, string> = {
  EQ: "main board",
  BE: "trade-for-trade segment",
  BZ: "trade-for-trade segment",
  SM: "SME platform",
  ST: "SME trade-for-trade segment",
  IV: "infrastructure investment trust",
  RR: "real estate investment trust",
};

function segmentOf(tradingSymbol: string): string | null {
  const series = tradingSymbol.match(/-([A-Z0-9]+)$/)?.[1];
  return series ? (SEGMENTS[series] ?? null) : null;
}

/* -------------------------------------------------------------------------- */
/* Builder                                                                     */
/* -------------------------------------------------------------------------- */

export function buildStockOverview(input: StockOverviewInput): StockOverview {
  const { contract, displayName, quote, shareholding, sector, previousClose, editorialDescription } = input;
  const isIndex = contract.exchange === "INDICES";

  const last = num(quote?.lp);
  const high52 = num(quote?.["52h"]);
  const low52 = num(quote?.["52l"]);
  const dayHigh = num(quote?.h);
  const dayLow = num(quote?.l);
  const volume = num(quote?.v);
  const avgPrice = num(quote?.ap);

  const paragraphs: string[] = [];
  const facts: StockFact[] = [];
  const faqs: StockFaq[] = [];

  /* --- Identity ---------------------------------------------------------- */

  if (editorialDescription) {
    paragraphs.push(editorialDescription);
  } else if (isIndex) {
    paragraphs.push(
      `${displayName} is a market index, so it is not bought or sold directly — it tracks the combined ` +
        `movement of its constituent shares. Its level is quoted through the trading day and is used as a ` +
        `benchmark for funds and derivatives.`,
    );
  } else {
    const segment = segmentOf(contract.tradingSymbol);
    const venue = contract.exchange === "BSE" ? "the BSE" : "the NSE";
    const where = segment ? `${venue} ${segment}` : venue;
    const sectorClause = sector && sector !== contract.symbol ? `, a ${sector.toLowerCase()} company,` : "";

    paragraphs.push(
      `${displayName}${sectorClause} trades on ${where} under the symbol ${contract.symbol}. ` +
        `The price below is live during market hours, alongside the order book, the day's range and the ` +
        `company's latest disclosed shareholding.`,
    );
  }

  /* --- 52-week positioning ----------------------------------------------- */

  if (high52 && low52 && high52 > low52) {
    const band = `${rupees(low52)} and ${rupees(high52)}`;

    if (last) {
      // Where in the band the price sits is the fact a reader wants and no
      // widget on the page states in words.
      const position = ((last - low52) / (high52 - low52)) * 100;
      const offHigh = ((high52 - last) / high52) * 100;
      const place =
        position >= 90
          ? "putting it close to the top of that range"
          : position <= 10
            ? "putting it close to the bottom of that range"
            : `placing it in the ${position >= 50 ? "upper" : "lower"} half of that range`;

      paragraphs.push(
        `Over the past year ${isIndex ? "it" : "the share"} has moved between ${band}. ` +
          `At ${rupees(last)} it is ${offHigh.toFixed(1)}% below the 52-week high, ${place}.`,
      );
    } else {
      paragraphs.push(`Over the past year ${isIndex ? "it" : "the share"} has moved between ${band}.`);
    }

    facts.push({ label: "52-week high", value: rupees(high52) });
    facts.push({ label: "52-week low", value: rupees(low52) });

    faqs.push({
      question: `What is the 52-week high and low of ${displayName}?`,
      answer:
        `${displayName} has traded between a 52-week low of ${rupees(low52)} and a 52-week high of ` +
        `${rupees(high52)} on ${contract.exchange === "BSE" ? "the BSE" : "the NSE"}.`,
    });
  }

  /* --- Shareholding ------------------------------------------------------ */

  if (shareholding) {
    const { promoter, public: publicShare, employeeTrusts, asOf } = shareholding;

    // The promoter stake is the single most-searched fact about an Indian
    // company, and it genuinely characterises the business.
    const character =
      promoter >= 50
        ? "a promoter-controlled company"
        : promoter >= 26
          ? "a company where promoters hold a significant but non-controlling stake"
          : promoter > 0
            ? "a widely held company, with promoters holding a minority stake"
            : "a professionally managed company with no promoter holding on record";

    const trustClause = employeeTrusts > 0 ? ` A further ${employeeTrusts.toFixed(2)}% sits with employee trusts.` : "";

    paragraphs.push(
      `As of the filing for ${asOf}, promoters held ${promoter.toFixed(2)}% of ${displayName} and public ` +
        `shareholders ${publicShare.toFixed(2)}%, making it ${character}.${trustClause}`,
    );

    facts.push({ label: "Promoter holding", value: `${promoter.toFixed(2)}%` });
    facts.push({ label: "Public holding", value: `${publicShare.toFixed(2)}%` });
    facts.push({ label: "Shareholding as of", value: asOf });

    faqs.push({
      question: `Who owns ${displayName}?`,
      answer:
        `In the shareholding pattern filed for ${asOf}, promoters held ${promoter.toFixed(2)}% of ` +
        `${displayName} and public shareholders held ${publicShare.toFixed(2)}%` +
        (employeeTrusts > 0 ? `, with ${employeeTrusts.toFixed(2)}% held by employee trusts.` : ".") +
        " The full break-up by FII, DII and retail holding is shown on this page.",
    });
  }

  /* --- Liquidity --------------------------------------------------------- */

  if (!isIndex && volume) {
    const turnover = avgPrice ? ` worth roughly ₹${indianScale(volume * avgPrice)} at the average traded price` : "";
    paragraphs.push(
      `${indianScale(volume)} shares changed hands in the latest session${turnover}. ` +
        `Traded volume is a rough guide to how easily a position can be entered or exited.`,
    );
    facts.push({ label: "Volume (latest session)", value: indianScale(volume) });
  }

  /* --- Remaining facts --------------------------------------------------- */

  if (previousClose) facts.push({ label: "Previous close", value: rupees(previousClose) });
  if (dayHigh && dayLow) facts.push({ label: "Day range", value: `${rupees(dayLow)} – ${rupees(dayHigh)}` });
  facts.push({ label: isIndex ? "Index" : "Symbol", value: contract.symbol });
  facts.push({ label: "Exchange", value: contract.exchange });

  /* --- Q&A the data can answer ------------------------------------------- */

  if (last) {
    faqs.unshift({
      question: `What is the share price of ${displayName} today?`,
      answer:
        `${displayName} (${contract.symbol}) last traded at ${rupees(last)} on ` +
        `${contract.exchange === "BSE" ? "the BSE" : "the NSE"}. The price on this page updates live during ` +
        `market hours.`,
    });
  }

  if (!isIndex) {
    faqs.push({
      question: `How can I buy ${displayName} shares?`,
      answer:
        `You need a demat and trading account to buy ${contract.symbol} shares. With a GoPocket account you ` +
        `can place an order on the web terminal or the mobile app.`,
    });
  }

  // One sentence is the identity line, which every page would have - that is a
  // stub, not content. Two or more means the feed or the filing said something.
  return { paragraphs, facts, faqs, worthShowing: paragraphs.length >= 2 };
}
