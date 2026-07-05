import type { Book } from './types';
import { era, shelfLabel } from './filters';

export type StackLevel = 'category' | 'era' | 'subject' | 'author';

/**
 * A stack in the sense of Winnie Lim's learning-network prototype:
 * a collection that is itself addressable as a card, so stacks nest
 * inside stacks. Children render as stack-type cards, `books` as
 * regular book cards after them.
 */
export interface Stack {
  slug: string;
  title: string;
  description: string;
  level: StackLevel;
  parent: Stack | null;
  children: Stack[];
  books: Book[];
}

export interface StackIndex {
  home: Stack[];
  bySlug: Map<string, Stack>;
  /** Stacks in which a book appears as a direct card (for the "stacks (N)" pivot). */
  byBook: Map<number, Stack[]>;
  /** Author-name → author stack (for the author link on book cards). */
  byAuthor: Map<string, Stack>;
}

/** Direct cards in a stack = nested stacks + books, like the prototype's cardCount. */
export function cardCount(s: Stack): number {
  return s.children.length + s.books.length;
}

const UNDATED = 'Undated';
const ERA_ORDER = ['Before 1800', '19th century', '20th century', UNDATED];
const ERA_PHRASE: Record<string, string> = {
  'Before 1800': 'written before 1800',
  '19th century': 'from the 19th century',
  '20th century': 'from the 20th century',
  [UNDATED]: 'of unknown date',
};

const MAX_SUBJECTS = 12;
const MIN_SUBJECT_BOOKS = 2;
const MIN_SLICE_FOR_SUBJECTS = 4;

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function byDownloads(books: Book[]): Book[] {
  return [...books].sort((a, z) => z.downloads - a.downloads);
}

export function bookEra(b: Book): string {
  return era(b.year) ?? UNDATED;
}

/** Subjects with enough books in a slice, most common first, capped. */
function pickSubjects(books: Book[]): string[] {
  if (books.length < MIN_SLICE_FOR_SUBJECTS) return [];
  const counts = new Map<string, number>();
  for (const b of books)
    for (const s of b.subjects)
      counts.set(s, (counts.get(s) ?? 0) + 1);
  return [...counts.entries()]
    .filter(([, n]) => n >= MIN_SUBJECT_BOOKS)
    .sort((a, z) => z[1] - a[1] || a[0].localeCompare(z[0]))
    .slice(0, MAX_SUBJECTS)
    .map(([s]) => s);
}

/** Stacks whose title or description matches the query, title hits first. */
export function searchStacks(index: StackIndex, query: string,
                             limit = 12): Stack[] {
  const q = query.toLowerCase();
  const inTitle: Stack[] = [];
  const inDescription: Stack[] = [];
  for (const s of index.bySlug.values()) {
    if (s.title.toLowerCase().includes(q)) inTitle.push(s);
    else if (s.description.toLowerCase().includes(q)) inDescription.push(s);
  }
  return [...inTitle, ...inDescription].slice(0, limit);
}

export function buildStacks(books: Book[]): StackIndex {
  const bySlug = new Map<string, Stack>();
  const byBook = new Map<number, Stack[]>();

  const uniqueSlug = (base: string): string => {
    let slug = base || 'stack';
    for (let n = 2; bySlug.has(slug); n++) slug = `${base}-${n}`;
    return slug;
  };

  const addStack = (stack: Stack): Stack => {
    bySlug.set(stack.slug, stack);
    stack.parent?.children.push(stack);
    return stack;
  };

  const addBooks = (stack: Stack, members: Book[]) => {
    stack.books = byDownloads(members);
    for (const b of stack.books) {
      const list = byBook.get(b.id) ?? [];
      list.push(stack);
      byBook.set(b.id, list);
    }
  };

  const byCategory = new Map<string, Book[]>();
  for (const b of books)
    for (const shelf of b.bookshelves) {
      const list = byCategory.get(shelf) ?? [];
      list.push(b);
      byCategory.set(shelf, list);
    }

  const home = [...byCategory.entries()]
    .sort((a, z) => z[1].length - a[1].length || a[0].localeCompare(z[0]))
    .map(([shelf, categoryBooks]) => {
      const title = shelfLabel(shelf);
      const category = addStack({
        slug: uniqueSlug(slugify(title)),
        title,
        description: `every book on the ${title} shelf: drill down by era, then by subject`,
        level: 'category',
        parent: null,
        children: [],
        books: [],
      });

      for (const eraName of ERA_ORDER) {
        const eraBooks = categoryBooks.filter((b) => bookEra(b) === eraName);
        if (eraBooks.length === 0) continue;
        const eraStack = addStack({
          slug: uniqueSlug(`${category.slug}--${slugify(eraName)}`),
          title: eraName,
          description: `${title} books ${ERA_PHRASE[eraName]}`,
          level: 'era',
          parent: category,
          children: [],
          books: [],
        });

        const subjects = pickSubjects(eraBooks);
        const covered = new Set<number>();
        for (const subject of subjects) {
          const subjectBooks = eraBooks.filter((b) => b.subjects.includes(subject));
          const subjectStack = addStack({
            slug: uniqueSlug(`${eraStack.slug}--${slugify(subject)}`),
            title: subject,
            description: `${title} books on ${subject.toLowerCase()}, ${ERA_PHRASE[eraName]}`,
            level: 'subject',
            parent: eraStack,
            children: [],
            books: [],
          });
          addBooks(subjectStack, subjectBooks);
          for (const b of subjectBooks) covered.add(b.id);
        }
        addBooks(eraStack, eraBooks.filter((b) => !covered.has(b.id)));
      }
      return category;
    });

  // Author stacks: every author is a stack too, but off the home wall —
  // reached from the author link on a card, the pivot modal, or search.
  const byAuthor = new Map<string, Stack>();
  const authorBooks = new Map<string, Book[]>();
  for (const b of books) {
    if (!b.author || b.author === 'Unknown') continue;
    const list = authorBooks.get(b.author) ?? [];
    list.push(b);
    authorBooks.set(b.author, list);
  }
  for (const [author, members] of [...authorBooks.entries()]
      .sort((a, z) => a[0].localeCompare(z[0]))) {
    const stack = addStack({
      slug: uniqueSlug(`author--${slugify(author)}`),
      title: author,
      description: `every book by ${author} in the archive`,
      level: 'author',
      parent: null,
      children: [],
      books: [],
    });
    addBooks(stack, members);
    byAuthor.set(author, stack);
  }

  return { home, bySlug, byBook, byAuthor };
}
