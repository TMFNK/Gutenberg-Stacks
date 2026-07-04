import type { Deck, OrthographicView } from '@deck.gl/core';
import type { Book } from './types';

export function wireSearch(books: Book[], deck: Deck<OrthographicView>,
                           onPick: (b: Book) => void): void {
  const input = document.getElementById('search') as HTMLInputElement;
  input.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' || !input.value.trim()) return;
    const q = input.value.toLowerCase();
    const hit = books.find((b) => b.title.toLowerCase().includes(q))
      ?? books.find((b) => b.author.toLowerCase().includes(q));
    if (!hit) return;
    deck.setProps({ initialViewState: { target: [hit.x, -hit.y, 0], zoom: 5,
      transitionDuration: 800 } as any });
    onPick(hit);
  });
}
