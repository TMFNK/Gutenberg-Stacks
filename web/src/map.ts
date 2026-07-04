import { Deck, OrthographicView } from '@deck.gl/core';
import { ScatterplotLayer, TextLayer } from '@deck.gl/layers';
import type { Book, Cluster } from './types';

const PALETTE: [number, number, number][] = [
  [138, 180, 248], [246, 178, 107], [143, 214, 148], [234, 153, 153],
  [180, 167, 214], [255, 217, 102], [118, 200, 214], [213, 166, 189],
];

export function createMap(books: Book[], clusters: Cluster[],
                          onPick: (b: Book | null) => void): Deck<OrthographicView> {
  return new Deck({
    parent: document.getElementById('map') as HTMLDivElement,
    views: new OrthographicView(),
    initialViewState: { target: [0, 0, 0], zoom: 1.5, minZoom: 0.5, maxZoom: 8 },
    controller: true,
    getCursor: ({ isHovering }) => (isHovering ? 'pointer' : 'grab'),
    layers: [
      new ScatterplotLayer<Book>({
        id: 'books', data: books, pickable: true,
        getPosition: (d) => [d.x, -d.y],
        getRadius: (d) => 0.3 + Math.log10(1 + d.downloads) * 0.15,
        radiusUnits: 'common',
        getFillColor: (d) => d.cluster === -1
          ? [120, 120, 140, 160]
          : [...PALETTE[d.cluster % PALETTE.length], 210] as [number, number, number, number],
        onClick: (info) => onPick(info.object ?? null),
      }),
      new TextLayer<Cluster>({
        id: 'labels', data: clusters,
        getPosition: (d) => [d.x, -d.y], getText: (d) => d.label,
        getSize: 14, getColor: [232, 230, 223, 190],
        fontFamily: 'Georgia, serif', billboard: false,
      }),
    ],
  });
}
