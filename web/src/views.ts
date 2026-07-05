import type { Book } from './types';
import { cardCount, type Stack, type StackIndex } from './stacks';

const CURATOR = 'gutenberg';

export function stackHref(s: Stack): string {
  return `#/stack/${s.slug}`;
}

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K, className?: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function link(href: string, text?: string): HTMLAnchorElement {
  const a = el('a', undefined, text);
  a.href = href;
  return a;
}

/** The prototype's stack modal, read-only: every stack a card lives in. */
function openStackModal(title: string, stacks: Stack[]) {
  const backdrop = el('div', 'backdrop');
  const modal = el('div', 'stack-modal');
  modal.addEventListener('click', (e) => e.stopPropagation());
  const close = () => backdrop.remove();
  modal.append(el('h4', undefined, title));
  const list = el('ul');
  if (stacks.length === 0)
    list.append(el('li', undefined, 'not in any other stack yet'));
  for (const s of stacks) {
    const li = el('li');
    const path: string[] = [];
    for (let p = s.parent; p; p = p.parent) path.unshift(p.title);
    const context = path.length ? ` (${path.join(' · ')})` : '';
    const a = link(stackHref(s),
      `${s.title}${context} — ${cardCount(s)} cards`);
    a.addEventListener('click', (e) => {
      e.preventDefault();
      close();
      location.hash = stackHref(s);
    });
    li.append(a);
    list.append(li);
  }
  modal.append(list);
  backdrop.append(modal);
  backdrop.addEventListener('click', close);
  document.addEventListener('keydown', function onKey(e) {
    if (e.key !== 'Escape') return;
    close();
    document.removeEventListener('keydown', onKey);
  });
  document.body.append(backdrop);
}

/** Black stack card on the home screen: title, why, "N cards curated by". */
function homeStackCard(s: Stack): HTMLLIElement {
  const li = el('li', 'card stack');
  li.addEventListener('click', () => { location.hash = stackHref(s); });
  const h2 = el('h2', 'stack-title');
  h2.append(link(stackHref(s), s.title));
  li.append(h2, el('p', 'stack-why', s.description));
  const meta = el('div', 'stack-meta');
  meta.append(el('p', undefined,
    `${cardCount(s)} cards curated by ${CURATOR}`));
  li.append(meta);
  return li;
}

/** Header card of a stack view: "stacks (N) | M cards curated by". */
function stackHeaderCard(s: Stack): HTMLLIElement {
  const li = el('li', 'card stack');
  li.append(el('h2', 'stack-title', s.title),
    el('p', 'stack-why', s.description));
  const meta = el('div', 'stack-meta');
  const p = el('p');
  const parents = s.parent ? [s.parent] : [];
  const pivot = link('javascript:void(0)',
    `stacks (${parents.length}) | ${cardCount(s)} cards curated by ${CURATOR}`);
  pivot.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    openStackModal(`"${s.title}" is in`, parents);
  });
  p.append(pivot);
  meta.append(p);
  li.append(meta);
  return li;
}

/** A nested stack rendered as a card of type "stack" inside a card list. */
function stackTypeCard(s: Stack): HTMLLIElement {
  const li = el('li', 'card card-holds-stack');
  li.addEventListener('click', () => { location.hash = stackHref(s); });
  li.append(el('span', 'card-type', 'stack'));
  const preview = el('div', 'card-preview-stack');
  const a = link(stackHref(s));
  a.append(el('h3', undefined, s.title),
    el('small', undefined, `${cardCount(s)} cards by ${CURATOR}`));
  preview.append(a);
  li.append(preview);
  return li;
}

interface BookCardOpts {
  index?: number;
  total?: number;
}

/** A book as a card: source, title → gutenberg.org, cover or quote,
    curator note, "stacks (N)" pivot, position counter. */
function bookCard(b: Book, stacks: StackIndex, opts: BookCardOpts = {}):
    HTMLLIElement {
  const li = el('li', 'card');
  li.append(el('span', 'card-type', 'book'),
    el('h5', 'card-source', b.author || 'Project Gutenberg'));

  const h3 = el('h3', 'card-title');
  const titleLink = link(b.url, b.title);
  titleLink.target = '_blank';
  titleLink.rel = 'noopener';
  h3.append(titleLink);
  li.append(h3);

  const preview = el('div', 'card-preview');
  const previewLink = link(b.url);
  previewLink.target = '_blank';
  previewLink.rel = 'noopener';
  if (b.cover) {
    const img = el('img', 'card-image');
    img.src = b.cover;
    img.alt = '';
    img.loading = 'lazy';
    previewLink.append(img);
  } else {
    previewLink.append(el('blockquote', undefined,
      b.hook ?? b.summary?.slice(0, 160) ?? b.title));
  }
  preview.append(previewLink);
  li.append(preview);

  if (b.cover && b.hook) {
    const note = el('p', 'card-curator-note');
    note.append(el('strong', undefined, `${CURATOR}:`), ` ${b.hook}`);
    li.append(note);
  }

  const memberships = stacks.byBook.get(b.id) ?? [];
  const pivot = link('javascript:void(0)');
  pivot.className = 'card-stacks';
  pivot.textContent = `stacks (${memberships.length})`;
  pivot.addEventListener('click', (e) => {
    e.preventDefault();
    openStackModal(`"${b.title}" is in`, memberships);
  });
  li.append(pivot);

  if (opts.total !== undefined)
    li.append(el('span', 'card-count',
      `${(opts.index ?? 0) + 1} / ${opts.total} cards`));
  return li;
}

const matches = (q: string, ...fields: (string | null)[]) =>
  !q || fields.some((f) => f?.toLowerCase().includes(q.toLowerCase()));

/** Thin ink-line under the header that fills as the mobile carousel is
    swiped through — the visual twin of the "3 / 46 cards" counter. */
function setCarouselProgress(list: HTMLElement | null) {
  const bar = document.getElementById('progress');
  const fill = document.getElementById('progress-fill');
  if (!bar || !fill) return;
  bar.classList.toggle('active', list !== null);
  fill.style.width = '0%';
  if (!list) return;
  list.addEventListener('scroll', () => {
    const max = list.scrollWidth - list.clientWidth;
    fill.style.width = max > 0
      ? `${Math.min(100, (list.scrollLeft / max) * 100)}%` : '0%';
  }, { passive: true });
}

/** Home: the stack list, led by the "All books" card (the prototype's
    "My cards"). */
export function renderHome(app: HTMLElement, stacks: StackIndex,
                           query: string) {
  const wrap = el('div', 'stacks');
  const list = el('ul', 'stack-list');

  const all = el('li', 'card stack');
  all.addEventListener('click', () => { location.hash = '#/cards'; });
  const h2 = el('h2', 'stack-title');
  h2.append(link('#/cards', 'All books'));
  all.append(h2, el('p', 'stack-why',
    'every card in the archive, in one searchable stack'));
  if (matches(query, 'All books')) list.append(all);

  for (const s of stacks.home)
    if (matches(query, s.title, s.description)) list.append(homeStackCard(s));
  wrap.append(list);
  app.replaceChildren(wrap);
  setCarouselProgress(null);
}

/** A stack: header card, nested stack cards, then book cards.
    On mobile the list becomes a swipeable carousel. */
export function renderStack(app: HTMLElement, stack: Stack,
                            stacks: StackIndex, query: string) {
  const list = el('ul', 'card-list carousel');
  list.append(stackHeaderCard(stack));
  const children = stack.children.filter((s) => matches(query, s.title));
  const books = stack.books.filter((b) => matches(query, b.title, b.author));
  const total = children.length + books.length;
  for (const s of children) list.append(stackTypeCard(s));
  books.forEach((b, i) => list.append(bookCard(b, stacks,
    { index: children.length + i, total })));
  app.replaceChildren(list);
  setCarouselProgress(list);
}

/** All cards, filterable — the prototype's "My cards" view.
    Rendered in chunks so 1,000 cards don't hit the DOM at once. */
export function renderAllCards(app: HTMLElement, books: Book[],
                               stacks: StackIndex) {
  const CHUNK = 40;
  const list = el('ul', 'card-list');
  const head = el('li', 'card');
  head.append(el('h2', undefined, `${books.length} cards`));
  list.append(head);

  const sentinel = el('li', 'load-sentinel');
  list.append(sentinel);
  let rendered = 0;
  const observer = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) appendChunk();
  }, { rootMargin: '1200px' });
  const appendChunk = () => {
    for (const b of books.slice(rendered, rendered + CHUNK))
      list.insertBefore(bookCard(b, stacks), sentinel);
    rendered = Math.min(rendered + CHUNK, books.length);
    if (rendered >= books.length) {
      observer.disconnect();
      sentinel.remove();
    }
  };
  appendChunk();
  if (rendered < books.length) observer.observe(sentinel);

  app.replaceChildren(list);
  setCarouselProgress(null);
}
