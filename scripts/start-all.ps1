<#
.SYNOPSIS
  Starts the local stack: GeoServer (8081), pmtiles serve (8082) and the website (3000).

.DESCRIPTION
  GeoServer and the tile server each open in their own window and are skipped if their
  port is already in use. The website runs in this window (dev server by default).

.PARAMETER Production
  Builds the site and runs the production server (`npm run build` + `npm start`).
#>
param([switch]$Production)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$tools = Join-Path $root 'tools'

# Installers update the machine/user PATH, but not that of already open shells
$env:Path = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' +
  [Environment]::GetEnvironmentVariable('Path', 'User')

function Test-Port([int]$port) {
  [bool](Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue)
}

# --- GeoServer ---------------------------------------------------------------
if (Test-Port 8081) {
  Write-Host 'GeoServer: port 8081 already in use, skipping.'
} else {
  $geoserver = Join-Path $tools 'geoserver'
  if (-not $env:JAVA_HOME) {
    $env:JAVA_HOME = Split-Path -Parent (Split-Path -Parent (Get-Command java).Source)
  }
  $env:GEOSERVER_HOME = $geoserver
  Write-Host "GeoServer: starting on http://localhost:8081/geoserver (data dir: $(
    if ($env:GEOSERVER_DATA_DIR) { $env:GEOSERVER_DATA_DIR } else { 'default' }))"
  # cmd does not pick up the working directory here, so pass the full path
  Start-Process -FilePath 'cmd.exe' -ArgumentList '/c', "`"$geoserver\bin\startup.bat`"" `
    -WindowStyle Minimized
}

# --- Vector basemap -----------------------------------------------------------
$basemapDir = Join-Path $root 'data\derived\basemap'
if (Test-Port 8082) {
  Write-Host 'Basemap: port 8082 already in use, skipping.'
} elseif (-not (Get-ChildItem $basemapDir -Filter *.pmtiles -ErrorAction SilentlyContinue)) {
  Write-Host "Basemap: no .pmtiles in $basemapDir yet (pipeline step 06-basemap), skipping."
} else {
  Write-Host 'Basemap: starting pmtiles serve on http://localhost:8082'
  Start-Process -FilePath (Join-Path $tools 'pmtiles\pmtiles.exe') `
    -ArgumentList 'serve', "`"$basemapDir`"", '--port=8082', '--interface=127.0.0.1',
      '--public-url=http://localhost:3000/basemap' `
    -WindowStyle Minimized
}

# --- Website -----------------------------------------------------------------
Set-Location $root
if (-not (Test-Path (Join-Path $root 'static\portal\ghana\index.html'))) {
  Write-Host 'Map portal: building static/portal (first run downloads Masterportal)'
  npm run portal
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}
if ($Production) {
  npm run build
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  Write-Host 'Website: http://localhost:3000'
  npm start
} else {
  npm run dev
}
