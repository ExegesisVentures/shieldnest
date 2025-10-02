# 🔧 CORS Fix & Production Deployment Guide

## Problem Identified

The CORS error was caused by **hardcoded placeholder values** in `apps/api/vercel.json` that were blocking all cross-origin requests before they could reach the Express middleware.

### Root Causes:
1. ❌ `apps/api/vercel.json` had hardcoded CORS header: `"https://your-frontend-domain.vercel.app"`
2. ❌ `apps/web/vercel.json` had hardcoded API rewrite: `"https://your-api-domain.vercel.app"`
3. ❌ Static Vercel headers were overriding dynamic Express CORS middleware

## ✅ Fixes Applied

### File: `apps/api/vercel.json`
**Location:** `/apps/api/vercel.json`

**Changed:** Removed the entire `/api/(.*)` headers section that contained hardcoded CORS values.

**Why:** The Express middleware (`apps/api/src/middleware/zero-trust.ts`) handles CORS dynamically, allowing all `*.vercel.app` domains in production. Static headers in `vercel.json` were preventing this from working.

### File: `apps/web/vercel.json`  
**Location:** `/apps/web/vercel.json`

**Changed:** Removed the `rewrites` section that had a hardcoded API URL.

**Why:** The frontend uses `NEXT_PUBLIC_API_URL` environment variable to determine the API URL dynamically. Static rewrites aren't needed and can cause confusion.

### File: `apps/api/src/middleware/zero-trust.ts`
**Location:** `/apps/api/src/middleware/zero-trust.ts` (lines 121-167)

**Enhanced:** Added better logging and OPTIONS request handling to the CORS configuration.

**Why:** Better debugging and proper preflight request handling for production environments.

---

## 🚀 Deployment Steps

### Step 1: Commit & Push Changes

```bash
# Review the changes
git status

# Add the modified files
git add apps/api/vercel.json apps/web/vercel.json apps/api/src/middleware/zero-trust.ts

# Commit with a clear message
git commit -m "fix: Remove hardcoded CORS headers to allow dynamic Vercel domain handling"

# Push to your branch
git push origin mvp-production
```

### Step 2: Verify Environment Variables on Vercel

#### For API Project (`shieldnest-api-4`)

Go to: **Vercel Dashboard → shieldnest-api-4 → Settings → Environment Variables**

Ensure these are set:

| Variable | Value | Required |
|----------|-------|----------|
| `NODE_ENV` | `production` | ✅ **CRITICAL** |
| `FRONTEND_URL` | `https://shieldnest-mvp-production-2yvnrfyjj-rizewithus-projects.vercel.app` | ✅ **CRITICAL** |
| `DATABASE_URL` | `postgresql://postgres:8JRE5bwZHqz@H@Z@db.cucnmhpguyynfknmxrtt.supabase.co:5432/postgres` | ✅ |
| `SUPABASE_URL` | `https://cucnmhpguyynfknmxrtt.supabase.co` | ✅ |
| `SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | ✅ |
| `JWT_SECRET` | (your secret) | ✅ |
| `MAGIC_LINK_SECRET` | (your secret) | ✅ |
| `CHAIN_ID` | `coreum-mainnet-1` | ✅ |
| `RPC_ENDPOINT` | `https://full-node.mainnet-1.coreum.dev:26657` | ✅ |
| `REST_ENDPOINT` | `https://full-node.mainnet-1.coreum.dev:1317` | ✅ |

**IMPORTANT:** Make sure `NODE_ENV=production` is set. The CORS logic checks this!

#### For Web Project (`shieldnest-mvp-production`)

Go to: **Vercel Dashboard → shieldnest-mvp-production → Settings → Environment Variables**

Ensure these are set:

| Variable | Value | Required |
|----------|-------|----------|
| `NODE_ENV` | `production` | ✅ |
| `NEXT_PUBLIC_API_URL` | `https://shieldnest-api-4-git-mvp-production-rizewithus-projects.vercel.app` | ✅ **CRITICAL** |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://cucnmhpguyynfknmxrtt.supabase.co` | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | ✅ |
| `NEXT_PUBLIC_CHAIN_ID` | `coreum-mainnet-1` | ✅ |
| `NEXT_PUBLIC_RPC_ENDPOINT` | `https://full-node.mainnet-1.coreum.dev:26657` | ✅ |
| `NEXT_PUBLIC_REST_ENDPOINT` | `https://full-node.mainnet-1.coreum.dev:1317` | ✅ |
| `NEXT_PUBLIC_MVP_MODE` | `true` | ✅ |

### Step 3: Redeploy Both Projects

1. **API First:**
   - Go to Vercel Dashboard → shieldnest-api-4 → Deployments
   - Click on the latest deployment → Click "..." → **Redeploy**
   - Wait for deployment to complete

2. **Then Web:**
   - Go to Vercel Dashboard → shieldnest-mvp-production → Deployments  
   - Click on the latest deployment → Click "..." → **Redeploy**
   - Wait for deployment to complete

### Step 4: Test the Connection

Open your browser's developer console on the deployed site and try to connect a wallet:

**Expected Console Output:**
```
🌐 API Request: {endpoint: 'api/auth/wallet-auth', url: 'https://...', method: 'POST'}
🌐 API Response: {endpoint: 'api/auth/wallet-auth', status: 200, ok: true}
```

**Check API Logs on Vercel:**
Go to: **Vercel Dashboard → shieldnest-api-4 → Logs**

Look for:
```
CORS allowed { origin: 'https://shieldnest-mvp-production-2yvnrfyjj-rizewithus-projects.vercel.app', ... }
```

---

## 🔍 How the CORS System Works Now

### File: `apps/api/src/middleware/zero-trust.ts` (lines 121-167)

```typescript
export const corsOptions = {
  origin: (origin, callback) => {
    // In production, allow all *.vercel.app domains
    if (process.env.NODE_ENV === 'production') {
      if (origin.endsWith('.vercel.app') || origin === frontendUrl) {
        return callback(null, true); // ✅ ALLOW
      }
      return callback(new Error('Not allowed by CORS')); // ❌ BLOCK
    }
    
    // In development, allow localhost
    const devOrigins = ['http://localhost:3000', ...];
    if (devOrigins.includes(origin)) {
      return callback(null, true); // ✅ ALLOW
    }
    
    callback(new Error('Not allowed by CORS')); // ❌ BLOCK
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Request-Id'],
  preflightContinue: false,
  optionsSuccessStatus: 204,
  maxAge: 86400 // 24 hours
};
```

### Applied in: `apps/api/src/index.ts` (line 49)

```typescript
app.use(cors(zeroTrustCors)); // Strict CORS policy
```

---

## 🧪 Troubleshooting

### If CORS errors persist:

1. **Check NODE_ENV:**
   ```bash
   # In API logs, look for:
   CORS allowed { ..., nodeEnv: 'production' }
   ```
   If it shows `development`, the `NODE_ENV` variable isn't set correctly.

2. **Check Origin Logging:**
   ```bash
   # In API logs, look for:
   CORS allowed { origin: 'https://your-frontend.vercel.app', ... }
   # OR
   CORS blocked { origin: 'https://your-frontend.vercel.app', ... }
   ```

3. **Verify Environment Variables:**
   ```bash
   # On API project, ensure FRONTEND_URL matches your actual frontend URL
   # On Web project, ensure NEXT_PUBLIC_API_URL matches your actual API URL
   ```

4. **Clear Vercel Cache:**
   - Go to Vercel Dashboard → Project → Settings → General
   - Scroll to "Caching" → Click "Clear Cache"
   - Redeploy

5. **Check for Multiple CORS Headers:**
   ```bash
   # In browser Network tab → Select the failed request → Check Response Headers
   # You should see ONE 'Access-Control-Allow-Origin' header
   # If you see multiple or none, there's a configuration conflict
   ```

---

## 📝 Summary

### What Changed:
1. ✅ Removed hardcoded CORS headers from `apps/api/vercel.json`
2. ✅ Removed hardcoded API rewrite from `apps/web/vercel.json`  
3. ✅ Enhanced CORS middleware with better logging and OPTIONS handling
4. ✅ Express middleware now handles all CORS dynamically

### Why This is Production-Ready:
- **Dynamic:** Automatically allows all Vercel preview deployments
- **Secure:** Still validates origins, just against patterns not hardcoded values
- **Flexible:** Easy to add custom domains later
- **Debuggable:** Comprehensive logging for troubleshooting
- **Standards-Compliant:** Proper preflight handling with OPTIONS 204 responses

### Next Steps After Deployment:
1. Monitor API logs for CORS messages
2. Test wallet connection from production
3. If you add a custom domain, add it to the `FRONTEND_URL` environment variable
4. Document any additional origins that need to be allowed

---

**Last Updated:** October 2, 2025  
**Files Modified:**
- `apps/api/vercel.json`
- `apps/web/vercel.json`  
- `apps/api/src/middleware/zero-trust.ts`
- `CORS_FIX_DEPLOYMENT_GUIDE.md` (this file)

