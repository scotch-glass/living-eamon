#!/usr/bin/env bash
# Push a local directory to r2://living-eamon/<subpath>/.
# Usage:
#   ./sync-to-r2.sh ./public/art/painter-curation/_civitai-upload training-data/style-lora-v1
#   ./sync-to-r2.sh ./training-output/style-v1 trained-loras/style-v1
#
# Requires:
#   - rclone installed
#   - rclone remote "r2-living-eamon" configured (with no_check_bucket=true for scoped tokens)
set -euo pipefail

SRC="${1:?usage: $0 <local-src-dir> <r2-subpath>}"
SUBPATH="${2:?usage: $0 <local-src-dir> <r2-subpath>}"

if [[ ! -d "$SRC" ]]; then
  echo "ERROR: source dir does not exist: $SRC" >&2
  exit 1
fi

LOCAL_COUNT=$(find "$SRC" -type f | wc -l | tr -d ' ')
echo "→ pushing $SRC/ ($LOCAL_COUNT files) → r2://living-eamon/$SUBPATH/"
rclone copy "$SRC/" "r2-living-eamon:living-eamon/$SUBPATH/" --progress
echo
REMOTE_COUNT=$(rclone ls "r2-living-eamon:living-eamon/$SUBPATH/" | wc -l | tr -d ' ')
echo "✓ done. local=$LOCAL_COUNT, remote=$REMOTE_COUNT"
[[ "$LOCAL_COUNT" == "$REMOTE_COUNT" ]] || echo "WARNING: file counts differ — investigate" >&2
