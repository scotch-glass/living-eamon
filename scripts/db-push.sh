#!/bin/bash
# Run all pending SQL migrations via the Supabase Management API.
# Usage:
#   ./scripts/db-push.sh          # defaults to prod
#   ./scripts/db-push.sh prod     # explicit prod
#   ./scripts/db-push.sh dev      # dev environment

ENV="${1:-prod}"

# Project IDs
PROD_PROJECT="dhjgfdfeopdjjyyvfmfy"
DEV_PROJECT="culglwaxeskoaezljrsx"

if [ "$ENV" = "dev" ]; then
  PROJECT="$DEV_PROJECT"
  if [ -z "$PROJECT" ]; then
    echo "Error: DEV_PROJECT not set in db-push.sh. Create the dev Supabase project first."
    exit 1
  fi
  echo "=== Running migrations against DEV ==="
elif [ "$ENV" = "prod" ]; then
  PROJECT="$PROD_PROJECT"
  echo "=== Running migrations against PROD ==="
else
  echo "Usage: ./scripts/db-push.sh [dev|prod]"
  exit 1
fi

TOKEN="${SUPABASE_ACCESS_TOKEN}"
if [ -z "$TOKEN" ]; then
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

echo "Done ($ENV)."
