import { BrowserStorageCache, DEFAULT_STORAGE_PREFIX, getBrowserStorage } from './BrowserStorageCache';

/** In-memory Web Storage. */
class MemoryStorage implements Storage {
  public readonly items: Map<string, string> = new Map();
  public get length(): number { return this.items.size; }
  public key(index: number): string | null { return Array.from(this.items.keys())[index] ?? null; }
  public getItem(key: string): string | null { return this.items.get(key) ?? null; }
  public setItem(key: string, value: string): void { this.items.set(key, value); }
  public removeItem(key: string): void { this.items.delete(key); }
  public clear(): void { this.items.clear(); }
}

const MINUTE = 60000;

describe('BrowserStorageCache', () => {
  let storage: MemoryStorage;
  let time: number;
  let cache: BrowserStorageCache;

  beforeEach(() => {
    storage = new MemoryStorage();
    time = 1000000;
    cache = new BrowserStorageCache(storage, { now: () => time });
  });

  it('stores values under the prefix with their expiry', () => {
    cache.set('menu', { a: 1 });
    expect(JSON.parse(storage.getItem(`${DEFAULT_STORAGE_PREFIX}menu`) as string)).toEqual({ value: { a: 1 }, expires: time + 60 * MINUTE });
    expect(cache.get('menu')).toEqual({ a: 1 });
  });

  it('uses a custom prefix and default expiry', () => {
    cache = new BrowserStorageCache(storage, { prefix: 'test.', defaultExpiryMinutes: 5, now: () => time });
    cache.set('menu', 'x');
    expect(JSON.parse(storage.getItem('test.menu') as string).expires).toBe(time + 5 * MINUTE);
  });

  it('expires values and removes them', () => {
    cache.set('menu', 'x', 10);
    time += 10 * MINUTE - 1;
    expect(cache.get('menu')).toBe('x');
    time += 1;
    expect(cache.get('menu')).toBeUndefined();
    expect(storage.length).toBe(0);
  });

  it('stores nothing for an expiry of 0 or undefined values', () => {
    cache.set('menu', 'x', 0);
    cache.set('other', undefined);
    expect(storage.length).toBe(0);
  });

  it('treats unreadable entries as misses and removes them', () => {
    storage.setItem(`${DEFAULT_STORAGE_PREFIX}bad`, '{not json');
    storage.setItem(`${DEFAULT_STORAGE_PREFIX}plain`, '"no envelope"');
    expect(cache.get('bad')).toBeUndefined();
    expect(cache.get('plain')).toBeUndefined();
    expect(storage.length).toBe(0);
  });

  it('clears and purges only its own entries', () => {
    storage.setItem('someone-else', 'keep');
    cache.set('fresh', 1, 10);
    cache.set('stale', 2, 1);
    time += 5 * MINUTE;

    cache.purgeExpired();
    expect(Array.from(storage.items.keys())).toEqual(['someone-else', `${DEFAULT_STORAGE_PREFIX}fresh`]);

    cache.clear();
    expect(Array.from(storage.items.keys())).toEqual(['someone-else']);
  });

  it('purges expired entries and retries when storage is full', () => {
    cache.set('stale', 'old', 1);
    time += 2 * MINUTE;
    const setItem = jest.spyOn(storage, 'setItem').mockImplementationOnce(() => { throw new Error('QuotaExceededError'); });

    cache.set('menu', 'x');

    expect(setItem).toHaveBeenCalledTimes(2);
    expect(Array.from(storage.items.keys())).toEqual([`${DEFAULT_STORAGE_PREFIX}menu`]);
  });

  it('never throws when storage fails', () => {
    jest.spyOn(storage, 'getItem').mockImplementation(() => { throw new Error('SecurityError'); });
    jest.spyOn(storage, 'setItem').mockImplementation(() => { throw new Error('SecurityError'); });
    expect(() => cache.set('menu', 'x')).not.toThrow();
    expect(cache.get('menu')).toBeUndefined();
  });

  it('is an always-empty cache without storage', async () => {
    cache = new BrowserStorageCache(undefined);
    cache.set('menu', 'x');
    expect(cache.get('menu')).toBeUndefined();
    await expect(cache.getOrLoad('menu', () => Promise.resolve('loaded'))).resolves.toBe('loaded');
  });

  describe('getOrLoad', () => {
    it('loads and caches on a miss, then serves the cache', async () => {
      const load = jest.fn().mockResolvedValue('loaded');
      await expect(cache.getOrLoad('menu', load)).resolves.toBe('loaded');
      await expect(cache.getOrLoad('menu', load)).resolves.toBe('loaded');
      expect(load).toHaveBeenCalledTimes(1);
    });

    it('does not cache failed loads', async () => {
      await expect(cache.getOrLoad('menu', () => Promise.reject(new Error('offline')))).rejects.toThrow('offline');
      expect(storage.length).toBe(0);
    });

    it('uses the given expiry', async () => {
      await cache.getOrLoad('menu', () => Promise.resolve('x'), 1);
      time += MINUTE;
      expect(cache.get('menu')).toBeUndefined();
    });
  });
});

describe('getBrowserStorage', () => {
  it('is undefined without a browser', () => {
    expect(getBrowserStorage()).toBeUndefined();
  });
});
