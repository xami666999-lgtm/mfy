# setup.ps1
# Installs everything needed to run a GC-level Rocket League bot (Nexto) via RLBot v5.
# Usage:  powershell -ExecutionPolicy Bypass -File setup.ps1

$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$BotsDir = Join-Path $ProjectRoot "bots"
$TempDir = Join-Path $env:TEMP "rlbot-setup"
$ServerDir = Join-Path $env:LOCALAPPDATA "RLBot5\bin"

Write-Host "== RLBot v5 setup for Nexto ==" -ForegroundColor Cyan

# --- 1. RLBotServer (the match server) ---
Write-Host "`n[1/4] Locating RLBotServer..." -ForegroundColor Cyan
$ServerExe = Join-Path $ServerDir "RLBotServer.exe"
if (Test-Path $ServerExe) {
    Write-Host "  RLBotServer already installed: $ServerExe"
} else {
    Write-Host "  Downloading RLBotServer to $ServerDir"
    New-Item -ItemType Directory -Force -Path $ServerDir | Out-Null
    $Release = Invoke-RestMethod -Uri "https://api.github.com/repos/RLBot/core/releases/latest" -Headers @{ "User-Agent" = "rlbot-setup" }
    $Asset = $Release.assets | Where-Object { $_.name -eq "RLBotServer.exe" } | Select-Object -First 1
    if (-not $Asset) { throw "Could not find RLBotServer.exe in release $($Release.tag_name)" }
    Invoke-WebRequest -Uri $Asset.browser_download_url -OutFile $ServerExe -UseBasicParsing
    Write-Host "  Installed RLBotServer $($Release.tag_name)"
}

# --- 2. Botpack (contains Nexto) ---
Write-Host "`n[2/4] Fetching botpack (Nexto)..." -ForegroundColor Cyan
$BotToml = Join-Path $BotsDir "Nexto\bot.toml"
if (Test-Path $BotToml) {
    Write-Host "  Nexto already present: $BotToml"
} else {
    Write-Host "  Downloading latest botpack from GitHub..."
    New-Item -ItemType Directory -Force -Path $TempDir | Out-Null
    $PackRelease = Invoke-RestMethod -Uri "https://api.github.com/repos/RLBot/botpack/releases/latest" -Headers @{ "User-Agent" = "rlbot-setup" }
    $Asset = $PackRelease.assets | Where-Object { $_.name -like "*x86_64-windows.tar.xz" } | Select-Object -First 1
    if (-not $Asset) { throw "Could not find windows botpack asset in $($PackRelease.tag_name)" }
    $Archive = Join-Path $TempDir "botpack.tar.xz"
    Write-Host "  Downloading $($Asset.name) ($([math]::Round($Asset.size/1MB)) MB)..."
    Invoke-WebRequest -Uri $Asset.browser_download_url -OutFile $Archive -UseBasicParsing

    $ExtractRoot = Join-Path $TempDir "botpack"
    if (Test-Path $ExtractRoot) { Remove-Item $ExtractRoot -Recurse -Force }
    New-Item -ItemType Directory -Force -Path $ExtractRoot | Out-Null
    tar -xf $Archive -C $ExtractRoot
    $NextoSrc = Get-ChildItem $ExtractRoot -Recurse -Directory -Filter "Nexto" | Select-Object -First 1
    if (-not $NextoSrc) { throw "Nexto not found in botpack" }
    New-Item -ItemType Directory -Force -Path $BotsDir | Out-Null
    Copy-Item $NextoSrc.FullName -Destination $BotsDir -Recurse
    Remove-Item $ExtractRoot -Recurse -Force
    Write-Host "  Nexto installed to $BotsDir\Nexto"
}

# --- 3. Python venv + dependencies ---
Write-Host "`n[3/4] Setting up Python environment..." -ForegroundColor Cyan
$VenvDir = Join-Path $ProjectRoot ".venv"
$Python = Join-Path $VenvDir "Scripts\python.exe"
if (-not (Test-Path $Python)) {
    Write-Host "  Creating virtualenv..."
    python -m venv $VenvDir
}
Write-Host "  Installing rlbot + psutil..."
& $Python -m pip install --upgrade pip --quiet
& $Python -m pip install -r (Join-Path $ProjectRoot "requirements.txt")

# --- 4. Sanity check ---
Write-Host "`n[4/4] Verifying installation..." -ForegroundColor Cyan
$ok = $true
if (-not (Test-Path $ServerExe))  { Write-Host "  FAIL: RLBotServer missing" -ForegroundColor Red; $ok = $false }
if (-not (Test-Path $BotToml))    { Write-Host "  FAIL: Nexto missing" -ForegroundColor Red; $ok = $false }
if (-not (Test-Path $Python))     { Write-Host "  FAIL: Python venv missing" -ForegroundColor Red; $ok = $false }
& $Python -c "import rlbot; print('  rlbot', rlbot.__version__)" 2>$null

if ($ok) {
    Write-Host "`nDone! Next step:" -ForegroundColor Green
    Write-Host "  1. Close Rocket League if it's running." -ForegroundColor White
    Write-Host "  2. Run:  .\.venv\Scripts\python.exe run.py 2v2" -ForegroundColor White
    Write-Host "     (or 1v1 / 3v3 / rumble / heatseeker / 3v3_vs_nexto)" -ForegroundColor White
} else {
    Write-Host "`nSetup did not complete cleanly." -ForegroundColor Yellow
}