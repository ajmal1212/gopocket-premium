/**
 * Brokerage and statutory charges for /brokerage-calculator.
 *
 * Two kinds of numbers live here, and they change for different reasons:
 *
 * 1. GoPocket's own pricing - brokerage and the DP charge. These are carried
 *    over unchanged from the calculator on the previous gopocket.in page,
 *    including its ₹20 caps. Change them only when GoPocket's pricing changes.
 *
 * 2. Statutory and exchange charges - STT/CTT, exchange transaction charges,
 *    NSE IPFT, SEBI fees and stamp duty - in the RATES table below. These are
 *    set by the government, SEBI and the exchanges, and must be kept current.
 *    Last verified September 2026 against:
 *      - NSE circular NSE/FA/73061 (27 Feb 2026, effective 1 Mar 2026): cash
 *        ₹306.99/cr, futures ₹182.99/cr, options ₹3,552.99/cr of premium, and
 *        the IPFT contribution cut to ₹0.01/cr.
 *      - Union Budget 2026-27 STT revision, effective 1 Apr 2026: futures
 *        0.05% and options 0.15% of premium, both on the sell side.
 *      - BSE and MCX transaction charges and the unchanged stamp duty, SEBI
 *        and CTT rates, as published in brokers' current charge sheets.
 *
 * Rounding follows the old page - STT with Math.ceil (except options, which it
 * left unrounded), CTT and stamp duty with Math.round - so results only move
 * where a rate has actually changed.
 *
 * Kept outside the page script so the page renders its first result on the
 * server and the browser recomputes with the very same code.
 */

export type Exchange = "NSE" | "BSE";

export interface ChargeBreakdown {
  turnover: number;
  brokerage: number;
  exchangeCharges: number;
  gst: number;
  /** STT for equity and F&O, CTT for commodity. */
  transactionTax: number;
  sebiCharges: number;
  stampDuty: number;
  /** Equity delivery only. */
  dpCharges?: number;
  /** NSE only; zero on BSE and not charged on commodity. */
  nseIpft?: number;
  totalCharges: number;
  breakEven: number;
  netProfit: number;
}

/** Statutory and exchange rates, as fractions of the traded value. */
const RATES = {
  gst: 0.18,
  /** ₹10 per crore. */
  sebi: 0.000001,
  /** ₹1 per crore - agricultural commodities. */
  sebiAgri: 0.0000001,
  /** ₹0.01 per crore, from 1 Mar 2026. */
  nseIpft: 0.000000001,
  exchange: {
    equity: { NSE: 0.000030699, BSE: 0.0000375 },
    futures: { NSE: 0.000018299, BSE: 0 },
    options: { NSE: 0.000355299, BSE: 0.000325 },
    mcxFutures: 0.000021,
    mcxOptions: 0.000418,
  },
  stt: {
    /** On buy and sell. */
    delivery: 0.001,
    /** Sell side. */
    intraday: 0.00025,
    /** Sell side, from 1 Apr 2026. */
    futures: 0.0005,
    /** Sell side, on premium, from 1 Apr 2026. */
    options: 0.0015,
  },
  ctt: {
    /** Sell side, non-agricultural only. */
    futures: 0.0001,
    /** Sell side. */
    options: 0.0005,
  },
  stamp: {
    /** All on the buy side. */
    delivery: 0.00015,
    intraday: 0.00003,
    futures: 0.00002,
    options: 0.00003,
  },
};

// GoPocket pricing, unchanged from the old page.
const DP_CHARGE = 20;
const OPTION_ORDER_BROKERAGE = 20;

/** Brokerage per leg: 0.1% of the order value, capped at ₹20 (reached at ₹20,000). */
const equityLegBrokerage = (value: number) => (value >= 20000 ? 20 : value * 0.001);

/** Brokerage per leg: 0.03% of the order value, capped at ₹20 (reached at ₹66,666). */
const futuresLegBrokerage = (value: number) => (value >= 66666 ? 20 : value * 0.0003);

/** Flat per executed order, on each side that has a price. */
const optionBrokerage = (buy: number, sell: number) =>
  (buy > 0 ? OPTION_ORDER_BROKERAGE : 0) + (sell > 0 ? OPTION_ORDER_BROKERAGE : 0);

// The old page divided by the quantity unguarded and showed "NaN" for an empty
// quantity; zero reads better and changes nothing for a real trade.
const safeDivide = (value: number, by: number) => (by ? value / by : 0);

/** GST is charged on brokerage, exchange transaction charges and SEBI fees. */
const gstOn = (brokerage: number, exchangeCharges: number, sebiCharges: number) =>
  RATES.gst * (brokerage + exchangeCharges + sebiCharges);

const sum = (...values: (number | undefined)[]) => values.reduce<number>((total, value) => total + (value ?? 0), 0);

function finish(
  parts: Omit<ChargeBreakdown, "totalCharges" | "breakEven" | "netProfit">,
  profitBeforeCharges: number,
  breakEvenUnits: number,
): ChargeBreakdown {
  const totalCharges = sum(
    parts.brokerage,
    parts.exchangeCharges,
    parts.gst,
    parts.transactionTax,
    parts.sebiCharges,
    parts.stampDuty,
    parts.dpCharges,
    parts.nseIpft,
  );
  return {
    ...parts,
    totalCharges,
    breakEven: safeDivide(totalCharges, breakEvenUnits),
    netProfit: profitBeforeCharges - totalCharges,
  };
}

const ipftFor = (exchange: Exchange, turnover: number) => (exchange === "NSE" ? RATES.nseIpft * turnover : 0);

export function equityIntraday(buy: number, sell: number, qty: number, exchange: Exchange = "NSE"): ChargeBreakdown {
  const turnover = (buy + sell) * qty;
  const brokerage = equityLegBrokerage(buy * qty) + equityLegBrokerage(sell * qty);
  const exchangeCharges = RATES.exchange.equity[exchange] * turnover;
  const sebiCharges = RATES.sebi * turnover;
  return finish(
    {
      turnover,
      brokerage,
      exchangeCharges,
      gst: gstOn(brokerage, exchangeCharges, sebiCharges),
      transactionTax: Math.ceil(sell * qty * RATES.stt.intraday),
      sebiCharges,
      stampDuty: Math.round(buy * qty * RATES.stamp.intraday),
      nseIpft: ipftFor(exchange, turnover),
    },
    (sell - buy) * qty,
    qty,
  );
}

export function equityDelivery(buy: number, sell: number, qty: number, exchange: Exchange = "NSE"): ChargeBreakdown {
  const turnover = (buy + sell) * qty;
  const brokerage = equityLegBrokerage(buy * qty) + equityLegBrokerage(sell * qty);
  const exchangeCharges = RATES.exchange.equity[exchange] * turnover;
  const sebiCharges = RATES.sebi * turnover;
  return finish(
    {
      turnover,
      brokerage,
      exchangeCharges,
      gst: gstOn(brokerage, exchangeCharges, sebiCharges),
      transactionTax: Math.ceil(turnover * RATES.stt.delivery),
      sebiCharges,
      stampDuty: Math.round(buy * qty * RATES.stamp.delivery),
      dpCharges: sell > 0 ? DP_CHARGE : 0,
      nseIpft: ipftFor(exchange, turnover),
    },
    (sell - buy) * qty,
    qty,
  );
}

export function fnoFutures(buy: number, sell: number, qty: number, exchange: Exchange = "NSE"): ChargeBreakdown {
  const turnover = (buy + sell) * qty;
  const brokerage = futuresLegBrokerage(buy * qty) + futuresLegBrokerage(sell * qty);
  const exchangeCharges = RATES.exchange.futures[exchange] * turnover;
  const sebiCharges = RATES.sebi * turnover;
  return finish(
    {
      turnover,
      brokerage,
      exchangeCharges,
      gst: gstOn(brokerage, exchangeCharges, sebiCharges),
      transactionTax: Math.ceil(sell * qty * RATES.stt.futures),
      sebiCharges,
      stampDuty: Math.round(buy * qty * RATES.stamp.futures),
      nseIpft: ipftFor(exchange, turnover),
    },
    (sell - buy) * qty,
    qty,
  );
}

export function fnoOptions(buy: number, sell: number, qty: number, exchange: Exchange = "NSE"): ChargeBreakdown {
  // For options, buy and sell are premiums, so turnover is premium turnover.
  const turnover = (buy + sell) * qty;
  const brokerage = optionBrokerage(buy, sell);
  const exchangeCharges = RATES.exchange.options[exchange] * turnover;
  const sebiCharges = RATES.sebi * turnover;
  return finish(
    {
      turnover,
      brokerage,
      exchangeCharges,
      gst: gstOn(brokerage, exchangeCharges, sebiCharges),
      transactionTax: sell * qty * RATES.stt.options,
      sebiCharges,
      stampDuty: Math.round(buy * qty * RATES.stamp.options),
      nseIpft: ipftFor(exchange, turnover),
    },
    (sell - buy) * qty,
    qty,
  );
}

/** MCX contracts and their lot sizes, in the order the old page listed them. */
export const commodityLotSizes: Record<string, number> = {
  ALUMINIUM: 5000,
  ALUMINI: 1000,
  CARDAMOM: 100,
  CASTORSEED: 100,
  COPPER: 2500,
  COTTON: 25,
  CPO: 1000,
  CRUDEOIL: 100,
  GOLD: 100,
  GOLDGUINEA: 1,
  GOLDM: 10,
  GOLDPETAL: 1,
  KAPAS: 200,
  LEAD: 5000,
  MENTHAOIL: 1080,
  NATURALGAS: 1250,
  NICKEL: 1500,
  PEPPER: 10,
  RBDPMOLEIN: 1000,
  SILVER: 30,
  SILVERM: 5,
  SILVERMIC: 1,
  ZINC: 5000,
  MCXBULLDEX: 50,
  MCXMETLDEX: 50,
  MCXENRGDEX: 125,
  RUBBER: 10,
  ZINCMINI: 1000,
  LEADMINI: 1000,
  CRUDEOILM: 10,
  NATGASMINI: 250,
};

/**
 * MCX agricultural contracts: no CTT, and SEBI fees of ₹1/cr instead of ₹10.
 */
export const agriCommodities = new Set([
  "CARDAMOM",
  "CASTORSEED",
  "COTTON",
  "CPO",
  "KAPAS",
  "MENTHAOIL",
  "PEPPER",
  "RBDPMOLEIN",
  "RUBBER",
]);

/** Contracts that trade as options on MCX; the Option tab offers only these. */
export const commodityOptionContracts = [
  "COPPER",
  "CRUDEOIL",
  "GOLD",
  "GOLDM",
  "NATURALGAS",
  "SILVER",
  "SILVERM",
  "ZINC",
];

export function commodityFutures(commodity: string, buy: number, sell: number, lots: number): ChargeBreakdown {
  const lotSize = commodityLotSizes[commodity] ?? 0;
  const agri = agriCommodities.has(commodity);
  const turnover = (buy + sell) * lots * lotSize;
  const brokerage = futuresLegBrokerage(buy * lots * lotSize) + futuresLegBrokerage(sell * lots * lotSize);
  const exchangeCharges = RATES.exchange.mcxFutures * turnover;
  const sebiCharges = (agri ? RATES.sebiAgri : RATES.sebi) * turnover;
  return finish(
    {
      turnover,
      brokerage,
      exchangeCharges,
      gst: gstOn(brokerage, exchangeCharges, sebiCharges),
      transactionTax: agri ? 0 : Math.round(sell * lots * lotSize * RATES.ctt.futures),
      sebiCharges,
      stampDuty: Math.round(buy * lots * lotSize * RATES.stamp.futures),
    },
    (sell - buy) * lotSize * lots,
    // As on the old page: per unit of one lot, not of every lot traded.
    lotSize,
  );
}

export function commodityOptions(commodity: string, buy: number, sell: number, lots: number): ChargeBreakdown {
  const lotSize = commodityLotSizes[commodity] ?? 0;
  const turnover = (buy + sell) * lots * lotSize;
  const brokerage = optionBrokerage(buy, sell);
  const exchangeCharges = RATES.exchange.mcxOptions * turnover;
  const sebiCharges = RATES.sebi * turnover;
  return finish(
    {
      turnover,
      brokerage,
      exchangeCharges,
      gst: gstOn(brokerage, exchangeCharges, sebiCharges),
      transactionTax: Math.round(sell * lots * lotSize * RATES.ctt.options),
      sebiCharges,
      stampDuty: Math.round(buy * lots * lotSize * RATES.stamp.options),
    },
    (sell - buy) * lotSize * lots,
    lotSize,
  );
}
