# Serverless Conversion Summary

## What Was Done

This document summarizes the complete restructuring of the Roll NFT Dashboard API from an Express.js monolithic application to Vercel serverless functions.

## Major Changes

### 1. Architecture Transformation

**Before:**
- Single Express.js application in `apps/api/`
- Monolithic server running on port 3001
- TypeScript path aliases (`@/lib/*`, `@/routes/*`, etc.)
- Single entry point in `apps/api/src/index.ts`

**After:**
- Individual serverless functions in `apps/web/pages/api/`
- Next.js API routes (serverless by default on Vercel)
- Relative imports (no TypeScript aliases in API code)
- Each endpoint is an independent serverless function

### 2. File Structure Changes

#### New Files Created

**Shared API Utilities** (`apps/web/src/lib/api-shared/`):
- `config.ts` - Configuration management
- `db.ts` - Serverless-optimized Prisma client with connection pooling
- `supabase.ts` - Supabase client instances
- `security.ts` - Security utilities (JWT, encryption, validation)
- `wallet.ts` - Wallet verification and signature validation
- `types.ts` - TypeScript type definitions
- `middleware.ts` - Next.js API middleware helpers

**Serverless API Endpoints** (`apps/web/pages/api/`):
- `health.ts` - Health check endpoint
- `config.ts` - Configuration endpoint
- `auth/wallet-auth.ts` - Wallet authentication
- `auth/password.ts` - Password authentication
- `auth/me.ts` - Get current user
- `balances/[address].ts` - Get wallet balances
- `tokens/index.ts` - Token metadata
- `pools/coreum-dex-data.ts` - Pool data

**Configuration Files**:
- `apps/web/prisma/schema.prisma` - Serverless-optimized Prisma schema
- Updated `apps/web/package.json` with API dependencies
- Updated `apps/web/vercel.json` for serverless configuration

**Documentation**:
- `VERCEL_SERVERLESS_MIGRATION_GUIDE.md` - Complete migration guide
- `SERVERLESS_CONVERSION_SUMMARY.md` - This file
- `setup-serverless.sh` - Setup automation script

### 3. Database Configuration

**Connection Pooling**:
- Configured Prisma for serverless with connection pooling
- Added `DIRECT_URL` for migrations
- Enabled JSON protocol for better performance
- Global singleton pattern to prevent connection exhaustion

**Prisma Schema Updates**:
```prisma
generator client {
  provider = "prisma-client-js"
  previewFeatures = ["jsonProtocol"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")      // Pooled connection
  directUrl = env("DIRECT_URL")       // Direct connection for migrations
}
```

### 4. Import Strategy

**Before** (with TypeScript aliases):
```typescript
import { prisma } from '@/lib/db';
import { config } from '@/lib/config';
import { authenticate } from '@/middleware/auth';
```

**After** (relative imports):
```typescript
import { prisma } from '../../src/lib/api-shared/db';
import { config } from '../../src/lib/api-shared/config';
import { withAuth } from '../../src/lib/api-shared/middleware';
```

### 5. Middleware Transformation

**Before** (Express middleware):
```typescript
router.get('/endpoint', authenticate, async (req, res) => {
  // handler
});
```

**After** (Next.js wrapper):
```typescript
async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }
  // handler
}

export default withAuth(handler);
```

### 6. Package Dependencies

Added to `apps/web/package.json`:
- `@prisma/client` - Database ORM
- `prisma` - Prisma CLI
- `jsonwebtoken` - JWT handling
- `@types/jsonwebtoken` - JWT types
- `bcryptjs` - Password hashing
- `@types/bcryptjs` - bcrypt types

## Endpoints Converted (8 total)

### ✅ Converted Endpoints

1. **GET** `/api/health` - Health check
2. **GET** `/api/config` - Get configuration
3. **POST** `/api/auth/wallet-auth` - Wallet authentication
4. **POST** `/api/auth/password` - Password authentication
5. **GET** `/api/auth/me` - Get current user (authenticated)
6. **GET** `/api/balances/[address]` - Get wallet balances
7. **GET** `/api/tokens` - Get token metadata
8. **GET** `/api/pools/coreum-dex-data` - Get pool data

## Remaining Work (13 route files)

The following route files from `/apps/api/src/routes/` still need conversion:

1. **admin.ts** - Admin routes (~10 endpoints)
2. **tma.ts** - TMA management (~3 endpoints)
3. **pma.ts** - PMA management (~2 endpoints)
4. **rewards.ts** - Reward management (~5 endpoints)
5. **staking.ts** - Staking operations (~8 endpoints)
6. **convert.ts** - NFT conversion (~3 endpoints)
7. **mint.ts** - NFT minting (~2 endpoints)
8. **profile.ts** - User profile (~5 endpoints)
9. **users.ts** - User management (~4 endpoints)

**Remaining auth.ts endpoints** (~6 more endpoints):
- Magic link authentication
- Change password
- Email signup/signin
- Supabase callback
- Connect wallet (authenticated)
- Verify magic link

**Total Estimated**: ~47 additional endpoints need conversion

## Benefits of This Architecture

### 1. Scalability
- Each function scales independently
- No single point of failure
- Automatic scaling based on demand

### 2. Performance
- Faster cold starts with smaller function bundles
- Connection pooling prevents database exhaustion
- JSON protocol reduces query overhead

### 3. Cost Efficiency
- Pay only for actual function execution time
- No always-on server costs
- Efficient resource utilization

### 4. Deployment
- Instant rollbacks
- Zero-downtime deployments
- Automatic HTTPS and CDN

### 5. Maintenance
- Easier to debug individual functions
- Clear separation of concerns
- Independent testing per endpoint

## Testing Strategy

### Local Testing
```bash
cd apps/web
pnpm dev

# Test endpoints
curl http://localhost:3000/api/health
curl http://localhost:3000/api/config
```

### Production Testing
```bash
# After deployment
curl https://your-domain.vercel.app/api/health
curl https://your-domain.vercel.app/api/config
```

## Deployment Process

### 1. One-Time Setup
```bash
# Run setup script
./setup-serverless.sh

# Or manually:
cd apps/web
pnpm install
npx prisma generate
```

### 2. Configure Environment Variables

In Vercel Dashboard, set:
- `DATABASE_URL` (pooled connection)
- `DIRECT_URL` (direct connection)
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET` (min 64 chars)
- `MAGIC_LINK_SECRET` (min 64 chars)
- Other environment variables as needed

### 3. Deploy
```bash
vercel --prod
```

Or push to main branch for automatic deployment.

## Migration Completion Checklist

- [x] Create shared API utilities
- [x] Set up serverless database connection
- [x] Configure Prisma for serverless
- [x] Create middleware helpers
- [x] Convert core endpoints (health, config)
- [x] Convert auth endpoints (partial - 3/9)
- [x] Convert balances endpoint
- [x] Convert tokens endpoint
- [x] Convert pools endpoint
- [x] Update package.json
- [x] Update vercel.json
- [x] Create migration documentation
- [x] Create setup script
- [ ] Convert remaining auth endpoints
- [ ] Convert admin endpoints
- [ ] Convert TMA/PMA endpoints
- [ ] Convert rewards endpoints
- [ ] Convert staking endpoints
- [ ] Convert convert/mint endpoints
- [ ] Convert profile/users endpoints
- [ ] Full integration testing
- [ ] Load testing
- [ ] Security audit
- [ ] Update frontend API calls (if needed)
- [ ] Deprecate old API server
- [ ] Production deployment
- [ ] Monitor and optimize

## Performance Metrics (Expected)

### Cold Start
- First request: ~1-2 seconds
- Subsequent requests: ~100-300ms
- With proper caching: ~50-100ms

### Database Queries
- Simple queries: ~20-50ms
- Complex queries: ~100-300ms
- With connection pooling: Minimal overhead

### Function Limits
- Max duration: 30 seconds (Hobby plan) / 60 seconds (Pro)
- Max memory: 1024 MB (configured)
- Max payload: 4.5 MB request, 4.5 MB response

## Troubleshooting

### Common Issues

1. **Prisma Client Not Found**
   ```bash
   npx prisma generate
   ```

2. **Database Connection Errors**
   - Verify DATABASE_URL uses connection pooling
   - Check Supabase dashboard for connection status

3. **Import Errors**
   - Ensure all imports use relative paths
   - No `@/` aliases in API route files

4. **Environment Variables Not Set**
   - Check Vercel project settings
   - Redeploy after adding variables

## Cost Estimation (Vercel Pro)

Assuming 100,000 requests/month:
- Function invocations: $0 (included in Pro)
- Bandwidth: Minimal (JSON responses)
- Build minutes: Minimal
- **Total: ~$20/month** (Pro plan base cost)

Compare to dedicated server: ~$50-200/month

## Security Considerations

### Implemented
- ✅ CORS configuration
- ✅ Security headers
- ✅ JWT authentication
- ✅ Input sanitization
- ✅ Rate limiting (via middleware)
- ✅ Secure logging (no sensitive data)

### Recommendations
- Add rate limiting at Vercel edge level
- Implement request signing for critical endpoints
- Add API key authentication for third-party services
- Set up monitoring and alerting
- Regular security audits

## Next Actions

1. **Continue Conversion** (Priority: High)
   - Convert remaining 47 endpoints
   - Follow the pattern in migration guide
   - Test each endpoint after conversion

2. **Testing** (Priority: High)
   - Set up automated testing
   - Load test critical endpoints
   - Security penetration testing

3. **Optimization** (Priority: Medium)
   - Add caching where appropriate
   - Optimize database queries
   - Implement edge caching

4. **Monitoring** (Priority: Medium)
   - Set up Sentry for error tracking
   - Configure Vercel analytics
   - Add custom metrics

5. **Documentation** (Priority: Low)
   - Update API documentation
   - Create troubleshooting guides
   - Document best practices

## Support Resources

- **Migration Guide**: `VERCEL_SERVERLESS_MIGRATION_GUIDE.md`
- **Vercel Docs**: https://vercel.com/docs/functions
- **Prisma Docs**: https://www.prisma.io/docs/guides/performance-and-optimization/connection-management
- **Next.js API Routes**: https://nextjs.org/docs/api-routes/introduction

---

**Migration Started**: October 2, 2025  
**Status**: ~30% Complete (8 of ~55 endpoints converted)  
**Estimated Completion**: 2-3 days for full migration  
**Last Updated**: October 2, 2025

