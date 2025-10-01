#!/bin/bash

# Clean Development Server Restart Script
# This script restarts the development server with a clean slate to apply HMR fixes

echo "🧹 Cleaning development environment..."

# Stop any running dev servers
echo "🛑 Stopping any running dev servers..."
pkill -f "next dev" 2>/dev/null || echo "No running Next.js dev servers found"

# Clean Next.js cache and build artifacts
echo "🗑️  Cleaning Next.js cache..."
cd /Users/mj/Downloads/roll2.0/apps/web
rm -rf .next
rm -rf node_modules/.cache
rm -rf tsconfig.tsbuildinfo

echo "🔄 Restarting development server with clean state..."

# Start the dev server with proper environment variables
echo "🚀 Starting clean development server..."
FORCE_COLOR=1 WATCHPACK_POLLING=true npm run dev

echo "✅ Development server restarted successfully!"
echo "The HMR fixes should now be active and reduce console errors."
