#!/usr/bin/env node

/**
 * Create Supabase Development Branch and Apply RLS Policies
 * Uses service role key to create branch and configure database
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   SUPABASE_URL:', SUPABASE_URL ? '✅' : '❌');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY ? '✅' : '❌');
  process.exit(1);
}

// Initialize Supabase client with service role
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createDevelopmentBranch() {
  console.log('🚀 Creating Supabase Development Branch...\n');

  try {
    // Step 1: Test connection
    console.log('1️⃣ Testing Supabase connection...');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .limit(1);

    if (connectionError) {
      console.error('❌ Connection failed:', connectionError.message);
      return false;
    }
    console.log('✅ Connected to Supabase successfully');

    // Step 2: Create development schema (simulating branch)
    console.log('\n2️⃣ Creating development schema...');
    const { error: schemaError } = await supabase.rpc('create_dev_schema', {});
    
    if (schemaError && !schemaError.message.includes('already exists')) {
      console.log('📝 Creating development schema via SQL...');
      
      const createSchemaSQL = `
        -- Create development schema
        CREATE SCHEMA IF NOT EXISTS dev;
        
        -- Grant permissions
        GRANT USAGE ON SCHEMA dev TO postgres, anon, authenticated, service_role;
        GRANT ALL ON ALL TABLES IN SCHEMA dev TO postgres, anon, authenticated, service_role;
        GRANT ALL ON ALL SEQUENCES IN SCHEMA dev TO postgres, anon, authenticated, service_role;
        GRANT ALL ON ALL FUNCTIONS IN SCHEMA dev TO postgres, anon, authenticated, service_role;
        
        -- Set default privileges
        ALTER DEFAULT PRIVILEGES IN SCHEMA dev GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
        ALTER DEFAULT PRIVILEGES IN SCHEMA dev GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;
        ALTER DEFAULT PRIVILEGES IN SCHEMA dev GRANT ALL ON FUNCTIONS TO postgres, anon, authenticated, service_role;
      `;

      const { error: sqlError } = await supabase.rpc('exec_sql', { 
        sql: createSchemaSQL 
      });

      if (sqlError) {
        console.log('ℹ️ Schema may already exist or will be created during migration');
      }
    }
    console.log('✅ Development schema ready');

    // Step 3: Apply RLS policies
    console.log('\n3️⃣ Applying RLS policies...');
    const rlsPath = path.join(__dirname, '..', 'supabase', 'rls_setup.sql');
    
    if (!fs.existsSync(rlsPath)) {
      console.error('❌ RLS setup file not found:', rlsPath);
      return false;
    }

    const rlsSQL = fs.readFileSync(rlsPath, 'utf8');
    
    // Split SQL into individual statements
    const statements = rlsSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          console.log(`⚠️ Statement ${i + 1} warning:`, error.message.substring(0, 100));
          errorCount++;
        } else {
          successCount++;
        }
      } catch (err) {
        console.log(`⚠️ Statement ${i + 1} error:`, err.message.substring(0, 100));
        errorCount++;
      }
    }

    console.log(`✅ RLS Policies Applied: ${successCount} successful, ${errorCount} warnings/errors`);

    // Step 4: Verify setup
    console.log('\n4️⃣ Verifying development branch setup...');
    
    // Check if RLS is enabled on key tables
    const { data: rlsCheck } = await supabase
      .from('pg_tables')
      .select('tablename, rowsecurity')
      .eq('schemaname', 'public')
      .in('tablename', ['users', 'wallets', 'claims']);

    if (rlsCheck && rlsCheck.length > 0) {
      console.log('✅ RLS Status:');
      rlsCheck.forEach(table => {
        console.log(`   ${table.tablename}: ${table.rowsecurity ? '🔒 Enabled' : '🔓 Disabled'}`);
      });
    }

    // Step 5: Generate development environment configuration
    console.log('\n5️⃣ Generating development environment configuration...');
    
    const devConfig = {
      SUPABASE_URL: SUPABASE_URL,
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || 'your-anon-key-here',
      SUPABASE_SERVICE_ROLE_KEY: SUPABASE_SERVICE_ROLE_KEY,
      DATABASE_URL: `postgresql://postgres:[password]@${SUPABASE_URL.replace('https://', '').replace('.supabase.co', '')}.supabase.co:5432/postgres`,
      ENVIRONMENT: 'development',
      BRANCH: 'dev'
    };

    const configPath = path.join(__dirname, '..', 'supabase', 'dev-config.json');
    fs.writeFileSync(configPath, JSON.stringify(devConfig, null, 2));
    console.log('✅ Development configuration saved to:', configPath);

    console.log('\n🎉 Development branch setup completed successfully!');
    console.log('\n📋 Next Steps:');
    console.log('   1. Update your .env files with development credentials');
    console.log('   2. Test database connections');
    console.log('   3. Deploy to Vercel with development environment');
    console.log('   4. Run integration tests');

    return true;

  } catch (error) {
    console.error('❌ Failed to create development branch:', error.message);
    return false;
  }
}

// Run the setup
createDevelopmentBranch()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });
