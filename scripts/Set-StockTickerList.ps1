<#
.SYNOPSIS
    Creates (or brings up to date) the Stock Ticker list read by the header banner.

.DESCRIPTION
    Ensures a custom list with these fields exists on the site:

        Ticker                (built-in Title field, renamed)
        LastClosePrice        Number, 2 decimals
        CurrentPrice          Number, 2 decimals
        CurrentPriceAsOfDate  Single line of text, UTC retrieval time as ISO 8601 (e.g. 2026-10-21T20:00:00Z)

    The list and missing fields are created; existing fields keep their type and data, and only their
    display name and description are re-applied.  The default view is reset to show the four
    fields.  Running it again is safe.

    The header reads the first item (lowest ID).  Point the header at this site and list with the
    "stockTicker" property in scripts/config/header.*.json.

.PARAMETER SiteUrl
    URL of the site that hosts the list (typically one central site, such as the home site).

.PARAMETER ClientId
    Client ID of the Entra ID app registration used for PnP.PowerShell interactive sign-in.

.PARAMETER ListTitle
    List title.  Must match "stockTicker.listTitle" in the header configuration.

.EXAMPLE
    ./scripts/Set-StockTickerList.ps1 -SiteUrl https://contoso.sharepoint.com `
        -ClientId 00000000-0000-0000-0000-000000000000
#>
[CmdletBinding(SupportsShouldProcess)]
param(
    [Parameter(Mandatory)]
    [string]$SiteUrl,

    [Parameter(Mandatory)]
    [string]$ClientId,

    [string]$ListTitle = 'Stock Ticker'
)

#Requires -Version 7.4
#Requires -Modules @{ ModuleName = 'PnP.PowerShell'; ModuleVersion = '3.0.0' }

$ErrorActionPreference = 'Stop'

$fieldDefinitions = @(
    @{
        InternalName = 'LastClosePrice'
        Xml          = '<Field Type="Number" Name="LastClosePrice" StaticName="LastClosePrice" DisplayName="Last Close Price" Decimals="2" Min="0" />'
        Values       = @{ Title = 'Last Close Price'; Description = 'Previous closing price.' }
    },
    @{
        InternalName = 'CurrentPrice'
        Xml          = '<Field Type="Number" Name="CurrentPrice" StaticName="CurrentPrice" DisplayName="Current Price" Decimals="2" Min="0" />'
        Values       = @{ Title = 'Current Price'; Description = 'Latest price.' }
    },
    @{
        InternalName = 'CurrentPriceAsOfDate'
        Xml          = '<Field Type="Text" Name="CurrentPriceAsOfDate" StaticName="CurrentPriceAsOfDate" DisplayName="Current Price As Of" MaxLength="64" />'
        Values       = @{ Title = 'Current Price As Of'; Description = 'When Current Price was retrieved, in UTC, as an ISO 8601 string (e.g. 2026-10-21T20:00:00Z).' }
    }
)
$viewFields = @('Title') + ($fieldDefinitions | ForEach-Object { $_.InternalName })

Connect-PnPOnline -Url $SiteUrl -Interactive -ClientId $ClientId

$list = Get-PnPList -Identity $ListTitle
if (-not $list) {
    if (-not $PSCmdlet.ShouldProcess($SiteUrl, "Create list '$ListTitle'")) {
        Write-Host "List '$ListTitle' does not exist; skipping field and view changes."
        return
    }
    $list = New-PnPList -Title $ListTitle -Template GenericList -Url 'Lists/StockTicker'
    Write-Host "Created list '$ListTitle'."
}

if ($PSCmdlet.ShouldProcess($ListTitle, "Rename the Title field to 'Ticker'")) {
    Set-PnPField -List $list -Identity 'Title' -Values @{ Title = 'Ticker'; Description = 'Ticker symbol, e.g. MSFT.' } | Out-Null
}

$existingFields = @(Get-PnPField -List $list | ForEach-Object { $_.InternalName })
foreach ($field in $fieldDefinitions) {
    if ($existingFields -notcontains $field.InternalName) {
        if ($PSCmdlet.ShouldProcess($ListTitle, "Add field '$($field.InternalName)'")) {
            Add-PnPFieldFromXml -List $list -FieldXml $field.Xml | Out-Null
            Write-Host "Added field '$($field.InternalName)'."
        }
        else {
            continue
        }
    }
    if ($PSCmdlet.ShouldProcess($ListTitle, "Update field '$($field.InternalName)'")) {
        Set-PnPField -List $list -Identity $field.InternalName -Values $field.Values | Out-Null
    }
}

$defaultView = Get-PnPView -List $list | Where-Object { $_.DefaultView } | Select-Object -First 1
if ($defaultView -and $PSCmdlet.ShouldProcess($ListTitle, "Set default view fields to $($viewFields -join ', ')")) {
    Set-PnPView -List $list -Identity $defaultView.Id -Fields $viewFields | Out-Null
}

Write-Host "List '$ListTitle' is ready on $SiteUrl."
