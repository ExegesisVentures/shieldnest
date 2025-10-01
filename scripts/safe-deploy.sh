#!/bin/bash

# Safe Deployment Script with Schema Protection
# Prevents database schema mix-ups during deployment

set -e

echo "🛡️ Safe Deployment with Schema Protection"
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

# Step 1: Validate current branch and schema
log_info "Step 1: Validating branch and schema configuration..."
./scripts/validate-deployment.sh || {
    log_error "Schema validation failed!"
    exit 1
}

# Step 2: Run schema guard verification
log_info "Step 2: Running schema integrity check..."
node scripts/schema-guard.js verify || {
    log_error "Schema integrity check failed!"
    exit 1
}

# Step 3: Determine deployment type
CURRENT_BRANCH=$(git branch --show-current)
case "$CURRENT_BRANCH" in
    "mvp-production")
        DEPLOYMENT_TYPE="MVP"
        ENV_FILE=".env.mvp"
        DEPLOY_SCRIPT="./scripts/deploy-mvp-live.sh"
        SCHEMA="mvp_production"
        ;;
    "main"|"develop")
        DEPLOYMENT_TYPE="DEVELOPMENT"
        ENV_FILE=".env.development"
        DEPLOY_SCRIPT="./scripts/deploy-to-vercel.sh"
        SCHEMA="public,dev"
        ;;
    *)
        log_error "Unknown branch: $CURRENT_BRANCH"
        log_info "Allowed branches: mvp-production, main, develop"
        exit 1
        ;;
esac

log_success "Deployment type: $DEPLOYMENT_TYPE"
log_success "Using schema: $SCHEMA"
log_success "Environment file: $ENV_FILE"

# Step 4: Verify environment file exists and is correct
log_info "Step 3: Verifying environment configuration..."
if [ ! -f "$ENV_FILE" ]; then
    log_error "Environment file not found: $ENV_FILE"
    log_info "Run: node scripts/schema-guard.js generate-config"
    exit 1
fi

# Check schema configuration in env file
if grep -q "DATABASE_SCHEMA=$SCHEMA" "$ENV_FILE"; then
    log_success "Schema configuration verified in $ENV_FILE"
else
    log_error "Schema mismatch in $ENV_FILE"
    log_error "Expected: DATABASE_SCHEMA=$SCHEMA"
    exit 1
fi

# Step 5: Show deployment summary
echo ""
log_info "🚀 Deployment Summary:"
echo "   Branch: $CURRENT_BRANCH"
echo "   Type: $DEPLOYMENT_TYPE"
echo "   Schema: $SCHEMA"
echo "   Environment: $ENV_FILE"
echo "   Script: $DEPLOY_SCRIPT"
echo ""

# Step 6: Confirm deployment
read -p "🤔 Proceed with deployment? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log_warning "Deployment cancelled by user"
    exit 0
fi

# Step 7: Run the appropriate deployment script
log_info "Step 4: Running deployment..."
if [ -f "$DEPLOY_SCRIPT" ]; then
    $DEPLOY_SCRIPT
else
    log_error "Deployment script not found: $DEPLOY_SCRIPT"
    exit 1
fi

# Step 8: Post-deployment verification
log_info "Step 5: Post-deployment verification..."
node scripts/schema-guard.js verify

log_success "🎉 Safe deployment completed successfully!"
log_success "Schema integrity maintained throughout deployment"
