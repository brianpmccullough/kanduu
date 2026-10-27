import type { IStorageCache } from './IStorageCache';

export const DEFAULT_STORAGE_PREFIX = 'kanduu:';
export const DEFAULT_CACHE_EXPIRY_MINUTES = 60;

export interface IBrowserStorageCacheOptions {
  /** Prepended to every key so this cache's entries sort together and can be cleared together. */
  prefix?: string;
  /** Expiry used when set() is given none; defaults to DEFAULT_CACHE_EXPIRY_MINUTES. */
  defaultExpiryMinutes?: number;
  /** Clock, for tests. */
  now?: () => number;
}

/** What is stored for each key: the value and when it expires (ms since the epoch). */
interface ICacheEnvelope<T> {
  value: T;
  expires: number;
}

function isEnvelope(value: unknown): value is ICacheEnvelope<unknown> {
  return typeof value === 'object' && value !== null && 'value' in value &&
    typeof (value as ICacheEnvelope<unknown>).expires === 'number';
}

/**
 * localStorage or sessionStorage, or undefined when the browser blocks it (private windows, blocked
 * site data) or there is no browser.
 */
export function getBrowserStorage(kind: 'local' | 'session' = 'local'): Storage | undefined {
  try {
    return typeof window === 'undefined' ? undefined : kind === 'local' ? window.localStorage : window.sessionStorage;
  } catch {
    return undefined;
  }
}

/**
 * A cache over Web Storage (localStorage / sessionStorage).  Each value is wrapped with its expiry and
 * stored under a prefixed key.  Storage can be missing, full or throw at any time, so every failure
 * becomes a cache miss: callers load the data as if nothing were cached.
 */
export class BrowserStorageCache implements IStorageCache {
  private readonly _prefix: string;
  private readonly _defaultExpiryMinutes: number;
  private readonly _now: () => number;

  public constructor(private readonly _storage: Storage | undefined, options: IBrowserStorageCacheOptions = {}) {
    this._prefix = options.prefix ?? DEFAULT_STORAGE_PREFIX;
    this._defaultExpiryMinutes = options.defaultExpiryMinutes ?? DEFAULT_CACHE_EXPIRY_MINUTES;
    this._now = options.now ?? Date.now;
  }

  public get<T>(key: string): T | undefined {
    const envelope = this._read(this._prefix + key);
    return envelope ? (envelope.value as T) : undefined;
  }

  public set<T>(key: string, value: T, expiryMinutes: number = this._defaultExpiryMinutes): void {
    if (!this._storage || expiryMinutes <= 0 || value === undefined) {
      return;
    }
    const envelope: ICacheEnvelope<T> = { value, expires: this._now() + expiryMinutes * 60000 };
    let serialized: string;
    try {
      serialized = JSON.stringify(envelope);
    } catch {
      return;
    }
    try {
      this._storage.setItem(this._prefix + key, serialized);
    } catch {
      // Usually a full storage quota: make room from expired entries and try once more.
      this.purgeExpired();
      try {
        this._storage.setItem(this._prefix + key, serialized);
      } catch {
        // Not cached; the next get() is a miss.
      }
    }
  }

  public remove(key: string): void {
    this._remove(this._prefix + key);
  }

  public clear(): void {
    this._ownKeys().forEach((storageKey) => this._remove(storageKey));
  }

  public purgeExpired(): void {
    // _read removes entries that are expired or unreadable.
    this._ownKeys().forEach((storageKey) => this._read(storageKey));
  }

  public async getOrLoad<T>(key: string, load: () => Promise<T>, expiryMinutes?: number): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== undefined) {
      return cached;
    }
    const value = await load();
    this.set(key, value, expiryMinutes);
    return value;
  }

  /** The envelope stored under the full key; removes it when expired or unreadable. */
  private _read(storageKey: string): ICacheEnvelope<unknown> | undefined {
    try {
      const raw = this._storage?.getItem(storageKey);
      if (raw === null || raw === undefined) {
        return undefined;
      }
      const envelope: unknown = JSON.parse(raw);
      if (isEnvelope(envelope) && envelope.expires > this._now()) {
        return envelope;
      }
    } catch {
      // Unreadable: fall through and remove it.
    }
    this._remove(storageKey);
    return undefined;
  }

  private _remove(storageKey: string): void {
    try {
      this._storage?.removeItem(storageKey);
    } catch {
      // Nothing to do; the entry expires anyway.
    }
  }

  /** Full keys of this cache's entries, collected first because removing entries shifts indexes. */
  private _ownKeys(): string[] {
    const keys: string[] = [];
    try {
      const storage = this._storage;
      for (let index = 0; storage && index < storage.length; index++) {
        const storageKey = storage.key(index);
        if (storageKey?.startsWith(this._prefix)) {
          keys.push(storageKey);
        }
      }
    } catch {
      // Storage became unavailable; return what was found.
    }
    return keys;
  }
}
