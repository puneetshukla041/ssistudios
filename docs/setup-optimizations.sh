#!/bin/bash

# SSI Studios - Performance Optimization Quick Fix Guide
# Run this script after pulling the optimized code

echo "🚀 SSI Studios - Optimization Setup Script"
echo "==========================================\n"

# Step 1: Environment Setup
echo "📋 Step 1: Setting up environment..."
if [ ! -f .env.local ]; then
  cp .env.local.example .env.local
  echo "✅ Created .env.local from template"
  echo "⚠️  IMPORTANT: Update .env.local with your actual credentials"
else
  echo "✅ .env.local already exists"
fi

# Step 2: Security Check
echo "\n🔐 Step 2: Security verification..."
if grep -q "zo6KoEIWALNm9d97" .env.local 2>/dev/null; then
  echo "❌ CRITICAL: Exposed credentials detected in .env.local"
  echo "   Running: git rm --cached .env.local"
  git rm --cached .env.local
  echo "✅ Cached version removed (if it was committed)"
elif grep -q "AIzaSyDZnxsHccYo724SZfKAIrYzniRiyp6izU4" .env.local 2>/dev/null; then
  echo "❌ CRITICAL: Exposed API key detected in .env.local"
  echo "   Running: git rm --cached .env.local"
  git rm --cached .env.local
  echo "✅ Cached version removed (if it was committed)"
else
  echo "✅ No exposed credentials found"
fi

# Step 3: Dependency Check
echo "\n📦 Step 3: Checking dependencies..."
npm install 2>/dev/null || yarn install 2>/dev/null || pnpm install 2>/dev/null

# Step 4: Build Verification
echo "\n🔨 Step 4: Building application..."
npm run build

if [ $? -eq 0 ]; then
  echo "✅ Build successful!"
else
  echo "❌ Build failed. Check errors above."
  exit 1
fi

echo "\n✨ Setup complete!"
echo "\nNext steps:"
echo "1. Review OPTIMIZATION_REPORT.md for detailed changes"
echo "2. Test the application: npm run dev"
echo "3. Run performance audit: npm run build && npm run start"
echo "4. Check bundle size changes"
echo "\n📚 Recommended readings:"
echo "- OPTIMIZATION_REPORT.md: Comprehensive optimization details"
echo "- .env.local.example: Environment configuration template"
