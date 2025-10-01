#!/usr/bin/env node

/**
 * Security Audit Script for Roll NFT Dashboard
 * Performs comprehensive security checks before deployment
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class SecurityAuditor {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.passed = [];
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
    
    if (type === 'error') this.errors.push(message);
    else if (type === 'warning') this.warnings.push(message);
    else if (type === 'success') this.passed.push(message);
  }

  // Check for sensitive files
  checkSensitiveFiles() {
    this.log('info', 'Checking for sensitive files...');
    
    const sensitivePatterns = [
      '**/.env',
      '**/.env.local',
      '**/.env.production',
      '**/*.key',
      '**/*.pem',
      '**/id_rsa',
      '**/id_ed25519'
    ];

    const sensitiveFiles = [];
    
    const checkDirectory = (dir) => {
      if (!fs.existsSync(dir)) return;
      
      const items = fs.readdirSync(dir);
      for (const item of items) {
        if (item === 'node_modules' || item === '.git') continue;
        
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          checkDirectory(fullPath);
        } else {
          // Check for sensitive file patterns
          if (item.includes('.env') || 
              item.includes('.key') || 
              item.includes('.pem') ||
              item.includes('id_rsa') ||
              item.includes('id_ed25519')) {
            sensitiveFiles.push(fullPath);
          }
        }
      }
    };

    checkDirectory('.');

    if (sensitiveFiles.length > 0) {
      this.log('error', `Found sensitive files that should not be committed:`);
      sensitiveFiles.forEach(file => {
        this.log('error', `  - ${file}`);
      });
    } else {
      this.log('success', 'No sensitive files found');
    }
  }

  // Check for hardcoded secrets
  checkHardcodedSecrets() {
    this.log('info', 'Checking for hardcoded secrets...');
    
    const secretPatterns = [
      /password\s*[:=]\s*["'][^"']+["']/gi,
      /secret\s*[:=]\s*["'][^"']+["']/gi,
      /key\s*[:=]\s*["'][^"']+["']/gi,
      /token\s*[:=]\s*["'][^"']+["']/gi,
      /api_key\s*[:=]\s*["'][^"']+["']/gi,
      /private_key\s*[:=]\s*["'][^"']+["']/gi
    ];

    const checkFile = (filePath) => {
      if (!fs.existsSync(filePath)) return;
      
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        // Skip comments and process.env references
        if (line.trim().startsWith('//') || 
            line.trim().startsWith('#') || 
            line.includes('process.env')) {
          return;
        }
        
        secretPatterns.forEach(pattern => {
          if (pattern.test(line)) {
            this.log('warning', `Potential hardcoded secret in ${filePath}:${index + 1}`);
            this.log('warning', `  Line: ${line.trim()}`);
          }
        });
      });
    };

    // Check TypeScript and JavaScript files
    const checkDirectory = (dir) => {
      if (!fs.existsSync(dir)) return;
      
      const items = fs.readdirSync(dir);
      for (const item of items) {
        if (item === 'node_modules' || item === '.git' || item === '.next') continue;
        
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          checkDirectory(fullPath);
        } else if (item.endsWith('.ts') || item.endsWith('.tsx') || 
                   item.endsWith('.js') || item.endsWith('.jsx')) {
          checkFile(fullPath);
        }
      }
    };

    checkDirectory('apps');
    
    if (this.warnings.filter(w => w.includes('Potential hardcoded secret')).length === 0) {
      this.log('success', 'No hardcoded secrets detected');
    }
  }

  // Check environment variable usage
  checkEnvironmentVariables() {
    this.log('info', 'Checking environment variable usage...');
    
    const requiredEnvVars = [
      'DATABASE_URL',
      'SUPABASE_URL',
      'SUPABASE_ANON_KEY',
      'JWT_SECRET',
      'MAGIC_LINK_SECRET'
    ];

    // Check if env.template files exist
    const templateFiles = [
      'apps/api/env.template',
      'apps/web/env.template'
    ];

    templateFiles.forEach(file => {
      if (fs.existsSync(file)) {
        this.log('success', `Environment template found: ${file}`);
      } else {
        this.log('error', `Missing environment template: ${file}`);
      }
    });

    // Check for process.env usage in code
    let envUsageCount = 0;
    const checkFile = (filePath) => {
      if (!fs.existsSync(filePath)) return;
      
      const content = fs.readFileSync(filePath, 'utf8');
      const matches = content.match(/process\.env\.\w+/g);
      if (matches) {
        envUsageCount += matches.length;
      }
    };

    const checkDirectory = (dir) => {
      if (!fs.existsSync(dir)) return;
      
      const items = fs.readdirSync(dir);
      for (const item of items) {
        if (item === 'node_modules' || item === '.git' || item === '.next') continue;
        
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          checkDirectory(fullPath);
        } else if (item.endsWith('.ts') || item.endsWith('.tsx') || 
                   item.endsWith('.js') || item.endsWith('.jsx')) {
          checkFile(fullPath);
        }
      }
    };

    checkDirectory('apps');
    
    if (envUsageCount > 0) {
      this.log('success', `Found ${envUsageCount} proper environment variable usages`);
    } else {
      this.log('warning', 'No environment variable usage detected');
    }
  }

  // Check dependencies for vulnerabilities
  checkDependencies() {
    this.log('info', 'Checking dependencies for vulnerabilities...');
    
    try {
      // Check if pnpm audit is available
      execSync('pnpm audit --audit-level moderate', { stdio: 'pipe' });
      this.log('success', 'No moderate or high severity vulnerabilities found');
    } catch (error) {
      if (error.status === 1) {
        this.log('warning', 'Found vulnerabilities in dependencies - run "pnpm audit" for details');
      } else {
        this.log('warning', 'Could not run dependency audit - ensure pnpm is installed');
      }
    }
  }

  // Check file permissions
  checkFilePermissions() {
    this.log('info', 'Checking file permissions...');
    
    const checkFile = (filePath) => {
      if (!fs.existsSync(filePath)) return;
      
      const stats = fs.statSync(filePath);
      const mode = stats.mode & parseInt('777', 8);
      
      // Check for overly permissive files
      if (mode & parseInt('002', 8)) { // World writable
        this.log('warning', `File ${filePath} is world-writable (${mode.toString(8)})`);
      }
      
      // Check for executable scripts
      if (filePath.endsWith('.sh') && !(mode & parseInt('100', 8))) {
        this.log('warning', `Script ${filePath} is not executable`);
      }
    };

    const checkDirectory = (dir) => {
      if (!fs.existsSync(dir)) return;
      
      const items = fs.readdirSync(dir);
      for (const item of items) {
        if (item === 'node_modules' || item === '.git') continue;
        
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          checkDirectory(fullPath);
        } else {
          checkFile(fullPath);
        }
      }
    };

    checkDirectory('.');
    
    if (this.warnings.filter(w => w.includes('world-writable')).length === 0) {
      this.log('success', 'File permissions look secure');
    }
  }

  // Check Git configuration
  checkGitConfiguration() {
    this.log('info', 'Checking Git configuration...');
    
    // Check if .gitignore exists and is comprehensive
    if (fs.existsSync('.gitignore')) {
      const gitignore = fs.readFileSync('.gitignore', 'utf8');
      const requiredPatterns = [
        '.env',
        'node_modules',
        '*.key',
        '*.pem'
      ];
      
      let missingPatterns = [];
      requiredPatterns.forEach(pattern => {
        if (!gitignore.includes(pattern)) {
          missingPatterns.push(pattern);
        }
      });
      
      if (missingPatterns.length > 0) {
        this.log('warning', `Missing .gitignore patterns: ${missingPatterns.join(', ')}`);
      } else {
        this.log('success', '.gitignore contains essential security patterns');
      }
    } else {
      this.log('error', '.gitignore file not found');
    }
  }

  // Check for security headers configuration
  checkSecurityHeaders() {
    this.log('info', 'Checking security headers configuration...');
    
    const securityFiles = [
      'apps/api/src/middleware/zero-trust.ts',
      'apps/api/vercel.json',
      'apps/web/vercel.json'
    ];

    let foundSecurityConfig = false;
    
    securityFiles.forEach(file => {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        if (content.includes('X-Content-Type-Options') || 
            content.includes('X-Frame-Options') ||
            content.includes('helmet')) {
          foundSecurityConfig = true;
        }
      }
    });

    if (foundSecurityConfig) {
      this.log('success', 'Security headers configuration found');
    } else {
      this.log('warning', 'No security headers configuration detected');
    }
  }

  // Generate report
  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('🔒 SECURITY AUDIT REPORT');
    console.log('='.repeat(60));
    
    console.log(`\n✅ Passed Checks: ${this.passed.length}`);
    console.log(`⚠️  Warnings: ${this.warnings.length}`);
    console.log(`❌ Errors: ${this.errors.length}`);
    
    if (this.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      this.warnings.forEach(warning => {
        console.log(`   ${warning}`);
      });
    }
    
    if (this.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      this.errors.forEach(error => {
        console.log(`   ${error}`);
      });
    }
    
    console.log('\n' + '='.repeat(60));
    
    if (this.errors.length > 0) {
      console.log('❌ SECURITY AUDIT FAILED - Please fix errors before deployment');
      process.exit(1);
    } else if (this.warnings.length > 0) {
      console.log('⚠️  SECURITY AUDIT PASSED WITH WARNINGS - Review warnings before deployment');
      process.exit(0);
    } else {
      console.log('✅ SECURITY AUDIT PASSED - Ready for deployment');
      process.exit(0);
    }
  }

  // Run all checks
  async runAudit() {
    console.log('🔒 Starting Security Audit for Roll NFT Dashboard\n');
    
    this.checkSensitiveFiles();
    this.checkHardcodedSecrets();
    this.checkEnvironmentVariables();
    this.checkDependencies();
    this.checkFilePermissions();
    this.checkGitConfiguration();
    this.checkSecurityHeaders();
    
    this.generateReport();
  }
}

// Run the audit
if (require.main === module) {
  const auditor = new SecurityAuditor();
  auditor.runAudit().catch(error => {
    console.error('❌ Security audit failed:', error);
    process.exit(1);
  });
}

module.exports = SecurityAuditor;
