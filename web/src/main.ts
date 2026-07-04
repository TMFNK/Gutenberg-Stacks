import { createMap } from './map';
import type { Book, Cluster } from './types';

async function init() {
  const [books, clusters]: [Book[], Cluster[]] = await Promise.all([
    fetch('/data/books.json').then((r) => r.json()),
    fetch('/data/clusters.json').then((r) => r.json()),
  ]);
  createMap(books, clusters, (b) => console.log('picked', b?.title));
}
init();
