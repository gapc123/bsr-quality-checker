# Security Setup Guide

## Phase 0: Critical Security Fixes

### 1. API Key Rotation

**IMPORTANT**: If `.env` files with real API keys have ever been committed to git, those keys are compromised and must be rotated immediately.

#### Check Git History for Leaked Keys
```bash
# Search for potential API keys in git history
git log -p | grep -i "ANTHROPIC_API_KEY\|OPENAI_API_KEY" | head -20

# Or use git-secrets tool
git secrets --scan-history
```

#### Rotate Anthropic API Key
1. Go to https://console.anthropic.com/settings/keys
2. Delete the old key
3. Generate a new key
4. Update `.env` with the new key
5. Restart the application

#### Rotate OpenAI API Key (if used)
1. Go to https://platform.openai.com/api-keys
2. Revoke the old key
3. Create a new key
4. Update `.env` with the new key

### 2. Required Environment Variables

Create/update `packages/backend/.env` with these variables:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/bsr_quality_checker"

# AI APIs
ANTHROPIC_API_KEY="your-new-key-here"
OPENAI_API_KEY="your-openai-key" # if using OpenAI features

# Server Configuration
PORT=3001
NODE_ENV=production

# Security (Production Only)
INTERNAL_API_KEY="generate-a-strong-random-key-here"
CORS_ORIGINS="https://yourdomain.com,https://www.yourdomain.com"
```

#### Generate Strong API Key
```bash
# Generate a secure random key for INTERNAL_API_KEY
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Frontend Configuration

Update `packages/frontend/.env` to include the API key in headers:

```bash
VITE_API_URL=http://localhost:3001
VITE_INTERNAL_API_KEY=your-internal-api-key-here
```

Then update the frontend API client to include the header:

```typescript
// packages/frontend/src/api/client.ts (or wherever you make API calls)
const headers = {
  'Content-Type': 'application/json',
  'x-internal-api-key': import.meta.env.VITE_INTERNAL_API_KEY || '',
};

fetch('/api/packs', { headers, ...options });
```

### 4. Git Security

Add pre-commit hook to prevent secrets from being committed:

```bash
# Install git-secrets
brew install git-secrets  # macOS
# or
apt-get install git-secrets  # Linux

# Set up for this repo
cd /path/to/bsr-quality-checker
git secrets --install
git secrets --register-aws
git secrets --add 'ANTHROPIC_API_KEY.*'
git secrets --add 'OPENAI_API_KEY.*'
git secrets --add 'INTERNAL_API_KEY.*'
```

### 5. Verify Security Setup

Run this checklist:

```bash
# 1. Check that .env is in .gitignore
grep -q "^\.env$" .gitignore && echo "✅ .env in .gitignore" || echo "❌ Add .env to .gitignore"

# 2. Verify no .env in git
git ls-files | grep -q "\.env$" && echo "❌ .env is tracked in git!" || echo "✅ .env not in git"

# 3. Check for hardcoded keys in source
grep -r "sk-ant-" packages/ && echo "❌ Found hardcoded Anthropic keys!" || echo "✅ No hardcoded keys found"

# 4. Verify start.sh doesn't use --accept-data-loss
grep -q "accept-data-loss" packages/backend/start.sh && echo "❌ Still using --accept-data-loss" || echo "✅ Safe migration"

# 5. Check CORS is configured
grep -q "CORS_ORIGINS" packages/backend/.env && echo "✅ CORS configured" || echo "⚠️  Set CORS_ORIGINS"

# 6. Check INTERNAL_API_KEY is set
grep -q "INTERNAL_API_KEY" packages/backend/.env && echo "✅ API key configured" || echo "⚠️  Set INTERNAL_API_KEY"
```

### 6. Deployment Checklist

Before deploying to production:

- [ ] All API keys rotated
- [ ] `.env` files never committed to git
- [ ] `INTERNAL_API_KEY` set with strong random value
- [ ] `CORS_ORIGINS` set to actual domain(s)
- [ ] `NODE_ENV=production` set
- [ ] Frontend configured to send `x-internal-api-key` header
- [ ] `/api/debug` endpoint disabled in production (automatic)
- [ ] `/uploads` directory not publicly accessible (automatic)
- [ ] Database migrations tested in staging environment

## Monitoring

After deployment, monitor for:

- Unauthorized API access attempts (check logs for 401 responses)
- CORS violations (check logs for CORS errors)
- Failed file uploads (PDF validation failures)

## Emergency Response

If keys are leaked:

1. **Immediately** rotate all API keys
2. Check API provider dashboards for unauthorized usage
3. Review application logs for suspicious activity
4. Consider resetting `INTERNAL_API_KEY` and updating all clients
5. Audit git history and consider using `git filter-branch` to remove sensitive data
