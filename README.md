# kanduu digital workplace

Microsoft 365 extensibility for the kanduu digital workplace: SharePoint Framework (SPFx) web parts and extensions, plus the PnP.PowerShell scripts that provision them.

## Repository layout

| Path | Contents |
| --- | --- |
| `spfx/customizers-global` | Application customizers deployed tenant-wide (e.g. the themed header banner) |
| `spfx/webparts-global` | Web parts available to all sites |
| `spfx/shared` | `@kanduu/spfx-shared`: TypeScript shared by the SPFx packages |
| `scripts` | PnP.PowerShell provisioning scripts and per-site JSON configurations |
| `docs` | Reference documentation for people and coding agents |

This is an [npm workspaces](https://docs.npmjs.com/cli/using-npm/workspaces) monorepo.  Run commands from the repository root.

## Prerequisites

- Node.js 22 (>= 22.14.0, < 23)
- A Microsoft 365 tenant with a SharePoint App Catalog
- For provisioning: PowerShell 7.4+ and [PnP.PowerShell](https://pnp.github.io/powershell/) 3.x, and an Entra ID app registration for sign-in

## Getting started

```bash
npm install
npm run build
```

`npm run build` builds `spfx/shared`, then every SPFx package (lint, TypeScript, Jest tests and `.sppkg` packaging).

### Run a package locally

```bash
export SPFX_SERVE_TENANT_DOMAIN=<tenant>.sharepoint.com
npm run customizers-global:start
```

| Command | Purpose |
| --- | --- |
| `npm run build` | Build everything |
| `npm run <package>:build` | Build `shared` and one package (e.g. `webparts-global:build`) |
| `npm run <package>:start` | Build `shared` and serve one package locally |
| `npm run <package>:clean` | Clean one package |

## Deploying

1. Build, then upload `spfx/<package>/sharepoint/solution/<package>.sppkg` to the tenant App Catalog and make it available to all sites.
2. Activate application customizers per site with PnP.PowerShell:

   ```powershell
   ./scripts/Set-ApplicationCustomizer.ps1 -SiteUrl https://<tenant>.sharepoint.com/sites/<site> `
       -ConfigPath ./scripts/config/header.default.json -ClientId <entra-app-client-id>
   ```

   The script can be re-run.  It replaces any existing registration with the current configuration.  See [docs/application-customizers.md](docs/application-customizers.md).

## Documentation

- [AGENTS.md](AGENTS.md): tech stack, guardrails and definition of done (for people and coding agents)
- [docs/dependencies.md](docs/dependencies.md): approved dependencies
- [docs/application-customizers.md](docs/application-customizers.md): provisioning application customizers
- [docs/customizers-global.md](docs/customizers-global.md): the `customizers-global` package
- [docs/commit-message.md](docs/commit-message.md): commit message and PR title conventions

## Contributing

Contributions not accepted at this time. Thank you!
