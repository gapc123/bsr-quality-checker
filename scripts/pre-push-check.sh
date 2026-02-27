#!/bin/bash
# Pre-push check script - run before pushing to ensure build passes

set -e

echo "🔍 Running TypeScript check..."
cd packages/frontend
npx tsc --noEmit

echo "🏗️  Running build..."
npm run build

echo "✅ All checks passed - safe to push"
