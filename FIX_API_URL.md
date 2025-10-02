# 🔧 FIX: Update API URL for Serverless

## The Problem

Your frontend is calling:
- ❌ `https://shieldnest-api-4.vercel.app/api/auth/wallet-auth` (OLD separate API)

But should be calling:
- ✅ `https://shieldnest-mvp-production.vercel.app/api/auth/wallet-auth` (NEW serverless)

## The Solution

### Option 1: Add Environment Variable in Vercel (Recommended)

1. Go to Vercel Dashboard → shieldnest-mvp-production → Settings → Environment Variables

2. **Add or Update**:
   ```
   Variable: NEXT_PUBLIC_API_URL
   Value: https://shieldnest-mvp-production.vercel.app
   Environments: Production, Preview, Development
   ```

3. **Redeploy** (Deployments → ⋯ → Redeploy)

### Option 2: Use Relative URLs (Even Better!)

Since your API is now part of the same deployment, we can use relative URLs.

Update `apps/web/src/lib/api.ts`:

**Change line 2 from:**
```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
```

**To:**
```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001');
```

**And line 9 from:**
```typescript
return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
```

**To:**
```typescript
return process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001');
```

**And line 19 from:**
```typescript
const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
```

**To:**
```typescript
const baseUrl = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001');
```

This way:
- Production: Uses same domain (https://shieldnest-mvp-production.vercel.app)
- Development: Uses localhost:3001 (your local API)
- Can override with `NEXT_PUBLIC_API_URL` if needed

## Quick Fix NOW

**Fastest solution:**

1. Add this to Vercel Environment Variables:
   ```
   NEXT_PUBLIC_API_URL = https://shieldnest-mvp-production.vercel.app
   ```

2. Redeploy

Done! ✅

