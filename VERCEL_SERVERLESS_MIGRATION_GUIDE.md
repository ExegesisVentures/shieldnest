# Vercel Serverless Migration Guide

## Overview

This document outlines the complete migration from the Express.js monolithic API to Vercel serverless functions architecture.

## Migration Status

### ✅ Completed Tasks

1. **Shared Utilities Setup**
   - Created `/apps/web/src/lib/api-shared/` directory with all shared utilities
   - Converted TypeScript path aliases to relative imports
   - Moved all utilities: db.ts, config.ts, supabase.ts, security.ts, wallet.ts, types.ts, middleware.ts

2. **Serverless Database Configuration**
   - Updated Prisma schema for serverless deployment at `/apps/web/prisma/schema.prisma`
   - Added connection pooling support
   - Configured JSON protocol for faster performance
   - Added `DIRECT_URL` for migrations

3. **Converted API Endpoints**
   The following endpoints have been converted to serverless functions in `/apps/web/pages/api/`:
   
   - ✅ `/api/health` - Health check endpoint
   - ✅ `/api/config` - Configuration endpoint
   - ✅ `/api/auth/wallet-auth` - Wallet authentication
   - ✅ `/api/auth/password` - Password authentication
   - ✅ `/api/auth/me` - Get current user
   - ✅ `/api/balances/[address]` - Get wallet balances
   - ✅ `/api/tokens` - Token metadata
   - ✅ `/api/pools/coreum-dex-data` - Pool data

4. **Package Updates**
   - Updated `/apps/web/package.json` with required dependencies:
     - @prisma/client
     - prisma
     - jsonwebtoken
     - @types/jsonwebtoken
     - bcryptjs
     - @types/bcryptjs

5. **Vercel Configuration**
   - Updated `/apps/web/vercel.json` for serverless functions
   - Added Prisma generation to build command
   - Configured function memory and timeouts

### 🚧 Remaining API Routes to Convert

The following routes from `/apps/api/src/routes/` still need to be converted:

#### Auth Routes (from `/apps/api/src/routes/auth.ts`)
- POST `/api/auth/magic-link` - Send magic link for email authentication
- POST `/api/auth/change-password` - Change password for test users
- POST `/api/auth/email` - Supabase email authentication (signup/signin)
- POST `/api/auth/callback` - Handle Supabase auth callback
- POST `/api/auth/verify-magic-link` - Verify magic link token
- POST `/api/auth/connect-wallet` - Connect and verify wallet (authenticated)

#### Admin Routes (from `/apps/api/src/routes/admin.ts`)
- All admin endpoints need conversion

#### TMA Routes (from `/apps/api/src/routes/tma.ts`)
- GET `/api/tma/current` - Get current TMA
- POST `/api/tma/sign` - Sign TMA
- GET `/api/tma/status` - Get TMA status

#### PMA Routes (from `/apps/api/src/routes/pma.ts`)
- GET `/api/pma/current` - Get current PMA
- POST `/api/pma/accept` - Accept PMA

#### Rewards Routes (from `/apps/api/src/routes/rewards.ts`)
- GET `/api/rewards/epochs` - Get reward epochs
- GET `/api/rewards/claims` - Get reward claims
- POST `/api/rewards/claim` - Claim rewards

#### Staking Routes (from `/apps/api/src/routes/staking.ts`)
- All staking endpoints need conversion

#### Convert Routes (from `/apps/api/src/routes/convert.ts`)
- All conversion endpoints need conversion

#### Mint Routes (from `/apps/api/src/routes/mint.ts`)
- All minting endpoints need conversion

#### Profile Routes (from `/apps/api/src/routes/profile.ts`)
- All profile endpoints need conversion

#### Users Routes (from `/apps/api/src/routes/users.ts`)
- All user management endpoints need conversion

## File Structure

### New Structure
```
apps/web/
├── prisma/
│   └── schema.prisma          # Serverless-optimized Prisma schema
├── src/
│   └── lib/
│       └── api-shared/        # Shared API utilities (no TypeScript aliases)
│           ├── config.ts      # Configuration
│           ├── db.ts          # Database connection with pooling
│           ├── supabase.ts    # Supabase clients
│           ├── security.ts    # Security utilities
│           ├── wallet.ts      # Wallet verification
│           ├── types.ts       # TypeScript types
│           └── middleware.ts  # API middleware helpers
└── pages/
    └── api/                   # Serverless API routes
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

### Old Structure (Can be deprecated)
```
apps/api/
├── src/
│   ├── index.ts              # Express app (NOT NEEDED for serverless)
│   ├── lib/                  # Old utilities with aliases
│   ├── middleware/           # Express middleware
│   ├── routes/               # Express routes
│   ├── services/
│   ├── types/
│   └── utils/
```

## Environment Variables

### Required Environment Variables for Serverless

Add these to your Vercel project settings:

```bash
# Database (Supabase)
DATABASE_URL="postgresql://..."              # Connection pooling URL
DIRECT_URL="postgresql://..."                # Direct connection for migrations

# Supabase
SUPABASE_URL="https://...supabase.co"
SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."

# Authentication
JWT_SECRET="..."                             # Min 64 chars
MAGIC_LINK_SECRET="..."                      # Min 64 chars

# Blockchain
CHAIN_ID="coreum-mainnet-1"
RPC_ENDPOINT="https://full-node.mainnet-1.coreum.dev:26657"
REST_ENDPOINT="https://full-node.mainnet-1.coreum.dev:1317"

# Frontend
NEXT_PUBLIC_FRONTEND_URL="https://your-domain.vercel.app"

# Optional
ORACLE_PRIVATE_KEY="..."
ORACLE_PUBLIC_KEY="..."
SENTRY_DSN="..."
```

## Conversion Pattern for Remaining Routes

### Template for Converting Express Routes to Serverless

**Old Express Route (apps/api/src/routes/example.ts):**
```typescript
import { Router } from 'express';
import { prisma } from '@/lib/db';
import { authenticate } from '@/middleware/auth';

const router = Router();

router.get('/example', authenticate, async (req, res) => {
  // Handler code
});

export default router;
```

**New Serverless Function (apps/web/pages/api/example.ts):**
```typescript
import { NextApiResponse } from 'next';
import { prisma } from '../../src/lib/api-shared/db';
import { withAuth } from '../../src/lib/api-shared/middleware';
import { AuthenticatedRequest } from '../../src/lib/api-shared/types';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // Handler code
    return res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ success: false, error: 'Internal error' });
  }
}

export default withAuth(handler);
```

### Middleware Options

```typescript
// No authentication
export default withMiddleware(handler);

// With authentication
export default withAuth(handler);

// With custom middleware
export default withMiddleware(handler, [authenticate, requireTMA]);
```

## Database Connection Pooling

### Supabase Configuration

In Supabase, you need TWO connection strings:

1. **Transaction Mode** (for `DATABASE_URL`):
   - Used by the application
   - Format: `postgresql://...?pgbouncer=true`
   - Supports connection pooling

2. **Session Mode** (for `DIRECT_URL`):
   - Used for migrations
   - Format: `postgresql://...` (no pgbouncer parameter)
   - Direct connection to database

### Getting Connection Strings from Supabase

1. Go to Project Settings → Database
2. Connection string under "Connection pooling" → Use for `DATABASE_URL`
3. Connection string under "Connection string" → Use for `DIRECT_URL`

## Deployment Steps

### 1. Install Dependencies

```bash
cd apps/web
pnpm install
```

### 2. Generate Prisma Client

```bash
cd apps/web
npx prisma generate
```

### 3. Run Migrations (if needed)

```bash
# Make sure DIRECT_URL is set in your .env
npx prisma migrate deploy
```

### 4. Test Locally

```bash
cd apps/web
pnpm dev
```

Test endpoints:
- http://localhost:3000/api/health
- http://localhost:3000/api/config

### 5. Deploy to Vercel

```bash
# From project root
vercel --prod
```

Or push to main branch for automatic deployment.

### 6. Set Environment Variables

In Vercel dashboard:
1. Go to Project Settings → Environment Variables
2. Add all required variables (see list above)
3. Redeploy

## Testing

### Test All Converted Endpoints

```bash
# Health check
curl https://your-domain.vercel.app/api/health

# Config
curl https://your-domain.vercel.app/api/config

# Wallet auth
curl -X POST https://your-domain.vercel.app/api/auth/wallet-auth \
  -H "Content-Type: application/json" \
  -d '{"address":"core1...","chain":"coreum","signature":"...","message":"..."}'

# Get user (requires auth)
curl https://your-domain.vercel.app/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Balances
curl https://your-domain.vercel.app/api/balances/core1...
```

## Performance Optimizations

### 1. Connection Pooling
- Using Prisma's connection pooling with Supabase
- Configured in `db.ts` with global singleton pattern

### 2. Cold Start Optimization
- Prisma JSON protocol enabled for faster queries
- Minimal dependencies in each function
- Lazy loading where possible

### 3. Function Configuration
- Memory: 1024 MB (configured in vercel.json)
- Max duration: 30 seconds
- Appropriate for database operations

## Monitoring

### Check Logs in Vercel
1. Go to Vercel Dashboard
2. Select your project
3. Go to "Functions" tab
4. Click on individual functions to see logs

### Common Issues

1. **Database Connection Errors**
   - Check `DATABASE_URL` is using connection pooling
   - Verify Supabase connection strings are correct

2. **Module Not Found Errors**
   - Ensure all imports use relative paths (no `@/` aliases in API routes)
   - Run `pnpm install` to install missing dependencies

3. **Prisma Client Not Generated**
   - Run `npx prisma generate` before deployment
   - Vercel build command includes this automatically

4. **Authentication Errors**
   - Verify `JWT_SECRET` and `MAGIC_LINK_SECRET` are set
   - Check they're minimum 64 characters

## Next Steps

1. Convert remaining routes following the pattern above
2. Test each endpoint thoroughly
3. Update frontend to use new API endpoints (if URLs changed)
4. Deprecate the old `/apps/api` Express server
5. Update all documentation

## Rollback Plan

If issues occur:
1. Revert Vercel deployment to previous version
2. Re-enable old API server temporarily
3. Fix issues and redeploy

## Support

For issues or questions:
1. Check Vercel function logs
2. Review Supabase connection status
3. Test endpoints locally first
4. Verify all environment variables are set

---

**Migration Date:** October 2, 2025  
**Status:** In Progress  
**Completed:** ~30% of endpoints converted

