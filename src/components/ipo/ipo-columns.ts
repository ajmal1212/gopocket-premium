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
 * These strings are read by Tailwind's source scanner, so they must stay
 * written out in full - a template literal assembled at runtime would not be
 * seen and the classes would never be generated.
 */
export type IpoTab = "open" | "upcoming" | "closed";

export interface ColumnLayout {
  /** Base (phone) and md+ track lists, applied to both the headings and rows. */
  grid: string;
  /** Headings between "Company" and the trailing column. */
  headings: string[];
  /** Whether a final, unlabelled column holds an action (button or doc link). */
  trailingColumn: boolean;
}

export const COLUMN_LAYOUT: Record<IpoTab, ColumnLayout> = {
  // Company | Closing date | Overall subscription | Apply
  open: {
    grid: "grid-cols-[3.25rem_minmax(0,1fr)_5.75rem] md:grid-cols-[3.25rem_minmax(0,1fr)_9rem_11rem_6.5rem]",
    headings: ["Closing date", "Overall subscription"],
    trailingColumn: true,
  },

  // Company | Opening date | IPO Doc. Nothing else is known this early - most
  // upcoming records carry only a logo and a link to the filed offer document.
  upcoming: {
    grid: "grid-cols-[3.25rem_minmax(0,1fr)_5.75rem] md:grid-cols-[3.25rem_minmax(0,1fr)_minmax(0,1fr)_7rem]",
    headings: ["Opening date"],
    trailingColumn: true,
  },

  // Company | Listing date | Listing returns | Overall subscription. No action:
  // bidding is over, so there is nothing here for the reader to do.
  closed: {
    grid: "grid-cols-[3.25rem_minmax(0,1fr)] md:grid-cols-[3.25rem_minmax(0,1fr)_9rem_11rem_11rem]",
    headings: ["Listing date", "Listing returns", "Overall subscription"],
    trailingColumn: false,
  },
};
