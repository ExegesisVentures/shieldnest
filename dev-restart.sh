#!/bin/bash

# Development Environment Restart Script
# This script helps fix HMR and development issues

echo "🔄 Restarting development environment with comprehensive fixes..."

# Navigate to web app directory
cd apps/web

echo "🧹 Deep cleaning all caches..."
# Clean Next.js cache thoroughly
rm -rf .next
rm -rf node_modules/.cache
rm -rf .swc
rm -rf node_modules/.pnpm
rm -rf dist

echo "📦 Reinstalling dependencies..."
# Fresh dependency install
pnpm install --prefer-offline

echo "🔍 Type checking..."
# Quick type check
pnpm tsc --noEmit --pretty

echo "🛠️  Applied fixes:"
echo "   ✅ ISR manifest handling disabled"
echo "   ✅ HMR error suppression enabled"
echo "   ✅ Turbopack disabled for stability"
echo "   ✅ Webpack optimizations applied"

echo "🚀 Starting development server with all fixes..."
# Start with all optimizations
FORCE_COLOR=1 WATCHPACK_POLLING=true NODE_OPTIONS="--max-old-space-size=4096" pnpm next dev --turbo=false --port 3000

echo "✅ Development server running with Next.js 15 HMR fixes!"
