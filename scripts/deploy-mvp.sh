#!/bin/bash

# 🚀 Deploy Roll NFT Dashboard MVP to Production
# Clean, simplified deployment for MVP testing

set -e  # Exit on any error

echo "🎯 Roll NFT Dashboard - MVP Production Deployment"
echo "================================================"
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

# Check if we're on the MVP branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "mvp-production" ]; then
    log_error "Please switch to mvp-production branch first: git checkout mvp-production"
    exit 1
fi

log_success "On MVP production branch: $CURRENT_BRANCH"

# Check prerequisites
log_info "Checking prerequisites..."

if ! command -v vercel &> /dev/null; then
    log_error "Vercel CLI not found. Install with: npm i -g vercel"
    exit 1
fi

if ! command -v pnpm &> /dev/null; then
    log_error "pnpm not found. Please install pnpm"
    exit 1
fi

log_success "All prerequisites found"

# Verify MVP structure
log_info "Verifying MVP structure..."

# Check that non-MVP pages are removed
REMOVED_PAGES=(
    "apps/web/src/pages/admin"
    "apps/web/src/pages/admin.tsx"
    "apps/web/src/pages/staking.tsx"
    "apps/web/src/pages/rewards-history.tsx"
    "apps/web/src/pages/convert.tsx"
    "apps/web/src/pages/mint.tsx"
)

for page in "${REMOVED_PAGES[@]}"; do
    if [ -e "$page" ]; then
        log_warning "Non-MVP page still exists: $page"
    else
        log_success "Removed: $page"
    fi
done

# Check MVP files exist
MVP_FILES=(
    "apps/web/src/components/LayoutMVP.tsx"
    "apps/web/vercel.mvp.json"
    "mvp.env.template"
)

for file in "${MVP_FILES[@]}"; do
    if [ -f "$file" ]; then
        log_success "MVP file exists: $file"
    else
        log_error "Missing MVP file: $file"
        exit 1
    fi
done

# Install dependencies
log_info "Installing dependencies..."
pnpm install
log_success "Dependencies installed"

# Build and deploy web application
log_info "Deploying Web Application (MVP)..."
cd apps/web

# Use MVP-specific Vercel config
cp vercel.mvp.json vercel.json

# Deploy to Vercel
log_info "Deploying to Vercel with MVP configuration..."
vercel --prod --yes --env NODE_ENV=production --env ENVIRONMENT=mvp --env MVP_MODE=true || {
    log_error "MVP deployment failed"
    cd ../..
    exit 1
}

# Get deployment URL
DEPLOYMENT_URL=$(vercel --scope $(vercel whoami) ls roll-nft-mvp --json 2>/dev/null | jq -r '.[0].url' 2>/dev/null || echo "")

cd ../..

# Create MVP deployment summary
log_info "Creating MVP deployment summary..."
cat > MVP_DEPLOYMENT_STATUS.md << EOF
# 🎯 Roll NFT Dashboard MVP - Deployment Status

## ✅ MVP Deployment Complete
- **Date**: $(date)
- **Branch**: mvp-production
- **Status**: Successfully Deployed
- **Environment**: Production MVP

## 🌐 Deployment URL
- **MVP Dashboard**: ${DEPLOYMENT_URL:+https://$DEPLOYMENT_URL}${DEPLOYMENT_URL:-"Check Vercel dashboard"}

## 🎯 MVP Features Included
- ✅ **Landing Page**: Marketing and information
- ✅ **User Authentication**: Sign in/up functionality
- ✅ **Portfolio View**: Basic wallet and balance display
- ✅ **NFT Display**: Simple NFT viewing
- ✅ **Wallet Connection**: Core wallet integration
- ✅ **Profile Management**: Basic user profiles

## 🚫 Features Removed for MVP
- ❌ **Admin Panel**: Removed for security and simplicity
- ❌ **Staking Interface**: Complex feature for later
- ❌ **Rewards History**: Advanced reporting feature
- ❌ **Convert/Swap**: Trading functionality for later
- ❌ **Mint Interface**: NFT creation for later
- ❌ **Test Pages**: Development-only pages

## 🔧 MVP Configuration
- **Environment**: Production optimized
- **Security**: Basic security headers enabled
- **Redirects**: Non-MVP pages redirect to portfolio
- **Performance**: Optimized build and caching
- **Monitoring**: Error reporting enabled

## 📋 Post-Deployment Checklist
- [ ] Test user registration and login
- [ ] Verify wallet connection works
- [ ] Check portfolio display functionality
- [ ] Test NFT viewing
- [ ] Verify responsive design on mobile
- [ ] Test all navigation links
- [ ] Confirm security headers are active

## 🚀 Next Steps
1. **User Testing**: Gather feedback from initial users
2. **Monitor Performance**: Watch for errors and slow pages
3. **Iterate Based on Feedback**: Improve core MVP features
4. **Plan Feature Additions**: Prioritize next features to add

## 🔗 Useful Links
- **Vercel Dashboard**: https://vercel.com/dashboard
- **GitHub Repository**: https://github.com/ExegesisVentures/roll2
- **Supabase Dashboard**: https://supabase.com/dashboard

## 📞 Support & Maintenance
- **Branch**: Keep \`main\` and \`develop\` for continued development
- **MVP Branch**: \`mvp-production\` for production fixes only
- **Deployment**: Use this script for MVP updates
- **Monitoring**: Check Vercel analytics and error logs

---

**🎉 Your Roll NFT Dashboard MVP is live and ready for user testing!**
EOF

log_success "MVP deployment summary created: MVP_DEPLOYMENT_STATUS.md"

# Final success message
echo ""
echo "🎉 MVP Deployment Complete!"
echo "=========================="
log_success "Roll NFT Dashboard MVP deployed successfully"
log_info "MVP URL: ${DEPLOYMENT_URL:+https://$DEPLOYMENT_URL}${DEPLOYMENT_URL:-"Check Vercel dashboard"}"
echo ""
log_warning "Remember to:"
echo "  1. Test all core functionality"
echo "  2. Gather user feedback"
echo "  3. Monitor performance and errors"
echo "  4. Keep main/develop branches for continued development"
echo ""
log_success "Your MVP is ready for real users! 🚀"
echo ""
log_info "To continue development:"
echo "  git checkout main    # Return to full development version"
echo "  git checkout develop # Or work on develop branch"
