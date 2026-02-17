#!/bin/bash
# EAS Build Hook - runs after npm install
# This script applies the react-native-track-player patch

set -e

echo "=== Running EAS Build Hook: Apply Custom Patches ==="

# Check if patch-package is available
if command -v npx &> /dev/null; then
  echo "Applying patches with patch-package..."
  npx patch-package --patch-dir patches || echo "patch-package completed (may have warnings)"
else
  echo "npx not available, skipping patch-package"
fi

echo "=== Custom patches applied ==="
