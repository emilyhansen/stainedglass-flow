#!/bin/bash
# StainedGlass Flow — dev server launcher
# Usage:
#   ./start.sh           — normal start
#   ./start.sh --fresh   — clear Vite cache first (fixes missing CSS/styling)

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if [[ "$1" == "--fresh" ]]; then
  echo "🧹 Clearing Vite cache..."
  rm -rf node_modules/.vite
fi

echo "🔮 Starting StainedGlass Flow..."
echo "   → http://localhost:5173"
echo ""
echo "   Tip: if CSS looks broken, run:  ./start.sh --fresh"
echo ""

npm run dev
