import './style.css';
import type { Book } from './types';
import { buildStacks, searchStacks } from './stacks';
import { buildIndex, searchBooks } from './search';
import { sortBooks } from './filters';
import { renderAllCards, renderHome, renderSearch, renderStack } from './views';

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

  const stacks = buildStacks(books);
  const index = buildIndex(books);
  const byDownloads = sortBooks(books, 'downloads');
  const app = document.getElementById('app')!;
  const searchInput = document.getElementById('search') as HTMLInputElement;

  const route = () => {
    const hash = location.hash || '#/';
    const query = searchInput.value.trim();

    // The header search is global: from any screen, a query shows every
    // matching stack and book. Clearing it returns to the current view.
    if (query) {
      renderSearch(app, query, searchStacks(stacks, query),
        searchBooks(index, books, query), stacks);
      document.title = `“${query}” — Gutenberg Stacks`;
      return;
    }

    if (hash === '#/cards') {
      renderAllCards(app, byDownloads, stacks);
      document.title = 'All books — Gutenberg Stacks';
      return;
    }

    if (hash.startsWith('#/stack/')) {
      const slug = decodeURIComponent(hash.slice('#/stack/'.length));
      const stack = stacks.bySlug.get(slug);
      if (stack) {
        renderStack(app, stack, stacks);
        document.title = `${stack.title} — Gutenberg Stacks`;
        return;
      }
    }

    renderHome(app, stacks);
    document.title = 'Gutenberg Stacks';
  };

  window.addEventListener('hashchange', () => {
    searchInput.value = '';
    route();
    window.scrollTo(0, 0);
  });
  searchInput.addEventListener('input', route);
  route();
}

init();
