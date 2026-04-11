#!/bin/bash
# Run all pending SQL migrations via the Supabase Management API.
# Usage: ./scripts/db-push.sh

TOKEN="${SUPABASE_ACCESS_TOKEN}"
PROJECT="dhjgfdfeopdjjyyvfmfy"

if [ -z "$TOKEN" ]; then
  # Try reading from .env.local
  TOKEN=$(grep SUPABASE_ACCESS_TOKEN .env.local 2>/dev/null | cut -d= -f2)
fi

if [ -z "$TOKEN" ]; then
  echo "Error: SUPABASE_ACCESS_TOKEN not set"
  exit 1
fi

for f in supabase/migrations/*.sql; do
  echo "→ Running $f"
  SQL=$(cat "$f")
  RESULT=$(curl -s -X POST \
    "https://api.supabase.com/v1/projects/${PROJECT}/database/query" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{\"query\": $(echo "$SQL" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))')}")
  echo "   $RESULT"
done

echo "Done."
