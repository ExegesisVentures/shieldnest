# 🚀 Vercel Environment Variables - Quick Reference

## For API Project: `shieldnest-api-4`

Copy these directly into Vercel Dashboard → shieldnest-api-4 → Settings → Environment Variables

```bash
# ==================== CRITICAL FOR CORS ====================
NODE_ENV=production
FRONTEND_URL=https://shieldnest-mvp-production-2yvnrfyjj-rizewithus-projects.vercel.app

# ==================== DATABASE ====================
DATABASE_URL=postgresql://postgres:8JRE5bwZHqz@H@Z@db.cucnmhpguyynfknmxrtt.supabase.co:5432/postgres
SUPABASE_URL=https://cucnmhpguyynfknmxrtt.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1Y25taHBndXl5bmZrbm14cnR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2ODYwNzMsImV4cCI6MjA3NDI2MjA3M30.3Kmj29wW0HWBgX4x6X8niPOFuH45nkZFePBK3cC1C50
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1Y25taHBndXl5bmZrbm14cnR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODY4NjA3MywiZXhwIjoyMDc0MjYyMDczfQ.1ER4CiTtuiMkbB00EYe_sDcUGkULnZCyNUOPQvhFITo

# ==================== AUTH ====================
JWT_SECRET=mxIzxFYZkCOGVmBG7LzwPlYgKZfD5rXHZ6ueja47XoXPjA9u1HnUbPMCTgyVtO/xT50kLEXxZxvZHKLQUbs+9A==
MAGIC_LINK_SECRET=4g0QwUi72h2rOGGsbE5oXwKNM9pPtuYDGaC9La9fcEyuyNHxMeIOFBTmKylCCuTMO8AdOpuP6fZWCeN8U5nrOQ==

# ==================== BLOCKCHAIN ====================
CHAIN_ID=coreum-mainnet-1
RPC_ENDPOINT=https://full-node.mainnet-1.coreum.dev:26657
REST_ENDPOINT=https://full-node.mainnet-1.coreum.dev:1317

# ==================== CONTRACTS (optional for MVP) ====================
RISE_NFT_CW721_ADDRESS=
ROLL_NFT_CW721_ADDRESS=
BUYBACK_TREASURY_ADDRESS=
STAKING_ESCROW_ADDRESS=
LP_FEE_DISTRIBUTOR_ADDRESS=
ORACLE_VERIFIER_ADDRESS=

# ==================== PRICING & CONFIG ====================
NEW_ROLL_MINT_PRICE_USD=1000
OG_MIN_LIST_PRICE_USD=5000
BACKEND_BOOK_VALUE_USD=10000
FLOOR_MODEL=bonding_curve
FLOOR_INCREMENT_USD=50
SELLBACK_PAYOUT_MODE=token_amount_locked_at_sale_price
STAKING_WAIT_DAYS=14
STAKE_MODE=native_delegation
VALIDATOR_ADDRESS=
PRICE_ORACLE=backend_signed_TWAP
EPOCH_LENGTH_DAYS=7
LP_FEE_POOL_SHARE_PER_NFT=0.005
PARTNER_AIRDROPS=enabled
MAX_SUPPLY=100
BURN_ON_BUYBACK=true
REQUIRE_TMA=true
TMA_SIGN_METHODS=["Coreum ADR-036 sign"]
ROLL_HOLDER_FEE_BPS=0
NON_HOLDER_FEE_BPS=250
```

---

## For Web Project: `shieldnest-mvp-production`

Copy these directly into Vercel Dashboard → shieldnest-mvp-production → Settings → Environment Variables

```bash
# ==================== CRITICAL FOR API CALLS ====================
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://shieldnest-api-4-git-mvp-production-rizewithus-projects.vercel.app

# ==================== SUPABASE ====================
NEXT_PUBLIC_SUPABASE_URL=https://cucnmhpguyynfknmxrtt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1Y25taHBndXl5bmZrbm14cnR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2ODYwNzMsImV4cCI6MjA3NDI2MjA3M30.3Kmj29wW0HWBgX4x6X8niPOFuH45nkZFePBK3cC1C50

# ==================== BLOCKCHAIN ====================
NEXT_PUBLIC_CHAIN_ID=coreum-mainnet-1
NEXT_PUBLIC_RPC_ENDPOINT=https://full-node.mainnet-1.coreum.dev:26657
NEXT_PUBLIC_REST_ENDPOINT=https://full-node.mainnet-1.coreum.dev:1317

# ==================== CONTRACTS (optional for MVP) ====================
NEXT_PUBLIC_RISE_NFT_CW721_ADDRESS=
NEXT_PUBLIC_ROLL_NFT_CW721_ADDRESS=
NEXT_PUBLIC_BUYBACK_TREASURY_ADDRESS=
NEXT_PUBLIC_STAKING_ESCROW_ADDRESS=

# ==================== FEATURE FLAGS ====================
NEXT_PUBLIC_MVP_MODE=true
NEXT_PUBLIC_ENABLE_STAKING=true
NEXT_PUBLIC_ENABLE_MARKETPLACE=true
NEXT_PUBLIC_ENABLE_REWARDS=true
NEXT_PUBLIC_ENABLE_ADMIN_PANEL=false
NEXT_PUBLIC_ENABLE_ADVANCED_FEATURES=false

# ==================== ANALYTICS (optional) ====================
NEXT_PUBLIC_SENTRY_DSN=
NEXT_PUBLIC_GA_TRACKING_ID=
```

---

## 🔑 Critical Variables for CORS to Work

### API Must Have:
1. ✅ `NODE_ENV=production`
2. ✅ `FRONTEND_URL=https://shieldnest-mvp-production-2yvnrfyjj-rizewithus-projects.vercel.app`

### Web Must Have:
1. ✅ `NEXT_PUBLIC_API_URL=https://shieldnest-api-4-git-mvp-production-rizewithus-projects.vercel.app`

---

## 📋 How to Apply These

### Option 1: Vercel Dashboard (Recommended)

1. Go to https://vercel.com/dashboard
2. Select your project (API or Web)
3. Go to Settings → Environment Variables
4. Click "Add New"
5. For each variable:
   - **Key:** Variable name (e.g., `NODE_ENV`)
   - **Value:** Variable value (e.g., `production`)
   - **Environment:** Select "Production", "Preview", and "Development" (all three)
6. Click "Save"
7. After adding all variables, go to Deployments → Latest → "..." → **Redeploy**

### Option 2: Vercel CLI

```bash
# For API
cd apps/api
vercel env add NODE_ENV production
vercel env add FRONTEND_URL production
# ... add rest of variables

# For Web
cd apps/web
vercel env add NEXT_PUBLIC_API_URL production
# ... add rest of variables

# Redeploy
vercel --prod
```

---

## 🆘 If Variables Are Already Set

1. Go to Settings → Environment Variables
2. Find the variable
3. Click "Edit"
4. Update the value
5. Click "Save"
6. **IMPORTANT:** Go to Deployments → Latest → "..." → **Redeploy**

Environment variable changes don't take effect until you redeploy!

---

## ✅ Verification

After setting variables and redeploying:

### Check API Variables:
```bash
curl https://shieldnest-api-4-git-mvp-production-rizewithus-projects.vercel.app/health
```

Look for:
```json
{
  "success": true,
  "environment": "production",
  "timestamp": "..."
}
```

### Check Web Variables:
1. Open browser console on https://shieldnest-mvp-production-2yvnrfyjj-rizewithus-projects.vercel.app
2. Type: `console.log(process.env.NEXT_PUBLIC_API_URL)`
3. Should output: `https://shieldnest-api-4-git-mvp-production-rizewithus-projects.vercel.app`

---

**Last Updated:** October 2, 2025

