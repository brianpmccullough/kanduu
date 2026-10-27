# shared (`@kanduu/spfx-shared`)

Plain TypeScript shared by the SPFx packages: models, service interfaces and implementations, and pure logic.  It has no SPFx build of its own; SPFx packages bundle it with webpack.

## Build output

| Output | Built by | Used by |
| --- | --- | --- |
| `lib/` (ES modules + `.d.ts`) | `tsconfig.json` | SPFx packages (webpack, TypeScript) through `main` / `types` |
| `lib-commonjs/` (CommonJS, includes tests) | `tsconfig.commonjs.json` | Jest in this package only |

`sideEffects: false` lets webpack drop modules a package does not use, so importing one export does not pull in PnPJS.

## Scripts

| Command (repo root) | Purpose |
| --- | --- |
| `npm run shared:build` | Clean, build `lib/`, then test.  Every `<package>:build` / `:start` runs it first. |
| `npm run shared:test` | Build `lib-commonjs/` and run Jest |
| `npm run shared:watch` | Rebuild `lib/` on change |

## Tests

- Put tests next to the code as `*.test.ts`.  They are excluded from `lib/`.
- Jest runs the compiled CommonJS in `lib-commonjs/` with the Node environment, like the SPFx packages do.
- Mock PnPJS with `jest.mock('@pnp/sp', () => ({ ... }))`, and mock each side-effect import (`@pnp/sp/webs`, `@pnp/sp/lists`, ...) the same way.  PnPJS ships ES modules only, so Jest fails if it loads the real package.  See `src/stockQuote/StockQuoteService.test.ts`.
- SPFx packages cannot load shared at runtime in their own Jest tests (only types).  Test shared code here.

## Contents

| Path | Purpose |
| --- | --- |
| `src/headerMenu` | `IHeaderMenuDefinition` (the menu JSON) and `IHeaderMenuLink` (localized), `IHeaderMenuService`, `HeaderMenuService` (PnPJS, reads the menu JSON from a document library), `localizeHeaderMenu` / `resolveLocalizedText` (picks text for a locale and drops invalid entries).  Caches the JSON when given an `IStorageCache`. |
| `src/stockQuote` | `IStockQuote`, `IStockQuoteService`, `StockQuoteService` (PnPJS, reads the Stock Ticker list), `getStockQuoteChange` |
| `src/storage` | `IStorageCache` and `BrowserStorageCache`: an expiring cache over `localStorage` / `sessionStorage` (see [Browser storage cache](#browser-storage-cache)); `getBrowserStorage` |
| `src/userLinks` | `IUserLink`, `IUserLinksService`, `StaticUserLinksService` (fixed sample quick links, each with an optional icon, until links are stored per user in OneDrive) |

## Browser storage cache

`BrowserStorageCache` caches service data in Web Storage so repeat page loads skip the request.

```ts
const cache = new BrowserStorageCache(getBrowserStorage('local'));   // prefix "kanduu:", 60 minute expiry
const menu = await cache.getOrLoad('headerMenu:<source>', () => readMenu(), 30);
```

- **Prefix**: every key is stored as `<prefix><key>` (default `kanduu:`), so the solution's entries sit together in the browser's storage view, and `clear()` / `purgeExpired()` touch only them.  Use another prefix for data that should be cleared separately.
- **Envelope**: each value is stored as `{ "value": ..., "expires": <ms since epoch> }`.  Expired or unreadable entries are removed when read; `purgeExpired()` sweeps them all.
- **Expiry**: 60 minutes by default (`defaultExpiryMinutes`), or per call.  `0` or less stores nothing.  Choose it per data: how stale can it be before someone notices?
- **Failure is a miss**: storage can be missing (no browser, private windows, blocked site data), full or throw.  The cache never throws; it acts empty.  When storage is full it purges expired entries and retries once.  Failed loads and `undefined` are not cached.
- **What to cache**: data that is the same for everyone who uses the browser, or keyed by user.  Values must survive JSON.  Don't cache secrets or tokens: `localStorage` is readable by any script on the SharePoint origin.
- Services take an optional `IStorageCache` (dependency injection), so tests pass a fake or none.  Build the key from everything that selects the data (site, list, file) so different sources never share an entry.
