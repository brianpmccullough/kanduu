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

### App registration (Microsoft 365 access)

Each worker that writes to SharePoint has its own Entra ID app registration:

| Step | Setting | Who |
| --- | --- | --- |
| 1. Register | Entra ID → App registrations → New: single tenant, no redirect URI (e.g. `kanduu-stock-quote-worker`) | Application Administrator |
| 2. Permission | API permissions → Microsoft Graph → **Application** → `Sites.Selected`.  No other permissions. | Application Administrator |
| 3. Consent | Grant admin consent for the tenant | Global Administrator or Privileged Role Administrator |
| 4. Site access | Grant **Write** on only the site that hosts the list (command below) | SharePoint Administrator |
| 5. Credential | Locally, Certificates & secrets → new client secret.  Set an expiry and record when to rotate it.  In the cloud, prefer a managed identity or certificate. | App owner |
| 6. Configure | `TENANT_ID` = Directory (tenant) ID, `CLIENT_ID` = Application (client) ID, `CLIENT_SECRET` = the secret **value** (not its ID) | App owner |

`Sites.Selected` with no site grant has no access, so step 4 is required.  Add `ITokenProvider` implementations for managed identity or certificates when a host is chosen.

Step 4 runs with PnP.PowerShell as a SharePoint admin.  The PnP sign-in app needs the Microsoft Graph `Sites.FullControl.All` permission.

```powershell
Connect-PnPOnline -Url https://<tenant>.sharepoint.com -Interactive   # uses ENTRAID_APP_ID, or add -ClientId
Grant-PnPEntraIDAppSitePermission -AppId <worker-client-id> -DisplayName 'kanduu stock quote worker' `
    -Site https://<tenant>.sharepoint.com/sites/<site> -Permissions Write
```

## Workers

### `stock-quote`

Fetches quotes from [Alpha Vantage](https://www.alphavantage.co/documentation/#latestprice) (`GLOBAL_QUOTE`) and writes them to the Stock Ticker list that the header banner reads (see [customizers-global.md](customizers-global.md#stock-ticker)).

- For each symbol in `STOCK_SYMBOLS`, it updates the item whose Ticker matches (case-insensitive), or creates one.  It sets `CurrentPrice`, `LastClosePrice` (Alpha Vantage's previous close) and `CurrentPriceAsOfDate`: the UTC time, in ISO 8601, at which the worker retrieved the quote.
- A failure for one symbol is logged and doesn't stop the others.  `--once` exits with code 1 if any symbol failed.
- The header shows the item with the lowest ID.  A new symbol is added as a new item, so the first symbol ever written stays on display.
- **Rate limit:** a free Alpha Vantage key allows **25 requests a day**, and each symbol costs one request per refresh.  `REFRESH_INTERVAL_MINUTES` defaults to 60, which keeps one symbol at 24 a day.  `stock-quote:start` warns when the configuration would go over the limit.  Alpha Vantage reports limits and errors as an HTTP 200 with a message, which the worker logs as a failure.
- **API key:** Alpha Vantage only accepts the key in the query string, so the worker never logs request URLs.  Keep the key in `.env` or the host's app settings.
- **Market data terms:** free plans (Alpha Vantage included) generally limit how their data can be displayed or redistributed.  Check the provider's terms before showing quotes to employees.  The provider sits behind `IQuoteProvider`, so it can be swapped.

```bash
cp workers/stock-quote/.env.example workers/stock-quote/.env   # then fill it in
npm run stock-quote:once     # build, test, refresh once
npm run stock-quote:start    # build, test, refresh every REFRESH_INTERVAL_MINUTES (Ctrl+C to stop)
```

## Adding a worker

1. Create `workers/<name>` using the structure above.  Name the package `@kanduu/worker-<name>`.
2. Add `<name>:build`, `<name>:clean`, `<name>:test`, `<name>:start` and `<name>:once` scripts to the root `package.json`.
3. Add `.env.example` listing every setting, and document the worker here.
