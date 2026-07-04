import './style.css';
import type { Book } from './types';
import { buildIndex, searchBooks } from './search';
import { EMPTY_FILTERS, applyFilters, era, facetOptions, pickRandom,
         sortBooks, type Filters } from './filters';
import { renderGrid } from './grid';
import { showDetail } from './card';
import { loadRecent, pushRecent } from './recent';

interface Facet {
  id: string;
  key: keyof Filters;
  get: (b: Book) => (string | null)[];
  limit?: number;
}

const FACETS: Facet[] = [
  { id: 'f-mood', key: 'mood', get: (b) => [b.mood], limit: 30 },
  { id: 'f-difficulty', key: 'difficulty', get: (b) => [b.difficulty] },
  { id: 'f-theme', key: 'theme', get: (b) => b.themes ?? [], limit: 40 },
  { id: 'f-subject', key: 'subject', get: (b) => b.subjects, limit: 40 },
  { id: 'f-lang', key: 'lang', get: (b) => [b.lang] },
  { id: 'f-era', key: 'era', get: (b) => [era(b.year)] },
];

type Sort = 'relevance' | 'downloads' | 'title';

async function init() {
  let books: Book[];
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}data/books.json`);
    if (!res.ok) throw new Error(String(res.status));
    books = await res.json();
  } catch {
    document.getElementById('error')!.hidden = false;
    return;
  }

  const byId = new Map(books.map((b) => [b.id, b]));
  const index = buildIndex(books);
  const filters: Filters = { ...EMPTY_FILTERS };
  let query = '';
  let sort: Sort = 'downloads';
  const sortSelect = document.getElementById('f-sort') as HTMLSelectElement;
  const recentShelf = document.getElementById('recent-shelf')!;

  const openDetail = (b: Book) => {
    pushRecent(b.id);
    renderRecentShelf();
    showDetail(b);
  };

  const visible = (): Book[] => {
    let base: Book[];
    if (query.trim()) {
      base = searchBooks(index, books, query);
      if (sort === 'downloads') base = sortBooks(base, 'downloads');
      else if (sort === 'title') base = sortBooks(base, 'title');
    } else {
      base = sortBooks(books, sort === 'title' ? 'title' : 'downloads');
    }
    return applyFilters(base, filters);
  };

  const renderRecentShelf = () => {
    const recent = loadRecent()
      .map((id) => byId.get(id))
      .filter((b): b is Book => b !== undefined);
    recentShelf.hidden = recent.length === 0;
    recentShelf.replaceChildren(
      ...recent.map((b) => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'mood-chip recent-chip';
        chip.textContent = b.title;
        chip.title = b.title;
        chip.addEventListener('click', () => openDetail(b));
        return chip;
      }));
  };

  const badge = document.getElementById('filter-count')!;
  const apply = document.getElementById('apply')!;
  const moodSelect = document.getElementById('f-mood') as HTMLSelectElement;
  const moodShelf = document.getElementById('mood-shelf')!;

  const syncMoodShelf = () => {
    for (const chip of moodShelf.children)
      chip.setAttribute('aria-pressed',
        String(chip.textContent === filters.mood));
  };
  const update = () => {
    const shown = visible();
    renderGrid(shown, openDetail);
    const active = Object.values(filters).filter(Boolean).length;
    badge.hidden = active === 0;
    badge.textContent = String(active);
    apply.textContent = `Show ${shown.length.toLocaleString()} book${shown.length === 1 ? '' : 's'}`;
    syncMoodShelf();
  };

  moodShelf.replaceChildren(
    ...facetOptions(books, (b) => [b.mood], 8).map((m) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'mood-chip';
      chip.textContent = m;
      chip.setAttribute('aria-pressed', 'false');
      chip.addEventListener('click', () => {
        filters.mood = filters.mood === m ? null : m;
        moodSelect.value = filters.mood ?? '';
        update();
      });
      return chip;
    }));

  for (const f of FACETS) {
    const select = document.getElementById(f.id) as HTMLSelectElement;
    select.replaceChildren(new Option('Any', ''),
      ...facetOptions(books, f.get, f.limit).map((v) => new Option(v, v)));
    select.addEventListener('change', () => {
      filters[f.key] = select.value || null;
      update();
    });
  }
  sortSelect.addEventListener('change', (e) => {
    sort = (e.target as HTMLSelectElement).value as Sort;
    update();
  });
  document.getElementById('search')!.addEventListener('input', (e) => {
    const v = (e.target as HTMLInputElement).value;
    const hadQuery = !!query.trim();
    query = v;
    const hasQuery = !!query.trim();
    if (hasQuery && !hadQuery && sort === 'downloads') {
      sort = 'relevance';
      sortSelect.value = sort;
    } else if (!hasQuery && hadQuery && sort === 'relevance') {
      sort = 'downloads';
      sortSelect.value = sort;
    }
    update();
  });
  document.getElementById('clear')!.addEventListener('click', () => {
    Object.assign(filters, EMPTY_FILTERS);
    for (const f of FACETS)
      (document.getElementById(f.id) as HTMLSelectElement).value = '';
    update();
  });
  document.getElementById('surprise')!.addEventListener('click', () => {
    const b = pickRandom(applyFilters(books, filters));
    if (b) openDetail(b);
  });

  const toggle = document.getElementById('filters-toggle')!;
  const sheetBackdrop = document.getElementById('sheet-backdrop')!;
  const setFiltersOpen = (open: boolean) => {
    document.body.classList.toggle('filters-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    sheetBackdrop.hidden = !open;
  };
  toggle.addEventListener('click',
    () => setFiltersOpen(!document.body.classList.contains('filters-open')));
  apply.addEventListener('click', () => setFiltersOpen(false));
  sheetBackdrop.addEventListener('click', () => setFiltersOpen(false));
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (!document.getElementById('detail-backdrop')!.hidden) showDetail(null);
    else setFiltersOpen(false);
  });
  renderRecentShelf();
  update();
}
init();
