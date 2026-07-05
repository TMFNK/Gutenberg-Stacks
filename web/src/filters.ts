import type { Book } from './types';

/** Strip PG "Category: " prefix for display. */
export function shelfLabel(s: string): string {
  return s.startsWith('Category: ') ? s.slice(10) : s;
}

export function era(year: number | null): string | null {
  if (year == null) return null;
  if (year < 1800) return 'Before 1800';
  if (year < 1900) return '19th century';
  return '20th century';
}

export function sortBooks(books: Book[],
                          sort: 'downloads' | 'title'): Book[] {
  const copy = [...books];
  if (sort === 'title') copy.sort((a, z) => a.title.localeCompare(z.title));
  else copy.sort((a, z) => z.downloads - a.downloads);
  return copy;
}
