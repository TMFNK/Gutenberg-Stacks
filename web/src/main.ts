import { createMap } from './map';
import { showCard } from './card';
import { wireSearch } from './search';
import type { Book, Cluster } from './types';

async function init() {
  const [books, clusters]: [Book[], Cluster[]] = await Promise.all([
    fetch('/data/books.json').then((r) => r.json()),
    fetch('/data/clusters.json').then((r) => r.json()),
  ]);
  const deck = createMap(books, clusters, showCard);
  wireSearch(books, deck, showCard);
}
init();
