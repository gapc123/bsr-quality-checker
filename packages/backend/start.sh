#!/bin/bash
# Production startup script

echo "🚀 Starting BSR Quality Checker..."

# Run database migrations
echo "📊 Running database migrations..."
npx prisma migrate deploy

# Start the server
echo "✅ Starting server..."
node dist/index.js
