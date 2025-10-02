# ✅ Ready for Vercel Deployment!

**Date**: October 2, 2025  
**Status**: All environment variables configured

---

## 📁 Files Created (Local Only - NOT in Git)

### ✅ Local Development Files
1. **`apps/api/.env`** - API development environment
2. **`apps/web/.env`** - Web development environment  
3. **`VERCEL_ENV_VARIABLES.md`** - Copy-paste ready for Vercel ⭐

**Status**: ✅ These files are gitignored and will NOT be committed

---

## 🚀 Next Steps - Deploy to Vercel

### Quick Deploy (30 minutes)

#### 1. Deploy API Project (10 min)

**Create Project:**
- Go to: https://vercel.com/new
- Import from GitHub: `ExegesisVentures/shieldnest`
- Framework: Other
- Root Directory: `apps/api`
- Build Command: `pnpm build`
- Output Directory: `dist`
- Install Command: `cd ../.. && pnpm install --frozen-lockfile`

**Add Environment Variables:**
- Open file: `VERCEL_ENV_VARIABLES.md`
- Copy all variables from "API Project Environment Variables" section
- Paste in Vercel: Settings → Environment Variables
- **Temporarily set**: `FRONTEND_URL=https://localhost:3000`

**Deploy:**
- Click "Deploy"
- Wait for build to complete
- **Copy your API URL** (e.g., `https://shieldnest-api-xxxxx.vercel.app`)

#### 2. Deploy Web Project (10 min)

**Create Project:**
- Go to: https://vercel.com/new
- Import from GitHub: `ExegesisVentures/shieldnest`
- Framework: Next.js
- Root Directory: `apps/web`
- Build Command: `pnpm build`
- Output Directory: `.next`
- Install Command: `cd ../.. && pnpm install --frozen-lockfile`

**Add Environment Variables:**
- Open file: `VERCEL_ENV_VARIABLES.md`
- Copy all variables from "Web Project Environment Variables" section
- Paste in Vercel: Settings → Environment Variables
- **Update**: `NEXT_PUBLIC_API_URL` = Your API URL from step 1

**Deploy:**
- Click "Deploy"
- Wait for build to complete
- **Copy your Web URL** (e.g., `https://shieldnest-web-xxxxx.vercel.app`)

#### 3. Update API CORS (5 min)

**Update API Environment Variable:**
- Go to your API project in Vercel
- Settings → Environment Variables
- Find `FRONTEND_URL`
- Update value to your Web URL from step 2
- Save changes

**Redeploy API:**
- Deployments tab
- Click "..." on latest deployment
- Click "Redeploy"
- Wait for completion

#### 4. Test Deployment (5 min)

**Test API:**
```bash
curl https://your-api-url.vercel.app/health
```
Expected: `{"status":"healthy","database":"connected"}`

**Test Web:**
- Visit: `https://your-web-url.vercel.app`
- Should see landing page
- Try connecting wallet
- Check browser console for errors

---

## 📋 Environment Variables Summary

### API - 33 Variables Total

**Essential (10):**
- ✅ Database & Supabase configuration
- ✅ JWT & Magic Link secrets (generated)
- ✅ Blockchain endpoints
- ✅ CORS configuration

**Business Config (23):**
- ✅ Pricing (mint price, floor model)
- ✅ Rewards (epochs, LP fees)
- ✅ Marketplace (fees, access gating)
- ✅ Supply (max supply, burn settings)
- ⚠️ Contract addresses (empty - add after deployment)

### Web - 18 Variables Total

**Essential (7):**
- ✅ API URL (update after API deployment)
- ✅ Supabase public configuration
- ✅ Blockchain endpoints
- ✅ MVP mode enabled

**Feature Flags (7):**
- ✅ Staking enabled
- ✅ Marketplace enabled
- ✅ Rewards enabled
- ✅ Admin panel disabled
- ✅ Advanced features disabled

**Optional (4):**
- ⚠️ Contract addresses (empty - add after deployment)

---

## 🔐 Your Credentials

### Supabase
- **Project ID**: `cucnmhpguyynfknmxrtt`
- **URL**: `https://cucnmhpguyynfknmxrtt.supabase.co`
- **Anon Key**: ✅ Configured
- **Service Role Key**: ✅ Configured (API only)
- **Database URL**: ✅ Configured

### Generated Secrets
- **JWT Secret**: ✅ Generated (64 chars)
- **Magic Link Secret**: ✅ Generated (64 chars)

### Blockchain
- **Network**: Coreum Mainnet
- **Chain ID**: `coreum-mainnet-1`
- **RPC**: `https://full-node.mainnet-1.coreum.dev:26657`
- **REST**: `https://full-node.mainnet-1.coreum.dev:1317`

---

## ✅ Verification Checklist

### Pre-Deployment
- [x] Environment variables prepared
- [x] Secrets generated
- [x] Local .env files created
- [x] Git status clean (no sensitive files tracked)
- [ ] Vercel account ready

### API Deployment
- [ ] API project created in Vercel
- [ ] Root directory set to `apps/api`
- [ ] All 33 environment variables added
- [ ] Build successful
- [ ] Health endpoint responds
- [ ] API URL copied

### Web Deployment
- [ ] Web project created in Vercel
- [ ] Root directory set to `apps/web`
- [ ] All 18 environment variables added
- [ ] `NEXT_PUBLIC_API_URL` updated with API URL
- [ ] Build successful
- [ ] Site loads correctly
- [ ] Web URL copied

### Post-Deployment
- [ ] API `FRONTEND_URL` updated with Web URL
- [ ] API redeployed with new CORS
- [ ] Wallet connection tested
- [ ] Authentication tested
- [ ] No console errors
- [ ] Monitoring enabled

---

## 🎯 What's Configured

### Security ✅
- Zero-trust architecture ready
- JWT authentication configured
- Service role isolation (backend only)
- CORS protection configured
- Input validation ready
- Rate limiting ready

### Features ✅
- Wallet connection (Keplr, Leap, Cosmostation)
- Portfolio management
- Staking interface
- NFT display
- Rewards tracking
- Marketplace (when contracts deployed)

### MVP Mode ✅
- Simplified production deployment
- Essential features only
- Admin panel disabled
- Advanced features disabled
- Clean user experience

---

## 📚 Important Files

### For Deployment
- **`VERCEL_ENV_VARIABLES.md`** ⭐ Copy-paste ready variables
- **`VERCEL_CONNECTION_GUIDE.md`** - Full deployment guide
- **`DEPLOYMENT_READY.md`** - This file

### For Development
- **`apps/api/.env`** - API local environment (gitignored)
- **`apps/web/.env`** - Web local environment (gitignored)

### Configuration
- **`apps/api/vercel.json`** - API Vercel config
- **`apps/web/vercel.json`** - Web Vercel config
- **`apps/api/package.json`** - API build scripts
- **`apps/web/package.json`** - Web build scripts

---

## 🚨 Security Reminders

### ✅ Safe for Browser
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Designed to be public
- All `NEXT_PUBLIC_*` variables - Safe to expose

### ⚠️ NEVER Expose
- `SUPABASE_SERVICE_ROLE_KEY` - Backend only!
- `JWT_SECRET` - Backend only!
- `MAGIC_LINK_SECRET` - Backend only!
- `DATABASE_URL` - Backend only!

### 📝 Best Practices
- ✅ .env files are gitignored
- ✅ Only use service role in API (never frontend)
- ✅ Rotate secrets if ever exposed
- ✅ Use Vercel environment variables (encrypted at rest)
- ✅ Separate dev/preview/production environments

---

## 🆘 Troubleshooting

### Build Fails
**Check:**
- Are all required variables set?
- Is the root directory correct?
- Is install command using monorepo path?

**Solution:**
```bash
# Test build locally first
cd apps/api && pnpm build
cd apps/web && pnpm build
```

### CORS Errors
**Check:**
- Is `FRONTEND_URL` in API correct?
- Did you redeploy API after updating?
- Does URL match exactly (no trailing slash)?

**Solution:**
- API `FRONTEND_URL` must exactly match Web deployment URL
- Example: `https://shieldnest-web.vercel.app` (no trailing slash)

### Database Connection Errors
**Check:**
- Is `DATABASE_URL` correct?
- Is password correct in connection string?
- Is Supabase project active?

**Solution:**
```bash
# Test connection
psql "postgresql://postgres:PASSWORD@db.cucnmhpguyynfknmxrtt.supabase.co:5432/postgres" -c "SELECT 1;"
```

---

## 📞 Resources

### Your Services
- **Supabase**: https://supabase.com/dashboard/project/cucnmhpguyynfknmxrtt
- **Vercel**: https://vercel.com/dashboard
- **GitHub**: https://github.com/ExegesisVentures/shieldnest

### Documentation
- **Vercel Docs**: https://vercel.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Supabase Docs**: https://supabase.com/docs
- **Coreum Docs**: https://docs.coreum.dev

---

## 🎉 You're Ready!

Everything is configured and ready for deployment:

- ✅ **Environment variables** prepared
- ✅ **Secrets** generated  
- ✅ **Local development** configured
- ✅ **Git security** verified (no sensitive files tracked)
- ✅ **Deployment guide** ready

### Quick Start
1. Open `VERCEL_ENV_VARIABLES.md`
2. Follow the deployment order
3. Copy-paste variables from that file
4. Deploy and test!

**Estimated time**: 30 minutes

---

**Status**: ✅ Ready for Production Deployment  
**Last Updated**: October 2, 2025  
**Branch**: mvp-production

