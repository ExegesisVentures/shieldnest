#!/bin/bash

# Serverless Migration Setup Script
# Run this script to set up the serverless infrastructure

set -e

echo "🚀 Setting up Vercel Serverless Infrastructure..."
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Run this script from the project root directory"
    exit 1
fi

echo "📦 Installing dependencies for web app..."
cd apps/web
pnpm install

echo ""
echo "🔨 Generating Prisma Client..."
npx prisma generate

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Copy your .env file to apps/web/.env"
echo "2. Make sure you have both DATABASE_URL (pooled) and DIRECT_URL (direct)"
echo "3. Run 'pnpm dev' from apps/web to test locally"
echo "4. Deploy to Vercel with 'vercel --prod' or push to main branch"
echo ""
echo "📖 See VERCEL_SERVERLESS_MIGRATION_GUIDE.md for detailed instructions"

