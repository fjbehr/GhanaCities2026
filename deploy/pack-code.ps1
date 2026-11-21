# Ghana Cities: packs the code (everything git tracks plus new files that are not ignored)
# into deploy/out/ghana-cities-code.tar.gz, for servers that do not pull from GitHub.
#
#   powershell -ExecutionPolicy Bypass -File deploy\pack-code.ps1
#   scp deploy\out\ghana-cities-code.tar.gz root@203.0.113.10:/tmp/
#
# Secrets (.env), data, node_modules and build output are left out by .gitignore.
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root
New-Item -ItemType Directory -Force -Path 'deploy\out' | Out-Null
$list = Join-Path $env:TEMP 'ghana-cities-files.txt'
# Forward slashes and UTF-8 without BOM, so bsdtar reads the list on Windows
$files = git ls-files --cached --others --exclude-standard | Where-Object { Test-Path $_ -PathType Leaf }
[System.IO.File]::WriteAllLines($list, [string[]]$files, (New-Object System.Text.UTF8Encoding $false))
$out = 'deploy\out\ghana-cities-code.tar.gz'
& "$env:SystemRoot\System32\tar.exe" -czf $out -T $list
if ($LASTEXITCODE -ne 0) { throw 'tar failed' }
Remove-Item $list
$size = [math]::Round((Get-Item $out).Length / 1MB, 1)
Write-Host "Packed $($files.Count) files into $out ($size MB)"
