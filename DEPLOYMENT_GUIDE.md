# 🚀 Roll NFT Dashboard - Deployment Guide

## Overview

This guide covers the complete deployment process for the Roll NFT Dashboard, including:
- Supabase branch setup with RLS (Row Level Security)
- Vercel deployment for both API and Web applications
- Environment configuration for development and production
- Zero trust security implementation

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Server    │    │   Database      │
│   (Next.js)     │◄──►│   (Express)     │◄──►│   (Supabase)    │
│   Vercel        │    │   Vercel        │    │   PostgreSQL    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📋 Prerequisites

1. **GitHub Repository**: Code hosted at `https://github.com/ExegesisVentures/roll2.git`
2. **Supabase Account**: With main project and dev branch
3. **Vercel Account**: Connected to GitHub repository
4. **Environment Variables**: Properly configured for each environment

## 🔧 Step 1: Supabase Setup

### Create Development Branch

1. **Via Supabase Dashboard**:
   - Go to Project → Branches
   - Click "Create branch"
   - Name: `dev` or `staging`
   - Base: `main`
   - Wait for branch creation

2. **Collect Branch Credentials**:
   ```bash
   # Development Branch
   SUPABASE_URL_DEV=https://your-project-dev.supabase.co
   SUPABASE_ANON_KEY_DEV=your_dev_anon_key
   SUPABASE_SERVICE_ROLE_KEY_DEV=your_dev_service_role_key
   DATABASE_URL_DEV=postgresql://postgres:password@db.your-project-dev.supabase.co:5432/postgres
   ```

### Apply RLS Policies

The repository includes `supabase/rls_setup.sql` which will be automatically applied via GitHub Actions.

**Manual Application** (if needed):
```bash
# For development branch
psql "postgresql://postgres:password@db.your-project-dev.supabase.co:5432/postgres" -f supabase/rls_setup.sql

# Verify RLS is enabled
psql "your_dev_db_url" -c "SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;"
```

## 🔧 Step 2: Vercel Setup

### Create Vercel Projects

1. **API Project**:
   - Import from GitHub: `apps/api`
   - Framework: Other
   - Build Command: `pnpm build`
   - Output Directory: `dist`

2. **Web Project**:
   - Import from GitHub: `apps/web`
   - Framework: Next.js
   - Build Command: `pnpm build`
   - Output Directory: `.next`

### Configure Environment Variables

#### API Project Environment Variables

**Development/Staging**:
```bash
NODE_ENV=production
DATABASE_URL=your_supabase_dev_database_url
SUPABASE_URL=https://your-project-dev.supabase.co
SUPABASE_ANON_KEY=your_dev_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_dev_service_role_key
JWT_SECRET=your_secure_jwt_secret_64_chars_minimum
MAGIC_LINK_SECRET=your_secure_magic_link_secret_64_chars_minimum
CHAIN_ID=coreum-mainnet-1
RPC_ENDPOINT=https://full-node.mainnet-1.coreum.dev:26657
REST_ENDPOINT=https://full-node.mainnet-1.coreum.dev:1317
FRONTEND_URL=https://your-web-app.vercel.app
```

**Production**:
```bash
# Same as above but with production Supabase credentials
DATABASE_URL=your_supabase_prod_database_url
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_prod_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_prod_service_role_key
```

#### Web Project Environment Variables

**Development/Staging**:
```bash
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://your-api-app.vercel.app
NEXT_PUBLIC_SUPABASE_URL=https://your-project-dev.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_dev_anon_key
NEXT_PUBLIC_CHAIN_ID=coreum-mainnet-1
NEXT_PUBLIC_RPC_ENDPOINT=https://full-node.mainnet-1.coreum.dev:26657
NEXT_PUBLIC_REST_ENDPOINT=https://full-node.mainnet-1.coreum.dev:1317
```

**Production**:
```bash
# Same as above but with production URLs and credentials
NEXT_PUBLIC_API_URL=https://your-api-app-prod.vercel.app
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_prod_anon_key
```

## 🔧 Step 3: GitHub Actions Setup

### Required Secrets

Add these secrets to your GitHub repository (Settings → Secrets and variables → Actions):

```bash
# Vercel
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_vercel_org_id
VERCEL_API_PROJECT_ID=your_api_project_id
VERCEL_WEB_PROJECT_ID=your_web_project_id

# Supabase Development
SUPABASE_URL_DEV=https://your-project-dev.supabase.co
SUPABASE_ANON_KEY_DEV=your_dev_anon_key
SUPABASE_SERVICE_ROLE_KEY_DEV=your_dev_service_role_key
SUPABASE_DEV_DB_URL=postgresql://postgres:password@db.your-project-dev.supabase.co:5432/postgres
DATABASE_URL_DEV=your_dev_database_url

# Supabase Production
SUPABASE_URL_PROD=https://your-project.supabase.co
SUPABASE_ANON_KEY_PROD=your_prod_anon_key
SUPABASE_SERVICE_ROLE_KEY_PROD=your_prod_service_role_key
SUPABASE_PROD_DB_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres
DATABASE_URL_PROD=your_prod_database_url

# Deployment URLs
NEXT_PUBLIC_API_URL_STAGING=https://your-api-staging.vercel.app
NEXT_PUBLIC_API_URL_PROD=https://your-api-prod.vercel.app
WEB_URL_STAGING=https://your-web-staging.vercel.app
WEB_URL_PROD=https://your-web-prod.vercel.app
```

## 🔧 Step 4: Deployment Process

### Automatic Deployment

The GitHub Actions workflow automatically handles:

1. **On `develop` branch push**:
   - Security audit
   - Lint and type checking
   - Build applications
   - Apply RLS to dev Supabase branch
   - Deploy to staging environment
   - Run post-deployment tests

2. **On `main` branch push**:
   - All above steps
   - Deploy to production environment
   - Apply RLS to production Supabase branch (with manual approval)

### Manual Deployment

If you need to deploy manually:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy API
cd apps/api
vercel --prod

# Deploy Web
cd apps/web
vercel --prod
```

## 🔒 Security Features

### Zero Trust Architecture

- **API Gateway**: All external API calls go through secure gateway
- **Rate Limiting**: Different limits for auth, API, and sensitive endpoints
- **Input Sanitization**: All inputs are sanitized before processing
- **Request Validation**: Comprehensive request validation
- **Security Headers**: Enhanced security headers via Helmet
- **CORS Policy**: Strict CORS configuration

### Row Level Security (RLS)

- **User Isolation**: Users can only access their own data
- **Service Role Access**: Backend services have full access via service role
- **Public Data**: Some data (like TMA documents) is publicly readable
- **Helper Functions**: Secure helper functions for common operations

### Environment Security

- **No Sensitive Data in Repo**: All `.env` files are gitignored
- **Template Files**: `env.template` files provide structure without secrets
- **Separate Environments**: Dev and prod use different Supabase branches
- **Service Role Isolation**: Service role keys only used in backend

## 🧪 Testing

### Health Checks

- **API Health**: `GET /health`
- **Database Connection**: Verified in health endpoint
- **Environment Validation**: Automatic validation on startup

### Post-Deployment Tests

GitHub Actions automatically tests:
- API health endpoint
- Web application loading
- Database connectivity
- RLS policy verification

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Errors**:
   - Verify DATABASE_URL is correct
   - Check Supabase project is active
   - Ensure RLS policies are applied

2. **CORS Errors**:
   - Verify frontend URL in API environment
   - Check CORS configuration in zero-trust middleware
   - Ensure Vercel domains are whitelisted

3. **Authentication Failures**:
   - Verify Supabase keys match between frontend and backend
   - Check JWT secret is properly set
   - Ensure user exists in database

4. **Build Failures**:
   - Check all environment variables are set
   - Verify TypeScript compilation
   - Check for linting errors

### Debug Commands

```bash
# Check environment variables
vercel env ls

# View deployment logs
vercel logs

# Test API health
curl https://your-api.vercel.app/health

# Test database connection
psql "your_database_url" -c "SELECT 1;"
```

## 📊 Monitoring

### Production Monitoring

- **Health Checks**: Automated health monitoring
- **Error Logging**: Comprehensive error logging with SecureLogger
- **Performance Monitoring**: Request timing and performance metrics
- **Security Monitoring**: Failed authentication attempts and suspicious activity

### Alerts

Set up alerts for:
- API downtime
- Database connection failures
- High error rates
- Security violations
- Performance degradation

## 🔄 Maintenance

### Regular Tasks

1. **Security Updates**: Keep dependencies updated
2. **Database Maintenance**: Monitor database performance
3. **Log Review**: Regular review of security logs
4. **Environment Rotation**: Rotate secrets periodically
5. **Backup Verification**: Ensure backups are working

### Scaling Considerations

- **Database**: Monitor connection limits and query performance
- **API**: Consider serverless function limits
- **Frontend**: Monitor bundle size and loading performance
- **Security**: Review and update security policies regularly

---

## 🎯 Quick Start Checklist

- [ ] Create Supabase dev branch
- [ ] Set up Vercel projects
- [ ] Configure environment variables
- [ ] Add GitHub secrets
- [ ] Push to `develop` branch
- [ ] Verify staging deployment
- [ ] Test all functionality
- [ ] Deploy to production via `main` branch

## 📞 Support

For deployment issues:
1. Check GitHub Actions logs
2. Review Vercel deployment logs
3. Verify environment variables
4. Test database connectivity
5. Check security configurations

---

**Last Updated**: October 1, 2025
**Version**: 1.0.0
