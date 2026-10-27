/** A key/value cache whose entries expire.  Values must survive JSON serialization. */
export interface IStorageCache {
  /** The value, or undefined when missing, expired or unreadable. */
  get<T>(key: string): T | undefined;
  /** Stores the value for expiryMinutes (the cache's default when omitted; 0 or less stores nothing). */
  set<T>(key: string, value: T, expiryMinutes?: number): void;
  remove(key: string): void;
  /** Removes every entry this cache owns. */
  clear(): void;
  /** Removes this cache's expired entries. */
  purgeExpired(): void;
  /** The cached value, or the loaded one, which is then cached.  Failed loads and undefined are not cached. */
  getOrLoad<T>(key: string, load: () => Promise<T>, expiryMinutes?: number): Promise<T>;
}
