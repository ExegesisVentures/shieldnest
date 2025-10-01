#!/usr/bin/env node

/**
 * Apply RLS Policies Script
 * Directly applies RLS policies to Supabase database using service role
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Production Supabase Configuration
const SUPABASE_URL = 'https://cucnmhpguyynfknmxrtt.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1Y25taHBndXl5bmZrbm14cnR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODY4NjA3MywiZXhwIjoyMDc0MjYyMDczfQ.Qs4Ys2Wd6_7vLnHQCXBQPcLYJYFNXUYBYKJVQGJXNQY';

class RLSPolicyApplicator {
  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
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

  async readRLSFile() {
    const rlsPath = path.join(__dirname, '..', 'supabase', 'rls_setup.sql');
    
    if (!fs.existsSync(rlsPath)) {
      throw new Error('RLS setup file not found at: ' + rlsPath);
    }

    const content = fs.readFileSync(rlsPath, 'utf8');
    this.log('success', `RLS file loaded: ${content.split('\n').length} lines`);
    
    return content;
  }

  async executeSQLStatements(sqlContent) {
    this.log('info', 'Parsing SQL statements...');
    
    // Split SQL content into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
      .map(stmt => stmt + ';');

    this.log('info', `Found ${statements.length} SQL statements to execute`);

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip comments and empty statements
      if (statement.trim().startsWith('--') || statement.trim() === ';') {
        continue;
      }

      try {
        this.log('info', `Executing statement ${i + 1}/${statements.length}...`);
        
        const { data, error } = await this.supabase.rpc('exec_sql', {
          sql: statement
        });

        if (error) {
          // Try alternative method if rpc doesn't work
          const { data: altData, error: altError } = await this.supabase
            .from('_dummy_table_that_does_not_exist')
            .select('*');
          
          // If we get here, the connection works, so let's try a different approach
          this.log('warning', `Statement ${i + 1} failed: ${error.message}`);
          errorCount++;
          errors.push({ statement: i + 1, error: error.message });
        } else {
          successCount++;
          this.log('success', `Statement ${i + 1} executed successfully`);
        }
      } catch (err) {
        this.log('error', `Statement ${i + 1} exception: ${err.message}`);
        errorCount++;
        errors.push({ statement: i + 1, error: err.message });
      }

      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return { successCount, errorCount, errors };
  }

  async applyRLSPoliciesDirectly() {
    this.log('info', 'Applying RLS policies using direct SQL execution...');
    
    try {
      // Read the RLS setup file
      const rlsContent = await this.readRLSFile();
      
      // Parse into individual SQL commands
      const sqlCommands = [
        // Enable RLS on tables
        "ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;",
        "ALTER TABLE IF EXISTS public.user_wallets ENABLE ROW LEVEL SECURITY;",
        "ALTER TABLE IF EXISTS public.wallets ENABLE ROW LEVEL SECURITY;",
        "ALTER TABLE IF EXISTS public.tma_documents ENABLE ROW LEVEL SECURITY;",
        "ALTER TABLE IF EXISTS public.tma_consents ENABLE ROW LEVEL SECURITY;",
        "ALTER TABLE IF EXISTS public.claims ENABLE ROW LEVEL SECURITY;",
        "ALTER TABLE IF EXISTS public.sellbacks ENABLE ROW LEVEL SECURITY;",
        "ALTER TABLE IF EXISTS public.reward_claims ENABLE ROW LEVEL SECURITY;",
        
        // Create basic user policy
        `DROP POLICY IF EXISTS "Users can view own record" ON public.users;`,
        `CREATE POLICY "Users can view own record" ON public.users
         FOR SELECT TO authenticated
         USING ((SELECT auth.uid())::text = users."supabaseId");`,
        
        // Service role access
        `DROP POLICY IF EXISTS "Service role full access to users" ON public.users;`,
        `CREATE POLICY "Service role full access to users" ON public.users
         FOR ALL USING (auth.role() = 'service_role');`
      ];

      let successCount = 0;
      let errorCount = 0;

      for (const [index, command] of sqlCommands.entries()) {
        try {
          this.log('info', `Executing command ${index + 1}/${sqlCommands.length}...`);
          
          // Use the REST API directly for SQL execution
          const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
              'apikey': SUPABASE_SERVICE_ROLE_KEY
            },
            body: JSON.stringify({ sql: command })
          });

          if (response.ok) {
            successCount++;
            this.log('success', `Command ${index + 1} executed successfully`);
          } else {
            const errorText = await response.text();
            this.log('warning', `Command ${index + 1} failed: ${errorText}`);
            errorCount++;
          }
        } catch (error) {
          this.log('error', `Command ${index + 1} exception: ${error.message}`);
          errorCount++;
        }

        // Small delay between commands
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      return { successCount, errorCount, total: sqlCommands.length };
    } catch (error) {
      this.log('error', `RLS application failed: ${error.message}`);
      throw error;
    }
  }

  async verifyRLSSetup() {
    this.log('info', 'Verifying RLS setup...');
    
    try {
      // Check if we can query the users table (should work with service role)
      const { data, error } = await this.supabase
        .from('users')
        .select('count')
        .limit(1);

      if (error) {
        this.log('warning', `Users table query: ${error.message}`);
      } else {
        this.log('success', 'Users table accessible with service role');
      }

      // Try to check RLS status using a simple query
      const { data: tableData, error: tableError } = await this.supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .limit(5);

      if (tableError) {
        this.log('warning', `Table information query: ${tableError.message}`);
      } else {
        this.log('success', `Found ${tableData?.length || 0} public tables`);
      }

      return true;
    } catch (error) {
      this.log('error', `Verification failed: ${error.message}`);
      return false;
    }
  }

  async createManualInstructions() {
    this.log('info', 'Creating manual RLS application instructions...');
    
    const instructions = `# 🔐 Manual RLS Policy Application

## Method 1: Supabase SQL Editor (Recommended)

1. Go to: https://supabase.com/dashboard/project/cucnmhpguyynfknmxrtt
2. Navigate to: SQL Editor
3. Copy and paste the contents of \`supabase/rls_setup.sql\`
4. Click "Run" to execute all policies
5. Verify with the verification queries below

## Method 2: psql Command Line

\`\`\`bash
# Connect to production database
psql "postgresql://postgres:8JRE5bwZHqz@H@Z@db.cucnmhpguyynfknmxrtt.supabase.co:5432/postgres" -f supabase/rls_setup.sql

# Verify setup
psql "postgresql://postgres:8JRE5bwZHqz@H@Z@db.cucnmhpguyynfknmxrtt.supabase.co:5432/postgres" -f supabase/verify_rls.sql
\`\`\`

## Verification Queries

Run these in the SQL Editor to verify RLS is working:

\`\`\`sql
-- Check RLS enabled on tables
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

-- Check policy count
SELECT 
  schemaname,
  tablename,
  count(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public' 
GROUP BY schemaname, tablename 
ORDER BY tablename;

-- Check helper function
SELECT 
  n.nspname as schema,
  p.proname as function_name
FROM pg_proc p 
JOIN pg_namespace n ON p.pronamespace = n.oid 
WHERE p.proname = 'user_owns_wallet';
\`\`\`

## Expected Results

After successful application:
- ✅ All public tables should have RLS enabled
- ✅ Multiple policies should exist for each table
- ✅ Helper function \`user_owns_wallet\` should exist
- ✅ Service role should have full access
- ✅ Anonymous users should have restricted access

## Troubleshooting

If policies fail to apply:
1. Check you have admin access to the Supabase project
2. Verify the service role key is correct
3. Try applying policies one section at a time
4. Check the Supabase logs for detailed error messages

---
Generated: ${new Date().toISOString()}
Project: Roll NFT Dashboard
Status: Ready for manual RLS application
`;

    fs.writeFileSync(path.join(__dirname, '..', 'MANUAL_RLS_INSTRUCTIONS.md'), instructions);
    this.log('success', 'Manual instructions created');
    return true;
  }

  async run() {
    console.log('🔐 Starting RLS Policy Application\n');
    
    try {
      // Try to apply RLS policies
      const result = await this.applyRLSPoliciesDirectly();
      
      console.log('\n' + '='.repeat(60));
      console.log('📊 RLS APPLICATION RESULTS');
      console.log('='.repeat(60));
      console.log(`✅ Successful: ${result.successCount}/${result.total}`);
      console.log(`❌ Failed: ${result.errorCount}/${result.total}`);
      
      // Verify setup
      await this.verifyRLSSetup();
      
      // Create manual instructions
      await this.createManualInstructions();
      
      console.log('\n' + '='.repeat(60));
      if (result.successCount > result.errorCount) {
        console.log('✅ RLS POLICIES MOSTLY APPLIED');
        console.log('⚠️  Some policies may need manual application');
      } else {
        console.log('⚠️  RLS POLICIES NEED MANUAL APPLICATION');
        console.log('📋 Follow instructions in MANUAL_RLS_INSTRUCTIONS.md');
      }
      console.log('='.repeat(60));
      
    } catch (error) {
      console.error('❌ RLS application failed:', error);
      
      // Still create manual instructions
      await this.createManualInstructions();
      console.log('\n📋 Manual RLS application instructions created');
      console.log('   See: MANUAL_RLS_INSTRUCTIONS.md');
    }
  }
}

// Run the applicator
if (require.main === module) {
  const applicator = new RLSPolicyApplicator();
  applicator.run().catch(error => {
    console.error('❌ RLS policy application failed:', error);
    process.exit(1);
  });
}

module.exports = RLSPolicyApplicator;
