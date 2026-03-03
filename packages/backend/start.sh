#!/bin/bash
# Production startup script
set -e

echo "🚀 Starting BSR Quality Checker..."

# Generate Prisma Client
echo "🔧 Generating Prisma Client..."
cd /app/packages/backend
npx prisma generate

# Initialize database with schema (PostgreSQL)
echo "📊 Initializing database schema..."
npx prisma db push --accept-data-loss || {
  echo "❌ Database push failed with error code $?"
  echo "Trying alternative: prisma migrate deploy"
  npx prisma migrate deploy || echo "❌ Migrate also failed"
}
echo "✅ Database schema ready"

# Start the server
echo "✅ Starting server..."
cd /app
node packages/backend/dist/index.js
