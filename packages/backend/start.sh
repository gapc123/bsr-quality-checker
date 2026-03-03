#!/bin/bash
# Production startup script

echo "🚀 Starting BSR Quality Checker..."

# Create data directory if it doesn't exist
mkdir -p /app/data

# Initialize database
echo "📊 Setting up database..."
npx prisma db push --accept-data-loss

# Start the server
echo "✅ Starting server..."
node dist/index.js
