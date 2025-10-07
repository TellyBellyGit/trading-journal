# Railway Deployment Script for Trading Journal
# Run this script in PowerShell to deploy to Railway

Write-Host "🚀 Trading Journal - Railway Deployment Script" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green

# Check if Railway CLI is installed
Write-Host "📋 Checking Railway CLI installation..." -ForegroundColor Yellow
try {
    $railwayVersion = railway --version
    Write-Host "✅ Railway CLI found: $railwayVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Railway CLI not found. Installing..." -ForegroundColor Red
    Write-Host "Please install Railway CLI first:" -ForegroundColor Yellow
    Write-Host "npm install -g @railway/cli" -ForegroundColor Cyan
    Write-Host "Or visit: https://docs.railway.app/develop/cli#install" -ForegroundColor Cyan
    exit 1
}

# Check if user is logged in
Write-Host "🔐 Checking Railway authentication..." -ForegroundColor Yellow
try {
    railway whoami
    Write-Host "✅ Already logged in to Railway" -ForegroundColor Green
} catch {
    Write-Host "🔑 Please log in to Railway:" -ForegroundColor Yellow
    railway login
}

# Check if project exists
Write-Host "📁 Checking Railway project..." -ForegroundColor Yellow
try {
    railway status
    Write-Host "✅ Railway project found" -ForegroundColor Green
} catch {
    Write-Host "🆕 No Railway project found. Creating new project..." -ForegroundColor Yellow
    railway init
}

# Deploy to Railway
Write-Host "🚀 Deploying to Railway..." -ForegroundColor Yellow
railway up

Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host "📊 Check your deployment status:" -ForegroundColor Cyan
Write-Host "railway status" -ForegroundColor White
Write-Host "🌐 Open your app:" -ForegroundColor Cyan
Write-Host "railway open" -ForegroundColor White