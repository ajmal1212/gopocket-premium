/**
 * Page sizes for the /blog listing. Page 1 carries the featured post and the
 * three stacked beside it on top of a grid, so it holds more than the later
 * pages, which are grid only. Both grids are three columns wide, so the grid
 * counts are kept to multiples of three to leave no half-empty last row.
 */
export const FIRST_PAGE_SIZE = 16; // 1 featured + 3 side + 12 grid
export const PAGE_SIZE = 12;

/** Number of posts that come before page `page` (1-based). */
export function blogPageStart(page: number): number {
  return page <= 1 ? 0 : FIRST_PAGE_SIZE + (page - 2) * PAGE_SIZE;
}

export function blogPageCount(totalPosts: number): number {
  return totalPosts <= FIRST_PAGE_SIZE ? 1 : 1 + Math.ceil((totalPosts - FIRST_PAGE_SIZE) / PAGE_SIZE);
}

export function blogPageHref(page: number): string {
  return page <= 1 ? "/blog" : `/blog/page/${page}`;
}
