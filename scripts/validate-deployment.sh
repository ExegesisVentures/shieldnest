#!/bin/bash

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
