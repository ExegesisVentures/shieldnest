#!/usr/bin/env node

/**
 * Supabase Development Branch Setup Script
 * Creates development branch and applies RLS policies
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Production Supabase Configuration
const SUPABASE_URL = 'https://cucnmhpguyynfknmxrtt.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1Y25taHBndXl5bmZrbm14cnR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODY4NjA3MywiZXhwIjoyMDc0MjYyMDczfQ.Qs4Ys2Wd6_7vLnHQCXBQPcLYJYFNXUYBYKJVQGJXNQY';

class SupabaseBranchManager {
  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    this.projectRef = 'cucnmhpguyynfknmxrtt';
  }

  log(type, message) {
    const timestamp = new Date().toISOString();
    const prefix = {
      error: '❌',
      warning: '⚠️',
      success: '✅',
      info: 'ℹ️'
    }[type] || 'ℹ️';
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async createDevelopmentBranch() {
    this.log('info', 'Creating Supabase development branch...');
    
    try {
      // Note: Supabase branch creation is typically done via the dashboard or CLI
      // This script will prepare the environment and provide instructions
      
      this.log('info', 'Supabase branch creation requires dashboard access');
      this.log('info', 'Please follow these steps:');
      console.log('\n📋 SUPABASE BRANCH CREATION STEPS:');
      console.log('1. Go to https://supabase.com/dashboard/project/cucnmhpguyynfknmxrtt');
      console.log('2. Navigate to Project → Branches');
      console.log('3. Click "Create branch"');
      console.log('4. Set branch name: "dev"');
      console.log('5. Set base branch: "main"');
      console.log('6. Wait for branch creation to complete');
      console.log('7. Collect the new branch credentials\n');
      
      // Prepare RLS setup for when branch is ready
      await this.prepareRLSSetup();
      
      return true;
    } catch (error) {
      this.log('error', `Failed to prepare branch setup: ${error.message}`);
      return false;
    }
  }

  async prepareRLSSetup() {
    this.log('info', 'Preparing RLS policies for development branch...');
    
    const rlsPath = path.join(__dirname, '..', 'supabase', 'rls_setup.sql');
    
    if (!fs.existsSync(rlsPath)) {
      this.log('error', 'RLS setup file not found');
      return false;
    }

    const rlsContent = fs.readFileSync(rlsPath, 'utf8');
    this.log('success', `RLS setup file ready: ${rlsContent.split('\n').length} lines`);
    
    // Create a verification script
    const verificationScript = `
-- Verification queries for RLS setup
-- Run these after applying rls_setup.sql

-- 1) Check RLS enabled on all tables
SELECT 
  schemaname, 
  tablename, 
  rowsecurity as rls_enabled,
  CASE 
    WHEN rowsecurity THEN '✅ Enabled'
    ELSE '❌ Disabled'
  END as status
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- 2) Check policy count for each table
SELECT 
  schemaname,
  tablename,
  count(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public' 
GROUP BY schemaname, tablename 
ORDER BY tablename;

-- 3) Check helper function exists
SELECT 
  n.nspname as schema,
  p.proname as function_name,
  CASE 
    WHEN p.proname = 'user_owns_wallet' THEN '✅ Found'
    ELSE '❓ Unknown'
  END as status
FROM pg_proc p 
JOIN pg_namespace n ON p.pronamespace = n.oid 
WHERE p.proname = 'user_owns_wallet';

-- 4) Test basic RLS functionality (run as authenticated user)
-- This should return only the current user's data
-- SELECT * FROM users WHERE "supabaseId" = auth.uid()::text;
`;

    const verificationPath = path.join(__dirname, '..', 'supabase', 'verify_rls.sql');
    fs.writeFileSync(verificationPath, verificationScript);
    this.log('success', 'RLS verification script created');

    return true;
  }

  async testDatabaseConnection() {
    this.log('info', 'Testing database connection...');
    
    try {
      // Test basic connection
      const { data, error } = await this.supabase
        .from('users')
        .select('count')
        .limit(1);

      if (error) {
        this.log('warning', `Database query returned error (this may be expected): ${error.message}`);
      } else {
        this.log('success', 'Database connection successful');
      }

      // Test service role permissions
      const { data: authData, error: authError } = await this.supabase.auth.admin.listUsers();
      
      if (authError) {
        this.log('warning', `Auth admin access error: ${authError.message}`);
      } else {
        this.log('success', `Service role access confirmed - found ${authData.users?.length || 0} users`);
      }

      return true;
    } catch (error) {
      this.log('error', `Database connection test failed: ${error.message}`);
      return false;
    }
  }

  async generateEnvironmentFiles() {
    this.log('info', 'Generating environment configuration files...');
    
    // Development environment template
    const devEnvTemplate = `# =============== DEVELOPMENT ENVIRONMENT ===============
# Use these values after creating your Supabase development branch

# =============== DATABASE ===============
DATABASE_URL=postgresql://postgres:8JRE5bwZHqz@H@Z@db.YOUR_DEV_BRANCH.supabase.co:5432/postgres

# Supabase Development Branch Configuration
SUPABASE_URL=https://YOUR_DEV_BRANCH.supabase.co
SUPABASE_ANON_KEY=YOUR_DEV_BRANCH_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_DEV_BRANCH_SERVICE_ROLE_KEY

# =============== BLOCKCHAIN CONFIG ===============
CHAIN_ID=coreum-mainnet-1
RPC_ENDPOINT=https://full-node.mainnet-1.coreum.dev:26657
REST_ENDPOINT=https://full-node.mainnet-1.coreum.dev:1317

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

# =============== AUTH CONFIG ===============
JWT_SECRET=your_super_secret_jwt_key_minimum_64_characters_for_security_requirements_dev
MAGIC_LINK_SECRET=your_magic_link_secret_minimum_64_characters_for_security_requirements_dev

# =============== DEPLOYMENT ===============
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000
`;

    const prodEnvTemplate = `# =============== PRODUCTION ENVIRONMENT ===============
# Use these values for production deployment

# =============== DATABASE ===============
DATABASE_URL=postgresql://postgres:8JRE5bwZHqz@H@Z@db.cucnmhpguyynfknmxrtt.supabase.co:5432/postgres

# Supabase Production Configuration
SUPABASE_URL=https://cucnmhpguyynfknmxrtt.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1Y25taHBndXl5bmZrbm14cnR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2ODYwNzMsImV4cCI6MjA3NDI2MjA3M30.3Kmj29wW0HWBgX4x6X8niPOFuH45nkZFePBK3cC1C50
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1Y25taHBndXl5bmZrbm14cnR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODY4NjA3MywiZXhwIjoyMDc0MjYyMDczfQ.Qs4Ys2Wd6_7vLnHQCXBQPcLYJYFNXUYBYKJVQGJXNQY

# =============== BLOCKCHAIN CONFIG ===============
CHAIN_ID=coreum-mainnet-1
RPC_ENDPOINT=https://full-node.mainnet-1.coreum.dev:26657
REST_ENDPOINT=https://full-node.mainnet-1.coreum.dev:1317

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

# =============== AUTH CONFIG ===============
JWT_SECRET=your_super_secret_jwt_key_minimum_64_characters_for_security_requirements_prod
MAGIC_LINK_SECRET=your_magic_link_secret_minimum_64_characters_for_security_requirements_prod

# =============== DEPLOYMENT ===============
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://your-production-domain.com
`;

    // Write environment templates
    fs.writeFileSync(path.join(__dirname, '..', 'env.dev.template'), devEnvTemplate);
    fs.writeFileSync(path.join(__dirname, '..', 'env.prod.template'), prodEnvTemplate);
    
    this.log('success', 'Environment templates created');
    return true;
  }

  async generateSetupInstructions() {
    this.log('info', 'Generating setup instructions...');
    
    const instructions = `# 🚀 Supabase Development Branch Setup Instructions

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
   - Branch name: \`dev\`
   - Base branch: \`main\`
   - Wait for creation to complete

### Collect Development Branch Credentials:
After branch creation, go to Project Settings → API and collect:

\`\`\`bash
# Development Branch Credentials (replace with actual values)
SUPABASE_URL_DEV=https://cucnmhpguyynfknmxrtt-dev.supabase.co
SUPABASE_ANON_KEY_DEV=your_dev_anon_key_here
SUPABASE_SERVICE_ROLE_KEY_DEV=your_dev_service_role_key_here
DATABASE_URL_DEV=postgresql://postgres:8JRE5bwZHqz@H@Z@db.cucnmhpguyynfknmxrtt-dev.supabase.co:5432/postgres
\`\`\`

## Step 2: Apply RLS Policies

### Using psql:
\`\`\`bash
# Connect to development branch and apply RLS
psql "postgresql://postgres:8JRE5bwZHqz@H@Z@db.YOUR_DEV_BRANCH.supabase.co:5432/postgres" -f supabase/rls_setup.sql

# Verify RLS setup
psql "postgresql://postgres:8JRE5bwZHqz@H@Z@db.YOUR_DEV_BRANCH.supabase.co:5432/postgres" -f supabase/verify_rls.sql
\`\`\`

### Using Supabase SQL Editor:
1. Go to your development branch dashboard
2. Navigate to: SQL Editor
3. Copy and paste the contents of \`supabase/rls_setup.sql\`
4. Execute the SQL
5. Run verification queries from \`supabase/verify_rls.sql\`

## Step 3: Update Environment Variables

### For Development:
1. Copy \`env.dev.template\` to \`apps/api/.env\`
2. Replace placeholder values with actual development branch credentials
3. Copy \`apps/web/env.template\` to \`apps/web/.env\`
4. Update with development branch values

### For Production Deployment:
1. Use \`env.prod.template\` values for Vercel environment variables
2. Add GitHub secrets for CI/CD pipeline

## Step 4: Test Setup

### Test Database Connection:
\`\`\`bash
# Test development branch connection
node scripts/test-db-connection.js dev

# Test production connection
node scripts/test-db-connection.js prod
\`\`\`

### Test Application:
\`\`\`bash
# Start development servers
cd apps/api && npm run dev
cd apps/web && npm run dev

# Test health endpoint
curl http://localhost:3001/health
\`\`\`

## Step 5: Deploy to Staging

### GitHub Repository:
1. Push code to GitHub repository
2. Ensure all secrets are configured
3. Push to \`develop\` branch for staging deployment

### Vercel Configuration:
1. Create API project pointing to \`apps/api\`
2. Create Web project pointing to \`apps/web\`
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

**Generated**: ${new Date().toISOString()}
**Project**: Roll NFT Dashboard
**Status**: Ready for development branch setup
`;

    fs.writeFileSync(path.join(__dirname, '..', 'SUPABASE_SETUP_INSTRUCTIONS.md'), instructions);
    this.log('success', 'Setup instructions created');
    return true;
  }

  async run() {
    console.log('🚀 Starting Supabase Development Branch Setup\n');
    
    try {
      // Test current connection
      await this.testDatabaseConnection();
      
      // Prepare branch creation
      await this.createDevelopmentBranch();
      
      // Generate environment files
      await this.generateEnvironmentFiles();
      
      // Generate setup instructions
      await this.generateSetupInstructions();
      
      console.log('\n' + '='.repeat(60));
      console.log('✅ SUPABASE SETUP PREPARATION COMPLETE');
      console.log('='.repeat(60));
      console.log('\n📋 Next Steps:');
      console.log('1. Follow instructions in SUPABASE_SETUP_INSTRUCTIONS.md');
      console.log('2. Create development branch via Supabase dashboard');
      console.log('3. Apply RLS policies using supabase/rls_setup.sql');
      console.log('4. Update environment variables with branch credentials');
      console.log('5. Test the setup and deploy to staging');
      console.log('\n🎯 Ready for production deployment after setup completion!');
      
    } catch (error) {
      console.error('❌ Setup failed:', error);
      process.exit(1);
    }
  }
}

// Run the setup
if (require.main === module) {
  const manager = new SupabaseBranchManager();
  manager.run().catch(error => {
    console.error('❌ Supabase setup failed:', error);
    process.exit(1);
  });
}

module.exports = SupabaseBranchManager;
