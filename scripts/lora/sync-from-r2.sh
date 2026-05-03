#!/usr/bin/env bash
# Pull a path from r2://living-eamon/<subpath> to a local directory.
# Usage:
#   ./sync-from-r2.sh training-data/style-lora-v1                   # → ./training-data/style-lora-v1/
#   ./sync-from-r2.sh trained-loras/style-v1 ./loras                # → ./loras/style-v1/
#
# Requires:
#   - rclone installed (see SESSION_001_VAST_R2_SETUP.md)
#   - rclone remote "r2-living-eamon" configured
set -euo pipefail

SUBPATH="${1:?usage: $0 <r2-subpath> [local-dest-dir]}"
DEST="${2:-./$SUBPATH}"

mkdir -p "$DEST"
echo "→ pulling r2://living-eamon/$SUBPATH/ → $DEST/"
rclone copy "r2-living-eamon:living-eamon/$SUBPATH/" "$DEST/" --progress
echo
echo "✓ done. $(find "$DEST" -type f | wc -l | tr -d ' ') files in $DEST/"
