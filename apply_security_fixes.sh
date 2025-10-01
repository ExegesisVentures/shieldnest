#!/bin/bash

# =====================================================
# APPLY SUPABASE SECURITY FIXES
# =====================================================

echo "🔒 Applying Supabase Security Fixes..."
echo "======================================"

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
echo "• HaveIBeenPwned password checking disabled"
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
echo -e "${BLUE}🔧 Step 1: Applying Database Security Fixes...${NC}"

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ Error: psql not found. Please install PostgreSQL client tools.${NC}"
    echo "On macOS: brew install postgresql"
    echo "On Ubuntu: sudo apt-get install postgresql-client"
    exit 1
fi

# Apply the SQL security fixes
echo "Applying RLS and security policies..."
psql "$DATABASE_URL" -f supabase_security_fixes.sql

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database security fixes applied successfully${NC}"
else
    echo -e "${RED}❌ Error applying database security fixes${NC}"
    echo "Please check the error messages above and try again"
    exit 1
fi

echo ""
echo -e "${BLUE}🔧 Step 2: Verification${NC}"

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
echo -e "${BLUE}🔧 Step 3: Manual Configuration Required${NC}"
echo ""
echo -e "${YELLOW}📋 Manual Steps (Required):${NC}"
echo "1. Go to your Supabase Dashboard:"
echo "   https://supabase.com/dashboard/project/cucnmhpguyynfknmxrtt"
echo ""
echo "2. Navigate to Authentication → Settings"
echo ""
echo "3. Enable HaveIBeenPwned password checking:"
echo "   • Scroll to 'Security' section"
echo "   • Enable 'Check passwords against HaveIBeenPwned database'"
echo ""
echo "4. Configure Multi-Factor Authentication:"
echo "   • Scroll to 'Multi-Factor Authentication' section"
echo "   • Enable TOTP (recommended)"
echo "   • Consider enabling Phone/SMS if configured"
echo ""
echo "5. Review and customize email templates:"
echo "   • Go to Authentication → Email Templates"
echo "   • Customize signup confirmation, magic link, etc."
echo ""
echo "6. Configure rate limiting:"
echo "   • Set appropriate limits for sign-in attempts"
echo "   • Set limits for password reset requests"
echo ""

echo -e "${GREEN}✅ Database security fixes completed!${NC}"
echo ""
echo -e "${BLUE}📋 Next Steps:${NC}"
echo "1. Complete the manual configuration steps above"
echo "2. Test your application thoroughly:"
echo "   • User registration/login"
echo "   • Data access permissions"
echo "   • Admin functions"
echo "3. Monitor authentication logs for any issues"
echo ""
echo -e "${YELLOW}⚠️  Important:${NC}"
echo "• Your API will continue to work via service role"
echo "• Users will only see their own data (as intended)"
echo "• Public data (epochs, price oracles) remains readable"
echo ""
echo "For detailed information, see: supabase_auth_security.md"
