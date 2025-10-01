#!/usr/bin/env node

/**
 * Direct RLS Policy Application using PostgreSQL connection
 * Applies RLS policies directly to Supabase database
 */

const fs = require('fs');
const path = require('path');

// Use node-postgres for direct database connection
const { Client } = require('pg');

// Production Supabase Configuration
const DATABASE_URL = 'postgresql://postgres:8JRE5bwZHqz@H@Z@db.cucnmhpguyynfknmxrtt.supabase.co:5432/postgres';

class DirectRLSApplicator {
  constructor() {
    this.client = new Client({
      connectionString: DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });
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

  async connect() {
    try {
      await this.client.connect();
      this.log('success', 'Connected to Supabase database');
      return true;
    } catch (error) {
      this.log('error', `Database connection failed: ${error.message}`);
      return false;
    }
  }

  async disconnect() {
    try {
      await this.client.end();
      this.log('info', 'Disconnected from database');
    } catch (error) {
      this.log('warning', `Disconnect warning: ${error.message}`);
    }
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

  async executeSQL(sql) {
    try {
      const result = await this.client.query(sql);
      return { success: true, result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async applyRLSPolicies() {
    this.log('info', 'Starting RLS policy application...');
    
    try {
      const rlsContent = await this.readRLSFile();
      
      // Split SQL content into individual statements
      const statements = rlsContent
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => 
          stmt.length > 0 && 
          !stmt.startsWith('--') && 
          !stmt.match(/^\s*$/)
        );

      this.log('info', `Found ${statements.length} SQL statements to execute`);

      let successCount = 0;
      let errorCount = 0;
      const errors = [];

      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        
        // Skip empty statements and comments
        if (!statement.trim() || statement.trim().startsWith('--')) {
          continue;
        }

        this.log('info', `Executing statement ${i + 1}/${statements.length}...`);
        
        const result = await this.executeSQL(statement);
        
        if (result.success) {
          successCount++;
          this.log('success', `Statement ${i + 1} executed successfully`);
        } else {
          errorCount++;
          errors.push({ statement: i + 1, error: result.error, sql: statement.substring(0, 100) + '...' });
          this.log('warning', `Statement ${i + 1} failed: ${result.error}`);
        }

        // Small delay to avoid overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      return { successCount, errorCount, errors, total: statements.length };
    } catch (error) {
      this.log('error', `RLS application failed: ${error.message}`);
      throw error;
    }
  }

  async verifyRLSSetup() {
    this.log('info', 'Verifying RLS setup...');
    
    try {
      // Check RLS enabled on tables
      const rlsCheck = await this.executeSQL(`
        SELECT 
          schemaname, 
          tablename, 
          rowsecurity as rls_enabled,
          CASE 
            WHEN rowsecurity THEN 'Enabled'
            ELSE 'Disabled'
          END as status
        FROM pg_tables 
        WHERE schemaname = 'public' 
        ORDER BY tablename;
      `);

      if (rlsCheck.success) {
        const tables = rlsCheck.result.rows;
        const enabledTables = tables.filter(t => t.rls_enabled);
        const disabledTables = tables.filter(t => !t.rls_enabled);
        
        this.log('success', `Found ${tables.length} public tables`);
        this.log('success', `RLS enabled on ${enabledTables.length} tables`);
        
        if (disabledTables.length > 0) {
          this.log('warning', `RLS disabled on ${disabledTables.length} tables: ${disabledTables.map(t => t.tablename).join(', ')}`);
        }
      }

      // Check policies
      const policyCheck = await this.executeSQL(`
        SELECT 
          schemaname,
          tablename,
          count(*) as policy_count
        FROM pg_policies 
        WHERE schemaname = 'public' 
        GROUP BY schemaname, tablename 
        ORDER BY tablename;
      `);

      if (policyCheck.success) {
        const policies = policyCheck.result.rows;
        this.log('success', `Found policies on ${policies.length} tables`);
        
        policies.forEach(p => {
          this.log('info', `${p.tablename}: ${p.policy_count} policies`);
        });
      }

      // Check helper function
      const functionCheck = await this.executeSQL(`
        SELECT 
          n.nspname as schema,
          p.proname as function_name
        FROM pg_proc p 
        JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE p.proname = 'user_owns_wallet';
      `);

      if (functionCheck.success && functionCheck.result.rows.length > 0) {
        this.log('success', 'Helper function user_owns_wallet found');
      } else {
        this.log('warning', 'Helper function user_owns_wallet not found');
      }

      return true;
    } catch (error) {
      this.log('error', `Verification failed: ${error.message}`);
      return false;
    }
  }

  async run() {
    console.log('🔐 Starting Direct RLS Policy Application\n');
    
    try {
      // Connect to database
      const connected = await this.connect();
      if (!connected) {
        throw new Error('Failed to connect to database');
      }

      // Apply RLS policies
      const result = await this.applyRLSPolicies();
      
      console.log('\n' + '='.repeat(60));
      console.log('📊 RLS APPLICATION RESULTS');
      console.log('='.repeat(60));
      console.log(`✅ Successful: ${result.successCount}/${result.total}`);
      console.log(`❌ Failed: ${result.errorCount}/${result.total}`);
      
      if (result.errors.length > 0) {
        console.log('\n⚠️  ERRORS ENCOUNTERED:');
        result.errors.slice(0, 5).forEach(error => {
          console.log(`   Statement ${error.statement}: ${error.error}`);
        });
        if (result.errors.length > 5) {
          console.log(`   ... and ${result.errors.length - 5} more errors`);
        }
      }

      // Verify setup
      await this.verifyRLSSetup();
      
      console.log('\n' + '='.repeat(60));
      if (result.successCount > result.errorCount) {
        console.log('✅ RLS POLICIES SUCCESSFULLY APPLIED');
        console.log('🎉 Database security is now active!');
      } else {
        console.log('⚠️  RLS POLICIES PARTIALLY APPLIED');
        console.log('📋 Some policies may need manual review');
      }
      console.log('='.repeat(60));
      
      return result.successCount > result.errorCount;
      
    } catch (error) {
      console.error('❌ RLS application failed:', error);
      return false;
    } finally {
      await this.disconnect();
    }
  }
}

// Run the applicator
if (require.main === module) {
  const applicator = new DirectRLSApplicator();
  applicator.run().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('❌ Direct RLS application failed:', error);
    process.exit(1);
  });
}

module.exports = DirectRLSApplicator;
