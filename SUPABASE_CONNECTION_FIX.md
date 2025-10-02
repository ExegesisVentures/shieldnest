# 🔧 Supabase Connection Fix for Vercel

## Issue
Vercel cannot reach Supabase Transaction Pooler on port 6543.

## Solution: Use Session Mode Pooler

### Update These Environment Variables in Vercel:

#### 1. DATABASE_URL (Session Pooler - Port 5432)
```
postgresql://postgres:8JRE5bwZHqz%40H%40Z@db.cucnmhpguyynfknmxrtt.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1
```

**Note:** Added `connection_limit=1` for serverless optimization.

#### 2. DIRECT_URL (Direct Connection - Port 5432)
```
postgresql://postgres:8JRE5bwZHqz%40H%40Z@db.cucnmhpguyynfknmxrtt.supabase.co:5432/postgres
```

**Note:** Same as DATABASE_URL but without pooler params (used for migrations only).

---

## Alternative: Check Supabase Project Status

### Steps to verify in Supabase Dashboard:

1. **Go to:** https://supabase.com/dashboard/project/cucnmhpguyynfknmxrtt

2. **Check Database Status:**
   - Settings → Database
   - Is the database **ACTIVE** (not paused)?
   - On free tier, databases pause after 1 week of inactivity

3. **Check Connection Pooler:**
   - Settings → Database → Connection Pooling
   - Is **Supavisor** enabled?
   - Is **Transaction Mode** on port 6543 available?

4. **Check Network Settings:**
   - Settings → Database → Network Restrictions
   - Are there any IP allowlists blocking Vercel?
   - Vercel uses dynamic IPs, so you may need to allow all IPs

---

## Quick Test After Updating

After updating `DATABASE_URL` in Vercel:

1. **Redeploy** (without cache)
2. Test: `https://shieldnest-mvp-production.vercel.app/api/test-db-connection`
3. Should show: `"success": true`

---

## If Still Failing

The issue might be:
- Supabase database is paused (wake it up in dashboard)
- Connection pooler not enabled (check Supabase settings)
- IPv6 compatibility issue (Vercel uses IPv6, Supabase might need IPv4 Add-on)
- Network restrictions (check Supabase firewall settings)

