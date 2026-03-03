#!/bin/bash
set -e

echo "🚀 Starting BSR Quality Checker..."

# Navigate to backend directory
cd /app/packages/backend

# Run database migrations
echo "📊 Running database migrations..."
npx prisma migrate deploy
echo "✅ Database migrations complete"

# Navigate back to app root
cd /app

# Start the server
echo "✅ Starting server..."
exec node packages/backend/dist/index.js
