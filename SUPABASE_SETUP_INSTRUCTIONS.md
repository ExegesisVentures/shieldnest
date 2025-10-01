# 🚀 Supabase Development Branch Setup Instructions

## Current Status
- ✅ Production Supabase project: cucnmhpguyynfknmxrtt
- ✅ RLS policies prepared
- ✅ Environment templates created
- ⏳ Development branch creation required

## Step 1: Create Development Branch

### Via Supabase Dashboard:
1. Go to: https://supabase.com/dashboard/project/cucnmhpguyynfknmxrtt
2. Navigate to: Project → Branches
3. Click: "Create branch"
4. Configuration:
   - Branch name: `dev`
   - Base branch: `main`
   - Wait for creation to complete

### Collect Development Branch Credentials:
After branch creation, go to Project Settings → API and collect:

```bash
# Development Branch Credentials (replace with actual values)
SUPABASE_URL_DEV=https://cucnmhpguyynfknmxrtt-dev.supabase.co
SUPABASE_ANON_KEY_DEV=your_dev_anon_key_here
SUPABASE_SERVICE_ROLE_KEY_DEV=your_dev_service_role_key_here
DATABASE_URL_DEV=postgresql://postgres:8JRE5bwZHqz@H@Z@db.cucnmhpguyynfknmxrtt-dev.supabase.co:5432/postgres
```

## Step 2: Apply RLS Policies

### Using psql:
```bash
# Connect to development branch and apply RLS
psql "postgresql://postgres:8JRE5bwZHqz@H@Z@db.YOUR_DEV_BRANCH.supabase.co:5432/postgres" -f supabase/rls_setup.sql

# Verify RLS setup
psql "postgresql://postgres:8JRE5bwZHqz@H@Z@db.YOUR_DEV_BRANCH.supabase.co:5432/postgres" -f supabase/verify_rls.sql
```

### Using Supabase SQL Editor:
1. Go to your development branch dashboard
2. Navigate to: SQL Editor
3. Copy and paste the contents of `supabase/rls_setup.sql`
4. Execute the SQL
5. Run verification queries from `supabase/verify_rls.sql`

## Step 3: Update Environment Variables

### For Development:
1. Copy `env.dev.template` to `apps/api/.env`
2. Replace placeholder values with actual development branch credentials
3. Copy `apps/web/env.template` to `apps/web/.env`
4. Update with development branch values

### For Production Deployment:
1. Use `env.prod.template` values for Vercel environment variables
2. Add GitHub secrets for CI/CD pipeline

## Step 4: Test Setup

### Test Database Connection:
```bash
# Test development branch connection
node scripts/test-db-connection.js dev

# Test production connection
node scripts/test-db-connection.js prod
```

### Test Application:
```bash
# Start development servers
cd apps/api && npm run dev
cd apps/web && npm run dev

# Test health endpoint
curl http://localhost:3001/health
```

## Step 5: Deploy to Staging

### GitHub Repository:
1. Push code to GitHub repository
2. Ensure all secrets are configured
3. Push to `develop` branch for staging deployment

### Vercel Configuration:
1. Create API project pointing to `apps/api`
2. Create Web project pointing to `apps/web`
3. Configure environment variables for both projects

## Verification Checklist

- [ ] Development branch created in Supabase
- [ ] RLS policies applied successfully
- [ ] Environment variables configured
- [ ] Database connection working
- [ ] API health check passing
- [ ] Frontend loading correctly
- [ ] Authentication flow working
- [ ] GitHub secrets configured
- [ ] Vercel projects created
- [ ] Staging deployment successful

## Troubleshooting

### Common Issues:
1. **Branch creation fails**: Ensure you have admin access to the Supabase project
2. **RLS application fails**: Check database connection and permissions
3. **Environment variables**: Ensure all placeholders are replaced with actual values
4. **Connection errors**: Verify database URLs and credentials

### Support:
- Check GitHub Actions logs for deployment issues
- Review Vercel deployment logs
- Test database connectivity with psql
- Verify environment variable configuration

---

**Generated**: 2025-10-01T01:29:49.372Z
**Project**: Roll NFT Dashboard
**Status**: Ready for development branch setup
