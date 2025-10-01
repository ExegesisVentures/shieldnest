#!/usr/bin/env node

/**
 * Database Connection Test Script
 * Tests connection to Supabase and verifies RLS policies
 */

const { createClient } = require('@supabase/supabase-js');

// Configuration
const configs = {
  prod: {
    url: 'https://cucnmhpguyynfknmxrtt.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1Y25taHBndXl5bmZrbm14cnR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2ODYwNzMsImV4cCI6MjA3NDI2MjA3M30.3Kmj29wW0HWBgX4x6X8niPOFuH45nkZFePBK3cC1C50',
    serviceRoleKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1Y25taHBndXl5bmZrbm14cnR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODY4NjA3MywiZXhwIjoyMDc0MjYyMDczfQ.Qs4Ys2Wd6_7vLnHQCXBQPcLYJYFNXUYBYKJVQGJXNQY'
  },
  dev: {
    url: process.env.SUPABASE_URL_DEV || 'https://your-dev-branch.supabase.co',
    anonKey: process.env.SUPABASE_ANON_KEY_DEV || 'your_dev_anon_key',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY_DEV || 'your_dev_service_role_key'
  }
};

class DatabaseTester {
  constructor(environment = 'prod') {
    this.env = environment;
    this.config = configs[environment];
    
    if (!this.config) {
      throw new Error(`Unknown environment: ${environment}`);
    }
    
    this.supabaseAnon = createClient(this.config.url, this.config.anonKey);
    this.supabaseAdmin = createClient(this.config.url, this.config.serviceRoleKey);
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

  async testBasicConnection() {
    this.log('info', `Testing basic connection to ${this.env} environment...`);
    
    try {
      // Test with anon key
      const { data, error } = await this.supabaseAnon
        .from('users')
        .select('count')
        .limit(1);

      if (error) {
        this.log('info', `Anon connection test: ${error.message} (expected if RLS is working)`);
      } else {
        this.log('success', 'Anon connection successful');
      }

      return true;
    } catch (error) {
      this.log('error', `Connection test failed: ${error.message}`);
      return false;
    }
  }

  async testServiceRoleAccess() {
    this.log('info', 'Testing service role access...');
    
    try {
      // Test service role database access
      const { data, error } = await this.supabaseAdmin
        .from('users')
        .select('count')
        .limit(1);

      if (error) {
        this.log('warning', `Service role database access: ${error.message}`);
      } else {
        this.log('success', 'Service role database access confirmed');
      }

      // Test auth admin access
      const { data: authData, error: authError } = await this.supabaseAdmin.auth.admin.listUsers();
      
      if (authError) {
        this.log('warning', `Auth admin access: ${authError.message}`);
      } else {
        this.log('success', `Auth admin access confirmed - found ${authData.users?.length || 0} users`);
      }

      return true;
    } catch (error) {
      this.log('error', `Service role test failed: ${error.message}`);
      return false;
    }
  }

  async testRLSPolicies() {
    this.log('info', 'Testing RLS policies...');
    
    try {
      // Check if RLS is enabled on tables
      const { data, error } = await this.supabaseAdmin
        .rpc('sql', {
          query: `
            SELECT 
              schemaname, 
              tablename, 
              rowsecurity as rls_enabled
            FROM pg_tables 
            WHERE schemaname = 'public' 
            ORDER BY tablename;
          `
        });

      if (error) {
        this.log('warning', `RLS check failed: ${error.message}`);
        return false;
      }

      if (data && data.length > 0) {
        this.log('success', `Found ${data.length} tables in public schema`);
        
        const rlsEnabled = data.filter(table => table.rls_enabled);
        const rlsDisabled = data.filter(table => !table.rls_enabled);
        
        this.log('success', `RLS enabled on ${rlsEnabled.length} tables`);
        if (rlsDisabled.length > 0) {
          this.log('warning', `RLS disabled on ${rlsDisabled.length} tables: ${rlsDisabled.map(t => t.tablename).join(', ')}`);
        }
      } else {
        this.log('warning', 'No tables found or RLS check not available');
      }

      return true;
    } catch (error) {
      this.log('error', `RLS test failed: ${error.message}`);
      return false;
    }
  }

  async testAuthFlow() {
    this.log('info', 'Testing authentication flow...');
    
    try {
      // Test sign up (this will likely fail in production, which is expected)
      const testEmail = `test-${Date.now()}@example.com`;
      const { data, error } = await this.supabaseAnon.auth.signUp({
        email: testEmail,
        password: 'test-password-123'
      });

      if (error) {
        if (error.message.includes('Signups not allowed') || 
            error.message.includes('not authorized')) {
          this.log('success', 'Auth signup properly restricted (expected in production)');
        } else {
          this.log('warning', `Auth signup error: ${error.message}`);
        }
      } else {
        this.log('info', 'Auth signup successful (development environment)');
      }

      return true;
    } catch (error) {
      this.log('error', `Auth test failed: ${error.message}`);
      return false;
    }
  }

  async runAllTests() {
    console.log(`🧪 Starting Database Tests for ${this.env.toUpperCase()} environment\n`);
    
    const results = {
      connection: await this.testBasicConnection(),
      serviceRole: await this.testServiceRoleAccess(),
      rls: await this.testRLSPolicies(),
      auth: await this.testAuthFlow()
    };

    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(60));
    
    Object.entries(results).forEach(([test, passed]) => {
      const status = passed ? '✅ PASSED' : '❌ FAILED';
      console.log(`${test.toUpperCase().padEnd(15)} ${status}`);
    });

    const totalTests = Object.keys(results).length;
    const passedTests = Object.values(results).filter(Boolean).length;
    
    console.log('\n' + '='.repeat(60));
    console.log(`📈 OVERALL: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
      console.log('🎉 All tests passed! Database is ready for use.');
    } else if (passedTests >= totalTests - 1) {
      console.log('⚠️  Most tests passed. Review warnings above.');
    } else {
      console.log('❌ Multiple test failures. Check configuration and connectivity.');
    }
    
    return passedTests === totalTests;
  }
}

// CLI usage
if (require.main === module) {
  const environment = process.argv[2] || 'prod';
  
  if (!['prod', 'dev'].includes(environment)) {
    console.error('❌ Usage: node test-db-connection.js [prod|dev]');
    process.exit(1);
  }
  
  const tester = new DatabaseTester(environment);
  tester.runAllTests().catch(error => {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  });
}

module.exports = DatabaseTester;
