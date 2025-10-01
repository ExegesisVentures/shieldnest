# 🚀 Deployment Checklist - Roll NFT Dashboard

## Pre-Deployment Security Verification

### ✅ Security Audit Status
- [x] **No sensitive files in repository** - All `.env` files removed
- [x] **Comprehensive .gitignore** - Protects secrets and build artifacts
- [x] **Zero trust architecture** - API gateway and security middleware implemented
- [x] **Environment templates** - Secure configuration templates provided
- [x] **Security headers** - Comprehensive security headers configured
- [x] **Input validation** - All inputs sanitized and validated
- [x] **Rate limiting** - Multiple tiers of rate limiting implemented
- [x] **RLS policies** - Database security policies ready for deployment

### ⚠️ Known Warnings (Acceptable)
- Configuration seed values (not actual secrets)
- Test user temporary password (development only)
- Cache keys and console logs (not security risks)
- Some dependency vulnerabilities (non-critical)

## 🔧 Supabase Setup Required

### 1. Create Development Branch
```bash
# Via Supabase Dashboard:
# 1. Go to Project → Branches
# 2. Click "Create branch"
# 3. Name: "dev" or "staging"
# 4. Base: "main"
# 5. Wait for creation and collect credentials
```

### 2. Apply RLS Policies
```bash
# Use the provided SQL file
psql "YOUR_DEV_BRANCH_DB_URL" -f supabase/rls_setup.sql
```

### 3. Collect Environment Variables
```bash
# Development Branch
SUPABASE_URL_DEV=https://your-project-dev.supabase.co
SUPABASE_ANON_KEY_DEV=your_dev_anon_key
SUPABASE_SERVICE_ROLE_KEY_DEV=your_dev_service_role_key
DATABASE_URL_DEV=postgresql://postgres:password@db.your-project-dev.supabase.co:5432/postgres

# Production (Main Branch)
SUPABASE_URL_PROD=https://your-project.supabase.co
SUPABASE_ANON_KEY_PROD=your_prod_anon_key
SUPABASE_SERVICE_ROLE_KEY_PROD=your_prod_service_role_key
DATABASE_URL_PROD=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres
```

## 🚀 Vercel Setup Required

### 1. Create Projects
- **API Project**: Import `apps/api` from GitHub
- **Web Project**: Import `apps/web` from GitHub

### 2. Configure Environment Variables
Use the environment variables collected from Supabase setup above.

### 3. Set Up Domains
- Configure custom domains if needed
- Update CORS settings in zero-trust middleware

## 🔐 GitHub Secrets Required

Add these secrets to your GitHub repository:

```bash
# Vercel Configuration
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_vercel_org_id
VERCEL_API_PROJECT_ID=your_api_project_id
VERCEL_WEB_PROJECT_ID=your_web_project_id

# Supabase Development
SUPABASE_URL_DEV=https://your-project-dev.supabase.co
SUPABASE_ANON_KEY_DEV=your_dev_anon_key
SUPABASE_SERVICE_ROLE_KEY_DEV=your_dev_service_role_key
SUPABASE_DEV_DB_URL=postgresql://...
DATABASE_URL_DEV=postgresql://...

# Supabase Production
SUPABASE_URL_PROD=https://your-project.supabase.co
SUPABASE_ANON_KEY_PROD=your_prod_anon_key
SUPABASE_SERVICE_ROLE_KEY_PROD=your_prod_service_role_key
SUPABASE_PROD_DB_URL=postgresql://...
DATABASE_URL_PROD=postgresql://...

# Deployment URLs
NEXT_PUBLIC_API_URL_STAGING=https://your-api-staging.vercel.app
NEXT_PUBLIC_API_URL_PROD=https://your-api-prod.vercel.app
WEB_URL_STAGING=https://your-web-staging.vercel.app
WEB_URL_PROD=https://your-web-prod.vercel.app
```

## 📋 Deployment Steps

### 1. Initial Repository Setup
```bash
# 1. Push code to GitHub repository
git add .
git commit -m "Initial deployment-ready version"
git push origin main

# 2. Create develop branch
git checkout -b develop
git push origin develop
```

### 2. Test Staging Deployment
```bash
# Push to develop branch triggers staging deployment
git checkout develop
git push origin develop

# Monitor GitHub Actions for deployment status
# Verify staging environment works correctly
```

### 3. Production Deployment
```bash
# Push to main branch triggers production deployment
git checkout main
git merge develop
git push origin main

# Monitor GitHub Actions for production deployment
# Verify production environment works correctly
```

## 🧪 Post-Deployment Testing

### Health Checks
- [ ] API health endpoint responds: `GET /health`
- [ ] Database connection working
- [ ] Authentication flow functional
- [ ] Wallet connection working
- [ ] RLS policies active

### Security Verification
- [ ] HTTPS enforced on all endpoints
- [ ] Security headers present
- [ ] Rate limiting functional
- [ ] CORS policies working
- [ ] No sensitive data exposed

### Functionality Testing
- [ ] User registration/login
- [ ] Wallet connection (extension and manual)
- [ ] Dashboard data loading
- [ ] API endpoints responding
- [ ] Error handling working

## 🔍 Monitoring Setup

### Required Monitoring
- [ ] API uptime monitoring
- [ ] Database performance monitoring
- [ ] Error rate tracking
- [ ] Security event logging
- [ ] Performance metrics

### Alerting Thresholds
- [ ] API downtime alerts
- [ ] High error rate alerts (>5%)
- [ ] Database connection failures
- [ ] Security violation alerts
- [ ] Performance degradation alerts

## 🚨 Emergency Procedures

### Rollback Process
```bash
# If production deployment fails:
# 1. Revert to previous commit
git revert HEAD
git push origin main

# 2. Or rollback via Vercel dashboard
# 3. Check database state and rollback if needed
```

### Security Incident Response
1. **Immediate**: Disable affected services
2. **Assess**: Determine scope of incident
3. **Contain**: Stop the attack/breach
4. **Notify**: Alert stakeholders
5. **Recover**: Restore services safely
6. **Learn**: Update procedures

## 📞 Support Contacts

- **Technical Issues**: Create GitHub issue
- **Security Issues**: security@rollnft.com
- **Deployment Issues**: Check GitHub Actions logs
- **Database Issues**: Check Supabase dashboard

## ✅ Final Verification

Before going live, verify:

- [ ] All environment variables configured
- [ ] Security audit passes
- [ ] All tests passing
- [ ] Documentation updated
- [ ] Monitoring configured
- [ ] Backup procedures tested
- [ ] Team trained on procedures

---

## 🎯 Success Criteria

Deployment is successful when:

1. **Security**: All security measures active and verified
2. **Functionality**: All core features working correctly
3. **Performance**: Response times within acceptable limits
4. **Monitoring**: All monitoring and alerting functional
5. **Documentation**: All procedures documented and tested

---

**Deployment Date**: _______________
**Deployed By**: _______________
**Verified By**: _______________

**Status**: [ ] Staging Ready [ ] Production Ready [ ] Live
