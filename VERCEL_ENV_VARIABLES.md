# 🚀 Vercel Environment Variables - Copy & Paste Ready

**DO NOT COMMIT THIS FILE TO GIT**

---

## 📋 API Project Environment Variables

### Location
Vercel Dashboard → shieldnest-api → Settings → Environment Variables

### Copy All Below (Select All, Copy, Paste)

```
NODE_ENV=production
PORT=3002
DATABASE_URL=postgresql://postgres:8JRE5bwZHqz@H@Z@db.cucnmhpguyynfknmxrtt.supabase.co:5432/postgres
SUPABASE_URL=https://cucnmhpguyynfknmxrtt.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1Y25taHBndXl5bmZrbm14cnR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2ODYwNzMsImV4cCI6MjA3NDI2MjA3M30.3Kmj29wW0HWBgX4x6X8niPOFuH45nkZFePBK3cC1C50
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1Y25taHBndXl5bmZrbm14cnR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODY4NjA3MywiZXhwIjoyMDc0MjYyMDczfQ.1ER4CiTtuiMkbB00EYe_sDcUGkULnZCyNUOPQvhFITo
JWT_SECRET=mxIzxFYZkCOGVmBG7LzwPlYgKZfD5rXHZ6ueja47XoXPjA9u1HnUbPMCTgyVtO/xT50kLEXxZxvZHKLQUbs+9A==
MAGIC_LINK_SECRET=4g0QwUi72h2rOGGsbE5oXwKNM9pPtuYDGaC9La9fcEyuyNHxMeIOFBTmKylCCuTMO8AdOpuP6fZWCeN8U5nrOQ==
CHAIN_ID=coreum-mainnet-1
RPC_ENDPOINT=https://full-node.mainnet-1.coreum.dev:26657
REST_ENDPOINT=https://full-node.mainnet-1.coreum.dev:1317
RISE_NFT_CW721_ADDRESS=
ROLL_NFT_CW721_ADDRESS=
BUYBACK_TREASURY_ADDRESS=
STAKING_ESCROW_ADDRESS=
LP_FEE_DISTRIBUTOR_ADDRESS=
ORACLE_VERIFIER_ADDRESS=
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
FRONTEND_URL=UPDATE_AFTER_WEB_DEPLOYMENT
```

### ⚠️ IMPORTANT: Update After Web Deployment
After deploying the Web project, come back and update:
- `FRONTEND_URL` = Your web deployment URL (e.g., `https://shieldnest-web.vercel.app`)

---

## 🌐 Web Project Environment Variables

### Location
Vercel Dashboard → shieldnest-web → Settings → Environment Variables

### Copy All Below (Select All, Copy, Paste)

```
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
NEXT_PUBLIC_APP_ENV=mvp
NEXT_PUBLIC_DATABASE_SCHEMA=mvp_production
NEXT_PUBLIC_API_URL=UPDATE_AFTER_API_DEPLOYMENT
NEXT_PUBLIC_SUPABASE_URL=https://cucnmhpguyynfknmxrtt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1Y25taHBndXl5bmZrbm14cnR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2ODYwNzMsImV4cCI6MjA3NDI2MjA3M30.3Kmj29wW0HWBgX4x6X8niPOFuH45nkZFePBK3cC1C50
NEXT_PUBLIC_CHAIN_ID=coreum-mainnet-1
NEXT_PUBLIC_RPC_ENDPOINT=https://full-node.mainnet-1.coreum.dev:26657
NEXT_PUBLIC_REST_ENDPOINT=https://full-node.mainnet-1.coreum.dev:1317
NEXT_PUBLIC_RISE_NFT_CW721_ADDRESS=
NEXT_PUBLIC_ROLL_NFT_CW721_ADDRESS=
NEXT_PUBLIC_BUYBACK_TREASURY_ADDRESS=
NEXT_PUBLIC_STAKING_ESCROW_ADDRESS=
NEXT_PUBLIC_MVP_MODE=true
NEXT_PUBLIC_ENABLE_ADMIN_PANEL=false
NEXT_PUBLIC_ENABLE_STAKING=true
NEXT_PUBLIC_ENABLE_MARKETPLACE=true
NEXT_PUBLIC_ENABLE_REWARDS=true
NEXT_PUBLIC_ENABLE_ADVANCED_FEATURES=false
```

### ⚠️ IMPORTANT: Update After API Deployment
After deploying the API project, come back and update:
- `NEXT_PUBLIC_API_URL` = Your API deployment URL (e.g., `https://shieldnest-api.vercel.app`)

---

## 🔄 Deployment Order

### Step 1: Deploy API First
1. Go to Vercel → Import from GitHub
2. Select: `apps/api` directory
3. Add all API environment variables above
4. **Temporarily set**: `FRONTEND_URL=https://localhost:3000`
5. Deploy
6. **Copy the API URL** (e.g., `https://shieldnest-api.vercel.app`)

### Step 2: Deploy Web
1. Go to Vercel → Import from GitHub  
2. Select: `apps/web` directory
3. Add all Web environment variables above
4. **Update**: `NEXT_PUBLIC_API_URL` with your API URL from Step 1
5. Deploy
6. **Copy the Web URL** (e.g., `https://shieldnest-web.vercel.app`)

### Step 3: Update API CORS
1. Go back to API project in Vercel
2. Update environment variable:
   - `FRONTEND_URL` = Your Web URL from Step 2
3. Redeploy API (Deployments → Click "..." → Redeploy)

---

## ✅ Verification Commands

### After API Deployment
```bash
curl https://your-api-url.vercel.app/health
```
Expected: `{"status":"healthy",...}`

### After Web Deployment
Visit: `https://your-web-url.vercel.app`
Expected: Landing page loads

---

## 🔐 Environment Variables Summary

### API Variables
- **Required for MVP**: 10 essential variables
- **Total Available**: 33 variables (includes pricing, rewards, marketplace config)
- **Missing Values**: Leave contract addresses empty for now

### Web Variables  
- **Required for MVP**: 7 essential variables
- **Total Available**: 18 variables (includes feature flags)
- **MVP Mode**: Enabled for simplified deployment

---

## 📝 Variable Explanations

### Essential (Must Have)
- `DATABASE_URL` - PostgreSQL connection string
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Public key (browser-safe)
- `SUPABASE_SERVICE_ROLE_KEY` - Backend only (API only!)
- `JWT_SECRET` - Authentication token signing
- `MAGIC_LINK_SECRET` - Magic link authentication
- `CHAIN_ID` - Blockchain network identifier
- `RPC_ENDPOINT` - Blockchain RPC endpoint
- `REST_ENDPOINT` - Blockchain REST API

### Configuration (Business Logic)
- `NEW_ROLL_MINT_PRICE_USD` - NFT mint price
- `MAX_SUPPLY` - Maximum NFT supply
- `STAKING_WAIT_DAYS` - Staking lock period
- `ROLL_HOLDER_FEE_BPS` - Marketplace fee for holders
- `NON_HOLDER_FEE_BPS` - Marketplace fee for non-holders

### Feature Flags (Control Features)
- `NEXT_PUBLIC_MVP_MODE` - Enable MVP simplified mode
- `NEXT_PUBLIC_ENABLE_STAKING` - Show staking interface
- `NEXT_PUBLIC_ENABLE_MARKETPLACE` - Show marketplace
- `NEXT_PUBLIC_ENABLE_REWARDS` - Show rewards tracking

### Optional (Can Add Later)
- Contract addresses - After smart contract deployment
- Validator address - If using specific validator
- Email config - If sending emails
- Oracle keys - If using price oracle
- Analytics - If tracking users

---

## 🚨 Security Reminders

### ⚠️ NEVER expose in browser/frontend:
- ❌ `SUPABASE_SERVICE_ROLE_KEY`
- ❌ `JWT_SECRET`
- ❌ `MAGIC_LINK_SECRET`
- ❌ `DATABASE_URL`

### ✅ Safe for browser (NEXT_PUBLIC_*):
- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ✅ `NEXT_PUBLIC_API_URL`
- ✅ All other `NEXT_PUBLIC_*` variables

---

## 🎯 Quick Checklist

### Before Deploying
- [x] Generated JWT_SECRET
- [x] Generated MAGIC_LINK_SECRET
- [x] Have Supabase credentials
- [x] Have database password
- [ ] Ready to deploy

### During Deployment
- [ ] Deploy API with temp FRONTEND_URL
- [ ] Copy API URL
- [ ] Deploy Web with API URL
- [ ] Copy Web URL
- [ ] Update API FRONTEND_URL
- [ ] Redeploy API

### After Deployment
- [ ] Test API health endpoint
- [ ] Test Web loads
- [ ] Test wallet connection
- [ ] Test authentication
- [ ] Monitor error logs

---

**Generated**: October 2, 2025  
**Status**: Ready for Vercel Deployment  
**⚠️ DO NOT COMMIT THIS FILE TO GIT**

