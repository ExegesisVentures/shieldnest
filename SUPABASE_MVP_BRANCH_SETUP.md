# 🎯 Supabase MVP Branch Creation Guide

## 📋 **Current Status**
- **Development Project**: https://cucnmhpguyynfknmxrtt.supabase.co (keep for development)
- **MVP Branch**: Needs to be created for production users

## 🚀 **Step-by-Step MVP Branch Creation**

### **Step 1: Create MVP Branch in Supabase Dashboard**

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard/project/cucnmhpguyynfknmxrtt
2. **Navigate to Branches**: Project → Branches
3. **Create New Branch**:
   - Branch name: `mvp`
   - Base branch: `main` (current production)
   - Description: "Clean MVP branch for production users"
   - Wait for creation (5-10 minutes)

### **Step 2: Collect MVP Branch Credentials**

After branch creation, go to **Project Settings → API** and collect:

```bash
# MVP Branch Credentials (replace with actual values from dashboard)
SUPABASE_URL_MVP=https://cucnmhpguyynfknmxrtt-mvp.supabase.co
SUPABASE_ANON_KEY_MVP=your_mvp_anon_key_here
SUPABASE_SERVICE_ROLE_KEY_MVP=your_mvp_service_role_key_here
DATABASE_URL_MVP=postgresql://postgres:[mvp-password]@db.cucnmhpguyynfknmxrtt-mvp.supabase.co:5432/postgres
```

### **Step 3: Apply RLS to MVP Branch**

```bash
# Apply RLS policies to MVP branch
SUPABASE_URL="https://cucnmhpguyynfknmxrtt-mvp.supabase.co" \
SUPABASE_SERVICE_ROLE_KEY="your_mvp_service_role_key" \
node scripts/apply-rls-to-mvp.js
```

### **Step 4: Update Environment Files**

Create MVP-specific environment files:

```bash
# Copy MVP environment template
cp mvp.env.template .env.mvp

# Update with actual MVP branch credentials
# Edit .env.mvp with your MVP branch values
```

## 🎯 **Final Branch Strategy**

### **Development Branch** (Current Project)
- **URL**: https://cucnmhpguyynfknmxrtt.supabase.co
- **Purpose**: Continue building features, testing, experimentation
- **Git Branches**: `main`, `develop`
- **Schema**: `public` + `dev` (full feature set)
- **Usage**: Development and feature testing

### **MVP Branch** (New Branch)
- **URL**: https://cucnmhpguyynfknmxrtt-mvp.supabase.co
- **Purpose**: Clean, stable production for users
- **Git Branch**: `mvp-production`
- **Schema**: `public` only (essential tables)
- **Usage**: Production MVP deployment

## 🚀 **Deployment Strategy**

### **Deploy MVP** (Users):
```bash
git checkout mvp-production
# Update environment with MVP branch credentials
./scripts/deploy-mvp.sh
```

### **Deploy Development** (Testing):
```bash
git checkout main
# Uses development Supabase project
./scripts/deploy-to-vercel.sh
```

## ✅ **Benefits of This Setup**

1. **Complete Isolation**: MVP users never see development data
2. **Stable MVP**: Production branch doesn't change unless you update it
3. **Free Development**: Build features without affecting MVP
4. **Easy Updates**: Migrate proven features to MVP when ready
5. **Separate Monitoring**: Different analytics and error tracking

## 🔄 **Migration Process**

When you want to add features to MVP:

1. **Test in Development**: Verify feature works in development branch
2. **Apply to MVP**: Run migration scripts on MVP branch
3. **Deploy MVP**: Update MVP deployment with new features
4. **Monitor**: Ensure MVP stability

---

**Next Action**: Create the MVP branch in Supabase dashboard, then run the setup scripts.
