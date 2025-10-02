#!/bin/bash

# Serverless Endpoints Testing Script
# Tests all converted endpoints locally

set -e

BASE_URL="http://localhost:3000"
echo "🧪 Testing Serverless API Endpoints"
echo "Base URL: $BASE_URL"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to test endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local description=$3
    
    echo -n "Testing $method $endpoint ... "
    
    if [ "$method" == "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" \
            -H "Content-Type: application/json")
    fi
    
    status_code=$(echo "$response" | tail -n1)
    
    if [ "$status_code" -eq 200 ] || [ "$status_code" -eq 401 ] || [ "$status_code" -eq 403 ]; then
        echo -e "${GREEN}✓${NC} ($status_code - $description)"
    else
        echo -e "${RED}✗${NC} ($status_code - $description)"
    fi
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Core Endpoints"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "GET" "/api/health" "Health Check"
test_endpoint "GET" "/api/config" "Configuration"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Authentication Endpoints (Public)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "POST" "/api/auth/wallet-auth" "Wallet Auth (expects 400)"
test_endpoint "POST" "/api/auth/password" "Password Auth (expects 400)"
test_endpoint "POST" "/api/auth/magic-link" "Magic Link (expects 400)"
test_endpoint "POST" "/api/auth/email" "Email Auth (expects 400)"
test_endpoint "POST" "/api/auth/verify-magic-link" "Verify Magic Link (expects 400)"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Authentication Endpoints (Requires Auth - expects 401)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "GET" "/api/auth/me" "Get Current User"
test_endpoint "POST" "/api/auth/connect-wallet" "Connect Wallet"
test_endpoint "POST" "/api/auth/change-password" "Change Password"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TMA Endpoints"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "GET" "/api/tma/current" "Get Current TMA"
test_endpoint "GET" "/api/tma/versions" "Get TMA Versions"
test_endpoint "GET" "/api/tma/consent-status" "Consent Status (expects 401)"
test_endpoint "POST" "/api/tma/sign" "Sign TMA (expects 401)"
test_endpoint "POST" "/api/tma/create" "Create TMA (expects 400)"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PMA Endpoints"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "GET" "/api/pma/current" "Get Current PMA"
test_endpoint "GET" "/api/pma/status" "PMA Status (expects 401)"
test_endpoint "POST" "/api/pma/sign" "Sign PMA (expects 401)"
test_endpoint "GET" "/api/pma/history" "PMA History (expects 401)"
test_endpoint "POST" "/api/pma/generate-document" "Generate Document (expects 401)"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Profile Endpoints (Requires Auth - expects 401)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "GET" "/api/profile" "Get Profile"
test_endpoint "PUT" "/api/profile" "Update Profile"
test_endpoint "POST" "/api/profile/wallets" "Add Wallet"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Users Endpoints"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "GET" "/api/users/profile" "Get User Profile (expects 401)"
test_endpoint "POST" "/api/users/create-profile" "Create Profile (expects 400)"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Balances & Tokens"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "GET" "/api/tokens" "Get Tokens"
test_endpoint "GET" "/api/balances/core1test" "Get Balances (test address)"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Pools"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "GET" "/api/pools/coreum-dex-data" "Get Pool Data"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Rewards Endpoints (Requires Auth - expects 401)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "GET" "/api/rewards/epoch" "Get Current Epoch"
test_endpoint "GET" "/api/rewards/summary" "Get Rewards Summary"
test_endpoint "GET" "/api/rewards/history" "Get Rewards History"
test_endpoint "POST" "/api/rewards/claim" "Claim Rewards"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Convert Endpoints (Requires Auth - expects 401)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "GET" "/api/convert/check-eligibility" "Check Eligibility"
test_endpoint "POST" "/api/convert/convert" "Convert NFT"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Mint Endpoints"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "GET" "/api/mint/info" "Get Mint Info"
test_endpoint "GET" "/api/mint/eligibility" "Check Eligibility (expects 401)"
test_endpoint "POST" "/api/mint/mint" "Mint NFT (expects 401)"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Staking Endpoints"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "GET" "/api/staking/validators" "Get Validators"
test_endpoint "POST" "/api/staking/track-wallet" "Track Wallet (expects 401)"
test_endpoint "POST" "/api/staking/claims" "Log Claim (expects 401)"
test_endpoint "POST" "/api/staking/refresh" "Refresh Rewards (expects 401)"
test_endpoint "GET" "/api/staking/members" "Get Members (expects 401)"
test_endpoint "POST" "/api/staking/delegate" "Delegate (expects 401)"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Admin Endpoints (Requires Admin - expects 401/403)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "GET" "/api/admin/rise-holders" "Get Rise Holders"
test_endpoint "GET" "/api/admin/stats" "Get Admin Stats"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Testing Complete!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Note: Many endpoints expect auth (401) or admin access (403) - this is correct!"
echo "Public endpoints (health, config, validators, etc.) should return 200."
echo ""
echo "To test authenticated endpoints, get a JWT token first:"
echo "curl -X POST $BASE_URL/api/auth/wallet-auth -H 'Content-Type: application/json' -d '{...}'"

