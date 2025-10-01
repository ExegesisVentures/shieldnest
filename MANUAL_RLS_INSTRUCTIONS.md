# 🔐 Manual RLS Policy Application

## Method 1: Supabase SQL Editor (Recommended)

1. Go to: https://supabase.com/dashboard/project/cucnmhpguyynfknmxrtt
2. Navigate to: SQL Editor
3. Copy and paste the contents of `supabase/rls_setup.sql`
4. Click "Run" to execute all policies
5. Verify with the verification queries below

## Method 2: psql Command Line

```bash
# Connect to production database
psql "postgresql://postgres:8JRE5bwZHqz@H@Z@db.cucnmhpguyynfknmxrtt.supabase.co:5432/postgres" -f supabase/rls_setup.sql

# Verify setup
psql "postgresql://postgres:8JRE5bwZHqz@H@Z@db.cucnmhpguyynfknmxrtt.supabase.co:5432/postgres" -f supabase/verify_rls.sql
```

## Verification Queries

Run these in the SQL Editor to verify RLS is working:

```sql
-- Check RLS enabled on tables
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

-- Check policy count
SELECT 
  schemaname,
  tablename,
  count(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public' 
GROUP BY schemaname, tablename 
ORDER BY tablename;

-- Check helper function
SELECT 
  n.nspname as schema,
  p.proname as function_name
FROM pg_proc p 
JOIN pg_namespace n ON p.pronamespace = n.oid 
WHERE p.proname = 'user_owns_wallet';
```

## Expected Results

After successful application:
- ✅ All public tables should have RLS enabled
- ✅ Multiple policies should exist for each table
- ✅ Helper function `user_owns_wallet` should exist
- ✅ Service role should have full access
- ✅ Anonymous users should have restricted access

## Troubleshooting

If policies fail to apply:
1. Check you have admin access to the Supabase project
2. Verify the service role key is correct
3. Try applying policies one section at a time
4. Check the Supabase logs for detailed error messages

---
Generated: 2025-10-01T01:31:41.483Z
Project: Roll NFT Dashboard
Status: Ready for manual RLS application
