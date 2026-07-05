import { describe, expect, it } from 'vitest';
import { era, shelfLabel, sortBooks } from './filters';
import type { Book } from './types';

function mk(over: Partial<Book>): Book {
  return { id: 1, title: 'T', author: 'A', year: 1850, lang: 'en',
    downloads: 10, mood: null, themes: null, difficulty: null, hook: null,
    cover: null, summary: null, subjects: [], bookshelves: [],
    url: 'https://www.gutenberg.org/ebooks/1', ...over };
}

describe('era', () => {
  it('buckets years', () => {
    expect(era(1750)).toBe('Before 1800');
    expect(era(1850)).toBe('19th century');
    expect(era(1900)).toBe('20th century');
    expect(era(null)).toBeNull();
  });
});

describe('shelfLabel', () => {
  it('strips Category prefix', () => {
    expect(shelfLabel('Category: Novels')).toBe('Novels');
    expect(shelfLabel('Romance')).toBe('Romance');
  });
});

describe('sortBooks', () => {
  const books = [mk({ id: 1, title: 'B', downloads: 5 }), mk({ id: 2, title: 'A', downloads: 9 })];
  it('sorts by downloads desc', () => {
    expect(sortBooks(books, 'downloads')[0].id).toBe(2);
  });
  it('sorts by title asc without mutating input', () => {
    expect(sortBooks(books, 'title')[0].title).toBe('A');
    expect(books[0].title).toBe('B');
  });
});
