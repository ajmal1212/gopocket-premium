/**
 * Page sizes for the /news listing, the same scheme as blog-pages.ts. Page 1
 * carries the four "Recent News" cards on top of the grid, so it holds more
 * than the later pages, which are grid only. The grid is two columns wide, so
 * its counts are kept even to leave no half-empty last row.
 */
export const FIRST_PAGE_SIZE = 20; // 4 recent + 16 grid
export const PAGE_SIZE = 12;

/** Number of articles that come before page `page` (1-based). */
export function newsPageStart(page: number): number {
  return page <= 1 ? 0 : FIRST_PAGE_SIZE + (page - 2) * PAGE_SIZE;
}

export function newsPageCount(totalArticles: number): number {
  return totalArticles <= FIRST_PAGE_SIZE ? 1 : 1 + Math.ceil((totalArticles - FIRST_PAGE_SIZE) / PAGE_SIZE);
}

/** A listing page's address, carrying the category filter when one is set. */
export function newsPageHref(page: number, category: string | null = null): string {
  const path = page <= 1 ? "/news" : `/news/page/${page}`;
  return category ? `${path}?${new URLSearchParams({ category })}` : path;
}
