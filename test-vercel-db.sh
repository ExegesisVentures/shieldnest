#!/bin/bash

echo "🧪 Testing Vercel Serverless API Endpoints..."
echo ""

# Test /api/config (no DB required)
echo "1️⃣ Testing /api/config (no DB)..."
curl -s https://shieldnest-mvp-production.vercel.app/api/config | jq -r '.status // "ERROR"'
echo ""

# Test /api/health (requires DB connection)
echo "2️⃣ Testing /api/health (requires DB)..."
curl -s https://shieldnest-mvp-production.vercel.app/api/health | jq -r '.database // "ERROR"'
echo ""

echo "✅ If both show 'OK', your database is connected!"
echo "❌ If /api/health shows 'ERROR', check DATABASE_URL in Vercel"

