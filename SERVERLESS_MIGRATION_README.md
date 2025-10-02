# 🚀 Vercel Serverless Migration - Quick Start

## Executive Summary

The Roll NFT Dashboard API has been restructured from a monolithic Express.js application to Vercel serverless functions. This provides better scalability, performance, and cost efficiency.

**Current Status**: ~30% complete (8 of ~55 endpoints converted)

## What Changed?

### Before
```
apps/api/ (Express.js server on port 3001)
└── One monolithic application with TypeScript aliases
```

### After
```
apps/web/pages/api/ (Serverless functions)
└── Individual serverless functions, no TypeScript aliases
```

## Quick Start

### 1. Run Setup Script
```bash
./setup-serverless.sh
```

This will:
- Install dependencies
- Generate Prisma client
- Prepare for development

### 2. Configure Environment Variables

Copy your `.env` file to `apps/web/.env` and ensure you have:

```bash
# REQUIRED
DATABASE_URL="postgresql://...?pgbouncer=true"  # Pooled connection
DIRECT_URL="postgresql://..."                   # Direct connection
SUPABASE_URL="https://...supabase.co"
SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."
JWT_SECRET="..."  # Min 64 characters
MAGIC_LINK_SECRET="..."  # Min 64 characters
```

### 3. Test Locally
```bash
cd apps/web
pnpm dev

# Test endpoint
curl http://localhost:3000/api/health
```

### 4. Deploy to Vercel

**Option A: Automatic (recommended)**
```bash
git push origin main  # Triggers automatic deployment
```

**Option B: Manual**
```bash
vercel --prod
```

## Converted Endpoints ✅

These endpoints are ready to use:

| Method | Endpoint | Description | File |
|--------|----------|-------------|------|
| GET | `/api/health` | Health check | `pages/api/health.ts` |
| GET | `/api/config` | Get configuration | `pages/api/config.ts` |
| POST | `/api/auth/wallet-auth` | Wallet authentication | `pages/api/auth/wallet-auth.ts` |
| POST | `/api/auth/password` | Password login | `pages/api/auth/password.ts` |
| GET | `/api/auth/me` | Get current user | `pages/api/auth/me.ts` |
| GET | `/api/balances/[address]` | Get wallet balances | `pages/api/balances/[address].ts` |
| GET | `/api/tokens` | Get token metadata | `pages/api/tokens/index.ts` |
| GET | `/api/pools/coreum-dex-data` | Get pool data | `pages/api/pools/coreum-dex-data.ts` |

## Testing Converted Endpoints

### Local Testing
```bash
# Health check
curl http://localhost:3000/api/health

# Get config
curl http://localhost:3000/api/config

# Wallet auth
curl -X POST http://localhost:3000/api/auth/wallet-auth \
  -H "Content-Type: application/json" \
  -d '{
    "address": "core1...",
    "chain": "coreum",
    "signature": "...",
    "message": "..."
  }'

# Get balances
curl http://localhost:3000/api/balances/core1your-address-here
```

### Production Testing
Replace `http://localhost:3000` with your Vercel URL:
```bash
curl https://your-app.vercel.app/api/health
```

## Remaining Work

**47 endpoints** still need conversion from these files:
- `apps/api/src/routes/admin.ts` (10 endpoints)
- `apps/api/src/routes/auth.ts` (6 remaining)
- `apps/api/src/routes/tma.ts` (3 endpoints)
- `apps/api/src/routes/pma.ts` (2 endpoints)
- `apps/api/src/routes/rewards.ts` (5 endpoints)
- `apps/api/src/routes/staking.ts` (8 endpoints)
- `apps/api/src/routes/convert.ts` (3 endpoints)
- `apps/api/src/routes/mint.ts` (2 endpoints)
- `apps/api/src/routes/profile.ts` (5 endpoints)
- `apps/api/src/routes/users.ts` (4 endpoints)

## How to Convert Remaining Routes

See the **conversion pattern** in `VERCEL_SERVERLESS_MIGRATION_GUIDE.md`.

**Basic template:**
```typescript
// apps/web/pages/api/your-endpoint.ts
import { NextApiResponse } from 'next';
import { prisma } from '../../src/lib/api-shared/db';
import { withAuth } from '../../src/lib/api-shared/middleware';
import { AuthenticatedRequest } from '../../src/lib/api-shared/types';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // Your logic here
    return res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ success: false, error: 'Internal error' });
  }
}

export default withAuth(handler);
```

## Key Architecture Changes

### 1. No TypeScript Aliases in API Routes
**Before:** `import { prisma } from '@/lib/db'`  
**After:** `import { prisma } from '../../src/lib/api-shared/db'`

### 2. Serverless-Optimized Database
- Connection pooling enabled
- Global singleton pattern
- JSON protocol for faster queries

### 3. Middleware Pattern
**Before (Express):**
```typescript
router.get('/endpoint', authenticate, handler)
```

**After (Next.js):**
```typescript
export default withAuth(handler)
```

### 4. Independent Functions
- Each endpoint is a separate file
- Each scales independently
- Smaller bundle sizes = faster cold starts

## File Locations

### New Shared Utilities
```
apps/web/src/lib/api-shared/
├── config.ts          # Configuration
├── db.ts              # Database with pooling
├── supabase.ts        # Supabase clients
├── security.ts        # Security utilities
├── wallet.ts          # Wallet verification
├── types.ts           # TypeScript types
└── middleware.ts      # API middleware
```

### Serverless Functions
```
apps/web/pages/api/
├── health.ts
├── config.ts
├── auth/
│   ├── wallet-auth.ts
│   ├── password.ts
│   └── me.ts
├── balances/
│   └── [address].ts
├── tokens/
│   └── index.ts
└── pools/
    └── coreum-dex-data.ts
```

## Documentation

| Document | Purpose |
|----------|---------|
| `VERCEL_SERVERLESS_MIGRATION_GUIDE.md` | Complete technical migration guide |
| `SERVERLESS_CONVERSION_SUMMARY.md` | Detailed summary of all changes |
| `SERVERLESS_MIGRATION_README.md` | This file - quick start |
| `setup-serverless.sh` | Automated setup script |

## Troubleshooting

### Issue: "Prisma Client Not Found"
```bash
cd apps/web
npx prisma generate
```

### Issue: "Database Connection Error"
- Ensure `DATABASE_URL` uses connection pooling (has `?pgbouncer=true`)
- Verify credentials in Supabase dashboard

### Issue: "Module Not Found"
- Check that imports use relative paths (not `@/` aliases)
- Run `pnpm install` in `apps/web`

### Issue: "Environment Variables Not Set"
- Set variables in Vercel dashboard: Project Settings → Environment Variables
- Redeploy after adding variables

## Deployment Checklist

Before deploying to production:

- [ ] All environment variables set in Vercel
- [ ] `DATABASE_URL` uses connection pooling
- [ ] `DIRECT_URL` is set (for migrations)
- [ ] `JWT_SECRET` is at least 64 characters
- [ ] `MAGIC_LINK_SECRET` is at least 64 characters
- [ ] Prisma client generated (`npx prisma generate`)
- [ ] Tested locally (`pnpm dev`)
- [ ] Tested critical endpoints
- [ ] Reviewed logs for errors

## Benefits

✅ **Scalability**: Each function scales independently  
✅ **Performance**: Faster cold starts, connection pooling  
✅ **Cost**: Pay only for execution time  
✅ **Reliability**: No single point of failure  
✅ **Deployment**: Zero-downtime deployments  
✅ **Maintenance**: Easier to debug individual functions  

## Next Steps

1. **For Developers**: Convert remaining endpoints using the pattern in the migration guide
2. **For DevOps**: Set up monitoring and alerting in Vercel
3. **For QA**: Test all converted endpoints thoroughly
4. **For PM**: Plan timeline for remaining endpoint conversions

## Support

- Check `VERCEL_SERVERLESS_MIGRATION_GUIDE.md` for detailed instructions
- Review Vercel function logs in dashboard
- Test locally before deploying

---

**Status**: In Progress (30% complete)  
**Started**: October 2, 2025  
**Estimated Completion**: 2-3 days for full migration  

**Need Help?** Check the migration guide or review existing converted endpoints as examples.

