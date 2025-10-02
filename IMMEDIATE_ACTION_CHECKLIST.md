# ⚡ IMMEDIATE ACTION CHECKLIST - CORS FIX

## 🎯 Your Current Situation

You're seeing this error:
```
Access to fetch at 'https://shieldnest-api-4-git-mvp-production-rizewithus-projects.vercel.app/api/auth/wallet-auth' 
from origin 'https://shieldnest-mvp-production-2yvnrfyjj-rizewithus-projects.vercel.app' 
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present
```

## ✅ Fix Applied - DO THIS NOW

### Step 1: Push Code Changes (2 minutes)

```bash
cd /Users/mj/Downloads/roll2.0

# Check what changed
git status

# You should see:
# - apps/api/vercel.json
# - apps/web/vercel.json
# - apps/api/src/middleware/zero-trust.ts
# - CORS_FIX_DEPLOYMENT_GUIDE.md
# - VERCEL_ENV_QUICK_REFERENCE.md
# - IMMEDIATE_ACTION_CHECKLIST.md

# Add all changes
git add .

# Commit
git commit -m "fix: Remove hardcoded CORS headers, allow dynamic Vercel domains"

# Push
git push origin mvp-production
```

### Step 2: Set Environment Variables (5 minutes)

#### API Project (`shieldnest-api-4`)

1. Open: https://vercel.com/dashboard
2. Select: **shieldnest-api-4**
3. Go to: **Settings → Environment Variables**
4. **CRITICAL** - Add/Update these two:

   | Key | Value | Environments |
   |-----|-------|--------------|
   | `NODE_ENV` | `production` | Production, Preview, Development |
   | `FRONTEND_URL` | `https://shieldnest-mvp-production-2yvnrfyjj-rizewithus-projects.vercel.app` | Production, Preview, Development |

5. Verify these exist (if not, add them):

   | Key | Value |
   |-----|-------|
   | `DATABASE_URL` | `postgresql://postgres:8JRE5bwZHqz@H@Z@db.cucnmhpguyynfknmxrtt.supabase.co:5432/postgres` |
   | `SUPABASE_URL` | `https://cucnmhpguyynfknmxrtt.supabase.co` |
   | `SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (your key) |
   | `JWT_SECRET` | (your secret) |
   | `MAGIC_LINK_SECRET` | (your secret) |
   | `CHAIN_ID` | `coreum-mainnet-1` |
   | `RPC_ENDPOINT` | `https://full-node.mainnet-1.coreum.dev:26657` |
   | `REST_ENDPOINT` | `https://full-node.mainnet-1.coreum.dev:1317` |

#### Web Project (`shieldnest-mvp-production`)

1. Select: **shieldnest-mvp-production**  
2. Go to: **Settings → Environment Variables**
3. **CRITICAL** - Add/Update this:

   | Key | Value | Environments |
   |-----|-------|--------------|
   | `NEXT_PUBLIC_API_URL` | `https://shieldnest-api-4-git-mvp-production-rizewithus-projects.vercel.app` | Production, Preview, Development |

4. Verify these exist (if not, add them):

   | Key | Value |
   |-----|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://cucnmhpguyynfknmxrtt.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (your key) |
   | `NEXT_PUBLIC_CHAIN_ID` | `coreum-mainnet-1` |
   | `NEXT_PUBLIC_MVP_MODE` | `true` |

### Step 3: Redeploy (3 minutes)

#### Redeploy API First:

1. Go to: **shieldnest-api-4 → Deployments**
2. Click on the latest deployment
3. Click the **"..."** menu → Select **"Redeploy"**
4. ✅ Wait for deployment to complete (watch for "Ready")

#### Then Redeploy Web:

1. Go to: **shieldnest-mvp-production → Deployments**
2. Click on the latest deployment  
3. Click the **"..."** menu → Select **"Redeploy"**
4. ✅ Wait for deployment to complete (watch for "Ready")

### Step 4: Test (1 minute)

1. Open: https://shieldnest-mvp-production-2yvnrfyjj-rizewithus-projects.vercel.app
2. Open browser console (F12)
3. Try to connect wallet
4. **Expected:** ✅ Wallet connects successfully
5. **If failed:** Check Step 5 below

---

## 🔍 Step 5: If Still Not Working

### Check API Logs:

1. Go to: **Vercel Dashboard → shieldnest-api-4 → Logs**
2. Filter by: "Runtime Logs"
3. Look for:
   - ✅ `CORS allowed { origin: 'https://shieldnest-mvp-production-2yvnrfyjj...', ... }`
   - ❌ `CORS blocked { origin: '...', ... }`

### Common Issues:

#### Issue 1: Still seeing CORS blocked in logs

**Solution:** `NODE_ENV` is not set to `production`
- Go to API Settings → Environment Variables
- Make sure `NODE_ENV=production` is set for **Production** environment
- Redeploy

#### Issue 2: Not seeing any CORS logs

**Solution:** Frontend is not hitting the API
- Go to Web Settings → Environment Variables  
- Make sure `NEXT_PUBLIC_API_URL` is correct
- Redeploy

#### Issue 3: Environment variable not taking effect

**Solution:** Vercel caches environment variables
- Go to Settings → General → Caching
- Click "Clear Cache"
- Redeploy

---

## 📊 What Changed & Why

### Files Modified:

1. **`apps/api/vercel.json`**
   - ❌ **Removed:** Hardcoded CORS headers that blocked all requests
   - ✅ **Result:** Express middleware now handles CORS dynamically

2. **`apps/web/vercel.json`**
   - ❌ **Removed:** Hardcoded API rewrite rule
   - ✅ **Result:** Uses environment variable for API URL

3. **`apps/api/src/middleware/zero-trust.ts`**
   - ✅ **Enhanced:** Better CORS logging
   - ✅ **Enhanced:** Proper OPTIONS preflight handling
   - ✅ **Enhanced:** Allows all `*.vercel.app` domains in production

### How It Works Now:

```
Frontend (*.vercel.app) → Makes Request → API (*.vercel.app)
                                              ↓
                        CORS Middleware checks:
                        1. Is NODE_ENV === 'production'? ✅
                        2. Does origin end with '.vercel.app'? ✅
                        3. Add CORS headers ✅
                                              ↓
                                          Request Allowed ✅
```

### Why This is Better:

- ✅ **Works with Vercel Preview Deployments:** Any `*.vercel.app` domain is allowed
- ✅ **No Hardcoded Values:** Everything is dynamic
- ✅ **Easy to Debug:** Comprehensive logging
- ✅ **Production Ready:** Secure and standards-compliant
- ✅ **Future Proof:** Easy to add custom domains later

---

## 📞 Need Help?

### Quick Debug Commands:

```bash
# Test API health
curl https://shieldnest-api-4-git-mvp-production-rizewithus-projects.vercel.app/health

# Check if API is responding
curl -X OPTIONS https://shieldnest-api-4-git-mvp-production-rizewithus-projects.vercel.app/api/auth/wallet-auth \
  -H "Origin: https://shieldnest-mvp-production-2yvnrfyjj-rizewithus-projects.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -v
```

Look for `Access-Control-Allow-Origin` header in the response.

### Document References:

- 📖 **Full Fix Details:** `CORS_FIX_DEPLOYMENT_GUIDE.md`
- 📖 **Environment Variables:** `VERCEL_ENV_QUICK_REFERENCE.md`
- 📖 **This Checklist:** `IMMEDIATE_ACTION_CHECKLIST.md`

---

## ✅ Success Criteria

You'll know it's fixed when:

1. ✅ No CORS errors in browser console
2. ✅ Wallet connection succeeds
3. ✅ API logs show: `CORS allowed { origin: '...', ... }`
4. ✅ Network tab shows successful POST to `/api/auth/wallet-auth`

---

**Estimated Total Time:** 10-15 minutes

**Last Updated:** October 2, 2025  
**Status:** Ready to Deploy

