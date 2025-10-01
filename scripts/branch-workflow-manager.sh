#!/bin/bash

# 🔄 Branch Workflow Manager
# Manages switching between MVP work and full development work
# Preserves your work and prevents conflicts

set -e

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

echo "🔄 Branch Workflow Manager"
echo "========================="
echo ""

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)
log_info "Current branch: $CURRENT_BRANCH"

# Show available commands
if [ $# -eq 0 ]; then
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  start-mvp     - Switch to MVP development (saves current work)"
    echo "  back-to-dev   - Return to full development (saves MVP work)"
    echo "  status        - Show current workflow status"
    echo "  sync-mvp      - Sync specific MVP changes to development"
    echo "  deploy-mvp    - Deploy current MVP"
    echo ""
    exit 0
fi

COMMAND=$1

case "$COMMAND" in
    "start-mvp")
        echo "🎯 Switching to MVP Development Mode"
        echo "===================================="
        
        # Save current work if on main/develop
        if [[ "$CURRENT_BRANCH" == "main" || "$CURRENT_BRANCH" == "develop" ]]; then
            log_info "Saving current development work..."
            
            # Check for uncommitted changes
            if ! git diff-index --quiet HEAD --; then
                log_warning "You have uncommitted changes. Committing them first..."
                git add -A
                git commit -m "💾 Save development work before switching to MVP ($(date))"
                log_success "Development work saved"
            fi
            
            # Switch to MVP branch
            log_info "Switching to mvp-production branch..."
            git checkout mvp-production
            
            # Pull latest MVP changes
            log_info "Pulling latest MVP changes..."
            git pull origin mvp-production || log_warning "Could not pull (first time setup?)"
            
        elif [ "$CURRENT_BRANCH" == "mvp-production" ]; then
            log_success "Already on MVP branch"
        else
            log_error "Unknown branch: $CURRENT_BRANCH"
            exit 1
        fi
        
        log_success "🎯 MVP Development Mode Active!"
        log_info "Use the MVP prompt for all changes now"
        log_info "When done: ./scripts/branch-workflow-manager.sh back-to-dev"
        ;;
        
    "back-to-dev")
        echo "🚀 Returning to Full Development Mode"
        echo "====================================="
        
        # Must be on MVP branch
        if [ "$CURRENT_BRANCH" != "mvp-production" ]; then
            log_error "Must be on mvp-production branch to return to development"
            log_info "Current branch: $CURRENT_BRANCH"
            exit 1
        fi
        
        # Save MVP work
        log_info "Saving MVP work..."
        if ! git diff-index --quiet HEAD --; then
            git add -A
            git commit -m "💾 Save MVP work before switching to development ($(date))"
            log_success "MVP work saved"
        fi
        
        # Push MVP changes
        log_info "Pushing MVP changes to GitHub..."
        git push origin mvp-production
        
        # Switch back to main
        log_info "Switching back to main branch..."
        git checkout main
        
        # Pull latest development changes
        log_info "Pulling latest development changes..."
        git pull origin main || log_warning "Could not pull"
        
        log_success "🚀 Full Development Mode Active!"
        log_info "You're back to your full development environment"
        log_info "MVP changes are safely stored on mvp-production branch"
        ;;
        
    "status")
        echo "📊 Current Workflow Status"
        echo "=========================="
        
        log_info "Current branch: $CURRENT_BRANCH"
        
        # Check for uncommitted changes
        if ! git diff-index --quiet HEAD --; then
            log_warning "You have uncommitted changes"
            echo "   Modified files:"
            git diff --name-only HEAD | sed 's/^/     /'
        else
            log_success "No uncommitted changes"
        fi
        
        # Show recent commits on current branch
        echo ""
        log_info "Recent commits on $CURRENT_BRANCH:"
        git log --oneline -5 | sed 's/^/   /'
        
        # Show branch comparison
        echo ""
        if [ "$CURRENT_BRANCH" == "mvp-production" ]; then
            log_info "MVP vs Development comparison:"
            AHEAD=$(git rev-list --count main..mvp-production 2>/dev/null || echo "0")
            BEHIND=$(git rev-list --count mvp-production..main 2>/dev/null || echo "0")
            echo "   MVP is $AHEAD commits ahead of main"
            echo "   MVP is $BEHIND commits behind main"
        else
            log_info "Development vs MVP comparison:"
            AHEAD=$(git rev-list --count mvp-production..main 2>/dev/null || echo "0")
            BEHIND=$(git rev-list --count main..mvp-production 2>/dev/null || echo "0")
            echo "   Development is $AHEAD commits ahead of MVP"
            echo "   Development is $BEHIND commits behind MVP"
        fi
        ;;
        
    "sync-mvp")
        echo "🔄 Sync MVP Changes to Development"
        echo "=================================="
        
        if [ "$CURRENT_BRANCH" != "main" ]; then
            log_error "Must be on main branch to sync MVP changes"
            exit 1
        fi
        
        log_info "This will show you MVP changes to selectively merge..."
        
        # Show MVP commits not in main
        echo ""
        log_info "MVP commits not in development:"
        git log --oneline main..mvp-production | sed 's/^/   /'
        
        echo ""
        read -p "🤔 Do you want to merge ALL MVP changes to development? (y/N): " -n 1 -r
        echo
        
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            log_info "Merging MVP changes..."
            git merge mvp-production
            log_success "MVP changes merged to development"
        else
            log_info "Selective merge cancelled"
            log_info "Use: git cherry-pick <commit-hash> to pick specific commits"
        fi
        ;;
        
    "deploy-mvp")
        echo "🚀 Deploy MVP"
        echo "============="
        
        if [ "$CURRENT_BRANCH" != "mvp-production" ]; then
            log_error "Must be on mvp-production branch to deploy MVP"
            exit 1
        fi
        
        # Save any uncommitted changes
        if ! git diff-index --quiet HEAD --; then
            log_info "Saving uncommitted changes..."
            git add -A
            git commit -m "💾 Save changes before MVP deployment ($(date))"
        fi
        
        # Push to GitHub
        log_info "Pushing MVP to GitHub..."
        git push origin mvp-production
        
        # Deploy
        log_info "Deploying MVP..."
        ./scripts/safe-deploy.sh
        ;;
        
    *)
        log_error "Unknown command: $COMMAND"
        log_info "Use: $0 (no arguments) to see available commands"
        exit 1
        ;;
esac
