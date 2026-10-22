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
| `components/StockTicker.tsx` | Stub: placeholder text only |
| `components/ProfileButton.tsx` | Stub: current user's `Persona`, no menu yet |

Layout: actions area (empty `CommandBar`) on the left, then on the right a stock ticker, a search box, a settings (gear) button and the profile.  The search box, gear and profile are stubs with no behavior yet.  The ticker is hidden below 640px.

## Pattern: themed React UI from an application customizer

1. Customizer: `this.context.serviceScope.consume(ThemeProvider.serviceKey)` (`@microsoft/sp-component-base`), then `tryGetTheme()`, and subscribe to `themeChangedEvent`.
2. Pass the `IReadonlyTheme` to React as a prop.
3. React: `createTheme(theme)` and wrap the tree in `@fluentui/react`'s `ThemeProvider`.  Fluent controls, including those rendered in layers or portals (`Panel`, `Dialog`, `ContextualMenu`), then use the site theme.
4. Use theme slots for colors (here `semanticColors.primaryButtonBackground` / `primaryButtonText` for the banner).  Do not hard-code colors.

New menus, panels and dialogs belong in `components/` and are rendered inside `HeaderBanner` (e.g. `CommandBar` items for menus, or state in `HeaderBanner` toggling a `Panel`).  Data access goes behind a service, preferably in `@kanduu/spfx-shared`.
