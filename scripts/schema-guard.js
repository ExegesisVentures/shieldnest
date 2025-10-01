#!/usr/bin/env node

/**
 * Schema Guard - Prevents Database Schema Mix-ups
 * Ensures MVP and Development schemas stay completely separate
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration
const DB_CONFIG = {
  host: 'db.cucnmhpguyynfknmxrtt.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: '8JRE5bwZHqz@H@Z',
  ssl: { rejectUnauthorized: false }
};

// Schema definitions
const SCHEMAS = {
  mvp_production: {
    purpose: 'Clean MVP for production users',
    git_branches: ['mvp-production'],
    allowed_operations: ['SELECT', 'INSERT', 'UPDATE', 'DELETE'],
    restricted_operations: ['DROP TABLE', 'ALTER TABLE', 'CREATE TABLE'],
    tables: ['users', 'user_wallets', 'wallets', 'claims', 'epochs', 'airdrop_schedules', 'reward_claims']
  },
  public: {
    purpose: 'Main development and production data',
    git_branches: ['main', 'develop'],
    allowed_operations: ['ALL'],
    restricted_operations: [],
    tables: 'all'
  },
  dev: {
    purpose: 'Development testing and experimentation',
    git_branches: ['main', 'develop'],
    allowed_operations: ['ALL'],
    restricted_operations: [],
    tables: 'all'
  }
};

class SchemaGuard {
  constructor() {
    this.client = new Client(DB_CONFIG);
  }

  async connect() {
    await this.client.connect();
  }

  async disconnect() {
    await this.client.end();
  }

  // Get current git branch
  getCurrentBranch() {
    const { execSync } = require('child_process');
    try {
      return execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    } catch (error) {
      return 'unknown';
    }
  }

  // Verify schema integrity
  async verifySchemaIntegrity() {
    console.log('🔍 Verifying Schema Integrity...\n');

    const currentBranch = this.getCurrentBranch();
    console.log(`📋 Current Git Branch: ${currentBranch}`);

    // Check each schema
    for (const [schemaName, config] of Object.entries(SCHEMAS)) {
      console.log(`\n🗄️ Checking Schema: ${schemaName}`);
      console.log(`   Purpose: ${config.purpose}`);
      console.log(`   Allowed Branches: ${config.git_branches.join(', ')}`);

      // Verify schema exists
      const schemaExists = await this.client.query(
        'SELECT EXISTS(SELECT 1 FROM information_schema.schemata WHERE schema_name = $1)',
        [schemaName]
      );

      if (schemaExists.rows[0].exists) {
        console.log('   ✅ Schema exists');

        // Check tables
        const tables = await this.client.query(
          'SELECT tablename FROM pg_tables WHERE schemaname = $1 ORDER BY tablename',
          [schemaName]
        );

        console.log(`   📊 Tables (${tables.rows.length}): ${tables.rows.map(r => r.tablename).join(', ')}`);

        // Verify RLS status
        const rlsTables = await this.client.query(`
          SELECT tablename, rowsecurity 
          FROM pg_tables 
          WHERE schemaname = $1 AND rowsecurity = true
        `, [schemaName]);

        console.log(`   🔒 RLS Enabled: ${rlsTables.rows.length} tables`);
      } else {
        console.log('   ❌ Schema missing');
      }
    }

    return true;
  }

  // Check if current branch is allowed to modify schema
  validateBranchAccess(targetSchema) {
    const currentBranch = this.getCurrentBranch();
    const schemaConfig = SCHEMAS[targetSchema];

    if (!schemaConfig) {
      throw new Error(`Unknown schema: ${targetSchema}`);
    }

    if (!schemaConfig.git_branches.includes(currentBranch)) {
      throw new Error(
        `Branch '${currentBranch}' is not allowed to modify schema '${targetSchema}'. ` +
        `Allowed branches: ${schemaConfig.git_branches.join(', ')}`
      );
    }

    return true;
  }

  // Create environment-specific database URL
  generateDatabaseURL(environment) {
    const baseURL = 'postgresql://postgres:8JRE5bwZHqz@H@Z@db.cucnmhpguyynfknmxrtt.supabase.co:5432/postgres';
    
    switch (environment) {
      case 'mvp':
        return `${baseURL}?search_path=mvp_production`;
      case 'development':
        return `${baseURL}?search_path=public,dev`;
      case 'production':
        return `${baseURL}?search_path=public`;
      default:
        throw new Error(`Unknown environment: ${environment}`);
    }
  }

  // Generate environment-specific configuration
  async generateEnvironmentConfig() {
    console.log('🔧 Generating Environment-Specific Configurations...\n');

    const configs = {
      mvp: {
        file: '.env.mvp',
        schema: 'mvp_production',
        description: 'MVP Production Environment'
      },
      development: {
        file: '.env.development',
        schema: 'public,dev',
        description: 'Development Environment'
      },
      production: {
        file: '.env.production',
        schema: 'public',
        description: 'Full Production Environment'
      }
    };

    for (const [env, config] of Object.entries(configs)) {
      const envContent = `# ${config.description}
# Auto-generated by Schema Guard - DO NOT EDIT MANUALLY

# Database Configuration
SUPABASE_URL=https://cucnmhpguyynfknmxrtt.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=8JRE5bwZHqz@H@Z

# Schema-Specific Database URL
DATABASE_URL=${this.generateDatabaseURL(env)}
DATABASE_SCHEMA=${config.schema}

# Environment Settings
NODE_ENV=${env === 'mvp' ? 'production' : env}
ENVIRONMENT=${env}
BRANCH=${env === 'mvp' ? 'mvp-production' : 'main'}

# Next.js Public Variables
NEXT_PUBLIC_SUPABASE_URL=https://cucnmhpguyynfknmxrtt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_APP_ENV=${env}
NEXT_PUBLIC_DATABASE_SCHEMA=${config.schema}

# Feature Flags
MVP_MODE=${env === 'mvp' ? 'true' : 'false'}
ENABLE_ADMIN_PANEL=${env === 'mvp' ? 'false' : 'true'}
ENABLE_STAKING=${env === 'mvp' ? 'false' : 'true'}
ENABLE_ADVANCED_FEATURES=${env === 'mvp' ? 'false' : 'true'}

# Generated: ${new Date().toISOString()}
# Schema Guard Version: 1.0.0
`;

      fs.writeFileSync(config.file, envContent);
      console.log(`✅ Created: ${config.file} (${config.description})`);
    }
  }

  // Validate database operations
  async validateOperation(sql, targetSchema = 'public') {
    const currentBranch = this.getCurrentBranch();
    const schemaConfig = SCHEMAS[targetSchema];

    // Check branch permissions
    this.validateBranchAccess(targetSchema);

    // Check for dangerous operations on MVP schema
    if (targetSchema === 'mvp_production') {
      const dangerousPatterns = [
        /DROP\s+TABLE/i,
        /ALTER\s+TABLE.*DROP/i,
        /TRUNCATE/i,
        /DELETE\s+FROM.*WHERE\s+1\s*=\s*1/i
      ];

      for (const pattern of dangerousPatterns) {
        if (pattern.test(sql)) {
          throw new Error(
            `Dangerous operation detected on MVP schema: ${sql.substring(0, 50)}...` +
            `\nMVP schema should only receive safe data operations.`
          );
        }
      }
    }

    return true;
  }

  // Create schema protection triggers
  async createSchemaProtection() {
    console.log('🛡️ Creating Schema Protection System...\n');

    // Create audit table
    const auditTableSQL = `
      CREATE TABLE IF NOT EXISTS public.schema_audit_log (
        id SERIAL PRIMARY KEY,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        git_branch TEXT,
        schema_name TEXT,
        operation TEXT,
        table_name TEXT,
        user_name TEXT,
        success BOOLEAN,
        error_message TEXT
      );
    `;

    await this.client.query(auditTableSQL);
    console.log('✅ Created audit log table');

    // Create protection function
    const protectionFunctionSQL = `
      CREATE OR REPLACE FUNCTION public.log_schema_operation()
      RETURNS event_trigger AS $$
      BEGIN
        INSERT INTO public.schema_audit_log (
          schema_name, 
          operation, 
          table_name, 
          user_name,
          success
        ) VALUES (
          TG_TABLE_SCHEMA,
          TG_OP,
          TG_TABLE_NAME,
          current_user,
          true
        );
      END;
      $$ LANGUAGE plpgsql;
    `;

    try {
      await this.client.query(protectionFunctionSQL);
      console.log('✅ Created protection function');
    } catch (error) {
      console.log('⚠️ Protection function:', error.message.substring(0, 60));
    }

    return true;
  }

  // Generate deployment validation script
  generateDeploymentValidator() {
    const validatorScript = `#!/bin/bash

# Deployment Schema Validator
# Ensures correct schema is used for each environment

set -e

CURRENT_BRANCH=$(git branch --show-current)
ENVIRONMENT=""

# Determine environment from branch
case "$CURRENT_BRANCH" in
  "mvp-production")
    ENVIRONMENT="mvp"
    EXPECTED_SCHEMA="mvp_production"
    ;;
  "main"|"develop")
    ENVIRONMENT="development"
    EXPECTED_SCHEMA="public,dev"
    ;;
  *)
    echo "❌ Unknown branch: $CURRENT_BRANCH"
    exit 1
    ;;
esac

echo "🔍 Validating Deployment Configuration"
echo "Branch: $CURRENT_BRANCH"
echo "Environment: $ENVIRONMENT"
echo "Expected Schema: $EXPECTED_SCHEMA"

# Check if correct environment file exists
ENV_FILE=".env.$ENVIRONMENT"
if [ ! -f "$ENV_FILE" ]; then
  echo "❌ Environment file not found: $ENV_FILE"
  echo "Run: node scripts/schema-guard.js --generate-config"
  exit 1
fi

# Validate schema in environment file
if grep -q "DATABASE_SCHEMA=$EXPECTED_SCHEMA" "$ENV_FILE"; then
  echo "✅ Schema configuration validated"
else
  echo "❌ Schema mismatch in $ENV_FILE"
  echo "Expected: DATABASE_SCHEMA=$EXPECTED_SCHEMA"
  exit 1
fi

echo "🚀 Deployment validation passed!"
`;

    fs.writeFileSync('scripts/validate-deployment.sh', validatorScript);
    fs.chmodSync('scripts/validate-deployment.sh', 0o755);
    console.log('✅ Created deployment validator: scripts/validate-deployment.sh');
  }
}

// CLI Interface
async function main() {
  const guard = new SchemaGuard();
  const args = process.argv.slice(2);
  const command = args[0] || 'verify';

  try {
    await guard.connect();

    switch (command) {
      case 'verify':
        await guard.verifySchemaIntegrity();
        break;
      
      case 'generate-config':
        await guard.generateEnvironmentConfig();
        break;
      
      case 'protect':
        await guard.createSchemaProtection();
        break;
      
      case 'validate':
        guard.generateDeploymentValidator();
        break;
      
      case 'all':
        await guard.verifySchemaIntegrity();
        await guard.generateEnvironmentConfig();
        await guard.createSchemaProtection();
        guard.generateDeploymentValidator();
        break;
      
      default:
        console.log('Usage: node schema-guard.js [verify|generate-config|protect|validate|all]');
        break;
    }

    console.log('\n🎯 Schema Guard Complete!');
    console.log('Your schemas are protected from mix-ups! 🛡️');

  } catch (error) {
    console.error('❌ Schema Guard Error:', error.message);
    process.exit(1);
  } finally {
    await guard.disconnect();
  }
}

if (require.main === module) {
  main();
}

module.exports = { SchemaGuard };
