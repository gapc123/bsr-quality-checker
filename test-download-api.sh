#!/bin/bash

echo "🧪 Testing PDF Download API Endpoints"
echo "======================================"
echo ""

# Test on production
BASE_URL="https://bsr-quality-checker-production.up.railway.app"

# You'll need to replace these with actual IDs from your database
PACK_ID="REPLACE_WITH_REAL_PACK_ID"
VERSION_ID="REPLACE_WITH_REAL_VERSION_ID"

echo "📍 Testing Production API: $BASE_URL"
echo ""

echo "1️⃣ Testing Client Gap Analysis endpoint..."
curl -v "$BASE_URL/api/packs/$PACK_ID/versions/$VERSION_ID/saved-assessment/client-gap-analysis" \
  -o /tmp/client-gap-analysis.pdf \
  2>&1 | grep -E "< HTTP|< Content-Type|< Content-Length"

echo ""
echo "2️⃣ Testing Consultant Action Plan endpoint..."
curl -v "$BASE_URL/api/packs/$PACK_ID/versions/$VERSION_ID/saved-assessment/consultant-action-plan" \
  -o /tmp/consultant-action-plan.pdf \
  2>&1 | grep -E "< HTTP|< Content-Type|< Content-Length"

echo ""
echo "3️⃣ Checking if PDFs were downloaded..."
if [ -f /tmp/client-gap-analysis.pdf ]; then
  echo "✅ Client Gap Analysis PDF created ($(wc -c < /tmp/client-gap-analysis.pdf) bytes)"
else
  echo "❌ Client Gap Analysis PDF not created"
fi

if [ -f /tmp/consultant-action-plan.pdf ]; then
  echo "✅ Consultant Action Plan PDF created ($(wc -c < /tmp/consultant-action-plan.pdf) bytes)"
else
  echo "❌ Consultant Action Plan PDF not created"
fi
