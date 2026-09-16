/**
 * Column layout for each tab of the IPO board.
 *
 * The three statuses show different data, so they get different tables: an
 * upcoming issue has no subscription figure to report and a closed one has no
 * action to offer. The grid template lives here rather than in either component
 * because IpoRow and IpoDashboard's heading row must use the identical track
 * list - when they were written out separately they drifted and the headings
 * stopped lining up with the cells beneath them.
 *
 * Columns come in two tiers. The wide tables (Open with its price band and lot
 * size, Closed with its issue and listing price) only fit from `xl`; below that
 * those columns are hidden and a shorter track list is used. The squeeze is
 * worst at `lg`, where the CTA card has just appeared and taken 320px but the
 * viewport has not grown to compensate - at 1024px the full Closed table left
 * the company name 4px wide, which is what this tiering fixes.
 *
 * Hidden cells are `display: none`, so they leave grid flow entirely and the
 * visible cells line up with the shorter template. DOM order must therefore
 * match the widest (xl) track order.
 *
 * These strings are read by Tailwind's source scanner, so they must stay
 * written out in full - a template literal assembled at runtime would not be
 * seen and the classes would never be generated.
 */
export type IpoTab = "open" | "upcoming" | "closed";

/** The breakpoint from which a column appears. */
export type ColumnTier = "md" | "xl";

export interface ColumnSpec {
  label: string;
  tier: ColumnTier;
}

export interface ColumnLayout {
  /** Gap plus the base / md / xl track lists, shared by headings and rows. */
  grid: string;
  /** Columns between "Company" and the trailing action column. */
  columns: ColumnSpec[];
  /** Whether a final, unlabelled column holds an action (button or doc link). */
  trailingColumn: boolean;
}

/** Visibility utilities for a column's header cell and its row cell. */
export const TIER_VISIBILITY: Record<ColumnTier, string> = {
  md: "hidden md:block",
  xl: "hidden xl:block",
};

export const COLUMN_LAYOUT: Record<IpoTab, ColumnLayout> = {
  // Company | Closing | Price band | Lot | Subscribed | Apply.
  // Price band and lot size are xl-only; below that the table runs as
  // Company | Closing | Subscribed | Apply.
  open: {
    grid:
      "gap-3 grid-cols-[3.25rem_minmax(0,1fr)_5.75rem] " +
      "md:grid-cols-[3.25rem_minmax(0,1fr)_7rem_7rem_6.5rem] " +
      // Price band gets the widest track: a four-figure band such as
      // "₹1,530 - ₹1,785" is the longest value any cell on this page renders.
      "xl:grid-cols-[3.25rem_minmax(0,1fr)_5.5rem_7.5rem_4.5rem_6.5rem_6.5rem]",
    columns: [
      { label: "Closing", tier: "md" },
      { label: "Price band", tier: "xl" },
      { label: "Lot", tier: "xl" },
      { label: "Subscribed", tier: "md" },
    ],
    trailingColumn: true,
  },

  // Company | Opening | IPO Doc. Nothing else is known this early - most
  // upcoming records carry only a logo and a link to the filed offer document,
  // so this table never needs a second tier.
  upcoming: {
    grid:
      "gap-3 grid-cols-[3.25rem_minmax(0,1fr)_5.75rem] " + "md:grid-cols-[3.25rem_minmax(0,1fr)_minmax(0,1fr)_7rem]",
    columns: [{ label: "Opening", tier: "md" }],
    trailingColumn: true,
  },

  // Company | Listed | Issue | Listing | Returns | Subscribed. No action column:
  // bidding is over, so there is nothing here for the reader to do. The two
  // price columns are xl-only, leaving Listed | Returns | Subscribed below that.
  //
  // Single-word labels: the values disambiguate them ("18 Sep" vs "₹102" vs
  // "₹81.60"), and the full labels wrapped to two lines in these tracks.
  closed: {
    grid:
      "gap-3 grid-cols-[3.25rem_minmax(0,1fr)] " +
      "md:grid-cols-[3.25rem_minmax(0,1fr)_7rem_8rem_7rem] " +
      "xl:grid-cols-[3.25rem_minmax(0,1fr)_5rem_5rem_5.5rem_7.5rem_6rem]",
    columns: [
      { label: "Listed", tier: "md" },
      { label: "Issue", tier: "xl" },
      { label: "Listing", tier: "xl" },
      { label: "Returns", tier: "md" },
      { label: "Subscribed", tier: "md" },
    ],
    trailingColumn: false,
  },
};
