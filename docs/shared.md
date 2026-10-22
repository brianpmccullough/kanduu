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
| `src/stockQuote` | `IStockQuote`, `IStockQuoteService`, `StockQuoteService` (PnPJS, reads the Stock Ticker list) |
