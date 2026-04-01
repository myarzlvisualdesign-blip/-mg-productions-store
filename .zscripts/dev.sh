#!/bin/bash
# Production-ready server with auto-restart
# Uses standalone production build (no Turbopack overhead)

set -e
cd /home/z/my-project

echo "========================================"
echo "[SERVER] Installing dependencies..."
echo "========================================"
bun install --frozen-lockfile 2>/dev/null || bun install

echo "========================================"
echo "[SERVER] Setting up database..."
echo "========================================"
bun run db:push 2>&1 | tail -3

echo "========================================"
echo "[SERVER] Building production bundle..."
echo "========================================"
rm -rf .next
bun run build 2>&1 | tail -5

echo "========================================"
echo "[SERVER] Starting production server on port 3000..."
echo "========================================"

# Run production server with auto-restart loop
while true; do
    echo "[SERVER] $(date '+%Y-%m-%d %H:%M:%S') Starting..."
    NODE_ENV=production PORT=3000 bun .next/standalone/server.js
    EXIT_CODE=$?
    echo "[SERVER] $(date '+%Y-%m-%d %H:%M:%S') Exited with code $EXIT_CODE, restarting in 5s..."
    sleep 5
done
