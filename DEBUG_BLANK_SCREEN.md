# 🔍 Debug Blank Screen - Step by Step

## Checklist: Did Railway Actually Rebuild?

After adding environment variables, Railway should have automatically triggered a rebuild. Let's verify:

### Step 1: Verify Rebuild Happened
1. Go to Railway Dashboard → "Deployments" tab
2. Check the timestamp of the latest deployment
3. It should be AFTER you added the environment variables
4. Status should be green checkmark (not red X)

**If no new deployment**: Click "..." → "Redeploy" to force a rebuild

---

## Step 2: Check Railway Build Logs

This is CRITICAL - we need to see if the build included the Clerk key:

1. Railway Dashboard → "Deployments" tab
2. Click on the latest deployment
3. Look for these lines in the build output:

```bash
# Should see:
[BUILD] npm run build --workspace=packages/frontend
[BUILD] vite v5.4.21 building for production...
[BUILD] ✓ built in XXXms
```

**Red Flags to Look For**:
- Any errors mentioning "VITE_CLERK_PUBLISHABLE_KEY"
- Build failures
- "Cannot find module" errors
- TypeScript errors

**Copy the build logs and share them if you see errors**

---

## Step 3: Check Railway Runtime Logs

1. Railway Dashboard → "Logs" tab (not Deployments)
2. Look for the startup message:

**Expected (Good)**:
```
BSR Quality Checker API running on port 3001
Environment: Production
Serving frontend from: /app/packages/frontend/dist
```

**Bad Signs**:
- No startup message
- Port binding errors
- "Cannot find module" errors
- Crashes or restarts

---

## Step 4: Test the API Endpoint

Let's verify the backend is working:

**Open your browser and visit**:
```
https://your-railway-domain.up.railway.app/api/health
```

**Expected**: `{"status":"ok","timestamp":"2026-03-03T..."}`

**If you get**:
- ❌ "Cannot connect" → Backend isn't running
- ❌ 404 → Routing issue
- ❌ 500 → Server error (check logs)

---

## Step 5: Test the Debug Endpoint

Visit this endpoint to see what's happening with the frontend:

```
https://your-railway-domain.up.railway.app/api/debug
```

**Expected Response**:
```json
{
  "cwd": "/app",
  "frontendPath": "/app/packages/frontend/dist",
  "exists": true,
  "files": ["index.html", "assets", ...],
  "isProduction": true,
  "nodeEnv": "production"
}
```

**If `exists: false`**: Frontend wasn't built properly!

---

## Step 6: Check Browser Console

1. Open your Railway domain in the browser
2. Press **F12** (or Cmd+Option+I on Mac)
3. Go to **Console** tab
4. Look for errors

**Common Errors**:

### Error: "Clerk: Missing publishable key"
- The Clerk key wasn't embedded during build
- Railway needs to rebuild with the variable

### Error: "Failed to fetch" or CORS errors
- Backend isn't running or accessible
- Check API endpoints

### Error: "Unexpected token '<'" in JavaScript file
- Frontend files aren't being served correctly
- The server is returning HTML (404 page) instead of JS

### Error: Clerk initialization timeout
- The Clerk key might be invalid
- Network issues connecting to Clerk servers

---

## Step 7: Check Network Tab

1. Browser DevTools → **Network** tab
2. Refresh the page
3. Look at the requests:

**What to check**:
- `index.html` - Should be Status 200
- `index-XXXXX.js` - Should be Status 200 (not 404)
- `index-XXXXX.css` - Should be Status 200
- Preview the `index.html` response - should be actual HTML, not an error page

**If JavaScript files are 404**:
- The assets weren't built properly
- Path mismatch between build output and server

---

## 🚨 Most Likely Issues

Based on your situation, here are the top suspects:

### Issue 1: Railway Didn't Rebuild
**Symptom**: Same blank screen after adding variables
**Fix**: Manually trigger redeploy
- Deployments tab → "..." → "Redeploy"

### Issue 2: Variables Set as Runtime Only
**Symptom**: `VITE_CLERK_PUBLISHABLE_KEY` not working
**Why**: Vite needs it during BUILD, not just runtime
**Fix**: Railway should handle this automatically, but verify in build logs

### Issue 3: Frontend Build Failed
**Symptom**: `/api/debug` shows `exists: false`
**Fix**: Check build logs for errors

### Issue 4: Invalid Clerk Key
**Symptom**: Console error about Clerk initialization
**Fix**: Verify the key is correct (no typos, complete)

---

## 🔧 Emergency Fixes

### Fix 1: Force Complete Rebuild

Sometimes Railway needs a clean slate:

1. Railway Dashboard → Settings → "Restart Deployment"
2. Or push a new commit:
   ```bash
   git commit --allow-empty -m "Force Railway rebuild"
   git push origin main
   ```

### Fix 2: Verify Environment Variables Format

In Railway Variables tab, make sure there are **NO**:
- Extra spaces
- Quote marks around values
- Line breaks in values

Should be:
```
VITE_CLERK_PUBLISHABLE_KEY=pk_test_cmVsYXhpbmctcmF5LTE5LmNsZXJrLmFjY291bnRzLmRldiQ
```

NOT:
```
VITE_CLERK_PUBLISHABLE_KEY="pk_test_cmVsYXhpbmctcmF5LTE5LmNsZXJrLmFjY291bnRzLmRldiQ"
```

### Fix 3: Check Clerk Key Validity

The test key might be expired or invalid. Try using a fresh key:

1. Go to https://dashboard.clerk.com
2. Sign in to your account
3. Select your application
4. Go to "API Keys"
5. Copy the **Publishable Key** (starts with `pk_test_` or `pk_live_`)
6. Replace in Railway variables

---

## 📸 What I Need to Help Further

If still not working, gather this info:

1. **Railway Build Logs** (last 50 lines)
2. **Railway Runtime Logs** (last 20 lines)
3. **Browser Console Output** (screenshot or copy/paste)
4. **Network Tab** (screenshot showing the requests)
5. **Response from**: `https://your-domain.up.railway.app/api/debug`
6. **Your Railway domain URL** (so I can check it)

---

## 🎯 Quick Diagnostic Commands

Run these and share the results:

### Test 1: Health Check
```bash
curl https://your-railway-domain.up.railway.app/api/health
```

### Test 2: Debug Info
```bash
curl https://your-railway-domain.up.railway.app/api/debug
```

### Test 3: Check if HTML is served
```bash
curl https://your-railway-domain.up.railway.app/
```
Should return HTML starting with `<!doctype html>`

---

**Let me know what you find in the Railway logs and browser console!**
