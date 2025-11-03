#!/usr/bin/env bash
set -euo pipefail

# Check if port argument is provided
if [ $# -ne 1 ]; then
    echo "Usage: $0 <port>"
    exit 1
fi

PORT="$1"

# Check if Astro is already running on the specified port
if lsof -i :"$PORT" | grep -q LISTEN; then
    echo "Error: Port $PORT is already in use. Another preview may be running."
    echo "Run 'just shutdown $PORT' to stop it first."
    exit 1
fi

# Start Astro dev server in background
echo "Starting Astro dev server on port $PORT..."
npm run dev -- --port "$PORT" > /tmp/astro-"$PORT".log 2>&1 &

# Wait a moment for server to start
sleep 3

# Check if server started successfully
if lsof -i :"$PORT" | grep -q LISTEN; then
    echo "Astro server started successfully at http://localhost:$PORT"
else
    echo "Error: Failed to start Astro server. Check /tmp/astro-$PORT.log for details."
    exit 1
fi
