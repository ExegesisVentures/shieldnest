# 🔧 Vercel Environment Variables - Final Fix

## Issue
Wallet authentication was failing with 500 error because JWT_SECRET and MAGIC_LINK_SECRET were missing.

---

## ✅ **Required Environment Variables for Vercel**

### **Authentication & Security**

```bash
# JWT Secret (for authentication tokens)
JWT_SECRET=a61b9ba51fc2435502f9b4d49d7a6dca99659d96cf9220db8b6e46a42f035962af339cabbe300d931663985a352dfb6479c935be753d320d377202845a02c1df

# Magic Link Secret (for email verification)
MAGIC_LINK_SECRET=b21c45994ebb84aa3c08f11fa300da9a7171ace65cf08f15680022117dfbbeeb7a53f017d477db58c7eab0fcd8038546aa3458e08c89cbc8dd226c18c9b1d149
```

### **Database (Already Added)**

```bash
# Session Pooler for Serverless
DATABASE_URL=postgresql://postgres.cucnmhpguyynfknmxrtt:8JRE5bwZHqz%40H%40Z@aws-1-us-east-2.pooler.supabase.com:5432/postgres?pgbouncer=true

# Direct connection for migrations
DIRECT_URL=postgresql://postgres:8JRE5bwZHqz%40H%40Z@db.cucnmhpguyynfknmxrtt.supabase.co:5432/postgres
```

### **Supabase**

```bash
# Get these from Supabase Dashboard → Settings → API
SUPABASE_URL=https://cucnmhpguyynfknmxrtt.supabase.co
SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

### **Frontend URLs**

```bash
FRONTEND_URL=https://shieldnest-mvp-production.vercel.app
NEXT_PUBLIC_FRONTEND_URL=https://shieldnest-mvp-production.vercel.app
```

### **Blockchain (Public - Already Set)**

```bash
NEXT_PUBLIC_CHAIN_ID=coreum-mainnet-1
NEXT_PUBLIC_RPC_ENDPOINT=https://full-node.mainnet-1.coreum.dev:26657
NEXT_PUBLIC_REST_ENDPOINT=https://full-node.mainnet-1.coreum.dev:1317
```

### **Optional (for advanced features)**

```bash
# Contract Addresses (if you have them)
RISE_NFT_CW721_ADDRESS=core1...
ROLL_NFT_CW721_ADDRESS=core1...

# Email (for magic links - optional)
EMAIL_PROVIDER=postmark
POSTMARK_API_TOKEN=<your-token>
FROM_EMAIL=noreply@rollnft.com

# Pricing
NEW_ROLL_MINT_PRICE_USD=1000
OG_MIN_LIST_PRICE_USD=5000

# Rewards
EPOCH_LENGTH_DAYS=7

# Access Control
REQUIRE_TMA=false
```

---

## 🚀 **Quick Setup Instructions**

### **Step 1: Add JWT Secrets**
1. Go to: **https://vercel.com/dashboard**
2. Click: **shieldnest-mvp-production**
3. Click: **Settings** → **Environment Variables**
4. Add:
   - `JWT_SECRET` (copy from above)
   - `MAGIC_LINK_SECRET` (copy from above)
5. For each, check all environments (Production, Preview, Development)

### **Step 2: Verify Supabase Keys**
Check if you have `SUPABASE_SERVICE_ROLE_KEY`:
- If missing, get it from **Supabase Dashboard → Settings → API** (service_role secret)

### **Step 3: Redeploy**
1. Go to: **Deployments** tab
2. Click: **...** → **Redeploy** on latest deployment
3. **UNCHECK** "Use existing Build Cache"
4. Wait for deployment to complete

### **Step 4: Test**
Go to: `https://shieldnest-mvp-production.vercel.app`
- Try connecting your wallet
- Should work now! ✅

---

## 🔍 **How to Verify**

After redeployment, check the endpoint:
```bash
curl https://shieldnest-mvp-production.vercel.app/api/test-db-connection
```

Should return:
```json
{"success":true,"message":"Database connection successful!"}
```

---

## ✅ **Complete Checklist**

- [x] Database connection fixed (Session Pooler)
- [ ] JWT_SECRET added to Vercel
- [ ] MAGIC_LINK_SECRET added to Vercel
- [ ] SUPABASE_SERVICE_ROLE_KEY verified
- [ ] Redeployed without cache
- [ ] Wallet authentication works

---

## 🎯 **What Was Wrong**

1. **Before:** Missing `JWT_SECRET` → wallet auth crashed when trying to generate JWT
2. **After:** JWT secrets added → wallet auth can generate tokens successfully

The logs showed "Returning user reconnected" but then 500 error because `jwt.sign()` failed without the secret key.

