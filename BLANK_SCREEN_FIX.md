# Blank Screen Fix - BSR Quality Checker

## 🔴 Problem
The deployed domain shows a blank screen because the Clerk authentication is failing to initialize properly.

## 🎯 Root Cause
The frontend build process needs the `VITE_CLERK_PUBLISHABLE_KEY` environment variable **at build time**, not runtime. This was set to a placeholder value, causing Clerk to fail.

## ✅ Fixes Applied (Local)

1. **Created frontend .env file** for local development
   - File: `packages/frontend/.env`
   - Contains the Clerk publishable key

2. **Updated .env.production** with actual values
   - Added the real Anthropic API key
   - Added the Clerk publishable key
   - Added deployment notes

## 🚀 REQUIRED: Railway Deployment Fixes

### Step 1: Set Build-Time Environment Variable

**CRITICAL**: In Railway, you need to set `VITE_CLERK_PUBLISHABLE_KEY` as a **build-time variable**, not just a runtime variable.

1. Go to Railway Dashboard → Your Project
2. Click on "Variables" tab
3. Add this variable:
   ```
   VITE_CLERK_PUBLISHABLE_KEY=pk_test_cmVsYXhpbmctcmF5LTE5LmNsZXJrLmFjY291bnRzLmRldiQ
   ```
4. **Important**: Ensure this variable is available during the build phase

### Step 2: Verify Other Environment Variables

Make sure these are also set in Railway:

```bash
# Runtime variables
DATABASE_URL=file:/app/data/production.db
ANTHROPIC_API_KEY=your-anthropic-api-key-from-backend-env-file
NODE_ENV=production
PORT=3001

# Build-time variable (must be available during build!)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_cmVsYXhpbmctcmF5LTE5LmNsZXJrLmFjY291bnRzLmRldiQ
```

### Step 3: Trigger Redeploy

After setting the environment variables:

1. Go to Railway Dashboard
2. Click "Deploy" → "Redeploy"
   OR
3. Push a new commit to trigger automatic deployment

```bash
git add .
git commit -m "Fix: Add Clerk publishable key for frontend build"
git push origin main
```

### Step 4: Verify the Fix

Once deployed, check:

1. **Visit the domain** - Should now show the landing page (not blank)
2. **Check browser console** - Should see no Clerk errors
3. **Test sign-in** - Clerk authentication should work
4. **Health check**: Visit `/api/health` - Should return `{"status":"ok"}`

## 🔍 How to Verify Locally

Test the fix on your local machine first:

```bash
# Navigate to project root
cd /Users/georgeclarke/bsr-quality-checker

# Rebuild the frontend with the new environment variable
npm run build --workspace=packages/frontend

# Start the backend server
npm run start

# Visit http://localhost:3001 in your browser
# Should see the landing page (not blank screen)
```

## 📋 Why This Happened

### Vite Build Process
- Vite embeds environment variables starting with `VITE_` into the JavaScript bundle **at build time**
- If `VITE_CLERK_PUBLISHABLE_KEY` is missing or has a placeholder during build, Clerk initialization fails
- This results in a blank screen because React cannot render without Clerk properly initialized

### The Fix
- Set the real Clerk key before building
- Ensure Railway has access to this variable during the build phase
- The built JavaScript bundle will contain the correct key

## 🚨 Important Notes

1. **Clerk Publishable Keys are PUBLIC** - They're safe to embed in client-side code
2. **Clerk Secret Keys** (starting with `sk_`) should NEVER be in frontend code
3. The current key `pk_test_...` is a test key - you may want to create a production key in Clerk Dashboard

## 🔄 Alternative: Use Production Clerk Keys

If you want to use different Clerk keys for production:

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Create a new application or use existing
3. Get the **Publishable Key** (starts with `pk_`)
4. Update Railway environment variable:
   ```
   VITE_CLERK_PUBLISHABLE_KEY=pk_live_your_production_key_here
   ```
5. In Clerk Dashboard, add your Railway domain to:
   - Allowed origins
   - Redirect URLs
   - Authorized JavaScript origins

## ✅ Checklist

- [x] Created frontend .env file for local development
- [x] Updated .env.production with real values
- [ ] Set VITE_CLERK_PUBLISHABLE_KEY in Railway (build-time)
- [ ] Set other environment variables in Railway
- [ ] Trigger redeploy in Railway
- [ ] Verify domain shows landing page (not blank)
- [ ] Test sign-in functionality
- [ ] Update Clerk Dashboard with production domain

---

**Status**: Local fixes applied. Railway deployment configuration needed.
