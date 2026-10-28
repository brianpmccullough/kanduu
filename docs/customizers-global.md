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
| `HeaderApplicationCustomizer.ts` | Thin host: reads the SPFx theme, creates the Top placeholder, renders `HeaderBanner`, re-renders on theme / placeholder change and after each page change (`PageWatcher`) |
| `components/HeaderBanner.tsx` | Banner layout; wraps everything in a Fluent `ThemeProvider` built from the SPFx theme |
| `components/HeaderLogo.tsx` | Logo at the far left: the Kanduu mark and name.  See [Logo](#logo) |
| `assets/` | Logo images (`kanduu-mark.png`, cut from the `Kanduu-Logo.png` source artwork) |
| `components/StockTicker.tsx` | First quote from the Stock Ticker list; see [Stock ticker](#stock-ticker) |
| `components/stockTickerFormat.ts` | Locale-aware price, percent and date formatting |
| `components/headerCommands.ts` | `toCommandBarItems`: maps the menu (commands → sections → links) to Fluent `CommandBar` items, with a Fluent icon or a custom image per item |
| `components/brandIcons.tsx` | Registers social network logos as Fluent icons (`BrandLinkedIn`, `BrandYouTube`, `BrandFacebook`, `BrandInstagram`, `BrandX`) |
| `components/ProfileButton.tsx` | Current user's `Persona`; opens the profile popup.  See [Profile popup](#profile-popup) |
| `components/ProfileCard.tsx` | Popup contents: the user's name and email, their quick link tiles and a Manage button |
| `components/sampleUserLinks.ts` | Sample quick links until users can personalize them |

Layout: the logo on the far left, then commands (`CommandBar`), then on the right a stock ticker, a search box, the profile and a settings (gear) button.  The search box and gear are stubs with no behavior yet; the gear sits last so it can later be shown only to site owners or admins without shifting the other items.  The ticker and the logo name are hidden below 640px; commands that don't fit move to the CommandBar's overflow ("More commands") menu.

### Properties

| Property | Default | Notes |
| --- | --- | --- |
| `headerMenu.siteUrl` | current site | Site that hosts the Header Menu library.  Set it to one central site so one menu serves every site.  In this tenant, that's the root site. |
| `headerMenu.libraryTitle` | `Header Menu` | Must match `-LibraryTitle` of `Set-HeaderMenu.ps1` |
| `headerMenu.fileName` | `header-menu.json` | Must match `-FileName` of `Set-HeaderMenu.ps1` |
| `headerMenu.cacheExpiryMinutes` | `60` | How long each browser keeps the menu before reading the file again.  `0` reads it on every page load (useful while editing the menu). |
| `stockTicker.siteUrl` | current site | Site that hosts the Stock Ticker list.  Set it to one central site so a single list feeds every site.  In this tenant, that's the root site (`header.default.json`). |
| `stockTicker.listTitle` | `Stock Ticker` | Must match `-ListTitle` of `Set-StockTickerList.ps1` |

```json
"properties": {
  "headerMenu": {
    "siteUrl": "https://<tenant>.sharepoint.com",
    "libraryTitle": "Header Menu",
    "fileName": "header-menu.json",
    "cacheExpiryMinutes": 60
  },
  "stockTicker": {
    "siteUrl": "https://<tenant>.sharepoint.com",
    "listTitle": "Stock Ticker"
  }
}
```

### Search (`src/extensions/search`)

Shows a custom search panel (90% of the viewport width, non-blocking) on SharePoint search results pages.  On other pages it renders nothing.

| File | Role |
| --- | --- |
| `SearchApplicationCustomizer.ts` | Thin host: on start, after each page change (`PageWatcher.changedEvent`, which includes search query and tab changes) and on theme change, reads the current `SharePointPage` (`@kanduu/spfx-shared`) and renders `SearchPanel` into the Bottom placeholder when `search.isSearchPage` |
| `components/SearchPanel.tsx` | Fluent `Panel` in a `ThemeProvider` built from the SPFx theme; opens again when the query or vertical changes.  Placeholder content ("Custom search") for now |

The panel is rendered into the **Bottom** placeholder (the `Panel` itself draws in a layer over the page).  If the page has no Bottom placeholder, it logs a warning and shows nothing.  It has no properties yet.

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

The commands come from a JSON file in a SharePoint document library, so menus change without a redeploy.  `HeaderMenuService` (`@kanduu/spfx-shared`, PnPJS) reads it and `localizeHeaderMenu` picks the text for the user's language.  While it loads, and when it can't be read (logged as a warning), the banner shows no commands.

The raw JSON is cached in the browser's `localStorage` (`BrowserStorageCache`, key `kanduu:headermenu:<site>|<library>|<file>`) for `headerMenu.cacheExpiryMinutes` (default 60), so most page loads make no request for it.  Edits to the file reach each browser once its copy expires; to see them sooner, clear the `kanduu:` entries in the browser's developer tools (Application > Local storage) or set the expiry to `0` while editing.  When the browser blocks storage (e.g. some private windows), the file is read on every page load.

The starting menu is `scripts/config/header-menu.default.json`.  Except for Our brands, its links are **stubs**: they have no destinations yet, so choosing one only closes the menu.

| Command | Contents |
| --- | --- |
| Our brands | A submenu per brand (Microsoft, Xbox, LinkedIn, Microsoft 365, Azure, Copilot).  Each lists the brand's social accounts under the brand name (LinkedIn, YouTube, Facebook, Instagram, X), then its public website.  Placeholders for the company's own brands; links open in a new tab. |
| Hubs | Human Resources, Finance, IT, Facilities |
| Working here | **Careers**: browse job postings, explore career paths, find a mentor, refer a candidate.  **Learning**: learning catalog, my required training, leadership development.  **Life here**: benefits, wellbeing, recognize a colleague, employee communities, employee handbook. |
| News | Latest news, then submenus to filter news **by brand**, **by geography** (North America, Latin America, Europe, Middle East and Africa, Asia Pacific) and **by role** (Sales, Finance, Human Resources, Technology, Delivery, Client facing).  Sample filters. |
| I want to... | **Pay and time off**: get my pay slip, request time off, submit an expense report, update my personal details.  **Workplace**: book a meeting room, book travel, find a colleague.  **Get help**: report an IT issue, ask HR a question. |

Create the library and upload the menu (supports `-WhatIf`):

```powershell
./scripts/Set-HeaderMenu.ps1 -SiteUrl https://<tenant>.sharepoint.com
```

- The script checks the JSON first and stops on problems (missing keys or text, bad images).
- When the file already exists it is left alone, so re-running doesn't overwrite edits made in SharePoint.  Add `-Force` to replace it.  The library keeps versions, so a replaced menu can be restored.
- Use `-MenuPath` to upload a different file, e.g. a per-tenant `header-menu.<name>.json`.
- Everyone who sees the header needs read access to the file.  When the library is on a central site, grant visitors read there.

### Menu JSON

```json
{
  "version": 1,
  "commands": [
    {
      "key": "news",
      "text": { "default": "News", "fr": "Actualités", "fr-CA": "Nouvelles" },
      "iconName": "News",
      "sections": [
        {
          "key": "allNews",
          "title": "All news",
          "links": [
            { "key": "latestNews", "text": "Latest news", "iconName": "News", "href": "https://<tenant>.sharepoint.com/news" },
            { "key": "intranet", "text": "Intranet", "image": "data:image/png;base64,iVBORw0KGgo...", "href": "https://example.com", "openInNewTab": true }
          ]
        }
      ]
    }
  ]
}
```

| Field | Notes |
| --- | --- |
| `version` | `1` |
| `commands` | Top-level commands, in order.  Each is a link. |
| link `key` | Required; unique among its siblings |
| link `text`, section `title` | Required text (title optional).  A string, or an object of translations with a required `default` (see below). |
| link `iconName` | A [Fluent UI MDL2 icon](https://developer.microsoft.com/en-us/fluentui#/styles/web/icons), or one of the [brand icons](#brand-icons) |
| link `image` | A custom image as a base64 data URI (`data:image/png;base64,...`; PNG, JPEG, GIF, SVG or WebP), shown at 16 × 16 in place of `iconName`.  Other values (such as image URLs) are ignored, so the menu never loads images from other sites.  Keep images small: the whole file loads with every page. |
| link `href` | Destination.  Omit for a stub. |
| link `openInNewTab` | `true` opens the link in a new tab (`rel="noopener noreferrer"`) |
| link `sections` | Makes the link a menu (or a nested submenu).  Each section is a group of `links` with an optional `title`; sections after the first get a divider. |

**Translations.**  Text follows the page first, then the user:

1. **The page's language.**  A translated page on a multilingual site lives in a Site Pages folder named for its language (`SitePages/fr/Home.aspx`), so the header reads it from the URL (`getPageTranslationLanguage`, adapted from the "page" mode of the [PnP react-custom-localization sample](https://github.com/pnp/sp-dev-fx-webparts/tree/main/samples/react-custom-localization)).  It is checked again after every page change (`PageWatcher`).
2. **The user's SharePoint UI language** (`pageContext.cultureInfo.currentUICultureName`), from their Microsoft 365 language setting.
3. `default`.

For each language it tries an exact match (`fr-CA`), then the language (`fr`), then another region of the language (`fr-FR`), and moves to the next only when the menu has none of them.  So a normal folder that looks like a language code (`SitePages/hr/` for Human Resources is also Croatian) changes nothing unless the menu has that translation.  Keys are case-insensitive.  A plain string is used for every language.  This menu text is the only user-facing text kept outside the `loc/` files, because it belongs to the menu, not the code.  The fixed header text (Search, Settings, ...) comes from `loc/` and follows the user's language, as SPFx loads it; only `en-us` exists today.

Entries without a `key` or usable text are left out.  Items are styled with the banner's theme colors; their menus use the site theme.

### Brand icons

The Fluent MDL2 icon font has no YouTube, Facebook, Instagram or X logos, so `brandIcons.tsx` registers them (and LinkedIn, for a matching style) as SVG icons with Fluent's `registerIcons`.  `HeaderBanner` registers them once at load, after `initializeIcons()`.  Use them like any Fluent icon (`iconName: 'BrandYouTube'`).

- The paths come from [Simple Icons](https://simpleicons.org) (CC0).  The logos remain their owners' trademarks; use them only to link to those services.
- They are single-color and drawn in `currentColor`, so they take the theme's icon color, like the other icons.  Don't add brand colors (no custom colors).
- The public website uses the MDL2 `Globe` icon.

## Logo

`HeaderLogo` shows, at the far left of the banner:

- **The mark**: `assets/kanduu-mark.png`, the Kanduu "K" (Kanduu = "can do"; "duu" = double U, W for digital workplace).  It is a 64px crop of the `assets/Kanduu-Logo.png` source artwork, shown at 28px so it stays sharp on high-density screens.  It is the brand artwork, so it keeps its own colors and white background, shown as a small rounded tile on the banner.  Its alt text is the `LogoText` string.
- **The name**: the `LogoText` string ("Kanduu") as text in the banner's text color and theme font.  It is `aria-hidden`, since the mark already gives the name, and is hidden below 640px wide.

Images are imported as modules (`import url from '../assets/x.png'`; types in `src/images.d.ts`).  SPFx bundles them as separate files with hashed names, deployed with the package.  To change the mark, cut a new small PNG from the source artwork (e.g. `sips --cropToHeightWidth` then `sips -z 64 64`) rather than importing the large source file.

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
