import { describe, expect, it, beforeEach, vi } from 'vitest';
import { loadRecent, pushRecent } from './recent';

describe('recent', () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => { store.set(k, v); },
      removeItem: (k: string) => { store.delete(k); },
      clear: () => { store.clear(); },
    });
  });

  it('starts empty', () => {
    expect(loadRecent()).toEqual([]);
  });

  it('stores most recent first', () => {
    pushRecent(1);
    pushRecent(2);
    expect(loadRecent()).toEqual([2, 1]);
  });

  it('deduplicates and caps at 8', () => {
    for (let i = 1; i <= 10; i++) pushRecent(i);
    pushRecent(5);
    expect(loadRecent()).toEqual([5, 10, 9, 8, 7, 6, 4, 3]);
  });
});
