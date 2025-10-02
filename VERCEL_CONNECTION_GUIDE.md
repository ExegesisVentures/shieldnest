# 🚀 Vercel Connection & Deployment Guide

**Repository**: https://github.com/ExegesisVentures/shieldnest.git  
**Date**: October 1, 2025  
**Status**: Ready for Deployment

---

## 🚨 SECURITY WARNING - READ FIRST

**⚠️ Your GitHub Token is Compromised**

The GitHub token you shared in our conversation has been exposed publicly. It starts with `github_pat_11BFH2HQA0...` (redacted for security). 

**Immediate Action Required:**
1. Go to: https://github.com/settings/tokens
2. Find and **revoke** the compromised token
3. Generate a new fine-grained token with only required permissions
4. Update any automation using the old token
5. **Never** share tokens in chat, screenshots, or commits

---

## 📋 Prerequisites

Before connecting to Vercel, ensure you have:

- ✅ GitHub account with repository access
- ✅ Vercel account (free tier works)
- ✅ Supabase project created
- ✅ All environment variable values ready
- ✅ pnpm installed locally for testing

---

## 🔗 Step 1: Connect Repository to Vercel

### Option A: Via Vercel Dashboard (Recommended)

1. **Login to Vercel**
   - Go to https://vercel.com
   - Sign in with GitHub

2. **Import Repository**
   - Click "Add New..." → "Project"
   - Select "Import Git Repository"
   - Choose: `ExegesisVentures/shieldnest`
   - Click "Import"

3. **Create TWO Separate Projects**
   You need to deploy the API and Web app separately:
   - Project 1: API Server
   - Project 2: Web Application

### Option B: Via Vercel CLI

```bash
# Install Vercel CLI globally
npm i -g vercel

# Login to Vercel
vercel login

# Deploy API (from project root)
cd apps/api
vercel --prod

# Deploy Web (from project root)
cd apps/web
vercel --prod
```

---

## 🔧 Step 2: Configure API Project

### Create API Project in Vercel

1. **Project Setup**
   - **Project Name**: `shieldnest-api` (or your choice)
   - **Framework Preset**: Other
   - **Root Directory**: `apps/api`
   - **Build Command**: `pnpm build`
   - **Output Directory**: `dist`
   - **Install Command**: `cd ../.. && pnpm install`

2. **Configure Build Settings**
   ```json
   {
     "buildCommand": "pnpm build",
     "outputDirectory": "dist",
     "installCommand": "cd ../.. && pnpm install --frozen-lockfile",
     "devCommand": "pnpm dev"
   }
   ```

### Add API Environment Variables

Go to Project Settings → Environment Variables and add:

```bash
# =============== DEPLOYMENT ===============
NODE_ENV=production
PORT=3002

# =============== DATABASE & SUPABASE ===============
# Get these from: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/database
DATABASE_URL=postgresql://postgres:[YOUR_PASSWORD]@db.[YOUR_PROJECT_ID].supabase.co:5432/postgres

# Get these from: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api
SUPABASE_URL=https://[YOUR_PROJECT_ID].supabase.co
SUPABASE_ANON_KEY=[YOUR_SUPABASE_ANON_KEY]
SUPABASE_SERVICE_ROLE_KEY=[YOUR_SERVICE_ROLE_KEY_FROM_SUPABASE_DASHBOARD]

# =============== AUTHENTICATION SECRETS ===============
# Generate secure 64+ character strings using: openssl rand -base64 64
JWT_SECRET=[GENERATE_YOUR_OWN_64_CHAR_SECRET]
MAGIC_LINK_SECRET=[GENERATE_YOUR_OWN_64_CHAR_SECRET]

# =============== BLOCKCHAIN CONFIGURATION ===============
CHAIN_ID=coreum-mainnet-1
RPC_ENDPOINT=https://full-node.mainnet-1.coreum.dev:26657
REST_ENDPOINT=https://full-node.mainnet-1.coreum.dev:1317

# =============== CONTRACT ADDRESSES ===============
# Update these after deploying your smart contracts
RISE_NFT_CW721_ADDRESS=
ROLL_NFT_CW721_ADDRESS=
BUYBACK_TREASURY_ADDRESS=
STAKING_ESCROW_ADDRESS=
LP_FEE_DISTRIBUTOR_ADDRESS=
ORACLE_VERIFIER_ADDRESS=

# =============== PRICING CONFIG ===============
NEW_ROLL_MINT_PRICE_USD=1000
OG_MIN_LIST_PRICE_USD=5000
BACKEND_BOOK_VALUE_USD=10000
FLOOR_MODEL=bonding_curve
FLOOR_INCREMENT_USD=50

# =============== PAYOUT CONFIG ===============
SELLBACK_PAYOUT_MODE=token_amount_locked_at_sale_price
STAKING_WAIT_DAYS=14
STAKE_MODE=native_delegation
VALIDATOR_ADDRESS=
PRICE_ORACLE=backend_signed_TWAP

# =============== REWARDS CONFIG ===============
EPOCH_LENGTH_DAYS=7
LP_FEE_POOL_SHARE_PER_NFT=0.005
PARTNER_AIRDROPS=enabled

# =============== SUPPLY CONFIG ===============
MAX_SUPPLY=100
BURN_ON_BUYBACK=true

# =============== ACCESS GATING ===============
REQUIRE_TMA=true
TMA_SIGN_METHODS=["Coreum ADR-036 sign"]

# =============== MARKETPLACE FEES ===============
ROLL_HOLDER_FEE_BPS=0
NON_HOLDER_FEE_BPS=250

# =============== EMAIL CONFIG (Optional) ===============
EMAIL_PROVIDER=postmark
POSTMARK_API_TOKEN=your_postmark_token_if_using_email
FROM_EMAIL=noreply@shieldnest.io

# =============== ORACLE CONFIG (Optional) ===============
ORACLE_PRIVATE_KEY=your_oracle_signing_key_if_using
ORACLE_PUBLIC_KEY=your_oracle_public_key_if_using

# =============== OBSERVABILITY (Optional) ===============
SENTRY_DSN=your_sentry_dsn_for_error_tracking
ENABLE_COMPLIANCE_LOGGING=true

# =============== CORS CONFIGURATION ===============
# UPDATE THIS AFTER WEB DEPLOYMENT!
FRONTEND_URL=https://shieldnest-web.vercel.app
```

**Important Notes:**
- **Get DATABASE_URL password**: Supabase Dashboard → Settings → Database → Connection String
- **Get SERVICE_ROLE_KEY**: Supabase Dashboard → Settings → API → Service Role Key (secret)
- **Generate JWT secrets**: Run `openssl rand -base64 64` in terminal (twice for both secrets)
- **Update `FRONTEND_URL`**: After deploying the web app, come back and update this
- **Contract addresses**: Leave empty for MVP, update after smart contract deployment
- **Email/Oracle**: Optional for MVP, can be added later

### API Deployment Settings

In `apps/api/vercel.json` (already configured):
```json
{
  "version": 2,
  "name": "roll-nft-api",
  "builds": [
    {
      "src": "dist/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "dist/index.js"
    }
  ],
  "functions": {
    "dist/index.js": {
      "maxDuration": 30
    }
  }
}
```

---

## 🌐 Step 3: Configure Web Project

### Create Web Project in Vercel

1. **Project Setup**
   - **Project Name**: `shieldnest-web` (or your choice)
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/web`
   - **Build Command**: `pnpm build`
   - **Output Directory**: `.next`
   - **Install Command**: `cd ../.. && pnpm install`

2. **Configure Build Settings**
   ```json
   {
     "buildCommand": "pnpm build",
     "outputDirectory": ".next",
     "installCommand": "cd ../.. && pnpm install --frozen-lockfile",
     "devCommand": "pnpm dev --port 3003"
   }
   ```

### Add Web Environment Variables

Go to Project Settings → Environment Variables and add:

```bash
# =============== DEPLOYMENT ===============
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1

# =============== APP CONFIGURATION ===============
NEXT_PUBLIC_APP_ENV=mvp
NEXT_PUBLIC_DATABASE_SCHEMA=mvp_production

# =============== API CONFIGURATION ===============
# UPDATE THIS AFTER API DEPLOYMENT!
NEXT_PUBLIC_API_URL=https://shieldnest-api.vercel.app

# =============== SUPABASE CONFIGURATION ===============
# Get these from: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR_PROJECT_ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR_SUPABASE_ANON_KEY]

# =============== BLOCKCHAIN CONFIGURATION ===============
NEXT_PUBLIC_CHAIN_ID=coreum-mainnet-1
NEXT_PUBLIC_RPC_ENDPOINT=https://full-node.mainnet-1.coreum.dev:26657
NEXT_PUBLIC_REST_ENDPOINT=https://full-node.mainnet-1.coreum.dev:1317

# =============== CONTRACT ADDRESSES ===============
# Update these after deploying your smart contracts
NEXT_PUBLIC_RISE_NFT_CW721_ADDRESS=
NEXT_PUBLIC_ROLL_NFT_CW721_ADDRESS=
NEXT_PUBLIC_BUYBACK_TREASURY_ADDRESS=
NEXT_PUBLIC_STAKING_ESCROW_ADDRESS=

# =============== FEATURE FLAGS (MVP Configuration) ===============
NEXT_PUBLIC_MVP_MODE=true
NEXT_PUBLIC_ENABLE_ADMIN_PANEL=false
NEXT_PUBLIC_ENABLE_STAKING=true
NEXT_PUBLIC_ENABLE_MARKETPLACE=true
NEXT_PUBLIC_ENABLE_REWARDS=true
NEXT_PUBLIC_ENABLE_ADVANCED_FEATURES=false

# =============== ANALYTICS & MONITORING (Optional) ===============
# Add these if you want tracking and error monitoring
# NEXT_PUBLIC_GA_TRACKING_ID=G-XXXXXXXXXX
# NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
```

**Important Notes:**
- **Update `NEXT_PUBLIC_API_URL`**: After deploying API, update this with actual API URL
- **ANON_KEY is safe**: The anon key is meant to be public (browser-safe)
- **Never use SERVICE_ROLE_KEY**: Only use service role key in backend (API)
- **All `NEXT_PUBLIC_*` variables**: These are exposed to the browser
- **MVP Mode**: Enabled for simplified production deployment
- **Feature Flags**: Control which features are enabled in production
- **Contract Addresses**: Leave empty for MVP, update after smart contract deployment

### Web Deployment Settings

In `apps/web/vercel.json` (already configured):
```json
{
  "version": 2,
  "name": "roll-nft-dashboard",
  "framework": "nextjs",
  "buildCommand": "pnpm build",
  "outputDirectory": ".next"
}
```

---

## 🔄 Step 4: Deploy Both Projects

### Deploy API First

1. Go to your API project in Vercel
2. Click "Deploy" or push to GitHub
3. Wait for build to complete
4. Copy the deployment URL (e.g., `https://shieldnest-api.vercel.app`)

### Update CORS and Deploy Web

1. **Update API Environment Variables**
   - Go to API project → Settings → Environment Variables
   - Update `FRONTEND_URL` with your web deployment URL
   - Redeploy API

2. **Update Web Environment Variables**
   - Go to Web project → Settings → Environment Variables
   - Update `NEXT_PUBLIC_API_URL` with your API deployment URL

3. **Deploy Web Project**
   - Click "Deploy" or push to GitHub
   - Wait for build to complete

### Verify Deployment

1. **API Health Check**
   ```bash
   curl https://your-api.vercel.app/health
   # Expected: {"status": "healthy", ...}
   ```

2. **Web Application**
   - Visit: https://your-web.vercel.app
   - Check that the landing page loads
   - Test wallet connection
   - Verify API connectivity

---

## 📊 Step 5: Configure Production Domains (Optional)

### Add Custom Domains

1. **API Domain**
   - Go to API Project → Settings → Domains
   - Add: `api.shieldnest.io` (or your domain)
   - Update DNS records as instructed

2. **Web Domain**
   - Go to Web Project → Settings → Domains
   - Add: `app.shieldnest.io` (or your domain)
   - Update DNS records as instructed

3. **Update Environment Variables**
   - API: Update `FRONTEND_URL` to production domain
   - Web: Update `NEXT_PUBLIC_API_URL` to production domain
   - Redeploy both projects

---

## 🔒 Step 6: Security Configuration

### Enable Security Features in Vercel

1. **DDoS Protection** (Pro plan)
   - Automatic on Vercel Pro
   - Protects against attacks

2. **Edge Network**
   - Enabled by default
   - Global CDN distribution

3. **HTTPS/SSL**
   - Automatic SSL certificates
   - Force HTTPS (enabled by default)

4. **Environment Variables**
   - Never commit `.env` files
   - Use Vercel environment variables
   - Separate production/preview/development

### Update Security Headers

Headers are configured in `vercel.json` files:
- X-Content-Type-Options
- X-Frame-Options
- X-XSS-Protection
- Referrer-Policy
- Permissions-Policy
- Strict-Transport-Security

---

## 🧪 Step 7: Testing Deployment

### API Tests

```bash
# Health check
curl https://your-api.vercel.app/health

# Test tokens endpoint
curl https://your-api.vercel.app/api/tokens

# Test with authentication (replace TOKEN)
curl -H "Authorization: Bearer TOKEN" \
  https://your-api.vercel.app/api/profile
```

### Web Tests

1. **Landing Page**: https://your-web.vercel.app
2. **Portfolio**: https://your-web.vercel.app/portfolio
3. **Profile**: https://your-web.vercel.app/profile
4. **Dashboard**: https://your-web.vercel.app/dashboard

### Integration Tests

1. **Wallet Connection**
   - Connect Keplr/Leap wallet
   - Verify address shown
   - Check balance display

2. **Authentication**
   - Sign in with email
   - Sign in with wallet
   - Verify session persists

3. **Portfolio View**
   - View token balances
   - Check price updates
   - Verify NFT display

---

## 📈 Step 8: Monitoring & Analytics

### Vercel Analytics

1. **Enable Analytics**
   - Go to Project → Analytics
   - Enable Web Analytics (free tier)
   - View real-time metrics

2. **Monitor Performance**
   - Page load times
   - Core Web Vitals
   - Geographic distribution

### Log Monitoring

1. **Vercel Logs**
   - Go to Project → Logs
   - Monitor deployment logs
   - Check runtime logs

2. **Set Up Alerts**
   - Project → Settings → Alerts
   - Configure error alerts
   - Set up deployment notifications

---

## 🚨 Troubleshooting

### Common Issues

#### 1. Build Fails

**Problem**: Build fails during deployment

**Solutions**:
```bash
# Check build locally first
cd apps/api && pnpm build
cd apps/web && pnpm build

# Verify environment variables are set
# Check TypeScript errors
pnpm type-check

# Check for missing dependencies
pnpm install
```

#### 2. API Connection Errors

**Problem**: Frontend can't connect to API

**Solutions**:
- Verify `NEXT_PUBLIC_API_URL` is correct
- Check API is deployed and healthy
- Verify CORS settings in API
- Check browser console for errors

#### 3. Database Connection Errors

**Problem**: API can't connect to Supabase

**Solutions**:
- Verify `DATABASE_URL` is correct
- Check Supabase project is active
- Verify RLS policies are applied
- Check service role key is correct

#### 4. Authentication Failures

**Problem**: Users can't sign in

**Solutions**:
- Verify JWT_SECRET is set
- Check Supabase keys match
- Verify CORS allows frontend domain
- Check user exists in database

#### 5. Monorepo Build Issues

**Problem**: Dependencies not found during build

**Solutions**:
```bash
# Ensure install command navigates to root
"installCommand": "cd ../.. && pnpm install --frozen-lockfile"

# Verify pnpm-workspace.yaml is correct
# Check turbo.json configuration
# Ensure dependencies are in correct package.json
```

---

## 🔄 Step 9: Continuous Deployment

### Automatic Deployments

Vercel automatically deploys when you push to GitHub:

1. **Production Branch** (main/mvp-production)
   - Automatic deployment to production
   - Runs all checks and tests

2. **Preview Branches** (develop, feature/*)
   - Creates preview deployment
   - Unique URL for each branch
   - Perfect for testing

### GitHub Integration

Configure in Vercel:
1. Go to Project → Settings → Git
2. Enable "Auto Deploy"
3. Set production branch
4. Configure preview branches

---

## 📋 Deployment Checklist

### Pre-Deployment
- [ ] All environment variables ready
- [ ] Supabase project created and configured
- [ ] RLS policies applied
- [ ] Local testing completed
- [ ] Security audit passed
- [ ] Documentation updated

### API Deployment
- [ ] Vercel API project created
- [ ] Root directory set to `apps/api`
- [ ] Build command configured
- [ ] All environment variables added
- [ ] Deploy successful
- [ ] Health check passes
- [ ] API URL copied

### Web Deployment
- [ ] Vercel Web project created
- [ ] Root directory set to `apps/web`
- [ ] Build command configured
- [ ] Environment variables added
- [ ] `NEXT_PUBLIC_API_URL` set correctly
- [ ] Deploy successful
- [ ] Site loads properly

### Post-Deployment
- [ ] Update API `FRONTEND_URL`
- [ ] Test wallet connection
- [ ] Test authentication
- [ ] Test portfolio view
- [ ] Verify API connectivity
- [ ] Check security headers
- [ ] Monitor error logs
- [ ] Set up alerts

---

## 🎯 Quick Reference

### API Project Settings
```
Name: shieldnest-api (or your choice)
Framework: Other
Root: apps/api
Build: pnpm build
Output: dist
Install: cd ../.. && pnpm install --frozen-lockfile
Branch: mvp-production
```

### Web Project Settings
```
Name: shieldnest-web (or your choice)
Framework: Next.js
Root: apps/web
Build: pnpm build
Output: .next
Install: cd ../.. && pnpm install --frozen-lockfile
Branch: mvp-production
```

### Essential URLs
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Supabase Dashboard**: https://supabase.com/dashboard
- **GitHub Repo**: https://github.com/ExegesisVentures/shieldnest
- **Coreum Docs**: https://docs.coreum.dev

### Required Secrets to Generate
Run these commands to generate secure secrets:
```bash
# JWT Secret
openssl rand -base64 64

# Magic Link Secret  
openssl rand -base64 64
```

### Minimum Required Variables (MVP)

**API (Essential Only):**
- DATABASE_URL
- SUPABASE_URL
- SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- JWT_SECRET
- MAGIC_LINK_SECRET
- CHAIN_ID
- RPC_ENDPOINT
- REST_ENDPOINT
- FRONTEND_URL

**Web (Essential Only):**
- NEXT_PUBLIC_API_URL
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- NEXT_PUBLIC_CHAIN_ID
- NEXT_PUBLIC_RPC_ENDPOINT
- NEXT_PUBLIC_REST_ENDPOINT
- NEXT_PUBLIC_MVP_MODE=true

---

## 💡 Pro Tips

1. **Use Preview Deployments**: Test features in preview before merging to production
2. **Environment Variables**: Use different values for preview vs production
3. **Monitor Logs**: Check logs regularly for errors
4. **Custom Domains**: Add custom domains for professional appearance
5. **Analytics**: Enable Vercel Analytics for insights
6. **Branch Protection**: Protect production branches in GitHub
7. **Team Access**: Add team members with appropriate permissions

---

## 📞 Support

### Vercel Support
- **Docs**: https://vercel.com/docs
- **Community**: https://github.com/vercel/vercel/discussions
- **Status**: https://www.vercel-status.com

### Project Support
- **GitHub Issues**: Create issue in repository
- **Documentation**: Check `/docs` directory
- **Security**: Report security issues privately

---

## ✅ Success Criteria

Your deployment is successful when:

- ✅ API health endpoint responds with 200
- ✅ Web application loads and displays correctly
- ✅ Wallet connection works
- ✅ Authentication functions properly
- ✅ Portfolio displays user data
- ✅ No console errors on frontend
- ✅ No runtime errors in API logs
- ✅ HTTPS enabled on both domains
- ✅ Security headers present
- ✅ Performance metrics are good

---

**🎉 Congratulations! Your ShieldNest Dashboard is now live on Vercel!**

---

**Last Updated**: October 1, 2025  
**Version**: 1.0.0  
**Status**: Ready for Production

