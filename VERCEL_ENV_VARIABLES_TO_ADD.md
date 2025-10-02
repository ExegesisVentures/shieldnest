# 🔐 Environment Variables for Vercel Dashboard

Copy these to Vercel Dashboard → Settings → Environment Variables

**For each variable**: Select **Production**, **Preview**, AND **Development**

---

## 📋 COPY THESE EXACTLY

### Database & Supabase (CRITICAL!)

```
Variable: DATABASE_URL
Value: postgresql://postgres:8JRE5bwZHqz@H@Z@db.cucnmhpguyynfknmxrtt.supabase.co:5432/postgres?pgbouncer=true
```

```
Variable: DIRECT_URL
Value: postgresql://postgres:8JRE5bwZHqz@H@Z@db.cucnmhpguyynfknmxrtt.supabase.co:5432/postgres
```

```
Variable: SUPABASE_URL
Value: https://cucnmhpguyynfknmxrtt.supabase.co
```

```
Variable: SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1Y25taHBndXl5bmZrbm14cnR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2ODYwNzMsImV4cCI6MjA3NDI2MjA3M30.3Kmj29wW0HWBgX4x6X8niPOFuH45nkZFePBK3cC1C50
```

```
Variable: SUPABASE_SERVICE_ROLE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1Y25taHBndXl5bmZrbm14cnR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODY4NjA3MywiZXhwIjoyMDc0MjYyMDczfQ.1ER4CiTtuiMkbB00EYe_sDcUGkULnZCyNUOPQvhFITo
```

---

### Authentication Secrets (CRITICAL!)

```
Variable: JWT_SECRET
Value: mxIzxFYZkCOGVmBG7LzwPlYgKZfD5rXHZ6ueja47XoXPjA9u1HnUbPMCTgyVtO/xT50kLEXxZxvZHKLQUbs+9A==
```

```
Variable: MAGIC_LINK_SECRET
Value: 4g0QwUi72h2rOGGsbE5oXwKNM9pPtuYDGaC9La9fcEyuyNHxMeIOFBTmKylCCuTMO8AdOpuP6fZWCeN8U5nrOQ==
```

---

### Blockchain Configuration

```
Variable: CHAIN_ID
Value: coreum-mainnet-1
```

```
Variable: RPC_ENDPOINT
Value: https://full-node.mainnet-1.coreum.dev:26657
```

```
Variable: REST_ENDPOINT
Value: https://full-node.mainnet-1.coreum.dev:1317
```

---

### Frontend URLs (Update with your actual Vercel domain after first deploy)

```
Variable: FRONTEND_URL
Value: https://your-vercel-app.vercel.app
```

```
Variable: NEXT_PUBLIC_FRONTEND_URL
Value: https://your-vercel-app.vercel.app
```

---

### Node Environment

```
Variable: NODE_ENV
Value: production
```

---

## 📝 OPTIONAL (Can add later if needed)

### Contract Addresses (leave empty for now)
- `RISE_NFT_CW721_ADDRESS` (empty)
- `ROLL_NFT_CW721_ADDRESS` (empty)
- `BUYBACK_TREASURY_ADDRESS` (empty)
- `STAKING_ESCROW_ADDRESS` (empty)
- `LP_FEE_DISTRIBUTOR_ADDRESS` (empty)
- `ORACLE_VERIFIER_ADDRESS` (empty)
- `VALIDATOR_ADDRESS` (empty)

### Pricing & Config (uses defaults if not set)
- `NEW_ROLL_MINT_PRICE_USD=1000`
- `OG_MIN_LIST_PRICE_USD=5000`
- `BACKEND_BOOK_VALUE_USD=10000`
- `FLOOR_MODEL=bonding_curve`
- `FLOOR_INCREMENT_USD=50`
- `EPOCH_LENGTH_DAYS=7`
- `MAX_SUPPLY=100`
- `REQUIRE_TMA=true`

---

## ✅ CHECKLIST

**Required (13 variables):**
- [ ] DATABASE_URL (with ?pgbouncer=true)
- [ ] DIRECT_URL
- [ ] SUPABASE_URL
- [ ] SUPABASE_ANON_KEY
- [ ] SUPABASE_SERVICE_ROLE_KEY
- [ ] JWT_SECRET
- [ ] MAGIC_LINK_SECRET
- [ ] CHAIN_ID
- [ ] RPC_ENDPOINT
- [ ] REST_ENDPOINT
- [ ] FRONTEND_URL
- [ ] NEXT_PUBLIC_FRONTEND_URL
- [ ] NODE_ENV

**After adding each variable:**
- Select: ✅ Production
- Select: ✅ Preview
- Select: ✅ Development
- Click "Save"

---

## 🎯 WHERE TO ADD THESE

1. Go to: https://vercel.com/dashboard
2. Select your project
3. Click: **Settings** (top navigation)
4. Click: **Environment Variables** (left sidebar)
5. For each variable above:
   - Click "Add New"
   - Paste Name
   - Paste Value
   - Check all three: Production, Preview, Development
   - Click "Save"

---

**When you're done, come back and I'll push everything to deploy!** 🚀

