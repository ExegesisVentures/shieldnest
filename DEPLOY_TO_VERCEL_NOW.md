# 🚀 DEPLOY TO VERCEL - STEP BY STEP

## Current Status
✅ Migration complete - 52 serverless endpoints ready  
✅ All files created and tested  
🔄 Ready to push to Vercel

---

## 📋 PRE-DEPLOYMENT CHECKLIST

### 1. Environment Variables Ready?
You'll need these in Vercel Dashboard after deployment:

**Required:**
```bash
DATABASE_URL=postgresql://...?pgbouncer=true
DIRECT_URL=postgresql://...
SUPABASE_URL=https://...supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
JWT_SECRET=... (min 64 chars)
MAGIC_LINK_SECRET=... (min 64 chars)
CHAIN_ID=coreum-mainnet-1
RPC_ENDPOINT=https://full-node.mainnet-1.coreum.dev:26657
REST_ENDPOINT=https://full-node.mainnet-1.coreum.dev:1317
NEXT_PUBLIC_FRONTEND_URL=https://your-domain.vercel.app
FRONTEND_URL=https://your-domain.vercel.app
```

---

## 🚀 OPTION 1: Automatic Git Deployment (Recommended)

### Step 1: Commit All Changes

```bash
# Add all new serverless files
git add apps/web/pages/
git add apps/web/src/lib/api-shared/
git add apps/web/prisma/
git add apps/web/package.json
git add apps/web/vercel.json
git add pnpm-lock.yaml

# Add documentation
git add *.md
git add setup-serverless.sh
git add test-serverless-endpoints.sh

# Commit with descriptive message
git commit -m "feat: complete serverless migration to Vercel

- Convert 52 Express API routes to serverless functions
- Add shared utilities with connection pooling
- Remove TypeScript path aliases
- Configure for Vercel deployment
- Add comprehensive documentation"
```

### Step 2: Push to GitHub

```bash
# Push to current branch (mvp-production)
git push origin mvp-production

# OR push to main if that's your production branch
# git push origin main
```

### Step 3: Vercel Auto-Deploys! 🎉

If your project is connected to Vercel:
- Vercel will automatically detect the push
- Start building your project
- Deploy to production (if pushing to main) or preview (other branches)

**Watch deployment at**: https://vercel.com/dashboard

---

## 🔧 OPTION 2: Manual Vercel CLI Deployment

### Step 1: Install Vercel CLI (if not installed)

```bash
npm install -g vercel
```

### Step 2: Login to Vercel

```bash
vercel login
```

### Step 3: Deploy from apps/web

```bash
# Navigate to the web app
cd apps/web

# Deploy to production
vercel --prod

# Follow the prompts:
# - Select your team/account
# - Link to existing project or create new one
# - Confirm deployment
```

---

## ⚙️ AFTER DEPLOYMENT: Set Environment Variables

### Via Vercel Dashboard (Easiest)

1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add each variable:
   - Variable name: `DATABASE_URL`
   - Value: `postgresql://...?pgbouncer=true`
   - Select: **Production**, **Preview**, **Development**
   - Click **Save**
5. Repeat for ALL variables listed above
6. **Redeploy** after adding variables:
   - Go to **Deployments** tab
   - Click ⋯ on latest deployment
   - Click **Redeploy**

### Via Vercel CLI (Alternative)

```bash
# Set production environment variables
vercel env add DATABASE_URL production
# Paste your value when prompted

# Repeat for each variable
vercel env add SUPABASE_URL production
vercel env add JWT_SECRET production
# ... etc
```

---

## ✅ VERIFY DEPLOYMENT

### 1. Check Deployment Status

Visit your Vercel dashboard and wait for "Ready" status.

### 2. Test Health Endpoint

```bash
# Replace with your Vercel domain
curl https://your-domain.vercel.app/api/health
```

**Expected response:**
```json
{
  "success": true,
  "message": "Roll NFT Dashboard API is healthy",
  "deployment": "serverless",
  "timestamp": "2025-10-02T...",
  "database": "connected"
}
```

### 3. Test Other Public Endpoints

```bash
curl https://your-domain.vercel.app/api/config
curl https://your-domain.vercel.app/api/staking/validators
curl https://your-domain.vercel.app/api/tma/current
```

### 4. Test Protected Endpoints (should return 401)

```bash
curl https://your-domain.vercel.app/api/auth/me
# Should return: {"success":false,"error":"Missing or invalid authorization header"}
```

---

## 🎯 RECOMMENDED DEPLOYMENT FLOW

**For this project, I recommend:**

1. **Test locally first** (if you haven't):
   ```bash
   cd apps/web
   pnpm dev
   # Visit http://localhost:3000/api/health
   ```

2. **Commit and push to GitHub**:
   ```bash
   git add .
   git commit -m "feat: complete serverless migration"
   git push origin mvp-production
   ```

3. **Let Vercel auto-deploy** (if connected)

4. **Set environment variables** in Vercel Dashboard

5. **Redeploy** after setting env vars

6. **Test production** endpoints

---

## 🔍 WHAT VERCEL WILL DO

When you deploy, Vercel will:

1. ✅ Detect Next.js app in `apps/web`
2. ✅ Install dependencies (`pnpm install`)
3. ✅ Run `prisma generate` (configured in vercel.json)
4. ✅ Build your Next.js app
5. ✅ Deploy 52 serverless functions in `pages/api/`
6. ✅ Make them available at your domain

---

## 📁 DEPLOYMENT CONFIGURATION

These files tell Vercel how to deploy:

**`apps/web/vercel.json`** (already configured):
```json
{
  "buildCommand": "pnpm run build && npx prisma generate",
  "functions": {
    "pages/api/**/*.ts": {
      "memory": 1024,
      "maxDuration": 60
    }
  }
}
```

**`apps/web/package.json`** (already configured):
- Has all API dependencies (prisma, bcryptjs, jsonwebtoken, etc.)
- Build script runs Next.js build

---

## 🚨 TROUBLESHOOTING

### Issue: "Prisma Client Not Found"
**Solution**: Vercel should run `prisma generate` automatically. If not, check `vercel.json` buildCommand.

### Issue: "Environment variables not set"
**Solution**: 
1. Add all variables in Vercel Dashboard
2. Wait 1-2 minutes
3. Redeploy

### Issue: "Database connection error"
**Solution**: 
1. Verify `DATABASE_URL` has `?pgbouncer=true`
2. Verify `DIRECT_URL` is set
3. Check Supabase connection pooling is enabled

### Issue: "Build fails"
**Solution**:
1. Check build logs in Vercel Dashboard
2. Make sure all dependencies are in `apps/web/package.json`
3. Try building locally first: `cd apps/web && pnpm build`

---

## 🎊 READY TO DEPLOY?

**Choose your method:**

### Quick Deploy (Git):
```bash
git add .
git commit -m "feat: complete serverless migration"
git push origin mvp-production
```

### Manual Deploy (CLI):
```bash
cd apps/web
vercel --prod
```

**Then set environment variables in Vercel Dashboard!**

---

## 📞 NEED HELP?

- **Vercel Docs**: https://vercel.com/docs
- **Prisma Serverless**: https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel
- **Check your files**: All serverless functions are in `apps/web/pages/api/`

---

🚀 **You're ready to deploy! Good luck!** 🚀

