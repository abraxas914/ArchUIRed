#!/usr/bin/env bash
# Rename README.md to SPEC.md in all folders that contain a non-empty resources/ subfolder

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

echo "=== Scanning for folders with non-empty resources/ under $ROOT ==="
echo ""

TARGETS_FILE=$(mktemp)

# Find all resources/ dirs, get parent, filter non-empty, exclude the root resources/ itself
find "$ROOT" -type d -name "resources" | sort -r | while IFS= read -r resources_dir; do
  parent="$(dirname "$resources_dir")"
  # Skip the root-level resources/ folder (that's where this script lives)
  if [ "$parent" = "$ROOT" ]; then
    continue
  fi
  # Only process if non-empty
  if [ -n "$(ls -A "$resources_dir" 2>/dev/null)" ]; then
    echo "$parent" >> "$TARGETS_FILE"
  fi
done

COUNT=$(wc -l < "$TARGETS_FILE" | tr -d ' ')
if [ "$COUNT" -eq 0 ]; then
  echo "No matching folders found."
  rm "$TARGETS_FILE"
  exit 0
fi

echo "Found $COUNT folders to process."
echo ""

while IFS= read -r dir; do
  if [ -f "$dir/README.md" ]; then
    echo "Processing: $dir"
    mv "$dir/README.md" "$dir/SPEC.md"
    echo "  ✓ README.md → SPEC.md"
    echo ""
  fi
done < "$TARGETS_FILE"
rm "$TARGETS_FILE"

echo "=== Done. Run validator to verify: ==="
echo "  node $ROOT/cli/resources/dist/index.js validate ."
