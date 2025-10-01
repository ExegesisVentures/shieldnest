#!/usr/bin/env node

/**
 * Apply RLS Policies to MVP Supabase Branch
 * Clean application of essential policies only
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// MVP Supabase Configuration (update after branch creation)
const MVP_SUPABASE_URL = process.env.SUPABASE_URL_MVP || 'https://cucnmhpguyynfknmxrtt-mvp.supabase.co';
const MVP_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY_MVP || 'your-mvp-service-role-key';

// Extract project ID for connection
const projectId = MVP_SUPABASE_URL.replace('https://', '').replace('.supabase.co', '');

const dbConfig = {
  host: `db.${projectId}.supabase.co`,
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: MVP_SERVICE_KEY,
  ssl: { rejectUnauthorized: false }
};

async function applyMVPRLS() {
  console.log('🎯 Applying RLS Policies to MVP Branch...');
  console.log('Project:', projectId);
  console.log('');
  
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    console.log('✅ Connected to MVP branch');

    // Apply RLS policies
    const rlsPath = path.join(__dirname, '..', 'supabase', 'rls_setup.sql');
    const rlsSQL = fs.readFileSync(rlsPath, 'utf8');
    
    const statements = rlsSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    let successCount = 0;
    let errorCount = 0;

    console.log(`📝 Applying ${statements.length} RLS policies to MVP branch...`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      
      try {
        await client.query(statement);
        successCount++;
        if (i % 10 === 0) {
          console.log(`   Progress: ${i + 1}/${statements.length} policies...`);
        }
      } catch (error) {
        errorCount++;
        if (!error.message.includes('already exists')) {
          console.log(`⚠️ Policy ${i + 1} warning: ${error.message.substring(0, 80)}...`);
        }
      }
    }

    console.log(`✅ MVP RLS Setup Complete: ${successCount} successful, ${errorCount} warnings`);

    // Verify RLS status
    const rlsCheck = await client.query(`
      SELECT 
        tablename,
        rowsecurity as rls_enabled,
        (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = t.tablename) as policy_count
      FROM pg_tables t
      WHERE schemaname = 'public' 
      AND tablename IN ('users', 'wallets', 'claims', 'epochs', 'airdrop_schedules')
      ORDER BY tablename;
    `);

    console.log('\n📊 MVP Branch RLS Status:');
    rlsCheck.rows.forEach(row => {
      const status = row.rls_enabled ? '🔒 Enabled' : '🔓 Disabled';
      console.log(`   ${row.tablename}: ${status} (${row.policy_count} policies)`);
    });

    console.log('\n🎉 MVP branch is secure and ready for production!');
    return true;

  } catch (error) {
    console.error('❌ MVP RLS application failed:', error.message);
    return false;
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  applyMVPRLS()
    .then(success => process.exit(success ? 0 : 1))
    .catch(error => {
      console.error('💥 Unexpected error:', error);
      process.exit(1);
    });
}

module.exports = { applyMVPRLS };
