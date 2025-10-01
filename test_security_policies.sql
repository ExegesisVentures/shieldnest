-- =====================================================
-- SECURITY POLICY VALIDATION TEST SCRIPT
-- Run these queries to validate your RLS implementation
-- =====================================================

-- 1. VERIFY RLS IS ENABLED ON ALL TABLES
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as rls_enabled 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename NOT LIKE '%prisma%' 
ORDER BY tablename;

-- 2. COUNT POLICIES PER TABLE
SELECT 
    schemaname, 
    tablename, 
    COUNT(*) as policy_count 
FROM pg_policies 
WHERE schemaname = 'public' 
GROUP BY schemaname, tablename 
ORDER BY tablename;

-- 3. VERIFY SECURITY FUNCTION EXISTS
SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    p.prosecdef as is_security_definer,
    pg_get_userbyid(p.proowner) as owner
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'security' 
  AND p.proname = 'user_owns_wallet';

-- 4. VERIFY INDEXES EXIST FOR PERFORMANCE
SELECT 
    indexname, 
    tablename, 
    indexdef 
FROM pg_indexes 
WHERE tablename IN ('users', 'wallets', 'user_wallets', 'rise_conversions', 'rise_nft_holders')
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- =====================================================
-- MANUAL TESTS (Replace placeholders with real values)
-- =====================================================

-- Test 1: Verify you can read your own user record
-- Replace 'YOUR_SUPABASE_UUID' with your actual auth.uid()
-- SELECT * FROM public.users WHERE "supabaseId" = 'YOUR_SUPABASE_UUID';

-- Test 2: Test wallet ownership function
-- Replace 'WALLET_ADDRESS' with an actual wallet address
-- SELECT security.user_owns_wallet('WALLET_ADDRESS');

-- Test 3: Try to read another user's data (should return empty)
-- Replace 'DIFFERENT_USER_ID' with a different user's supabaseId
-- SELECT * FROM public.users WHERE "supabaseId" = 'DIFFERENT_USER_ID';

-- Test 4: Test airdrop claims access
-- Should only return claims for wallets you own
-- SELECT * FROM public.airdrop_claims LIMIT 5;

-- =====================================================
-- SERVICE ROLE VERIFICATION
-- =====================================================

-- Note: These queries should be run with service_role key to verify admin access
-- They will show all data when run with service_role, proving bypass works

-- SELECT COUNT(*) as total_users FROM public.users;
-- SELECT COUNT(*) as total_wallets FROM public.wallets;
-- SELECT COUNT(*) as total_claims FROM public.claims;

-- =====================================================
-- POLICY DETAILS (For debugging)
-- =====================================================

-- View all policies and their conditions
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
