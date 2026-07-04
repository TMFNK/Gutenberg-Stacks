const KEY = 'gbf-recent';
const MAX = 8;

export function loadRecent(): number[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const ids = JSON.parse(raw) as unknown;
    return Array.isArray(ids)
      ? ids.filter((id): id is number => typeof id === 'number')
      : [];
  } catch {
    return [];
  }
}

export function pushRecent(id: number): number[] {
  const ids = [id, ...loadRecent().filter((x) => x !== id)].slice(0, MAX);
  try { localStorage.setItem(KEY, JSON.stringify(ids)); } catch { /* quota */ }
  return ids;
}
