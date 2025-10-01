#!/usr/bin/env node

/**
 * Create Supabase Development Branch using Direct PostgreSQL Connection
 * Uses service role key to create branch and configure database
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Environment variables (you'll need to set these)
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';

// Extract database connection details from Supabase URL
const projectId = SUPABASE_URL.replace('https://', '').replace('.supabase.co', '');

// PostgreSQL connection configuration
const dbConfig = {
  host: `db.${projectId}.supabase.co`,
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: SUPABASE_SERVICE_ROLE_KEY,
  ssl: { rejectUnauthorized: false }
};

async function createDevelopmentBranch() {
  console.log('🚀 Creating Supabase Development Branch via Direct Connection...\n');
  
  const client = new Client(dbConfig);
  
  try {
    // Step 1: Connect to database
    console.log('1️⃣ Connecting to Supabase database...');
    await client.connect();
    console.log('✅ Connected successfully');

    // Step 2: Create development schema
    console.log('\n2️⃣ Creating development schema...');
    const createSchemaSQL = `
      -- Create development schema (simulates branch)
      CREATE SCHEMA IF NOT EXISTS dev;
      
      -- Grant permissions
      GRANT USAGE ON SCHEMA dev TO postgres, anon, authenticated, service_role;
      GRANT ALL ON ALL TABLES IN SCHEMA dev TO postgres, anon, authenticated, service_role;
      GRANT ALL ON ALL SEQUENCES IN SCHEMA dev TO postgres, anon, authenticated, service_role;
      GRANT ALL ON ALL FUNCTIONS IN SCHEMA dev TO postgres, anon, authenticated, service_role;
      
      -- Set default privileges for future objects
      ALTER DEFAULT PRIVILEGES IN SCHEMA dev GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
      ALTER DEFAULT PRIVILEGES IN SCHEMA dev GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;
      ALTER DEFAULT PRIVILEGES IN SCHEMA dev GRANT ALL ON FUNCTIONS TO postgres, anon, authenticated, service_role;
      
      -- Create a marker table to identify this as dev branch
      CREATE TABLE IF NOT EXISTS dev.branch_info (
        branch_name TEXT PRIMARY KEY,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        status TEXT DEFAULT 'active'
      );
      
      INSERT INTO dev.branch_info (branch_name, status) 
      VALUES ('development', 'active') 
      ON CONFLICT (branch_name) DO UPDATE SET created_at = NOW();
    `;

    await client.query(createSchemaSQL);
    console.log('✅ Development schema created');

    // Step 3: Apply RLS policies to public schema (main tables)
    console.log('\n3️⃣ Applying RLS policies to main tables...');
    const rlsPath = path.join(__dirname, '..', 'supabase', 'rls_setup.sql');
    
    if (!fs.existsSync(rlsPath)) {
      console.error('❌ RLS setup file not found:', rlsPath);
      return false;
    }

    const rlsSQL = fs.readFileSync(rlsPath, 'utf8');
    
    // Split SQL into individual statements and filter out comments
    const statements = rlsSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('/*'));

    let successCount = 0;
    let errorCount = 0;

    console.log(`📝 Processing ${statements.length} RLS statements...`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      
      try {
        await client.query(statement);
        successCount++;
        if (i % 10 === 0) {
          console.log(`   Processed ${i + 1}/${statements.length} statements...`);
        }
      } catch (error) {
        errorCount++;
        if (error.message.includes('already exists') || error.message.includes('does not exist')) {
          // These are expected for some statements
          continue;
        }
        console.log(`⚠️ Statement ${i + 1} warning: ${error.message.substring(0, 80)}...`);
      }
    }

    console.log(`✅ RLS Policies Applied: ${successCount} successful, ${errorCount} warnings`);

    // Step 4: Verify RLS is enabled
    console.log('\n4️⃣ Verifying RLS status...');
    const rlsCheckQuery = `
      SELECT 
        schemaname,
        tablename,
        rowsecurity as rls_enabled,
        (SELECT COUNT(*) FROM pg_policies WHERE schemaname = t.schemaname AND tablename = t.tablename) as policy_count
      FROM pg_tables t
      WHERE schemaname = 'public' 
      AND tablename IN ('users', 'wallets', 'claims', 'epochs', 'airdrop_schedules')
      ORDER BY tablename;
    `;

    const rlsResult = await client.query(rlsCheckQuery);
    
    if (rlsResult.rows.length > 0) {
      console.log('✅ RLS Status for key tables:');
      rlsResult.rows.forEach(row => {
        const status = row.rls_enabled ? '🔒 Enabled' : '🔓 Disabled';
        console.log(`   ${row.tablename}: ${status} (${row.policy_count} policies)`);
      });
    }

    // Step 5: Create development environment configuration
    console.log('\n5️⃣ Creating development environment configuration...');
    
    const devEnvConfig = `# Supabase Development Branch Configuration
# Generated on ${new Date().toISOString()}

# Database Configuration
SUPABASE_URL=${SUPABASE_URL}
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}

# Database Direct Connection
DATABASE_URL=postgresql://postgres:${SUPABASE_SERVICE_ROLE_KEY}@db.${projectId}.supabase.co:5432/postgres

# Environment Settings
NODE_ENV=development
ENVIRONMENT=development
BRANCH=dev

# API Configuration
API_URL=http://localhost:3001
WEB_URL=http://localhost:3000

# Security Settings
JWT_SECRET=your-jwt-secret-here
MAGIC_LINK_SECRET=your-magic-link-secret-here

# Blockchain Configuration (if needed)
CHAIN_ID=1
RPC_ENDPOINT=https://eth-mainnet.alchemyapi.io/v2/your-key
REST_ENDPOINT=https://api.etherscan.io/api
`;

    const envPath = path.join(__dirname, '..', '.env.development');
    fs.writeFileSync(envPath, devEnvConfig);
    console.log('✅ Development environment file created:', envPath);

    // Step 6: Create branch status summary
    const summaryQuery = `
      SELECT 
        'Tables with RLS' as metric,
        COUNT(*) as count
      FROM pg_tables 
      WHERE schemaname = 'public' AND rowsecurity = true
      UNION ALL
      SELECT 
        'Total Policies' as metric,
        COUNT(*) as count
      FROM pg_policies 
      WHERE schemaname = 'public'
      UNION ALL
      SELECT 
        'Development Schema' as metric,
        CASE WHEN EXISTS(SELECT 1 FROM information_schema.schemata WHERE schema_name = 'dev') THEN 1 ELSE 0 END as count;
    `;

    const summary = await client.query(summaryQuery);
    
    console.log('\n📊 Development Branch Summary:');
    summary.rows.forEach(row => {
      console.log(`   ${row.metric}: ${row.count}`);
    });

    console.log('\n🎉 Development branch created successfully!');
    console.log('\n📋 Next Steps:');
    console.log('   1. Copy .env.development to your apps and update with actual keys');
    console.log('   2. Test database connections from your applications');
    console.log('   3. Deploy to Vercel with development environment variables');
    console.log('   4. Run integration tests against the development branch');
    console.log('\n🔗 Useful Commands:');
    console.log('   • Test connection: node scripts/test-db-connection.js');
    console.log('   • Deploy to Vercel: vercel --env .env.development');
    console.log('   • View logs: supabase logs');

    return true;

  } catch (error) {
    console.error('❌ Failed to create development branch:', error.message);
    console.error('Stack:', error.stack);
    return false;
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
}

// Show configuration and run
console.log('🔧 Configuration:');
console.log(`   Project ID: ${projectId}`);
console.log(`   Database Host: db.${projectId}.supabase.co`);
console.log(`   Service Role Key: ${SUPABASE_SERVICE_ROLE_KEY ? '✅ Provided' : '❌ Missing'}`);
console.log('');

if (!SUPABASE_SERVICE_ROLE_KEY || SUPABASE_SERVICE_ROLE_KEY === 'your-service-role-key') {
  console.error('❌ Please set SUPABASE_SERVICE_ROLE_KEY environment variable');
  console.log('Usage: SUPABASE_SERVICE_ROLE_KEY=your-key node scripts/create-dev-branch-direct.js');
  process.exit(1);
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
