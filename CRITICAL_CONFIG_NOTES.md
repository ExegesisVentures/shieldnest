# 🚨 CRITICAL CONFIGURATION NOTES - READ BEFORE MAKING CHANGES

## ⚠️ DO NOT CHANGE THESE VALUES WITHOUT UNDERSTANDING THE IMPACT

### 🔐 Database Configuration (CRITICAL)
**File**: `apps/api/.env`
```bash
# DO NOT CHANGE - This connects to the actual Supabase database
DATABASE_URL=postgresql://postgres:8JRE5bwZHqz@H@Z@db.cucnmhpguyynfknmxrtt.supabase.co:5432/postgres

# DO NOT CHANGE - These are the actual Supabase credentials
SUPABASE_URL=https://cucnmhpguyynfknmxrtt.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1Y25taHBndXl5bmZrbm14cnR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2ODYwNzMsImV4cCI6MjA3NDI2MjA3M30.3Kmj29wW0HWBgX4x6X8niPOFuH45nkZFePBK3cC1C50
```

### 🌐 Frontend Configuration (CRITICAL)
**File**: `apps/web/.env`
```bash
# DO NOT CHANGE - Must match backend API server
NEXT_PUBLIC_API_URL=http://localhost:3001

# DO NOT CHANGE - Must match backend Supabase config
NEXT_PUBLIC_SUPABASE_URL=https://cucnmhpguyynfknmxrtt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1Y25taHBndXl5bmZrbm14cnR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2ODYwNzMsImV4cCI6MjA3NDI2MjA3M30.3Kmj29wW0HWBgX4x6X8niPOFuH45nkZFePBK3cC1C50
```

## 🏗️ Architecture Overview

### Port Configuration
- **Frontend (Next.js)**: Port 3000
- **API Server (Express)**: Port 3001
- **Database**: Supabase (external)

### URL Structure
- **Frontend**: `http://localhost:3000`
- **API**: `http://localhost:3001`
- **Database**: `db.cucnmhpguyynfknmxrtt.supabase.co:5432`

## 🚫 COMMON MISTAKES TO AVOID

### 1. Database URL Issues
❌ **DON'T**: Change DATABASE_URL to localhost
❌ **DON'T**: Use different passwords
❌ **DON'T**: Change the Supabase project reference

✅ **DO**: Keep the exact DATABASE_URL as shown above
✅ **DO**: Use the provided password: `8JRE5bwZHqz@H@Z`

### 2. Port Configuration Issues
❌ **DON'T**: Change ports without updating all references
❌ **DON'T**: Use hardcoded URLs in frontend code
❌ **DON'T**: Mix up frontend (3000) and API (3001) ports

✅ **DO**: Use environment variables for all URLs
✅ **DO**: Keep frontend on 3000, API on 3001

### 3. Supabase Configuration Issues
❌ **DON'T**: Change SUPABASE_URL or SUPABASE_ANON_KEY
❌ **DON'T**: Use different Supabase projects
❌ **DON'T**: Mix up frontend and backend Supabase configs

✅ **DO**: Keep exact Supabase credentials as shown
✅ **DO**: Ensure frontend and backend use same Supabase project

## 🔧 Development Workflow

### Starting the Application
1. **API Server**: `cd apps/api && npm run dev` (Port 3001)
2. **Frontend**: `cd apps/web && npm run dev` (Port 3000)

### Health Checks
- **API Health**: `http://localhost:3001/health`
- **Frontend**: `http://localhost:3000`

### Testing Endpoints
- **Mint Info**: `http://localhost:3001/api/mint/info`
- **TMA**: `http://localhost:3001/api/tma/current`

## 🐛 Troubleshooting

### Database Connection Issues
If you get "Can't reach database server" errors:
1. Check that DATABASE_URL is exactly as shown above
2. Verify the password is correct: `8JRE5bwZHqz@H@Z`
3. Ensure you're using the Supabase URL, not localhost

### API Connection Issues
If frontend can't connect to API:
1. Check that API server is running on port 3001
2. Verify NEXT_PUBLIC_API_URL is set to `http://localhost:3001`
3. Ensure no hardcoded URLs in frontend code

### Supabase Issues
If authentication fails:
1. Verify SUPABASE_URL and SUPABASE_ANON_KEY match exactly
2. Check that both frontend and backend use same credentials
3. Ensure Supabase project is active

## 📝 Code Standards

### Environment Variables
- **Frontend**: Use `process.env.NEXT_PUBLIC_*` variables
- **Backend**: Use `process.env.*` variables
- **Never**: Hardcode URLs in source code

### API Calls
```typescript
// ✅ CORRECT - Use environment variable
const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/endpoint`);

// ❌ WRONG - Hardcoded URL
const response = await fetch('http://localhost:3001/api/endpoint');
```

## 🚨 EMERGENCY RECOVERY

If you accidentally change critical configuration:

### Database URL Recovery
```bash
# Restore correct DATABASE_URL in apps/api/.env
DATABASE_URL=postgresql://postgres:8JRE5bwZHqz@H@Z@db.cucnmhpguyynfknmxrtt.supabase.co:5432/postgres
```

### Supabase Recovery
```bash
# Restore correct Supabase config in both files:
# apps/api/.env and apps/web/.env
SUPABASE_URL=https://cucnmhpguyynfknmxrtt.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1Y25taHBndXl5bmZrbm14cnR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2ODYwNzMsImV4cCI6MjA3NDI2MjA3M30.3Kmj29wW0HWBgX4x6X8niPOFuH45nkZFePBK3cC1C50
```

---

## 📋 Configuration Checklist

Before making any changes, verify:
- [ ] DATABASE_URL points to Supabase (not localhost)
- [ ] Password is exactly: `8JRE5bwZHqz@H@Z`
- [ ] Frontend and backend use same Supabase credentials
- [ ] No hardcoded URLs in frontend code
- [ ] API server runs on port 3001
- [ ] Frontend runs on port 3000
- [ ] All environment variables are properly set

---

**Last Updated**: September 26, 2025
**Critical**: These configurations are working in production. Do not change without understanding the full impact.
