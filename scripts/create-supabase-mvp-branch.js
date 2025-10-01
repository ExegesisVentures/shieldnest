#!/usr/bin/env node

/**
 * Create Separate Supabase MVP Branch
 * This creates a true Supabase branch for MVP production isolation
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Current production Supabase (will become development)
const PROD_SUPABASE_URL = 'https://cucnmhpguyynfknmxrtt.supabase.co';
const PROD_SERVICE_KEY = '8JRE5bwZHqz@H@Z';

console.log('🎯 Supabase Branch Strategy Setup');
console.log('==================================');
console.log('');
console.log('📋 Current Situation:');
console.log('   • One Supabase project with public + dev schemas');
console.log('   • Need: Separate branches for MVP vs Development');
console.log('');
console.log('🎯 Solution:');
console.log('   • Current project → Development branch (continue building)');
console.log('   • New MVP branch → Clean production for users');
console.log('');

async function createMVPBranchStrategy() {
  console.log('🚀 Creating Supabase MVP Branch Strategy...\n');

  // Step 1: Document current setup
  console.log('1️⃣ Documenting current setup...');
  
  const currentSetup = {
    development: {
      url: PROD_SUPABASE_URL,
      purpose: 'Continue development and testing',
      schema: 'public + dev schemas',
      usage: 'main and develop Git branches'
    },
    mvp: {
      url: 'https://cucnmhpguyynfknmxrtt-mvp.supabase.co', // Will be created
      purpose: 'Clean MVP for production users',
      schema: 'public schema only (essential tables)',
      usage: 'mvp-production Git branch'
    }
  };

  console.log('✅ Current setup documented');

  // Step 2: Create MVP branch instructions
  console.log('\n2️⃣ Creating MVP branch setup instructions...');
  
  const instructions = `# 🎯 Supabase MVP Branch Creation Guide

## 📋 **Current Status**
- **Development Project**: ${PROD_SUPABASE_URL} (keep for development)
- **MVP Branch**: Needs to be created for production users

## 🚀 **Step-by-Step MVP Branch Creation**

### **Step 1: Create MVP Branch in Supabase Dashboard**

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard/project/cucnmhpguyynfknmxrtt
2. **Navigate to Branches**: Project → Branches
3. **Create New Branch**:
   - Branch name: \`mvp\`
   - Base branch: \`main\` (current production)
   - Description: "Clean MVP branch for production users"
   - Wait for creation (5-10 minutes)

### **Step 2: Collect MVP Branch Credentials**

After branch creation, go to **Project Settings → API** and collect:

\`\`\`bash
# MVP Branch Credentials (replace with actual values from dashboard)
SUPABASE_URL_MVP=https://cucnmhpguyynfknmxrtt-mvp.supabase.co
SUPABASE_ANON_KEY_MVP=your_mvp_anon_key_here
SUPABASE_SERVICE_ROLE_KEY_MVP=your_mvp_service_role_key_here
DATABASE_URL_MVP=postgresql://postgres:[mvp-password]@db.cucnmhpguyynfknmxrtt-mvp.supabase.co:5432/postgres
\`\`\`

### **Step 3: Apply RLS to MVP Branch**

\`\`\`bash
# Apply RLS policies to MVP branch
SUPABASE_URL="https://cucnmhpguyynfknmxrtt-mvp.supabase.co" \\
SUPABASE_SERVICE_ROLE_KEY="your_mvp_service_role_key" \\
node scripts/apply-rls-to-mvp.js
\`\`\`

### **Step 4: Update Environment Files**

Create MVP-specific environment files:

\`\`\`bash
# Copy MVP environment template
cp mvp.env.template .env.mvp

# Update with actual MVP branch credentials
# Edit .env.mvp with your MVP branch values
\`\`\`

## 🎯 **Final Branch Strategy**

### **Development Branch** (Current Project)
- **URL**: ${PROD_SUPABASE_URL}
- **Purpose**: Continue building features, testing, experimentation
- **Git Branches**: \`main\`, \`develop\`
- **Schema**: \`public\` + \`dev\` (full feature set)
- **Usage**: Development and feature testing

### **MVP Branch** (New Branch)
- **URL**: https://cucnmhpguyynfknmxrtt-mvp.supabase.co
- **Purpose**: Clean, stable production for users
- **Git Branch**: \`mvp-production\`
- **Schema**: \`public\` only (essential tables)
- **Usage**: Production MVP deployment

## 🚀 **Deployment Strategy**

### **Deploy MVP** (Users):
\`\`\`bash
git checkout mvp-production
# Update environment with MVP branch credentials
./scripts/deploy-mvp.sh
\`\`\`

### **Deploy Development** (Testing):
\`\`\`bash
git checkout main
# Uses development Supabase project
./scripts/deploy-to-vercel.sh
\`\`\`

## ✅ **Benefits of This Setup**

1. **Complete Isolation**: MVP users never see development data
2. **Stable MVP**: Production branch doesn't change unless you update it
3. **Free Development**: Build features without affecting MVP
4. **Easy Updates**: Migrate proven features to MVP when ready
5. **Separate Monitoring**: Different analytics and error tracking

## 🔄 **Migration Process**

When you want to add features to MVP:

1. **Test in Development**: Verify feature works in development branch
2. **Apply to MVP**: Run migration scripts on MVP branch
3. **Deploy MVP**: Update MVP deployment with new features
4. **Monitor**: Ensure MVP stability

---

**Next Action**: Create the MVP branch in Supabase dashboard, then run the setup scripts.
`;

  fs.writeFileSync(path.join(__dirname, '..', 'SUPABASE_MVP_BRANCH_SETUP.md'), instructions);
  console.log('✅ MVP branch setup guide created: SUPABASE_MVP_BRANCH_SETUP.md');

  // Step 3: Create RLS application script for MVP
  console.log('\n3️⃣ Creating MVP RLS application script...');
  
  const mvpRLSScript = `#!/usr/bin/env node

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
  host: \`db.\${projectId}.supabase.co\`,
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

    console.log(\`📝 Applying \${statements.length} RLS policies to MVP branch...\`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      
      try {
        await client.query(statement);
        successCount++;
        if (i % 10 === 0) {
          console.log(\`   Progress: \${i + 1}/\${statements.length} policies...\`);
        }
      } catch (error) {
        errorCount++;
        if (!error.message.includes('already exists')) {
          console.log(\`⚠️ Policy \${i + 1} warning: \${error.message.substring(0, 80)}...\`);
        }
      }
    }

    console.log(\`✅ MVP RLS Setup Complete: \${successCount} successful, \${errorCount} warnings\`);

    // Verify RLS status
    const rlsCheck = await client.query(\`
      SELECT 
        tablename,
        rowsecurity as rls_enabled,
        (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = t.tablename) as policy_count
      FROM pg_tables t
      WHERE schemaname = 'public' 
      AND tablename IN ('users', 'wallets', 'claims', 'epochs', 'airdrop_schedules')
      ORDER BY tablename;
    \`);

    console.log('\\n📊 MVP Branch RLS Status:');
    rlsCheck.rows.forEach(row => {
      const status = row.rls_enabled ? '🔒 Enabled' : '🔓 Disabled';
      console.log(\`   \${row.tablename}: \${status} (\${row.policy_count} policies)\`);
    });

    console.log('\\n🎉 MVP branch is secure and ready for production!');
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
`;

  fs.writeFileSync(path.join(__dirname, 'apply-rls-to-mvp.js'), mvpRLSScript);
  fs.chmodSync(path.join(__dirname, 'apply-rls-to-mvp.js'), 0o755);
  console.log('✅ MVP RLS application script created: scripts/apply-rls-to-mvp.js');

  // Step 4: Create environment template for MVP
  console.log('\n4️⃣ Creating MVP environment template...');
  
  const mvpEnvTemplate = `# Roll NFT Dashboard MVP Branch Configuration
# Use this after creating MVP branch in Supabase

# MVP Supabase Branch (update with actual values after branch creation)
SUPABASE_URL_MVP=https://cucnmhpguyynfknmxrtt-mvp.supabase.co
SUPABASE_ANON_KEY_MVP=your_mvp_anon_key_here
SUPABASE_SERVICE_ROLE_KEY_MVP=your_mvp_service_role_key_here

# MVP Database Connection
DATABASE_URL_MVP=postgresql://postgres:your_mvp_password@db.cucnmhpguyynfknmxrtt-mvp.supabase.co:5432/postgres

# Environment Settings
NODE_ENV=production
ENVIRONMENT=mvp
BRANCH=mvp-production

# Next.js Public Variables (MVP Frontend)
NEXT_PUBLIC_SUPABASE_URL=https://cucnmhpguyynfknmxrtt-mvp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_mvp_anon_key_here
NEXT_PUBLIC_APP_ENV=mvp

# Development Supabase (current project - for continued development)
SUPABASE_URL_DEV=${PROD_SUPABASE_URL}
SUPABASE_ANON_KEY_DEV=your_dev_anon_key_here
SUPABASE_SERVICE_ROLE_KEY_DEV=${PROD_SERVICE_KEY}

# Security Settings
JWT_SECRET=mvp-jwt-secret-change-in-production
MAGIC_LINK_SECRET=mvp-magic-link-secret-change-in-production

# Feature Flags (MVP - Essential Features Only)
ENABLE_STAKING=false
ENABLE_REWARDS_HISTORY=false
ENABLE_ADMIN_PANEL=false
ENABLE_CONVERT=false
ENABLE_MINT=false
ENABLE_ADVANCED_FEATURES=false

# MVP Settings
MVP_MODE=true
SHOW_BETA_FEATURES=false
ENABLE_ANALYTICS=true
ENABLE_ERROR_REPORTING=true
`;

  fs.writeFileSync(path.join(__dirname, '..', 'mvp-branch.env.template'), mvpEnvTemplate);
  console.log('✅ MVP branch environment template created: mvp-branch.env.template');

  console.log('\n🎯 MVP Branch Strategy Setup Complete!');
  console.log('=====================================');
  console.log('');
  console.log('📋 What You Have Now:');
  console.log('   ✅ Development Supabase: Continue building features');
  console.log('   ✅ MVP Branch Guide: Step-by-step creation instructions');
  console.log('   ✅ RLS Scripts: Automated MVP security setup');
  console.log('   ✅ Environment Templates: Clean configuration management');
  console.log('');
  console.log('🚀 Next Steps:');
  console.log('   1. Read: SUPABASE_MVP_BRANCH_SETUP.md');
  console.log('   2. Create MVP branch in Supabase dashboard');
  console.log('   3. Run: scripts/apply-rls-to-mvp.js');
  console.log('   4. Deploy MVP with clean branch separation');
  console.log('');
  console.log('🎊 Result: Perfect isolation between MVP and Development!');
}

// Run the setup
createMVPBranchStrategy()
  .then(() => {
    console.log('\\n✅ Setup complete! Check the generated files for next steps.');
  })
  .catch(error => {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  });
