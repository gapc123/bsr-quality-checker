# 🚨 Railway Deployment Fix - Blank Screen Issue

## Problem Summary
The deployed domain shows a blank screen because the **Clerk authentication key is not being set during the build process**.

## Root Cause
Vite (the frontend build tool) needs environment variables prefixed with `VITE_` to be available **during build time**, not runtime. The variable `VITE_CLERK_PUBLISHABLE_KEY` was either missing or set to a placeholder value during the Railway build.

---

## ✅ SOLUTION: Fix Railway Environment Variables

### Step 1: Access Railway Dashboard

1. Go to: https://railway.com/project/cf75d4c6-d6c7-4cad-88ba-0bd4d4e7e0a3
2. Click on your service (the one running bsr-quality-checker)
3. Go to the **"Variables"** tab

### Step 2: Add/Update Environment Variables

Click **"+ New Variable"** and add these **EXACTLY** as shown:

#### Required Variables:
```bash
# Database
DATABASE_URL=file:/app/data/production.db

# Anthropic API (copy from your packages/backend/.env file)
ANTHROPIC_API_KEY=your-anthropic-api-key-here

# Clerk Authentication (CRITICAL FOR FRONTEND)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_cmVsYXhpbmctcmF5LTE5LmNsZXJrLmFjY291bnRzLmRldiQ

# Environment
NODE_ENV=production
PORT=3001
```

#### Important Notes:
- ⚠️ **VITE_CLERK_PUBLISHABLE_KEY** must be set **BEFORE** the build runs
- Railway automatically rebuilds when you add variables
- The Clerk key shown above is from your `main.tsx` fallback value
- If you want a different Clerk project, get the key from https://dashboard.clerk.com

### Step 3: Ensure Volume is Mounted (for Database)

1. In Railway Dashboard → **"Settings"** → **"Volumes"**
2. If no volume exists, click **"+ New Volume"**
3. Set:
   - **Mount Path**: `/app/data`
   - **Size**: 1 GB minimum
4. Click **"Add"**

### Step 4: Redeploy

After adding the environment variables:

**Option A: Automatic Redeploy (Recommended)**
- Railway will automatically redeploy when you save the variables
- Watch the **"Deployments"** tab for build progress

**Option B: Manual Trigger**
- Go to **"Deployments"** tab
- Click the **"..."** menu on the latest deployment
- Select **"Redeploy"**

**Option C: Git Push**
```bash
cd /Users/georgeclarke/bsr-quality-checker
git add .
git commit -m "Fix: Add frontend .env and documentation for Railway deployment"
git push origin main
```

### Step 5: Verify the Build

1. Watch the Railway build logs in the **"Deployments"** tab
2. Look for this line during the build:
   ```
   npm run build --workspace=packages/frontend
   ✓ built in XXXms
   ```
3. Ensure there are no Vite environment variable warnings

### Step 6: Test the Deployed Site

Once deployment completes (usually 3-5 minutes):

1. **Visit your Railway domain** (e.g., `your-app.up.railway.app`)
2. ✅ You should see the **Landing Page** (not a blank screen)
3. ✅ Click **"Sign In"** - Clerk should load
4. ✅ Test the health endpoint: `https://your-app.up.railway.app/api/health`
   - Should return: `{"status":"ok","timestamp":"..."}`

---

## 🔍 Debugging Steps (If Still Blank)

### Check 1: Browser Console
1. Open the deployed site
2. Press **F12** (or Cmd+Option+I on Mac)
3. Go to **"Console"** tab
4. Look for errors mentioning:
   - Clerk
   - "Publishable key"
   - "Failed to load"

### Check 2: Network Tab
1. In browser DevTools → **"Network"** tab
2. Refresh the page
3. Check if:
   - `index.html` loads (Status 200)
   - JavaScript files load (Status 200)
   - No 404 errors for assets

### Check 3: Railway Build Logs
1. Railway Dashboard → **"Deployments"** tab
2. Click latest deployment
3. Check build logs for:
   ```
   [BUILD] npm run build --workspace=packages/frontend
   [BUILD] ✓ built in XXXms
   ```
4. Verify no environment variable warnings

### Check 4: Railway Runtime Logs
1. Railway Dashboard → **"Logs"** tab
2. Look for startup message:
   ```
   BSR Quality Checker API running on port 3001
   Environment: Production
   Serving frontend from: /app/packages/frontend/dist
   ```

### Check 5: Verify Environment Variables
Use Railway's debug endpoint:
```
https://your-app.up.railway.app/api/debug
```
This will show:
- Current working directory
- Frontend path
- Whether frontend dist exists
- What files are in dist/

---

## 🎯 Expected Behavior After Fix

### Before (Blank Screen):
```
User visits domain → Blank white screen → Console shows Clerk initialization error
```

### After (Fixed):
```
User visits domain → Landing page loads → "Sign In" button works → Full app accessible
```

---

## 📋 Verification Checklist

Use this checklist to confirm everything is working:

- [ ] Railway environment variables are set (all 5 required)
- [ ] Volume is mounted at `/app/data`
- [ ] Deployment completed successfully (green checkmark)
- [ ] Domain loads the landing page (not blank)
- [ ] Browser console shows no Clerk errors
- [ ] Sign-in button appears and works
- [ ] Health check endpoint returns `{"status":"ok"}`
- [ ] Can create a client after signing in
- [ ] Can create a pack
- [ ] Can upload documents

---

## 🔑 Clerk Configuration (Optional)

If you want to use a **production** Clerk key instead of the test key:

1. Go to https://dashboard.clerk.com
2. Select your application (or create new)
3. Go to **"API Keys"**
4. Copy the **"Publishable Key"** (starts with `pk_live_` or `pk_test_`)
5. Update Railway variable:
   ```
   VITE_CLERK_PUBLISHABLE_KEY=pk_live_your_production_key
   ```

6. In Clerk Dashboard → **"Paths"**:
   - Add your Railway domain to:
     - **Authorized JavaScript origins**
     - **Authorized redirect URLs**

---

## 🚀 Quick Reference

### Railway Project Details
- **Project ID**: cf75d4c6-d6c7-4cad-88ba-0bd4d4e7e0a3
- **Project Name**: dynamic-gratitude
- **Dashboard**: https://railway.com/project/cf75d4c6-d6c7-4cad-88ba-0bd4d4e7e0a3

### Local Development (Working)
```bash
cd /Users/georgeclarke/bsr-quality-checker
npm run dev
# Frontend: http://localhost:5173
# Backend: http://localhost:3001
```

### Required Files Created
1. ✅ `packages/frontend/.env` - Local development environment
2. ✅ `BLANK_SCREEN_FIX.md` - Detailed technical explanation
3. ✅ `RAILWAY_DEPLOYMENT_FIX.md` - This file

---

## ⏱️ Expected Timeline

1. **Add variables in Railway**: 2 minutes
2. **Automatic rebuild**: 3-5 minutes
3. **Testing**: 2 minutes
4. **Total**: ~10 minutes

---

## 💡 Why This Happens

Vite's build process:
1. Reads all `VITE_*` environment variables
2. Embeds them into the JavaScript bundle at **build time**
3. The built `index-BUW9QLtG.js` file contains the Clerk key as a hardcoded string
4. If the key is wrong/missing during build → The bundle has the wrong key → Clerk fails → Blank screen

The fix:
- Provide the correct key **before building**
- Railway rebuilds with the correct key
- The new bundle has the working Clerk key
- Clerk initializes successfully
- App loads properly ✅

---

**Status**: Ready for Railway deployment. Follow steps above.
