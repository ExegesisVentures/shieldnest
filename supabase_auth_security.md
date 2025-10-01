# Supabase Authentication Security Configuration

## Critical Security Issues to Address

### 1. Enable HaveIBeenPwned Password Protection

**Issue**: Supabase Auth prevents the use of compromised passwords by checking against HaveIBeenPwned.org. This feature is currently disabled.

**Solution**: 
1. Go to Supabase Dashboard → Authentication → Settings
2. Scroll to "Security" section
3. Enable "Check passwords against HaveIBeenPwned database"
4. This will prevent users from using known compromised passwords

### 2. Enable Additional MFA Methods

**Issue**: Your project has too few MFA options enabled, which may weaken account security.

**Solution**:
1. Go to Supabase Dashboard → Authentication → Settings
2. Scroll to "Multi-Factor Authentication" section
3. Enable additional MFA methods:
   - **TOTP (Time-based One-Time Password)** - Enable this for authenticator apps
   - **Phone (SMS)** - If you have SMS provider configured
   - **Email** - As backup MFA method

### 3. Configure Email Templates

**Recommendation**: Customize email templates for better branding and security
1. Go to Authentication → Email Templates
2. Customize:
   - Confirm signup
   - Magic Link
   - Change Email Address
   - Reset Password

### 4. Configure OAuth Providers (if needed)

If using OAuth providers like Google, GitHub, etc.:
1. Go to Authentication → Providers
2. Configure redirect URLs properly
3. Ensure proper scopes are requested

### 5. Rate Limiting Configuration

**Recommendation**: Configure rate limiting for auth endpoints
1. Go to Authentication → Settings
2. Configure rate limits for:
   - Sign in attempts
   - Password reset requests
   - Email confirmation requests

## Implementation Steps

### Step 1: Apply Database Security Fixes
```bash
# Run the SQL security script in Supabase SQL Editor
# File: supabase_security_fixes.sql
```

### Step 2: Configure Authentication Settings
1. Login to your Supabase Dashboard
2. Navigate to your project: `https://supabase.com/dashboard/project/cucnmhpguyynfknmxrtt`
3. Go to Authentication → Settings
4. Apply the security configurations mentioned above

### Step 3: Verify Security Settings
```sql
-- Verify RLS is enabled on all tables
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Verify policies exist
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    cmd as command
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### Step 4: Test Security Configuration
1. Test user registration/login flows
2. Verify users can only access their own data
3. Test MFA flows if enabled
4. Verify RLS policies are working correctly

## Security Checklist

- [ ] RLS enabled on all public tables
- [ ] RLS policies created for user data isolation
- [ ] HaveIBeenPwned password checking enabled
- [ ] Additional MFA methods configured
- [ ] Email templates customized
- [ ] Rate limiting configured
- [ ] OAuth providers properly configured (if used)
- [ ] Security settings tested and verified

## Critical Notes

1. **RLS Policies**: The SQL script creates policies that allow:
   - Users to only access their own data
   - Service role (your API) to access all data
   - Public read access for certain tables (like epochs, price oracles)

2. **Service Role**: Your API uses the service role key to bypass RLS when needed. Keep this key secure and only use it server-side.

3. **Testing**: After applying these changes, thoroughly test your application to ensure:
   - User authentication still works
   - Users can only see their own data
   - Admin functions still work via service role

4. **Backup**: Always backup your database before applying security changes.

## Monitoring

After implementation, monitor:
- Authentication logs for suspicious activity
- Failed login attempts
- Database query patterns
- Any RLS policy violations in logs
