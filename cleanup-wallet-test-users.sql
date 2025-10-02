-- ============================================
-- CLEANUP: Remove all @wallet.local test users
-- ============================================
-- This script removes users created during wallet-only authentication testing
-- These are temporary users with email format: address@wallet.local

-- Safety check: Show what will be deleted
SELECT 
  'Users to delete:' as info,
  COUNT(*) as count,
  STRING_AGG(email, ', ') as emails
FROM users 
WHERE email LIKE '%@wallet.local';

-- Show related wallets
SELECT 
  'Wallets to delete:' as info,
  COUNT(*) as count
FROM wallets w
JOIN users u ON w."userId" = u.id
WHERE u.email LIKE '%@wallet.local';

-- ============================================
-- DELETE RELATED DATA (in order of dependencies)
-- ============================================

-- 1. Delete TMA Consents
DELETE FROM tma_consents
WHERE "userId" IN (
  SELECT id FROM users WHERE email LIKE '%@wallet.local'
);

-- 2. Delete PMA Consents
DELETE FROM pma_consents
WHERE "userId" IN (
  SELECT id FROM users WHERE email LIKE '%@wallet.local'
);

-- 3. Delete Claims
DELETE FROM claims
WHERE "userId" IN (
  SELECT id FROM users WHERE email LIKE '%@wallet.local'
);

-- 4. Delete Sellbacks
DELETE FROM sellbacks
WHERE "userId" IN (
  SELECT id FROM users WHERE email LIKE '%@wallet.local'
);

-- 5. Delete Reward Claims
DELETE FROM reward_claims
WHERE "userId" IN (
  SELECT id FROM users WHERE email LIKE '%@wallet.local'
);

-- 6. Delete Staking Claims
DELETE FROM staking_claims
WHERE "userId" IN (
  SELECT id FROM users WHERE email LIKE '%@wallet.local'
);

-- 7. Delete Staking Tracked Wallets
DELETE FROM staking_tracked_wallets
WHERE "userId" IN (
  SELECT id FROM users WHERE email LIKE '%@wallet.local'
);

-- 8. Delete Rise Conversions
DELETE FROM rise_conversions
WHERE "userId" IN (
  SELECT id FROM users WHERE email LIKE '%@wallet.local'
);

-- 9. Delete User Wallets (many-to-many)
DELETE FROM user_wallets
WHERE "userId" IN (
  SELECT id FROM users WHERE email LIKE '%@wallet.local'
);

-- 10. Delete Wallets (this cascades to wallet-related data)
DELETE FROM wallets
WHERE "userId" IN (
  SELECT id FROM users WHERE email LIKE '%@wallet.local'
);

-- ============================================
-- DELETE USERS
-- ============================================

-- Finally, delete the users themselves
DELETE FROM users
WHERE email LIKE '%@wallet.local';

-- ============================================
-- VERIFICATION
-- ============================================

-- Verify cleanup
SELECT 
  'Remaining @wallet.local users:' as info,
  COUNT(*) as count
FROM users 
WHERE email LIKE '%@wallet.local';

-- Show summary
SELECT 
  'Cleanup complete!' as status,
  'All @wallet.local test users have been removed' as message;

