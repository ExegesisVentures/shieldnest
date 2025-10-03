# ShieldNest Setup Guide

## 🚀 Quick Start with Your Infrastructure

### 1. Environment Configuration

Create `.env.local` in `apps/web/` with your Supabase credentials:

```bash
# Supabase Configuration (Your provided credentials)
NEXT_PUBLIC_SUPABASE_URL=https://yzzyyfrpumopzjydrhfj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6enl5ZnJwdW1vcHpqeWRyaGZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0NTk2NjAsImV4cCI6MjA3NTAzNTY2MH0.KtzrZX60h7rXVtU_HJ-Z9KLZPC8whQBj7MzLdq58_tk

# Get this from Supabase Dashboard > Settings > API > service_role key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Coreum Configuration (using mainnet)
NEXT_PUBLIC_COREUM_CHAIN_ID=coreum-mainnet-1
NEXT_PUBLIC_COREUM_RPC=https://full-node.mainnet-1.coreum.dev:26657
NEXT_PUBLIC_COREUM_REST=https://full-node.mainnet-1.coreum.dev:1317

# Admin Configuration
ADMIN_SECRET_KEY=shieldnest_admin_2025_secure_key

# Environment
NODE_ENV=development
```

### 2. Install Dependencies

```bash
cd apps/web
npm install
```

### 3. Database Setup

1. Go to your [Supabase Dashboard](https://yzzyyfrpumopzjydrhfj.supabase.co)
2. Navigate to SQL Editor
3. Run the schema from `docs/supabase-schema.sql`

### 4. Get Service Role Key

1. In Supabase Dashboard, go to **Settings** > **API**
2. Copy the `service_role` key (not anon key)
3. Add it to your `.env.local` as `SUPABASE_SERVICE_ROLE_KEY`

### 5. Start Development

```bash
npm run dev
```

## 🌐 Vercel Deployment

### Environment Variables for Vercel

In your Vercel dashboard, add these environment variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://yzzyyfrpumopzjydrhfj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6enl5ZnJwdW1vcHpqeWRyaGZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0NTk2NjAsImV4cCI6MjA3NTAzNTY2MH0.KtzrZX60h7rXVtU_HJ-Z9KLZPC8whQBj7MzLdq58_tk
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_COREUM_CHAIN_ID=coreum-mainnet-1
NEXT_PUBLIC_COREUM_RPC=https://full-node.mainnet-1.coreum.dev:26657
NEXT_PUBLIC_COREUM_REST=https://full-node.mainnet-1.coreum.dev:1317
ADMIN_SECRET_KEY=shieldnest_admin_2025_secure_key
NODE_ENV=production
```

### Vercel Configuration

The `next.config.js` is already optimized for Vercel deployment with:
- SSR support for Supabase
- Security headers
- Environment variable handling

## 📦 GitHub Repository Setup

To push to your repository at https://github.com/ExegesisVentures/shieldnestorg.git:

```bash
# Initialize git (if not already)
cd /Users/exe/Downloads/Cursor/Personal_Projects/ShieldNest/shieldnest
git init

# Add remote
git remote add origin https://github.com/ExegesisVentures/shieldnestorg.git

# Add all files
git add .

# Initial commit
git commit -m "feat: Initial ShieldNest M1 implementation

- Complete Supabase schema with RLS
- Wallet connectors (Keplr, Leap, Cosmostation)
- Visitor state management with upgrade nudges
- Portfolio tracking with Coreum integration
- Shield NFT placeholder system
- Unified error handling with Sentry
- Production-ready Next.js application"

# Push to main
git branch -M main
git push -u origin main
```

## 🔧 Alternative Supabase Connection Methods

Since you mentioned other connection methods, here are the options:

### Direct Connection
```typescript
// For direct database connections (not recommended for client-side)
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://yzzyyfrpumopzjydrhfj.supabase.co',
  'your_service_role_key', // Use service role for direct
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)
```

### Session-based (Current Implementation)
```typescript
// Already implemented in src/lib/supabase/server.ts
import { createServerSupabaseClient } from '@/lib/supabase/server'
const supabase = createServerSupabaseClient() // Handles sessions automatically
```

### Transaction Support
```typescript
// For database transactions
const { data, error } = await supabase.rpc('your_stored_procedure', {
  // transaction parameters
})
```

## 🚨 Important Next Steps

1. **Get Service Role Key**: This is critical for admin functions
2. **Run Database Schema**: Essential for the app to work
3. **Test Wallet Connection**: Verify Coreum integration works
4. **Deploy to Vercel**: Connect your GitHub repo to Vercel

## 📋 Verification Checklist

- [ ] `.env.local` created with all credentials
- [ ] Dependencies installed (`npm install`)
- [ ] Database schema applied in Supabase
- [ ] Service role key obtained and added
- [ ] Development server running (`npm run dev`)
- [ ] Wallet connection tested
- [ ] GitHub repository configured
- [ ] Vercel deployment ready

Let me know if you need help with any of these steps or want me to explain any specific connection method!
