# Workers

Background jobs ("server side" code) live in `/workers`.  Each worker is a small Node.js / TypeScript npm workspace that does one job, such as keeping a SharePoint list up to date.

Workers are **host-agnostic**.  You can run one locally with a single command, and run the same code later in Azure Functions, AWS Lambda, a container or a scheduled task.  Only a thin host file changes.

## Structure

```text
workers/<name>/
  src/
    core/        interfaces + use case (pure, no I/O, unit tested)
    providers/   external data sources behind core interfaces
    sharepoint/  Microsoft Graph / SharePoint writers behind core interfaces
    config.ts    reads environment variables, fails fast listing every missing one
    index.ts     composition root + runXxx(env, logger): the one function every host calls
    hosts/       thin entry points (cli.ts today; Azure Functions / Lambda later)
  .env.example   every setting, documented; copy to .env for local runs (gitignored)
```

The rules match the SPFx guardrails: logic sits behind interfaces, hosts stay thin, and the test files sit next to the code they test.

## Tech stack

- Node 22 (the same as SPFx, so one `npm install` serves the whole repo), TypeScript, CommonJS output in `dist/`
- Jest on a compiled CommonJS copy in `lib-commonjs/`, the same pattern as `spfx/shared`
- Built-in `fetch` and `node:` modules.  Add an npm dependency only after approval (see [dependencies.md](dependencies.md#workers)).
- Settings come from environment variables only.  Locally they're loaded with `node --env-file-if-exists=.env`.  In the cloud they're app settings, with secrets in Key Vault or Secrets Manager.  Never commit secrets.

## Hosting

| Host | Adapter (thin) |
| --- | --- |
| Local / any machine | `hosts/cli.ts`: `--once`, or repeat every `REFRESH_INTERVAL_MINUTES` |
| Azure Functions | Timer trigger that calls `runXxx(process.env, context)`.  Needs the `@azure/functions` package (not yet approved). |
| AWS Lambda | `export const handler = () => runXxx(process.env, console)`, scheduled with EventBridge.  Needs no package. |

### Authentication to Microsoft 365

- Use an Entra ID app registration with the Microsoft Graph **`Sites.Selected`** application permission, granted **write** on only the site that the worker updates.  Don't use `Sites.ReadWrite.All`.
- Locally, use a client secret (`ClientSecretTokenProvider`).  In the cloud, prefer a managed identity (Azure) or a certificate.  Add those as more `ITokenProvider` implementations when a host is chosen.

Grant the site with PnP.PowerShell (as a SharePoint admin):

```powershell
Connect-PnPOnline -Url https://<tenant>.sharepoint.com -Interactive -ClientId <admin-app-client-id>
Grant-PnPEntraIDAppSitePermission -AppId <worker-client-id> -DisplayName 'kanduu stock quote worker' `
    -Site https://<tenant>.sharepoint.com/sites/<site> -Permissions Write
```

## Workers

### `stock-quote`

Fetches quotes from [Finnhub](https://finnhub.io) and writes them to the Stock Ticker list that the header banner reads (see [customizers-global.md](customizers-global.md#stock-ticker)).

- For each symbol in `STOCK_SYMBOLS`, it updates the item whose Ticker matches (case-insensitive), or creates one.  It sets `CurrentPrice`, `LastClosePrice` (Finnhub's previous close) and `CurrentPriceAsOfDate` (ISO 8601, Finnhub's quote time).
- A failure for one symbol is logged and doesn't stop the others.  `--once` exits with code 1 if any symbol failed.
- The header shows the item with the lowest ID.  A new symbol is added as a new item, so the first symbol ever written stays on display.
- **Market data terms:** free Finnhub plans and most other free APIs limit how their data can be displayed or redistributed.  Check the provider's terms before showing quotes to employees.  The provider sits behind `IQuoteProvider`, so it can be swapped.

```bash
cp workers/stock-quote/.env.example workers/stock-quote/.env   # then fill it in
npm run stock-quote:once     # build, test, refresh once
npm run stock-quote:start    # build, test, refresh every REFRESH_INTERVAL_MINUTES (Ctrl+C to stop)
```

## Adding a worker

1. Create `workers/<name>` using the structure above.  Name the package `@kanduu/worker-<name>`.
2. Add `<name>:build`, `<name>:clean`, `<name>:test`, `<name>:start` and `<name>:once` scripts to the root `package.json`.
3. Add `.env.example` listing every setting, and document the worker here.
