# Application customizers

How application customizers in this repo are packaged, provisioned and configured.  For the customizers in a specific package, see that package's doc (e.g. [customizers-global.md](customizers-global.md)).

## Provisioning: PnP.PowerShell, not feature XML

Application customizers are activated per site with PnP.PowerShell scripts in `/scripts`.  They are **not** activated with SPFx feature XML.

- Packages set `skipFeatureDeployment: true` and have **no** `features` block in `config/package-solution.json` and no `sharepoint/assets/*.xml`.
- Deploying the `.sppkg` to the App Catalog only makes the components available.  It never registers a customizer on a site.
- Registration is a per-site step that runs `/scripts/Set-ApplicationCustomizer.ps1` with a JSON configuration from `/scripts/config`.

Why not feature XML:

- The properties in `elements.xml` / `ClientSideInstance.xml` are fixed in the package, so every site gets the same configuration.  The Tenant Wide Extensions list can only narrow where an extension appears, by site template or list template.
- If XML provisioning and a script both register the same component, the customizer is registered twice and renders twice.
- A script can be re-run, versioned per site and reviewed like any other code.

## Requirements

| Tool | Version | Install / update |
| --- | --- | --- |
| PowerShell | 7.4.6 or later (7.x) | [Install PowerShell](https://learn.microsoft.com/powershell/scripting/install/installing-powershell) |
| PnP.PowerShell | 3.x | `Install-Module PnP.PowerShell -Scope CurrentUser` / `Update-Module PnP.PowerShell` |
| Entra ID app registration | — | Required by PnP.PowerShell for interactive sign-in.  See [Register an Entra ID application](https://pnp.github.io/powershell/articles/registerapplication.html). |

The scripts declare these requirements with `#Requires` and will not start on older versions.

## `Set-ApplicationCustomizer.ps1`

```powershell
./scripts/Set-ApplicationCustomizer.ps1 -SiteUrl https://<tenant>.sharepoint.com/sites/<site> `
    -ConfigPath ./scripts/config/header.default.json
```

`-ClientId` is optional in every script.  When it's left out, PnP.PowerShell uses its [default client ID](https://pnp.github.io/powershell/articles/defaultclientid.html): the `ENTRAID_APP_ID`, `ENTRAID_CLIENT_ID` or `AZURE_CLIENT_ID` environment variable, or a `Set-PnPManagedAppId` entry for the tenant.  Set one in your PowerShell profile, for example:

```powershell
$env:ENTRAID_APP_ID = '<entra-app-client-id>'
```

The script can be run again safely.  It:

1. Connects to `-SiteUrl` interactively.
2. Removes **every** existing registration of the configured `clientSideComponentId` on the site, at both site collection and web scope.
3. Adds the customizer again with the configuration's title, description, scope, sequence and properties.

Use `-WhatIf` to see what would change without changing anything.

### Configuration files (`/scripts/config/*.json`)

```json
{
  "title": "Header",
  "description": "kanduu header banner (customizers-global)",
  "clientSideComponentId": "003d0b35-944d-424f-ab09-b53f62618e53",
  "scope": "Site",
  "sequence": 0,
  "properties": {}
}
```

| Field | Required | Notes |
| --- | --- | --- |
| `title` | yes | Custom action title |
| `clientSideComponentId` | yes | The `id` from the customizer's `*.manifest.json` |
| `description` | no | |
| `scope` | no | `Site` (site collection, default) or `Web` |
| `sequence` | no | Order relative to other customizers (default `0`) |
| `properties` | no | Serialized to `ClientSideComponentProperties`; must match the customizer's `I<Name>ApplicationCustomizerProperties` interface |

Name configuration files `<customizer>.<variant>.json`, for example `header.default.json` for most sites and `header.hr.json` for a site that needs different properties.

## Adding a new application customizer

1. Build the extension (thin `*ApplicationCustomizer.ts`, React UI in `components/`).  See [customizers-global.md](customizers-global.md) for the themed React pattern.
2. Do not add feature XML or a `features` block to `package-solution.json`.
3. Add `/scripts/config/<customizer>.default.json` with the manifest `id` and default properties.
4. Document the customizer in the package's doc in `/docs`.
