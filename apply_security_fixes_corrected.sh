#!/bin/bash

# =====================================================
# APPLY SUPABASE SECURITY FIXES (CORRECTED VERSION)
# =====================================================

echo "🔒 Applying Supabase Security Fixes (Corrected)..."
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f "apps/api/.env" ]; then
    echo -e "${RED}❌ Error: apps/api/.env file not found${NC}"
    echo "Please ensure you're running this from the project root and .env file exists"
    exit 1
fi

# Load environment variables
source apps/api/.env

# Check if required environment variables exist
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ Error: DATABASE_URL not found in .env file${NC}"
    exit 1
fi

echo -e "${BLUE}📋 Security Issues Found:${NC}"
echo "• Row Level Security (RLS) not enabled on public tables"
echo "• No RLS policies configured for data isolation"
echo "• HaveIBeenPwned password checking not implemented"
echo "• Insufficient MFA options enabled"
echo ""

echo -e "${YELLOW}⚠️  IMPORTANT WARNINGS:${NC}"
echo "• This script will modify your database security settings"
echo "• Always backup your database before applying security changes"
echo "• Test thoroughly after applying these changes"
echo "• Some operations may temporarily block access to data"
echo ""

# Prompt for confirmation
read -p "Do you want to proceed with applying security fixes? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Operation cancelled."
    exit 0
fi

echo ""
echo -e "${BLUE}🔧 Step 1: Checking PostgreSQL client...${NC}"

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ Error: psql not found. Installing PostgreSQL client...${NC}"
    
    # Try to install on macOS
    if command -v brew &> /dev/null; then
        echo "Installing via Homebrew..."
        brew install postgresql
    else
        echo "Please install PostgreSQL client tools:"
        echo "On macOS: brew install postgresql"
        echo "On Ubuntu: sudo apt-get install postgresql-client"
        echo "On Windows: Download from https://www.postgresql.org/download/windows/"
        exit 1
    fi
fi

echo -e "${GREEN}✅ PostgreSQL client is available${NC}"

echo ""
echo -e "${BLUE}🔧 Step 2: Testing database connection...${NC}"

# Test database connection
if ! psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${RED}❌ Error: Cannot connect to database${NC}"
    echo "Please check your DATABASE_URL in .env file"
    exit 1
fi

echo -e "${GREEN}✅ Database connection successful${NC}"

echo ""
echo -e "${BLUE}🔧 Step 3: Applying corrected security fixes...${NC}"

# Apply the final corrected SQL security fixes
echo "Applying RLS and security policies..."
if psql "$DATABASE_URL" -f supabase_security_fixes_final.sql; then
    echo -e "${GREEN}✅ Database security fixes applied successfully${NC}"
else
    echo -e "${RED}❌ Error applying database security fixes${NC}"
    echo "Please check the error messages above"
    exit 1
fi

echo ""
echo -e "${BLUE}🔧 Step 4: Installing HaveIBeenPwned function...${NC}"

# Apply HaveIBeenPwned function (requires http extension)
echo "Installing password security function..."
if psql "$DATABASE_URL" -c "CREATE EXTENSION IF NOT EXISTS http;" && \
   psql "$DATABASE_URL" -f supabase_hibp_function.sql; then
    echo -e "${GREEN}✅ HaveIBeenPwned function installed successfully${NC}"
else
    echo -e "${YELLOW}⚠️  Warning: Could not install HaveIBeenPwned function${NC}"
    echo "This might be due to extension restrictions. You can use the Edge Function instead."
fi

echo ""
echo -e "${BLUE}🔧 Step 5: Verification${NC}"

# Verify RLS is enabled
echo "Verifying RLS is enabled on all tables..."
psql "$DATABASE_URL" -c "
SELECT 
    tablename, 
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename NOT LIKE '%_prisma_%'
ORDER BY tablename;
"

echo ""
echo -e "${BLUE}🔧 Step 6: Policy verification${NC}"

# Check policies are created
echo "Verifying security policies..."
psql "$DATABASE_URL" -c "
SELECT 
    tablename,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
"

echo ""
echo -e "${GREEN}✅ Database security fixes completed!${NC}"
echo ""
echo -e "${BLUE}📋 Manual Steps Required:${NC}"
echo ""
echo -e "${YELLOW}1. Supabase Dashboard Configuration:${NC}"
echo "   https://supabase.com/dashboard/project/cucnmhpguyynfknmxrtt"
echo ""
echo -e "${YELLOW}2. Enable HaveIBeenPwned password checking:${NC}"
echo "   • Go to Authentication → Settings"
echo "   • Scroll to 'Security' section"
echo "   • Enable 'Check passwords against HaveIBeenPwned database'"
echo ""
echo -e "${YELLOW}3. Configure Multi-Factor Authentication:${NC}"
echo "   • Scroll to 'Multi-Factor Authentication' section"
echo "   • Enable TOTP (recommended)"
echo "   • Consider enabling Phone/SMS if configured"
echo ""
echo -e "${YELLOW}4. Optional: Deploy Edge Function for advanced password checking${NC}"
echo "   • Copy edge_function_hibp.ts to supabase/functions/check-password/index.ts"
echo "   • Copy cors_helper.ts to supabase/functions/_shared/cors.ts"
echo "   • Run: supabase functions deploy check-password"
echo ""
echo -e "${BLUE}📋 Testing Steps:${NC}"
echo "1. Test user registration/login flows"
echo "2. Verify users can only access their own data"
echo "3. Test API continues working"
echo "4. Monitor authentication logs"
echo ""
echo -e "${GREEN}🎉 Security implementation complete!${NC}"
echo ""
echo "For detailed information, see: supabase_auth_security.md"
