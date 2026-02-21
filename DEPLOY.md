# Deployment Guide - BSR Quality Checker

## Quick Deploy to Railway (Recommended)

### 1. Prerequisites
- GitHub account
- Railway account (https://railway.app - sign up with GitHub)
- Anthropic API key

### 2. Push to GitHub

```bash
# Initialize git if not already done
git init
git add .
git commit -m "Initial commit"

# Create a new repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/bsr-quality-checker.git
git branch -M main
git push -u origin main
```

### 3. Deploy on Railway

1. Go to https://railway.app/new
2. Click "Deploy from GitHub repo"
3. Select your `bsr-quality-checker` repository
4. Railway will auto-detect the Dockerfile

### 4. Add PostgreSQL Database

1. In your Railway project, click "New" → "Database" → "PostgreSQL"
2. Railway will automatically set `DATABASE_URL`

### 5. Set Environment Variables

In Railway project settings, add:

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `ANTHROPIC_API_KEY` | `sk-ant-...` (your key) |
| `DATABASE_URL` | (auto-set by Railway) |

### 6. Update Prisma for PostgreSQL

Before deploying, update the schema:

```bash
# Copy production schema
cp packages/backend/prisma/schema.production.prisma packages/backend/prisma/schema.prisma

# Commit and push
git add .
git commit -m "Switch to PostgreSQL for production"
git push
```

### 7. Run Database Migration

In Railway, open the "Deploy" tab and run:

```bash
cd packages/backend && npx prisma migrate deploy
```

### 8. Custom Domain (Optional)

1. In Railway project settings, go to "Settings" → "Domains"
2. Add your custom domain
3. Update DNS with the provided CNAME record

---

## Alternative: Deploy to Render

### 1. Create render.yaml

```yaml
services:
  - type: web
    name: bsr-quality-checker
    env: docker
    dockerfilePath: ./Dockerfile
    envVars:
      - key: NODE_ENV
        value: production
      - key: ANTHROPIC_API_KEY
        sync: false
      - key: DATABASE_URL
        fromDatabase:
          name: bsr-db
          property: connectionString

databases:
  - name: bsr-db
    databaseName: bsr
    plan: free
```

### 2. Deploy
1. Push to GitHub
2. Go to https://render.com
3. New → Blueprint → Connect your repo

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | Yes | Set to `production` |
| `ANTHROPIC_API_KEY` | Yes | Your Anthropic API key |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `PORT` | No | Default: 3001 |

---

## Local Production Test

```bash
# Build everything
npm run build

# Set environment
export NODE_ENV=production
export DATABASE_URL="postgresql://..."
export ANTHROPIC_API_KEY="sk-ant-..."

# Run migrations
cd packages/backend && npx prisma migrate deploy

# Start server
npm start --workspace=packages/backend
```

---

## Troubleshooting

### Puppeteer/PDF Issues
The Dockerfile includes Chromium. If PDFs aren't generating:
- Check Railway logs for Chromium errors
- Ensure `PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium` is set

### Database Connection
- Ensure `DATABASE_URL` starts with `postgresql://`
- Run `npx prisma migrate deploy` after first deployment

### Build Failures
- Check Node.js version (requires 20+)
- Ensure all dependencies are in package.json
