import { swr } from "@/lib/edge-cache";
import { getFrappeToken, getFrappeUrl } from "@/lib/frappe";
import { indexMembers, nseCompany, type StockRow } from "@/lib/contracts";

/**
 * The /markets/heatmap data: an index's members from Contract Master, priced
 * by Frappe's gopocket.api.get_stock_charts, and laid out as a treemap.
 *
 * The prices method takes trading symbols ("RELIANCE-EQ") and answers each
 * with the last price, the previous close and the session so far in five-
 * minute closes. Frappe holds those in its own cache, so a warm call is a few
 * milliseconds and a cold one two or three seconds.
 */

/** The indices the page offers, keyed by the `?index=` value. `name` is Contract Master's. */
export const HEATMAP_INDICES = [
  { param: "nifty-50", name: "NIFTY 50", label: "Nifty 50" },
  { param: "nifty-bank", name: "NIFTY BANK", label: "Nifty Bank" },
  { param: "nifty-fin-service", name: "NIFTY FIN SERVICE", label: "Nifty Financial Services" },
  { param: "nifty-next-50", name: "NIFTY NEXT 50", label: "Nifty Next 50" },
  { param: "nifty-mid-select", name: "NIFTY MID SELECT", label: "Nifty Midcap Select" },
  { param: "nifty-fpi-150", name: "NIFTY FPI 150", label: "Nifty FPI 150" },
] as const;

export type HeatmapIndex = (typeof HEATMAP_INDICES)[number];

export const indexByParam = (param: string | null): HeatmapIndex =>
  HEATMAP_INDICES.find((index) => index.param === param) ?? HEATMAP_INDICES[0];

/* --- Prices ------------------------------------------------------------- */

const METHOD = "gopocket.api.get_stock_charts";
const TIMEOUT_MS = 8000;

export interface StockQuote {
  ltp: number;
  prevClose: number;
  change: number;
  pct: number;
  /** Epoch seconds of the first five-minute close, or null with no chart. */
  start: number | null;
  /** Five-minute closes from the open, oldest first. */
  closes: number[];
}

export interface IndexQuotes {
  marketOpen: boolean;
  /** "YYYY-MM-DD", the session the prices belong to. */
  sessionDate: string | null;
  /** Interval between the chart's closes, in seconds. */
  step: number;
  /** Keyed by trading symbol. */
  quotes: Record<string, StockQuote>;
}

interface RawQuote {
  token?: string;
  status?: string;
  ltp?: number;
  prev_close?: number;
  change?: number;
  change_pct?: number;
  session_date?: string;
  chart?: [number, number][];
}

interface RawMessage {
  market_open?: boolean;
  chart_interval_minutes?: number;
  data?: RawQuote[];
}

const finite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);

async function readQuotes(tradingSymbols: string[]): Promise<IndexQuotes | null> {
  try {
    const response = await fetch(`${getFrappeUrl()}/api/method/${METHOD}`, {
      method: "POST",
      headers: { Authorization: `token ${getFrappeToken()}`, "Content-Type": "application/json" },
      body: JSON.stringify({ exchange: "NSE", tokens: tradingSymbols }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const { message } = (await response.json()) as { message?: RawMessage };
    if (!message?.data) return null;

    const quotes: Record<string, StockQuote> = {};
    let sessionDate: string | null = null;
    for (const raw of message.data) {
      if (raw.status !== "success" || !raw.token || !finite(raw.ltp) || !finite(raw.prev_close)) continue;
      const chart = (raw.chart ?? []).filter((point) => finite(point[0]) && finite(point[1]));
      sessionDate ??= raw.session_date ?? null;
      quotes[raw.token] = {
        ltp: raw.ltp,
        prevClose: raw.prev_close,
        change: finite(raw.change) ? raw.change : raw.ltp - raw.prev_close,
        pct: finite(raw.change_pct) ? raw.change_pct : ((raw.ltp - raw.prev_close) / raw.prev_close) * 100,
        start: chart[0]?.[0] ?? null,
        closes: chart.map((point) => point[1]),
      };
    }

    return {
      marketOpen: message.market_open === true,
      sessionDate,
      step: (message.chart_interval_minutes ?? 5) * 60,
      quotes,
    };
  } catch (error) {
    console.error("Heatmap prices lookup failed:", error);
    return null;
  }
}

/**
 * Prices for an index's members. Fresh for fifteen seconds, so a page load
 * during the session is close to live, and served stale for up to an hour
 * while a new copy loads, so a visitor only waits on Frappe when nobody has
 * asked lately.
 */
function fetchQuotes(
  index: HeatmapIndex,
  tradingSymbols: string[],
  waitUntil?: (promise: Promise<unknown>) => void,
): Promise<IndexQuotes | null> {
  return swr(`heatmap:${index.param}`, () => readQuotes(tradingSymbols), {
    freshSeconds: 15,
    staleSeconds: 60 * 60,
    keep: (value) => Object.keys(value.quotes).length > 0,
    waitUntil,
  });
}

/* --- Tiles -------------------------------------------------------------- */

export interface HeatTile {
  symbol: string;
  name: string;
  sector: string;
  href: string;
  /** ₹ crore - the tile's area. */
  weight: number;
  quote: StockQuote | null;
}

export interface Heatmap {
  index: HeatmapIndex;
  tiles: HeatTile[];
  marketOpen: boolean;
  sessionDate: string | null;
  step: number;
  /** False when the members or the prices couldn't be read. */
  ok: boolean;
}

const OTHERS = "Others";

export async function loadHeatmap(
  index: HeatmapIndex,
  waitUntil?: (promise: Promise<unknown>) => void,
): Promise<Heatmap> {
  const members = (await indexMembers(index.name, waitUntil)) ?? [];
  const prices =
    members.length > 0
      ? await fetchQuotes(
          index,
          members.map((row) => row.tradingSymbol),
          waitUntil,
        )
      : null;

  // A share without a market cap still gets a tile, at the index's median size.
  const caps = members
    .map((row) => row.marketCap)
    .filter((cap): cap is number => cap !== null)
    .sort((a, b) => a - b);
  const median = caps[Math.floor(caps.length / 2)] ?? 1;

  const tiles = members.map((row: StockRow): HeatTile => {
    const company = nseCompany(row.symbol);
    return {
      symbol: row.symbol,
      name: company?.name ?? row.symbol,
      sector: row.sector || OTHERS,
      href: `/stocks/${row.slug}`,
      weight: row.marketCap ?? median,
      quote: prices?.quotes[row.tradingSymbol] ?? null,
    };
  });

  return {
    index,
    tiles,
    marketOpen: prices?.marketOpen ?? false,
    sessionDate: prices?.sessionDate ?? null,
    step: prices?.step ?? 300,
    ok: members.length > 0 && prices !== null,
  };
}

/* --- Treemap ------------------------------------------------------------ */

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Squarified treemap (Bruls, Huizing & van Wijk): items are laid in rows along
 * the box's shorter side, and a row is closed as soon as adding the next item
 * would make its worst aspect ratio worse. The result is tiles as close to
 * square as the weights allow, which is what makes a label fit.
 */
function squarify<T>(items: { weight: number; item: T }[], box: Box): (Box & { item: T })[] {
  const total = items.reduce((sum, entry) => sum + entry.weight, 0);
  if (total <= 0 || box.w <= 0 || box.h <= 0) return [];

  const scale = (box.w * box.h) / total;
  const nodes = items
    .filter((entry) => entry.weight > 0)
    .map((entry) => ({ area: entry.weight * scale, item: entry.item }))
    .sort((a, b) => b.area - a.area);

  const placed: (Box & { item: T })[] = [];
  let free = { ...box };

  const worst = (row: typeof nodes, side: number) => {
    const sum = row.reduce((s, node) => s + node.area, 0);
    const max = row[0].area;
    const min = row[row.length - 1].area;
    return Math.max((side * side * max) / (sum * sum), (sum * sum) / (side * side * min));
  };

  const lay = (row: typeof nodes) => {
    const sum = row.reduce((s, node) => s + node.area, 0);
    if (free.w >= free.h) {
      const w = sum / free.h;
      let y = free.y;
      for (const node of row) {
        const h = node.area / w;
        placed.push({ x: free.x, y, w, h, item: node.item });
        y += h;
      }
      free = { x: free.x + w, y: free.y, w: free.w - w, h: free.h };
    } else {
      const h = sum / free.w;
      let x = free.x;
      for (const node of row) {
        const w = node.area / h;
        placed.push({ x, y: free.y, w, h, item: node.item });
        x += w;
      }
      free = { x: free.x, y: free.y + h, w: free.w, h: free.h - h };
    }
  };

  let row: typeof nodes = [];
  for (const node of nodes) {
    const side = Math.min(free.w, free.h);
    if (row.length === 0 || worst([...row, node], side) <= worst(row, side)) {
      row.push(node);
    } else {
      lay(row);
      row = [node];
    }
  }
  if (row.length > 0) lay(row);
  return placed;
}

/** How much a tile can say, from its size at the layout's reference width. */
export type Tier = "xl" | "lg" | "md" | "sm" | "xs";

function tierOf(w: number, h: number): Tier {
  const short = Math.min(w, h);
  if (short >= 110 && w >= 140) return "xl";
  if (short >= 64 && w >= 76) return "lg";
  if (short >= 36 && w >= 50) return "md";
  if (short >= 22 && w >= 34) return "sm";
  return "xs";
}

export interface PlacedTile {
  tile: HeatTile;
  /** Percent of the sector's body. */
  x: number;
  y: number;
  w: number;
  h: number;
  tier: Tier;
}

export interface PlacedSector {
  name: string;
  /** Percent of the whole map. */
  x: number;
  y: number;
  w: number;
  h: number;
  /** Whether the sector has room for its name strip. */
  header: boolean;
  tiles: PlacedTile[];
}

/** The sector name strip, in reference pixels - matches h-5 in the markup. */
const HEADER_PX = 20;

/**
 * Two-level layout: sectors by their combined market cap, then each sector's
 * shares inside it. Computed in pixels at a reference size - the map is drawn
 * at a fixed aspect ratio, so its real size only scales these - and returned
 * as percentages for the markup to position with.
 */
export function layoutHeatmap(tiles: HeatTile[], width: number, height: number): PlacedSector[] {
  const bySector = new Map<string, HeatTile[]>();
  for (const tile of tiles) bySector.set(tile.sector, [...(bySector.get(tile.sector) ?? []), tile]);

  const sectors = squarify(
    [...bySector].map(([name, members]) => ({
      weight: members.reduce((sum, tile) => sum + tile.weight, 0),
      item: { name, members },
    })),
    { x: 0, y: 0, w: width, h: height },
  );

  return sectors.map((sector) => {
    const header = sector.w >= 90 && sector.h >= 70;
    const body = { x: 0, y: 0, w: sector.w, h: sector.h - (header ? HEADER_PX : 0) };
    const placed = squarify(
      sector.item.members.map((tile) => ({ weight: tile.weight, item: tile })),
      body,
    );

    return {
      name: sector.item.name,
      x: (sector.x / width) * 100,
      y: (sector.y / height) * 100,
      w: (sector.w / width) * 100,
      h: (sector.h / height) * 100,
      header,
      tiles: placed.map((cell) => ({
        tile: cell.item,
        x: (cell.x / body.w) * 100,
        y: (cell.y / body.h) * 100,
        w: (cell.w / body.w) * 100,
        h: (cell.h / body.h) * 100,
        tier: tierOf(cell.w, cell.h),
      })),
    };
  });
}

/* --- Colour ------------------------------------------------------------- */

/**
 * Seven steps rather than a continuous scale: a reader compares a tile to the
 * legend, and "about -2%" is answerable at a glance where a shade of red is
 * not. Each step is centred on its label - "-1%" covers -1.5% to -0.5% - and
 * every one carries white text at a readable contrast.
 */
export const HEAT_STEPS = [
  { below: -2.5, color: "#8f1d22", label: "-3%" },
  { below: -1.5, color: "#b3262c", label: "-2%" },
  { below: -0.5, color: "#d6454a", label: "-1%" },
  { below: 0.5, color: "#5a6170", label: "0%" },
  { below: 1.5, color: "#2e9a5f", label: "+1%" },
  { below: 2.5, color: "#1f7d4a", label: "+2%" },
  { below: Infinity, color: "#145e36", label: "+3%" },
] as const;

/** The no-price tile: neither up nor down. */
export const HEAT_NONE = "#3f4450";

export const heatColor = (pct: number | null): string =>
  pct === null ? HEAT_NONE : (HEAT_STEPS.find((step) => pct < step.below) ?? HEAT_STEPS[HEAT_STEPS.length - 1]).color;
