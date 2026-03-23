#!/bin/bash
# Production startup script
set -e

echo "🚀 Starting BSR Quality Checker..."

# Generate Prisma Client
echo "🔧 Generating Prisma Client..."
cd /app/packages/backend
npx prisma generate

# Apply migrations safely (no data loss)
echo "📊 Applying database migrations..."
npx prisma migrate deploy || {
  echo "❌ Migration failed with error code $?"
  echo "⚠️  Please check migration files and database state"
  exit 1
}
echo "✅ Database schema ready"

# Start the server
echo "✅ Starting server..."
cd /app
node packages/backend/dist/index.js
