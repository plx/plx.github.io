#!/usr/bin/env bash
set -euo pipefail

# Check if port argument is provided
if [ $# -ne 1 ]; then
    echo "Usage: $0 <port>"
    exit 1
fi

PORT="$1"

# Check if server is running on the specified port
if lsof -i :"$PORT" | grep -q LISTEN; then
    echo "Opening http://localhost:$PORT in browser..."
    open "http://localhost:$PORT"
else
    echo "Error: No server found running on port $PORT"
    echo "Run 'just preview $PORT' to start the server first."
    exit 1
fi
