# customizers-global

Application customizers that apply across the tenant (header, footer, etc.).

## Deployment scope

- `skipFeatureDeployment: true`: deploy the `.sppkg` once to the tenant App Catalog so it is available to all sites.
- Activation is per site with PnP.PowerShell.  See [application-customizers.md](application-customizers.md).

| Customizer | Default configuration |
| --- | --- |
| Header | `/scripts/config/header.default.json` |

## Extensions

### Header (`src/extensions/header`)

Renders a banner in the page's **Top** placeholder, colored with the site's primary theme color.

| File | Role |
| --- | --- |
| `HeaderApplicationCustomizer.ts` | Thin host: reads the SPFx theme, creates the Top placeholder, renders `HeaderBanner`, re-renders on theme / placeholder change |
| `components/HeaderBanner.tsx` | Banner layout; wraps everything in a Fluent `ThemeProvider` built from the SPFx theme |
| `components/StockTicker.tsx` | First quote from the Stock Ticker list; see [Stock ticker](#stock-ticker) |
| `components/stockTickerFormat.ts` | Locale-aware price, percent and date formatting |
| `components/ProfileButton.tsx` | Stub: current user's `Persona`, no menu yet |

Layout: actions area (empty `CommandBar`) on the left, then on the right a stock ticker, a search box, a settings (gear) button and the profile.  The search box, gear and profile are stubs with no behavior yet.  The ticker is hidden below 640px.

### Properties

| Property | Default | Notes |
| --- | --- | --- |
| `stockTicker.siteUrl` | current site | Site that hosts the Stock Ticker list.  Set it to one central site (e.g. the home site) so a single list feeds every site. |
| `stockTicker.listTitle` | `Stock Ticker` | Must match `-ListTitle` of `Set-StockTickerList.ps1` |

```json
"properties": {
  "stockTicker": {
    "siteUrl": "https://<tenant>.sharepoint.com",
    "listTitle": "Stock Ticker"
  }
}
```

## Stock ticker

The ticker reads the **first item (lowest ID)** of a SharePoint list once per page load, through `StockQuoteService` (`@kanduu/spfx-shared`, PnPJS).  `getStockQuoteChange` (also in shared) works out the direction and percent change.  It shows the ticker, the current price and a direction indicator.  Hovering or focusing it shows the percent change since the last close and when the price was last updated, in the user's locale.

| Field (internal name) | Display name | Type |
| --- | --- | --- |
| `Title` | Ticker | Single line of text (built-in, renamed) |
| `LastClosePrice` | Last Close Price | Number, 2 decimals |
| `CurrentPrice` | Current Price | Number, 2 decimals |
| `CurrentPriceAsOfDate` | Current Price As Of | Single line of text holding an ISO 8601 string (e.g. `2026-10-21T20:00:00Z`), not a date/time field |

Provision or update the list (safe to re-run; supports `-WhatIf`):

```powershell
./scripts/Set-StockTickerList.ps1 -SiteUrl https://<tenant>.sharepoint.com -ClientId <entra-app-client-id>
```

Behavior:

- Direction: up when `CurrentPrice` > `LastClosePrice`, down when lower, otherwise unchanged (a dash).  No percent is shown when `LastClosePrice` is empty or 0.
- Colors come from the theme (`semanticColors.successIcon` / `errorIcon`) on a small `bodyBackground` pill, so they stay readable on the primary-colored banner.  The arrow icon carries the direction too, so it does not depend on color alone.
- Nothing is rendered while loading, when the list is empty, when the first item has no `Ticker` or `CurrentPrice`, or when the request fails (logged as a warning).
- Everyone who sees the header needs read access to the list.  When the list is on a central site, grant visitors read there.
- Updating the list (e.g. Power Automate or a scheduled job) is out of scope for this repo.

## Pattern: themed React UI from an application customizer

1. Customizer: `this.context.serviceScope.consume(ThemeProvider.serviceKey)` (`@microsoft/sp-component-base`), then `tryGetTheme()`, and subscribe to `themeChangedEvent`.
2. Pass the `IReadonlyTheme` to React as a prop.
3. React: `createTheme(theme)` and wrap the tree in `@fluentui/react`'s `ThemeProvider`.  Fluent controls, including those rendered in layers or portals (`Panel`, `Dialog`, `ContextualMenu`), then use the site theme.
4. Use theme slots for colors (here `semanticColors.primaryButtonBackground` / `primaryButtonText` for the banner).  Do not hard-code colors.

Pure logic is in plain `.ts` modules next to the components and is unit tested (`*.test.ts`).  Jest in an SPFx package cannot load `@kanduu/spfx-shared` at runtime (it is published to webpack as ES modules), so tests in an SPFx package may import only **types** from shared.  Test shared code in `spfx/shared` instead (see [shared.md](shared.md)).

New menus, panels and dialogs belong in `components/` and are rendered inside `HeaderBanner` (e.g. `CommandBar` items for menus, or state in `HeaderBanner` toggling a `Panel`).  Data access goes behind a service, preferably in `@kanduu/spfx-shared`.
