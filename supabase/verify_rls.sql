
-- Verification queries for RLS setup
-- Run these after applying rls_setup.sql

-- 1) Check RLS enabled on all tables
SELECT 
  schemaname, 
  tablename, 
  rowsecurity as rls_enabled,
  CASE 
    WHEN rowsecurity THEN '✅ Enabled'
    ELSE '❌ Disabled'
  END as status
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- 2) Check policy count for each table
SELECT 
  schemaname,
  tablename,
  count(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public' 
GROUP BY schemaname, tablename 
ORDER BY tablename;

-- 3) Check helper function exists
SELECT 
  n.nspname as schema,
  p.proname as function_name,
  CASE 
    WHEN p.proname = 'user_owns_wallet' THEN '✅ Found'
    ELSE '❓ Unknown'
  END as status
FROM pg_proc p 
JOIN pg_namespace n ON p.pronamespace = n.oid 
WHERE p.proname = 'user_owns_wallet';

-- 4) Test basic RLS functionality (run as authenticated user)
-- This should return only the current user's data
-- SELECT * FROM users WHERE "supabaseId" = auth.uid()::text;
