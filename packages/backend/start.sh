#!/bin/bash
# Production startup script
set -e

echo "🚀 Starting BSR Quality Checker..."

# Create data directory
echo "📁 Creating data directory..."
mkdir -p /app/data
chmod 777 /app/data

# Generate Prisma Client
echo "🔧 Generating Prisma Client..."
cd /app/packages/backend
npx prisma generate

# Initialize database with schema
echo "📊 Initializing database..."
echo "Running: npx prisma db push --force-reset --accept-data-loss"
npx prisma db push --force-reset --accept-data-loss || {
  echo "❌ Database push failed with error code $?"
  echo "Trying alternative: prisma migrate deploy"
  npx prisma migrate deploy || echo "❌ Migrate also failed"
}
echo "Database push completed"

# Verify database was created
if [ -f "/app/data/production.db" ]; then
  echo "✅ Database created successfully"
  ls -lh /app/data/production.db
else
  echo "❌ Database file not found!"
  ls -la /app/data/
fi

# Start the server
echo "✅ Starting server..."
cd /app
node packages/backend/dist/index.js
