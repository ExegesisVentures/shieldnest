# 🎯 MVP Development Prompt Template

## **Copy and paste this prompt before each request:**

---

**🎯 MVP FOCUS MODE: I am currently working on the MVP version only. Please:**

1. **Work ONLY on the `mvp-production` branch** - All changes should go directly to this branch
2. **Use the `mvp_production` database schema** - Never touch public or dev schemas  
3. **Focus on MVP features only** - Keep it simple and clean (no admin panels, staking, complex features)
4. **Make changes directly for MVP deployment** - These changes should be ready for live users
5. **Commit changes to mvp-production branch** - All updates stay on MVP branch until I say otherwise

**Current MVP Features (what users see):**
- ✅ Landing page with marketing
- ✅ User authentication (sign in/up)
- ✅ Portfolio dashboard (wallet connection, balances)
- ✅ NFT gallery (simple display)
- ✅ Profile management (basic)

**NOT in MVP (don't add these):**
- ❌ Admin panels
- ❌ Staking interface  
- ❌ Rewards history
- ❌ Convert/swap features
- ❌ Mint interface
- ❌ Complex reporting

**Deployment:** After changes, I want to deploy with `./scripts/safe-deploy.sh` to go live.

**Context:** I'm focusing 100% on getting the MVP perfect and live for users. Once MVP is stable and running well, then I'll work on advanced features on the main/develop branches.

---

## **Example Usage:**

```
🎯 MVP FOCUS MODE: I am currently working on the MVP version only. Please work ONLY on the mvp-production branch, use the mvp_production database schema, focus on MVP features only, make changes directly for MVP deployment, and commit changes to mvp-production branch.

[Your actual request here - like "Fix the login button styling" or "Add better error messages to the portfolio page"]
```

---

## **Why This Works:**

- ✅ **Clear Instructions** - I know exactly what to work on
- ✅ **Branch Protection** - All changes go to MVP branch only
- ✅ **Schema Safety** - Only MVP database schema is used
- ✅ **Feature Focus** - Keeps MVP simple and clean
- ✅ **Deployment Ready** - Changes are ready for live users

---

## **After MVP is Live and Stable:**

When you're ready to work on advanced features, you'll use a different prompt:

```
🚀 ADVANCED DEVELOPMENT MODE: I'm now working on advanced features for the main/develop branches. Please work on the main branch, use public+dev schemas, and build advanced features that will be added to MVP later.
```

But for now, **use the MVP FOCUS MODE prompt** for all your requests!

---

**🎯 Your MVP Development Prompt:**

```
🎯 MVP FOCUS MODE: I am currently working on the MVP version only. Please work ONLY on the mvp-production branch, use the mvp_production database schema, focus on MVP features only, make changes directly for MVP deployment, and commit changes to mvp-production branch. Note: I'm using the branch workflow manager to safely switch between MVP and development work.
```

**Copy this and paste it before each request!** 🚀

---

## 🔄 **Workflow Commands:**

**Before starting MVP work:**
```bash
./scripts/branch-workflow-manager.sh start-mvp
```

**When done with MVP (to return to full development):**
```bash
./scripts/branch-workflow-manager.sh back-to-dev
```

**Deploy MVP:**
```bash
./scripts/branch-workflow-manager.sh deploy-mvp
```
