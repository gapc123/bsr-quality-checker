# BSR Quality Checker - Production Deployment Guide

## 🚀 Quick Deploy Options

### Option 1: Railway (Recommended - 5 minutes)

**Why Railway?**
- Automatic Docker builds
- Free tier available
- Built-in SSL certificates
- Easy environment variables
- File storage volumes

**Steps:**

1. **Commit and Push Your Code**
```bash
git add .
git commit -m "Production deployment"
git push origin main
```

2. **Deploy to Railway**
   - Visit [railway.app](https://railway.app)
   - Connect your GitHub account
   - Click "New Project" → "Deploy from GitHub repo"
   - Select `bsr-quality-checker` repository
   - Railway auto-detects Dockerfile and deploys

3. **Configure Environment Variables**

   In Railway Dashboard → Variables tab, add:

   ```bash
   DATABASE_URL=file:/app/data/production.db
   ANTHROPIC_API_KEY=sk-ant-api03-... # Your key
   NODE_ENV=production
   PORT=3001
   VITE_CLERK_PUBLISHABLE_KEY=pk_... # Your Clerk key
   ```

4. **Add Persistent Storage for Database**

   In Railway Dashboard → Settings → Volumes:
   - Click "New Volume"
   - Mount Path: `/app/data`
   - This persists your SQLite database across deployments

5. **Get Your Production URL**

   Railway provides: `your-app-name.up.railway.app`

6. **Update Clerk Settings**

   In Clerk Dashboard → Applications:
   - Add your Railway URL to allowed origins
   - Update redirect URLs

---

### Option 2: Render.com (Alternative)

**Steps:**

1. **Push to Git**
```bash
git push origin main
```

2. **Deploy to Render**
   - Visit [render.com](https://render.com)
   - New → Web Service → Connect Repository
   - Runtime: Docker
   - Add environment variables (same as Railway)

3. **Add Disk for Database**
   - In Render → Settings → Disks
   - Mount Path: `/app/data`
   - Size: 1GB (free tier)

---

### Option 3: Docker on VPS (DigitalOcean, AWS, etc.)

**Prerequisites:**
- VPS with Docker installed
- Domain name (optional)

**Deployment:**

1. **Build Docker Image**
```bash
docker build -t bsr-quality-checker \
  --build-arg VITE_CLERK_PUBLISHABLE_KEY=pk_your_key \
  .
```

2. **Create Production Environment File**
```bash
cp .env.production .env
# Edit .env with your actual values
```

3. **Run Container with Volume**
```bash
docker run -d \
  --name bsr-app \
  -p 3001:3001 \
  -v $(pwd)/data:/app/data \
  --env-file .env \
  bsr-quality-checker
```

4. **Set Up Nginx Reverse Proxy** (Optional)
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

5. **Add SSL with Certbot** (Recommended)
```bash
sudo certbot --nginx -d your-domain.com
```

---

### Option 4: Fly.io

**Steps:**

1. **Install Fly CLI**
```bash
curl -L https://fly.io/install.sh | sh
```

2. **Login and Launch**
```bash
fly auth login
fly launch
```

3. **Set Environment Variables**
```bash
fly secrets set ANTHROPIC_API_KEY=your-key
fly secrets set VITE_CLERK_PUBLISHABLE_KEY=your-clerk-key
fly secrets set DATABASE_URL=file:/app/data/production.db
```

4. **Add Volume for Database**
```bash
fly volumes create bsr_data --size 1
```

5. **Deploy**
```bash
fly deploy
```

---

## 📋 Pre-Deployment Checklist

Before deploying, ensure:

- [ ] All environment variables are set
- [ ] Anthropic API key is valid
- [ ] Clerk authentication is configured
- [ ] Database volume/disk is mounted
- [ ] Port 3001 is exposed
- [ ] All fixes from local testing are committed
- [ ] Frontend is built with production settings

---

## 🔐 Required Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | ✅ Yes | Database connection string | `file:/app/data/production.db` |
| `ANTHROPIC_API_KEY` | ✅ Yes | Claude API key for assessments | `sk-ant-api03-...` |
| `VITE_CLERK_PUBLISHABLE_KEY` | ✅ Yes | Clerk auth public key | `pk_test_...` |
| `NODE_ENV` | ✅ Yes | Runtime environment | `production` |
| `PORT` | No | Server port | `3001` (default) |

---

## 🗄️ Database Options

### SQLite (Current - Simple)
- **Pros**: No external database needed, easy setup
- **Cons**: Single file, needs volume mounting
- **Best for**: Small to medium deployments

```bash
DATABASE_URL="file:/app/data/production.db"
```

### PostgreSQL (Scalable Alternative)

If you need better scalability:

1. **Update Prisma Schema** (`packages/backend/prisma/schema.prisma`):
```prisma
datasource db {
  provider = "postgresql"  // Change from sqlite
  url      = env("DATABASE_URL")
}
```

2. **Set up PostgreSQL** (Railway/Render provides this):
```bash
DATABASE_URL="postgresql://user:pass@host:5432/dbname"
```

3. **Run Migrations**:
```bash
npx prisma migrate deploy
```

---

## 🧪 Testing Production Deployment

After deployment:

1. **Health Check**
```bash
curl https://your-app.railway.app/api/health
# Expected: {"status":"ok","timestamp":"..."}
```

2. **Test Pack Creation**
```bash
curl -X POST https://your-app.railway.app/api/packs \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Pack"}'
```

3. **Test Frontend**
   - Visit your deployment URL
   - Sign in with Clerk
   - Create a pack
   - Upload documents
   - Run matrix assessment (wait 2-5 min)
   - Verify carousel appears

---

## 🔄 Updating Production

### Railway/Render (Automatic)
```bash
git add .
git commit -m "Update"
git push origin main
# Railway/Render auto-deploys
```

### Docker VPS (Manual)
```bash
# Pull latest code
git pull origin main

# Rebuild image
docker build -t bsr-quality-checker .

# Stop old container
docker stop bsr-app
docker rm bsr-app

# Start new container
docker run -d --name bsr-app -p 3001:3001 \
  -v $(pwd)/data:/app/data \
  --env-file .env \
  bsr-quality-checker
```

---

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Check if volume is mounted
docker exec bsr-app ls -la /app/data

# Verify DATABASE_URL path matches volume
echo $DATABASE_URL
```

### Matrix Assessment Fails
```bash
# Check Anthropic API key
curl -H "x-api-key: $ANTHROPIC_API_KEY" https://api.anthropic.com/v1/messages

# Check server logs
docker logs bsr-app -f
```

### Port Not Accessible
```bash
# Check if container is running
docker ps | grep bsr-app

# Check port binding
docker port bsr-app
```

---

## 📞 Support

- **Logs**: `docker logs bsr-app -f`
- **Shell Access**: `docker exec -it bsr-app sh`
- **Database**: Volume at `/app/data/production.db`

---

## ⚡ Performance Tips

1. **Use PostgreSQL** for >1000 packs
2. **Add Redis** for caching (future)
3. **Scale horizontally** on Railway (increase instances)
4. **Monitor with Sentry** or similar
5. **Set up backup** for database volume

---

**Recommended: Start with Railway - it's the easiest and has a generous free tier!** 🚀
