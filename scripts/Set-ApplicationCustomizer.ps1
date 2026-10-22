<#
.SYNOPSIS
    Registers (or re-registers) an SPFx application customizer on a site from a JSON configuration file.

.DESCRIPTION
    Removes any existing registration of the configured ClientSideComponentId on the site (site collection
    and web scopes), then adds it again with the configuration's title, scope, sequence and properties.
    Running it again applies the current configuration.  Use a different configuration file per site when
    sites need different properties.

    The solution package (.sppkg) must already be deployed to the App Catalog and available to the site.

.PARAMETER SiteUrl
    URL of the site to configure.

.PARAMETER ConfigPath
    Path to a JSON configuration file (see scripts/config/*.json).

.PARAMETER ClientId
    Client ID of the Entra ID app registration used for PnP.PowerShell interactive sign-in.

.EXAMPLE
    ./scripts/Set-ApplicationCustomizer.ps1 -SiteUrl https://contoso.sharepoint.com/sites/intranet `
        -ConfigPath ./scripts/config/header.default.json -ClientId 00000000-0000-0000-0000-000000000000
#>
[CmdletBinding(SupportsShouldProcess)]
param(
    [Parameter(Mandatory)]
    [string]$SiteUrl,

    [Parameter(Mandatory)]
    [string]$ConfigPath,

    [Parameter(Mandatory)]
    [string]$ClientId
)

#Requires -Version 7.4
#Requires -Modules @{ ModuleName = 'PnP.PowerShell'; ModuleVersion = '3.0.0' }

$ErrorActionPreference = 'Stop'

$config = Get-Content -Path $ConfigPath -Raw | ConvertFrom-Json

foreach ($required in 'clientSideComponentId', 'title') {
    if (-not $config.$required) {
        throw "Configuration '$ConfigPath' is missing '$required'."
    }
}

$componentId = $config.clientSideComponentId
$scope = if ($config.scope) { $config.scope } else { 'Site' }
$sequence = if ($null -ne $config.sequence) { [int]$config.sequence } else { 0 }
$properties = if ($null -ne $config.properties) {
    $config.properties | ConvertTo-Json -Depth 10 -Compress
} else {
    '{}'
}

Connect-PnPOnline -Url $SiteUrl -Interactive -ClientId $ClientId

$existing = @(Get-PnPApplicationCustomizer -ClientSideComponentId $componentId -Scope All)
if ($existing.Count -gt 0) {
    if ($PSCmdlet.ShouldProcess($SiteUrl, "Remove $($existing.Count) existing '$($config.title)' registration(s)")) {
        Remove-PnPApplicationCustomizer -ClientSideComponentId $componentId -Scope All -Force
        Write-Host "Removed $($existing.Count) existing registration(s) of '$($config.title)'."
    }
}

if ($PSCmdlet.ShouldProcess($SiteUrl, "Add '$($config.title)' at $scope scope")) {
    Add-PnPApplicationCustomizer `
        -Title $config.title `
        -Description $config.description `
        -ClientSideComponentId $componentId `
        -ClientSideComponentProperties $properties `
        -Scope $scope `
        -Sequence $sequence
    Write-Host "Added '$($config.title)' to $SiteUrl ($scope scope) with properties $properties."
}
