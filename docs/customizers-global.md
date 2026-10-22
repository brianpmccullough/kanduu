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
| `components/headerCommands.ts` | Command model (`IHeaderCommand` → sections → links) and `toCommandBarItems`, which maps it to Fluent `CommandBar` items |
| `components/defaultHeaderCommands.ts` | Sample intranet commands; see [Commands](#commands) |
| `components/brandIcons.tsx` | Registers social network logos as Fluent icons (`BrandLinkedIn`, `BrandYouTube`, `BrandFacebook`, `BrandInstagram`, `BrandX`) |
| `components/ProfileButton.tsx` | Current user's `Persona`; opens the profile popup.  See [Profile popup](#profile-popup) |
| `components/ProfileCard.tsx` | Popup contents: the user's name and email, their quick link tiles and a Manage button |
| `components/sampleUserLinks.ts` | Sample quick links until users can personalize them |

Layout: commands (`CommandBar`) on the left, then on the right a stock ticker, a search box, the profile and a settings (gear) button.  The search box and gear are stubs with no behavior yet; the gear sits last so it can later be shown only to site owners or admins without shifting the other items.  The ticker is hidden below 640px; commands that don't fit move to the CommandBar's overflow ("More commands") menu.

### Properties

| Property | Default | Notes |
| --- | --- | --- |
| `stockTicker.siteUrl` | current site | Site that hosts the Stock Ticker list.  Set it to one central site so a single list feeds every site.  In this tenant, that's the root site (`header.default.json`). |
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

The ticker shows the **first item (lowest ID)** of the Stock Ticker list: the ticker, the current price and a direction indicator.  Hovering or focusing it shows the percent change since the last close and when the price was last updated, in the user's locale.  It reads the list once per page load through `StockQuoteService` (`@kanduu/spfx-shared`, PnPJS).  `getStockQuoteChange`, also in shared, works out the direction and percent change.

The data lives in a SharePoint list, not behind an API of our own.  That way web, mobile and Teams clients can all read it with REST or Microsoft Graph, and there's no API layer to host.  See [workers.md](workers.md#design-decision-workers-write-to-sharepoint-lists).

| Field (internal name) | Display name | Type |
| --- | --- | --- |
| `Title` | Ticker | Single line of text (built-in, renamed) |
| `LastClosePrice` | Last Close Price | Number, 2 decimals |
| `CurrentPrice` | Current Price | Number, 2 decimals |
| `CurrentPriceAsOfDate` | Current Price As Of | Single line of text holding the UTC time the price was retrieved, as ISO 8601 (e.g. `2026-10-21T20:00:00Z`), not a date/time field |

Provision or update the list (safe to re-run; supports `-WhatIf`):

```powershell
./scripts/Set-StockTickerList.ps1 -SiteUrl https://<tenant>.sharepoint.com
```

Behavior:

- Direction: up when `CurrentPrice` > `LastClosePrice`, down when lower, otherwise unchanged (a dash).  No percent is shown when `LastClosePrice` is empty or 0.
- Colors come from the theme (`semanticColors.successIcon` / `errorIcon`) on a small `bodyBackground` pill, so they stay readable on the primary-colored banner.  The arrow icon carries the direction too, so it does not depend on color alone.
- Nothing is rendered while loading, when the list is empty, when the first item has no `Ticker` or `CurrentPrice`, or when the request fails (logged as a warning).
- Everyone who sees the header needs read access to the list.  When the list is on a central site, grant visitors read there.
- The `stock-quote` worker keeps the list up to date.  See [workers.md](workers.md#stock-quote).

## Commands

Sample intranet commands, defined in `defaultHeaderCommands.ts`.  Except for Our brands, they are **stubs**: the links have no destinations yet, so choosing one only closes the menu.  Destinations (and possibly the commands themselves) will come from configuration once the target systems are known.

| Command | Contents |
| --- | --- |
| I want to... | **Pay and time off**: get my pay slip, request time off, submit an expense report, update my personal details.  **Workplace**: book a meeting room, book travel, find a colleague.  **Get help**: report an IT issue, ask HR a question. |
| Departments | Human Resources, Finance, IT, Facilities |
| Our brands | A submenu per brand (Microsoft, Xbox, LinkedIn, Microsoft 365, Azure, Copilot).  Each lists the brand's social accounts under the brand name (LinkedIn, YouTube, Facebook, Instagram, X), then its public website.  Placeholders for the company's own brands; links open in a new tab. |
| News | A single link |

To add or change commands, edit `defaultHeaderCommands.ts` (text from `loc/` strings, icons from [Fluent UI MDL2 icons](https://developer.microsoft.com/en-us/fluentui#/styles/web/icons)).  A command with `sections` becomes a menu; each section is a group of links with an optional heading.  A link can have `sections` too, which makes it a nested submenu.  Add a brand with the `brand()` helper; networks without an account are left out.  A link with an `href` navigates; `openInNewTab` opens it in a new tab (`rel="noopener noreferrer"`).  Items are styled with the banner's theme colors; their menus use the site theme.

### Brand icons

The Fluent MDL2 icon font has no YouTube, Facebook, Instagram or X logos, so `brandIcons.tsx` registers them (and LinkedIn, for a matching style) as SVG icons with Fluent's `registerIcons`.  `HeaderBanner` registers them once at load, after `initializeIcons()`.  Use them like any Fluent icon (`iconName: 'BrandYouTube'`).

- The paths come from [Simple Icons](https://simpleicons.org) (CC0).  The logos remain their owners' trademarks; use them only to link to those services.
- They are single-color and drawn in `currentColor`, so they take the theme's icon color, like the other icons.  Don't add brand colors (no custom colors).
- The public website uses the MDL2 `Globe` icon.

## Profile popup

Selecting the profile picture opens a popup below it (`FocusTrapCallout`, `role="dialog"`) with:

- the user's name and email (from the page context; no extra request)
- **My quick links**: the user's bookmarks as a grid of tiles (icon and title) that open in a new tab
- a **Manage** button for editing quick links.  It is a stub with no behavior yet.

Links come from an `IUserLinksService` (`@kanduu/spfx-shared`), loaded the first time the popup opens.  Each `IUserLink` can name a [Fluent UI MDL2 icon](https://developer.microsoft.com/en-us/fluentui#/styles/web/icons) (`iconName`); without one the tile shows a generic link icon.  For now the service is `StaticUserLinksService` with the sample links in `sampleUserLinks.ts` (Workday, nelAI, CRM, Outlook, Teams, Learning; the internal tools use placeholder `example.com` addresses), so every user sees the same links.  Personal links will be a second implementation that reads and writes a JSON file in the app folder of the user's OneDrive (Microsoft Graph `/me/drive/special/approot`), and Manage will open an editor for it; the tiles will not need to change.

Keyboard: Enter or Space opens the popup and focus moves into it; Tab stays inside it; Escape or selecting outside closes it and focus returns to the button.

## Pattern: themed React UI from an application customizer

1. Customizer: `this.context.serviceScope.consume(ThemeProvider.serviceKey)` (`@microsoft/sp-component-base`), then `tryGetTheme()`, and subscribe to `themeChangedEvent`.
2. Pass the `IReadonlyTheme` to React as a prop.
3. React: `createTheme(theme)` and wrap the tree in `@fluentui/react`'s `ThemeProvider`.  Fluent controls, including those rendered in layers or portals (`Panel`, `Dialog`, `ContextualMenu`), then use the site theme.
4. Use theme slots for colors (here `semanticColors.primaryButtonBackground` / `primaryButtonText` for the banner).  Do not hard-code colors.

Pure logic is in plain `.ts` modules next to the components and is unit tested (`*.test.ts`).  Jest in an SPFx package cannot load `@kanduu/spfx-shared` at runtime (it is published to webpack as ES modules), so tests in an SPFx package may import only **types** from shared.  Test shared code in `spfx/shared` instead (see [shared.md](shared.md)).

New menus, panels and dialogs belong in `components/` and are rendered inside `HeaderBanner` (e.g. `CommandBar` items for menus, or state in `HeaderBanner` toggling a `Panel`).  Data access goes behind a service, preferably in `@kanduu/spfx-shared`.
