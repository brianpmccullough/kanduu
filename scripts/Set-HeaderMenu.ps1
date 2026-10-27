<#
.SYNOPSIS
    Creates the Header Menu library and uploads the menu JSON read by the header banner.

.DESCRIPTION
    Ensures a document library exists on the site, checks the menu JSON, then uploads it to the
    library's root folder.  The header reads the file at page load, so menu changes need no redeploy.

    An existing menu file is left alone unless -Force is given, so running the script again does not
    overwrite edits made in SharePoint.  The library keeps versions, so an overwrite can be undone.

    Everyone who sees the header needs read access to the file (the library inherits the site's
    permissions).  Point the header at this site, library and file with the "headerMenu" property in
    scripts/config/header.*.json.

.PARAMETER SiteUrl
    URL of the site that hosts the library (typically one central site, such as the home site).

.PARAMETER ClientId
    Client ID of the Entra ID app registration used for PnP.PowerShell interactive sign-in.  Optional:
    when omitted, PnP.PowerShell uses its default client ID from the ENTRAID_APP_ID, ENTRAID_CLIENT_ID or
    AZURE_CLIENT_ID environment variable (or Set-PnPManagedAppId).
    See https://pnp.github.io/powershell/articles/defaultclientid.html

.PARAMETER MenuPath
    Path to the menu JSON to upload.

.PARAMETER LibraryTitle
    Library title.  Must match "headerMenu.libraryTitle" in the header configuration.

.PARAMETER FileName
    File name in the library.  Must match "headerMenu.fileName" in the header configuration.

.PARAMETER Force
    Replace the menu file when it already exists.

.EXAMPLE
    ./scripts/Set-HeaderMenu.ps1 -SiteUrl https://contoso.sharepoint.com

.EXAMPLE
    ./scripts/Set-HeaderMenu.ps1 -SiteUrl https://contoso.sharepoint.com -MenuPath ./scripts/config/header-menu.contoso.json -Force
#>
[CmdletBinding(SupportsShouldProcess)]
param(
    [Parameter(Mandatory)]
    [string]$SiteUrl,

    [string]$ClientId,

    [string]$MenuPath = (Join-Path $PSScriptRoot 'config/header-menu.default.json'),

    [string]$LibraryTitle = 'Header Menu',

    [string]$FileName = 'header-menu.json',

    [switch]$Force
)

#Requires -Version 7.4
#Requires -Modules @{ ModuleName = 'PnP.PowerShell'; ModuleVersion = '3.0.0' }

$ErrorActionPreference = 'Stop'

function Test-LocalizedText($Text) {
    if ($Text -is [string]) {
        return [bool]$Text
    }
    return $null -ne $Text -and [bool]$Text.default
}

<# Returns a problem for each link or section without a key or text, or with an image that is not a base64 data URI. #>
function Get-MenuProblem($Links, [string]$Path) {
    foreach ($link in @($Links | Where-Object { $_ })) {
        $linkPath = "$Path/$($link.key)"
        if (-not $link.key) { "$Path has a link without a key." }
        if (-not (Test-LocalizedText $link.text)) { "$linkPath has no text (a string, or an object with 'default')." }
        if ($link.image -and $link.image -notmatch '^data:image/(png|jpe?g|gif|svg\+xml|webp);base64,') {
            "$linkPath has an image that is not a base64 image data URI (data:image/png;base64,...)."
        }
        foreach ($section in @($link.sections | Where-Object { $_ })) {
            if (-not $section.key) { "$linkPath has a section without a key." }
            if ($null -ne $section.title -and -not (Test-LocalizedText $section.title)) { "$linkPath/$($section.key) has an empty title." }
            Get-MenuProblem $section.links "$linkPath/$($section.key)"
        }
    }
}

$menu = Get-Content -Path $MenuPath -Raw | ConvertFrom-Json
if ($menu.version -ne 1 -or $menu.commands -isnot [array]) {
    throw "Menu '$MenuPath' must have ""version"": 1 and a ""commands"" array."
}
$problems = @(Get-MenuProblem $menu.commands '')
if ($problems) {
    throw "Menu '$MenuPath' has problems:`n  $($problems -join "`n  ")"
}

$connectArgs = @{ Url = $SiteUrl; Interactive = $true }
if ($ClientId) {
    $connectArgs.ClientId = $ClientId
}
Connect-PnPOnline @connectArgs

$list = Get-PnPList -Identity $LibraryTitle -ErrorAction 0
if (-not $list) {
    if (-not $PSCmdlet.ShouldProcess($SiteUrl, "Create library '$LibraryTitle'")) {
        Write-Host "Library '$LibraryTitle' does not exist; skipping upload."
        return
    }
    $list = New-PnPList -Title $LibraryTitle -Template DocumentLibrary -Url 'HeaderMenu'
    Write-Host "Created library '$LibraryTitle'."
}

if ($PSCmdlet.ShouldProcess($LibraryTitle, 'Turn on versioning')) {
    Set-PnPList -Identity $list -EnableVersioning $true | Out-Null
}

$folderUrl = (Get-PnPFolder -ListRootFolder $list).ServerRelativeUrl
# Add-PnPFile takes the folder relative to the site, e.g. "HeaderMenu".
$webUrl = (Get-PnPWeb).ServerRelativeUrl.TrimEnd('/')
$siteRelativeFolder = $folderUrl.Substring($webUrl.Length).TrimStart('/')

$existing = Get-PnPFile -Url "$folderUrl/$FileName" -AsListItem -ErrorAction 0
if ($existing -and -not $Force) {
    Write-Host "'$FileName' already exists in '$LibraryTitle'; leaving it.  Use -Force to replace it."
    return
}

if ($PSCmdlet.ShouldProcess("$LibraryTitle/$FileName", "Upload '$MenuPath'")) {
    Add-PnPFile -Path $MenuPath -Folder $siteRelativeFolder -NewFileName $FileName | Out-Null
    Write-Host "Uploaded '$FileName' to '$LibraryTitle' on $SiteUrl."
}
