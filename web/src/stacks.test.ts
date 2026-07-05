import { describe, expect, it } from 'vitest';
import { buildStacks, cardCount, searchStacks, type Stack } from './stacks';
import type { Book } from './types';

function mk(over: Partial<Book>): Book {
  return { id: 1, title: 'T', author: 'A', year: 1850, lang: 'en',
    downloads: 10, mood: null, themes: null, difficulty: null, hook: null,
    cover: null, summary: null, subjects: [], bookshelves: [],
    url: 'https://www.gutenberg.org/ebooks/1', ...over };
}

const fiction = (id: number, over: Partial<Book> = {}) =>
  mk({ id, bookshelves: ['Category: Fiction'], downloads: id, ...over });

describe('buildStacks', () => {
  it('creates one home stack per bookshelf, largest first, label stripped', () => {
    const { home } = buildStacks([
      fiction(1), fiction(2),
      mk({ id: 3, bookshelves: ['Category: Poetry'] }),
    ]);
    expect(home.map((s) => s.title)).toEqual(['Fiction', 'Poetry']);
    expect(home[0].slug).toBe('fiction');
  });

  it('nests era stacks in chronological order, skipping empty eras', () => {
    const { home } = buildStacks([
      fiction(1, { year: 1700 }),
      fiction(2, { year: 1920 }),
      fiction(3, { year: null }),
    ]);
    expect(home[0].children.map((s) => s.title))
      .toEqual(['Before 1800', '20th century', 'Undated']);
    expect(home[0].books).toHaveLength(0);
  });

  it('groups an era into subject stacks and keeps leftovers as direct cards', () => {
    const books = [
      fiction(1, { subjects: ['Sea stories'] }),
      fiction(2, { subjects: ['Sea stories'] }),
      fiction(3, { subjects: ['Sea stories'] }),
      fiction(4, { subjects: ['One-off subject'] }),
    ];
    const { home } = buildStacks(books);
    const eraStack = home[0].children[0];
    expect(eraStack.children.map((s) => s.title)).toEqual(['Sea stories']);
    expect(eraStack.children[0].books.map((b) => b.id)).toEqual([3, 2, 1]);
    expect(eraStack.books.map((b) => b.id)).toEqual([4]);
    expect(cardCount(eraStack)).toBe(2);
  });

  it('skips the subject level for tiny era slices', () => {
    const { home } = buildStacks([
      fiction(1, { subjects: ['Sea stories'] }),
      fiction(2, { subjects: ['Sea stories'] }),
    ]);
    const eraStack = home[0].children[0];
    expect(eraStack.children).toHaveLength(0);
    expect(eraStack.books).toHaveLength(2);
  });

  it('reaches every book of a category through its era subtree', () => {
    const books = Array.from({ length: 30 }, (_, i) =>
      fiction(i + 1, {
        year: [1700, 1850, 1920, null][i % 4],
        subjects: [`Subject ${i % 5}`],
      }));
    const { home } = buildStacks(books);
    const seen = new Set<number>();
    const walk = (s: Stack) => {
      for (const b of s.books) seen.add(b.id);
      s.children.forEach(walk);
    };
    walk(home[0]);
    expect(seen.size).toBe(30);
  });

  it('maps each book to the stacks holding it as a direct card', () => {
    const books = [
      fiction(1, { subjects: ['Sea stories', 'Whales'] }),
      fiction(2, { subjects: ['Sea stories', 'Whales'] }),
      fiction(3, { subjects: ['Sea stories'] }),
      fiction(4, { subjects: ['Sea stories'] }),
    ];
    const { byBook } = buildStacks(books);
    expect(byBook.get(1)!.map((s) => s.title).sort())
      .toEqual(['Sea stories', 'Whales']);
  });

  it('keeps slugs unique across same-named subjects in different eras', () => {
    const books = [
      ...[1, 2, 3, 4].map((id) => fiction(id, { year: 1850, subjects: ['War'] })),
      ...[5, 6, 7, 8].map((id) => fiction(id, { year: 1920, subjects: ['War'] })),
    ];
    const { bySlug } = buildStacks(books);
    const slugs = [...bySlug.keys()];
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(slugs).toContain('fiction--19th-century--war');
    expect(slugs).toContain('fiction--20th-century--war');
  });
});

describe('searchStacks', () => {
  const books = [
    ...[1, 2, 3, 4].map((id) => fiction(id, { year: 1850, subjects: ['Sea stories'] })),
    ...[5, 6].map((id) => mk({ id, bookshelves: ['Category: Poetry'] })),
  ];
  const index = buildStacks(books);

  it('matches stack titles case-insensitively', () => {
    expect(searchStacks(index, 'sea sto').map((s) => s.title))
      .toEqual(['Sea stories']);
    expect(searchStacks(index, 'POETRY')[0].title).toBe('Poetry');
  });

  it('ranks title matches before description matches', () => {
    const hits = searchStacks(index, 'fiction');
    expect(hits[0].title).toBe('Fiction');
    expect(hits.length).toBeGreaterThan(1);
  });

  it('returns nothing for unmatched queries and respects the limit', () => {
    expect(searchStacks(index, 'dracula')).toEqual([]);
    expect(searchStacks(index, 'e', 2)).toHaveLength(2);
  });
});
