# Deploy the backend to Cloudflare Workers (`trading-backend`).
#
#   cd backend
#   npx wrangler login      # one time only
#   .\deploy-worker.ps1
#
# Pushes the secrets your Worker needs (read from .env), deploys, then
# smoke-tests health + CORS. Nothing secret is printed.

$ErrorActionPreference = 'Stop'
Set-Location -Path $PSScriptRoot

Write-Host ''
Write-Host '== 1/4  Checking Cloudflare auth ==' -ForegroundColor Cyan
npx wrangler whoami
if ($LASTEXITCODE -ne 0) {
  Write-Host ''
  Write-Host 'Not authenticated. Run this first:' -ForegroundColor Red
  Write-Host '    npx wrangler login' -ForegroundColor Yellow
  exit 1
}

Write-Host ''
Write-Host '== 2/4  Pushing secrets from .env ==' -ForegroundColor Cyan
$keys = @('DATABASE_URL','DIRECT_URL','JWT_SECRET','JWT_REFRESH_SECRET','RESEND_API_KEY','STRIPE_SECRET_KEY','STRIPE_WEBHOOK_SECRET')
if (-not (Test-Path '.env')) {
  Write-Host '  no .env found - skipping (set secrets with `npx wrangler secret put NAME`)' -ForegroundColor Yellow
} else {
  $envLines = Get-Content '.env'
  foreach ($k in $keys) {
    $line = $envLines | Where-Object { $_ -match "^\s*$k\s*=" } | Select-Object -First 1
    if (-not $line) { Write-Host "  $k : not in .env, SKIPPED" -ForegroundColor Yellow; continue }
    $v = ($line -replace "^\s*$k\s*=", '').Trim().Trim('"').Trim("'")
    if (-not $v) { Write-Host "  $k : EMPTY in .env, skipped" -ForegroundColor Yellow; continue }
    $v | npx wrangler secret put $k | Out-Null
    Write-Host "  $k : set" -ForegroundColor Green
  }
}

Write-Host ''
Write-Host '== 3/4  Deploying the Worker ==' -ForegroundColor Cyan
$deployOut = npx wrangler deploy 2>&1
$deployOut | ForEach-Object { Write-Host $_ }
$url = ([regex]::Match(($deployOut -join ' '), 'https://[A-Za-z0-9\-\.]+\.workers\.dev')).Value
if (-not $url) { Write-Host 'Could not detect the Worker URL from the deploy output.' -ForegroundColor Yellow; exit 1 }
Write-Host ''
Write-Host "Worker URL: $url" -ForegroundColor Green

Write-Host ''
Write-Host '== 4/4  Smoke tests ==' -ForegroundColor Cyan
Write-Host '-- GET /api/health'
curl.exe -s -w "`nstatus=%{http_code}`n" --max-time 30 "$url/api/health"
Write-Host '-- OPTIONS /api/auth/login (CORS preflight)'
curl.exe -s -o NUL -w "status=%{http_code}`n" --max-time 30 -X OPTIONS "$url/api/auth/login" `
  -H 'Origin: https://trading-journal-dlb.pages.dev' `
  -H 'Access-Control-Request-Method: POST' `
  -H 'Access-Control-Request-Headers: content-type'

Write-Host ''
Write-Host 'Next: set Cloudflare Pages -> Settings -> Environment variables -> Production' -ForegroundColor Cyan
Write-Host "      VITE_API_URL = $url   (origin only, no /api)" -ForegroundColor Yellow
Write-Host '      then redeploy the Pages project.'
