#!/usr/bin/env bash
set -euo pipefail

# Check if port argument is provided
if [ $# -ne 1 ]; then
    echo "Usage: $0 <port>"
    exit 1
fi

PORT="$1"

# Find Node process on the specified port
PID=$(lsof -ti :"$PORT" 2>/dev/null || true)

if [ -z "$PID" ]; then
    echo "No server found running on port $PORT"
else
    echo "Stopping Astro server on port $PORT (PID: $PID)..."
    kill "$PID"
    echo "Server stopped."
fi
