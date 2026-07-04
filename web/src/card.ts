import type { Book } from './types';

export function showCard(b: Book | null): void {
  const el = document.getElementById('card')!;
  if (!b) { el.style.display = 'none'; return; }
  el.style.display = 'block';
  el.innerHTML = `
    <h2 style="font-size:16px;margin:0 0 4px">${b.title}</h2>
    <p style="margin:0;opacity:.7">${b.author}${b.lang !== 'en' ? ' · ' + b.lang : ''}</p>
    ${b.hook ? `<p style="font-style:italic;margin:10px 0">${b.hook}</p>` : ''}
    ${b.themes ? `<p style="font-size:12px;opacity:.8">${b.mood} · ${b.themes.join(' · ')} · ${b.difficulty}</p>` : ''}
    <p style="font-size:12px;opacity:.6">${b.downloads.toLocaleString()} downloads</p>
    <a href="${b.url}" target="_blank" style="color:#8ab4f8">Read free on gutenberg.org →</a>`;
}
