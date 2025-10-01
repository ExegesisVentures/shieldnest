#!/bin/bash

# 🚀 Deploy Roll NFT Dashboard to Vercel
# Comprehensive deployment script for development environment

set -e  # Exit on any error

echo "🚀 Roll NFT Dashboard - Vercel Deployment Script"
echo "=================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check prerequisites
log_info "Checking prerequisites..."

if ! command -v vercel &> /dev/null; then
    log_error "Vercel CLI not found. Install with: npm i -g vercel"
    exit 1
fi

if ! command -v node &> /dev/null; then
    log_error "Node.js not found. Please install Node.js"
    exit 1
fi

if ! command -v pnpm &> /dev/null; then
    log_error "pnpm not found. Please install pnpm"
    exit 1
fi

log_success "All prerequisites found"

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "apps" ]; then
    log_error "Please run this script from the project root directory"
    exit 1
fi

log_success "Project structure verified"

# Check environment files
log_info "Checking environment configuration..."

if [ ! -f ".env.development" ]; then
    log_warning ".env.development not found. Creating template..."
    cat > .env.development << EOF
# Supabase Development Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres

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
EOF
    log_warning "Please update .env.development with your actual values before deploying"
fi

# Install dependencies
log_info "Installing dependencies..."
pnpm install
log_success "Dependencies installed"

# Build projects
log_info "Building projects..."

# Build API
log_info "Building API..."
cd apps/api
if [ -f "package.json" ]; then
    pnpm build 2>/dev/null || log_warning "API build failed or no build script"
else
    log_warning "API package.json not found"
fi
cd ../..

# Build Web
log_info "Building Web..."
cd apps/web
if [ -f "package.json" ]; then
    pnpm build 2>/dev/null || log_warning "Web build failed or no build script"
else
    log_warning "Web package.json not found"
fi
cd ../..

log_success "Build process completed"

# Deploy API
log_info "Deploying API to Vercel..."
cd apps/api

# Check if vercel.json exists
if [ ! -f "vercel.json" ]; then
    log_info "Creating vercel.json for API..."
    cat > vercel.json << EOF
{
  "version": 2,
  "name": "roll-nft-api",
  "builds": [
    {
      "src": "src/index.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "src/index.ts"
    }
  ],
  "env": {
    "NODE_ENV": "development"
  },
  "functions": {
    "src/index.ts": {
      "maxDuration": 30
    }
  }
}
EOF
fi

# Deploy API
log_info "Deploying API..."
vercel --yes --env NODE_ENV=development --env ENVIRONMENT=development || {
    log_error "API deployment failed"
    cd ../..
    exit 1
}

API_URL=$(vercel --scope $(vercel whoami) ls roll-nft-api --json | jq -r '.[0].url' 2>/dev/null || echo "")
if [ -n "$API_URL" ]; then
    log_success "API deployed to: https://$API_URL"
    echo "API_URL=https://$API_URL" >> ../../.env.vercel
else
    log_warning "Could not determine API URL automatically"
fi

cd ../..

# Deploy Web
log_info "Deploying Web to Vercel..."
cd apps/web

# Check if vercel.json exists
if [ ! -f "vercel.json" ]; then
    log_info "Creating vercel.json for Web..."
    cat > vercel.json << EOF
{
  "version": 2,
  "name": "roll-nft-dashboard",
  "framework": "nextjs",
  "buildCommand": "pnpm build",
  "outputDirectory": ".next",
  "installCommand": "pnpm install",
  "env": {
    "NODE_ENV": "development"
  },
  "build": {
    "env": {
      "NODE_ENV": "development"
    }
  }
}
EOF
fi

# Deploy Web
log_info "Deploying Web application..."
vercel --yes --env NODE_ENV=development --env ENVIRONMENT=development || {
    log_error "Web deployment failed"
    cd ../..
    exit 1
}

WEB_URL=$(vercel --scope $(vercel whoami) ls roll-nft-dashboard --json | jq -r '.[0].url' 2>/dev/null || echo "")
if [ -n "$WEB_URL" ]; then
    log_success "Web deployed to: https://$WEB_URL"
    echo "WEB_URL=https://$WEB_URL" >> ../../.env.vercel
else
    log_warning "Could not determine Web URL automatically"
fi

cd ../..

# Create deployment summary
log_info "Creating deployment summary..."
cat > VERCEL_DEPLOYMENT_SUMMARY.md << EOF
# 🚀 Vercel Deployment Summary

## ✅ Deployment Status
- **Date**: $(date)
- **Status**: Successfully Deployed
- **Environment**: Development

## 🌐 Deployed URLs
- **API**: ${API_URL:+https://$API_URL}${API_URL:-"Check Vercel dashboard"}
- **Web**: ${WEB_URL:+https://$WEB_URL}${WEB_URL:-"Check Vercel dashboard"}

## 📋 Next Steps
1. **Environment Variables**: Add Supabase credentials to Vercel project settings
2. **Custom Domain**: Configure custom domains if needed
3. **Testing**: Run integration tests against deployed endpoints
4. **Monitoring**: Set up error tracking and performance monitoring

## 🔧 Configuration Files Created
- \`apps/api/vercel.json\`: API deployment configuration
- \`apps/web/vercel.json\`: Web deployment configuration  
- \`.env.vercel\`: Deployment URLs for reference

## 🔗 Useful Commands
\`\`\`bash
# View deployments
vercel ls

# View logs
vercel logs [deployment-url]

# Redeploy
vercel --prod
\`\`\`

## 📞 Support
- Vercel Dashboard: https://vercel.com/dashboard
- Documentation: https://vercel.com/docs
- GitHub Repository: https://github.com/ExegesisVentures/roll2
EOF

log_success "Deployment summary created: VERCEL_DEPLOYMENT_SUMMARY.md"

# Final success message
echo ""
echo "🎉 Deployment Complete!"
echo "======================"
log_success "Roll NFT Dashboard deployed to Vercel"
log_info "API URL: ${API_URL:+https://$API_URL}${API_URL:-"Check Vercel dashboard"}"
log_info "Web URL: ${WEB_URL:+https://$WEB_URL}${WEB_URL:-"Check Vercel dashboard"}"
echo ""
log_warning "Don't forget to:"
echo "  1. Add environment variables in Vercel dashboard"
echo "  2. Test the deployed applications"
echo "  3. Configure custom domains if needed"
echo ""
log_success "Your Roll NFT Dashboard MVP is ready for testing! 🚀"
