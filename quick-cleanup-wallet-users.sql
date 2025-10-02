-- ============================================
-- QUICK CLEANUP: One command to delete all @wallet.local users
-- ============================================
-- Run this in Supabase SQL Editor

-- This single DELETE will cascade to all related tables
-- because the schema has onDelete: Cascade configured
DELETE FROM users WHERE email LIKE '%@wallet.local';

-- Verify
SELECT COUNT(*) as remaining_wallet_users FROM users WHERE email LIKE '%@wallet.local';

