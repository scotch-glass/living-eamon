#!/bin/bash
# Image cache management — soft-delete, approve, recover.
# Usage:
#   ./scripts/image-cache.sh list              — show all active cached images
#   ./scripts/image-cache.sh approve <room_id> — mark image as approved (protected)
#   ./scripts/image-cache.sh approve-all       — approve all active images
#   ./scripts/image-cache.sh delete <room_id>  — soft-delete (recoverable)
#   ./scripts/image-cache.sh recover <room_id> — recover a soft-deleted image
#   ./scripts/image-cache.sh recover-all       — recover ALL soft-deleted images
#   ./scripts/image-cache.sh deleted           — show soft-deleted images

TOKEN="${SUPABASE_ACCESS_TOKEN}"
PROJECT="dhjgfdfeopdjjyyvfmfy"

if [ -z "$TOKEN" ]; then
  TOKEN=$(grep SUPABASE_ACCESS_TOKEN .env.local 2>/dev/null | cut -d= -f2)
fi

if [ -z "$TOKEN" ]; then
  echo "Error: SUPABASE_ACCESS_TOKEN not set"
  exit 1
fi

run_query() {
  curl -s -X POST \
    "https://api.supabase.com/v1/projects/${PROJECT}/database/query" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{\"query\": $(echo "$1" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))')}"
}

CMD="${1:-list}"
ROOM_ID="$2"

case "$CMD" in
  list)
    echo "Active cached images:"
    run_query "select room_id, tone, approved, created_at from scene_image_cache where deleted_at is null order by room_id"
    ;;
  deleted)
    echo "Soft-deleted images (recoverable):"
    run_query "select room_id, tone, approved, deleted_at from scene_image_cache where deleted_at is not null order by deleted_at desc"
    ;;
  approve)
    if [ -z "$ROOM_ID" ]; then echo "Usage: $0 approve <room_id>"; exit 1; fi
    echo "Approving: $ROOM_ID"
    run_query "update scene_image_cache set approved = true where room_id = '${ROOM_ID}' and deleted_at is null returning room_id, approved"
    ;;
  approve-all)
    echo "Approving all active images..."
    run_query "update scene_image_cache set approved = true where deleted_at is null returning room_id, approved"
    ;;
  delete)
    if [ -z "$ROOM_ID" ]; then echo "Usage: $0 delete <room_id>"; exit 1; fi
    # Check if approved
    APPROVED=$(run_query "select approved from scene_image_cache where room_id = '${ROOM_ID}' and deleted_at is null" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d[0]['approved'] if d else 'notfound')" 2>/dev/null)
    if [ "$APPROVED" = "true" ]; then
      echo "WARNING: $ROOM_ID is APPROVED. Soft-deleting approved image."
    fi
    run_query "update scene_image_cache set deleted_at = now() where room_id = '${ROOM_ID}' and deleted_at is null returning room_id"
    ;;
  recover)
    if [ -z "$ROOM_ID" ]; then echo "Usage: $0 recover <room_id>"; exit 1; fi
    echo "Recovering: $ROOM_ID"
    run_query "update scene_image_cache set deleted_at = null where room_id = '${ROOM_ID}' and deleted_at is not null returning room_id"
    ;;
  recover-all)
    echo "Recovering ALL soft-deleted images..."
    run_query "update scene_image_cache set deleted_at = null where deleted_at is not null returning room_id"
    ;;
  *)
    echo "Unknown command: $CMD"
    echo "Commands: list, deleted, approve, approve-all, delete, recover, recover-all"
    exit 1
    ;;
esac
echo ""
