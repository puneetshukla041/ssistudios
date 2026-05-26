# SSI Studios - Performance Optimization Quick Fix Guide (Windows)
# Run this script after pulling the optimized code

Write-Host "🚀 SSI Studios - Optimization Setup Script" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""

# Step 1: Environment Setup
Write-Host "📋 Step 1: Setting up environment..." -ForegroundColor Cyan
if (-not (Test-Path ".env.local")) {
  Copy-Item ".env.local.example" ".env.local"
  Write-Host "✅ Created .env.local from template" -ForegroundColor Green
  Write-Host "⚠️  IMPORTANT: Update .env.local with your actual credentials" -ForegroundColor Yellow
} else {
  Write-Host "✅ .env.local already exists" -ForegroundColor Green
}

# Step 2: Security Check
Write-Host ""
Write-Host "🔐 Step 2: Security verification..." -ForegroundColor Cyan
$envContent = Get-Content ".env.local" -ErrorAction SilentlyContinue

if ($envContent -match "zo6KoEIWALNm9d97" -or $envContent -match "AIzaSyDZnxsHccYo724SZfKAIrYzniRiyp6izU4") {
  Write-Host "❌ CRITICAL: Exposed credentials detected in .env.local" -ForegroundColor Red
  Write-Host "   Please regenerate your credentials immediately!" -ForegroundColor Red
  Write-Host "   MongoDB: Reset password in Atlas" -ForegroundColor Yellow
  Write-Host "   Gemini: Regenerate API key in Google Cloud Console" -ForegroundColor Yellow
} else {
  Write-Host "✅ No exposed credentials found in current config" -ForegroundColor Green
}

# Step 3: Dependency Check
Write-Host ""
Write-Host "📦 Step 3: Checking dependencies..." -ForegroundColor Cyan

$npmExists = $null -ne (Get-Command npm -ErrorAction SilentlyContinue)
$yarnExists = $null -ne (Get-Command yarn -ErrorAction SilentlyContinue)
$pnpmExists = $null -ne (Get-Command pnpm -ErrorAction SilentlyContinue)

if ($npmExists) {
  Write-Host "Installing dependencies with npm..." -ForegroundColor Gray
  npm install
} elseif ($yarnExists) {
  Write-Host "Installing dependencies with yarn..." -ForegroundColor Gray
  yarn install
} elseif ($pnpmExists) {
  Write-Host "Installing dependencies with pnpm..." -ForegroundColor Gray
  pnpm install
} else {
  Write-Host "❌ No package manager found. Please install npm, yarn, or pnpm" -ForegroundColor Red
  exit 1
}

# Step 4: Build Verification
Write-Host ""
Write-Host "🔨 Step 4: Building application..." -ForegroundColor Cyan

if ($npmExists) {
  npm run build
  $buildSuccess = $LASTEXITCODE -eq 0
} else {
  yarn build
  $buildSuccess = $LASTEXITCODE -eq 0
}

if ($buildSuccess) {
  Write-Host "✅ Build successful!" -ForegroundColor Green
} else {
  Write-Host "❌ Build failed. Check errors above." -ForegroundColor Red
  exit 1
}

Write-Host ""
Write-Host "✨ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Review OPTIMIZATION_REPORT.md for detailed changes"
Write-Host "2. Test the application: npm run dev"
Write-Host "3. Run performance audit: npm run build && npm run start"
Write-Host "4. Check bundle size changes"
Write-Host ""
Write-Host "📚 Recommended readings:" -ForegroundColor Yellow
Write-Host "- OPTIMIZATION_REPORT.md: Comprehensive optimization details"
Write-Host "- .env.local.example: Environment configuration template"
