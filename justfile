# Astro development commands

# Default port
port := "4000"

# Build: builds the site for production
build:
    npm run build

# Preview: launches dev server with hot reload
# Fails early if another preview is already running
preview port=port:
    #!/usr/bin/env bash
    set -euo pipefail
    
    # Check if Astro is already running on the specified port
    if lsof -i :{{port}} | grep -q LISTEN; then
        echo "Error: Port {{port}} is already in use. Another preview may be running."
        echo "Run 'just shutdown {{port}}' to stop it first."
        exit 1
    fi
    
    # Start Astro dev server in background
    echo "Starting Astro dev server on port {{port}}..."
    npm run dev -- --port {{port}} > /tmp/astro-{{port}}.log 2>&1 &
    
    # Wait a moment for server to start
    sleep 3
    
    # Check if server started successfully
    if lsof -i :{{port}} | grep -q LISTEN; then
        echo "Astro server started successfully at http://localhost:{{port}}"
    else
        echo "Error: Failed to start Astro server. Check /tmp/astro-{{port}}.log for details."
        exit 1
    fi

# Shutdown: kills Astro server if running on specified port
shutdown port=port:
    #!/usr/bin/env bash
    set -euo pipefail
    
    # Find Node process on the specified port
    PID=$(lsof -ti :{{port}} 2>/dev/null || true)
    
    if [ -z "$PID" ]; then
        echo "No server found running on port {{port}}"
    else
        echo "Stopping Astro server on port {{port}} (PID: $PID)..."
        kill $PID
        echo "Server stopped."
    fi

# Open: opens browser if server is running
open port=port:
    #!/usr/bin/env bash
    set -euo pipefail
    
    # Check if server is running on the specified port
    if lsof -i :{{port}} | grep -q LISTEN; then
        echo "Opening http://localhost:{{port}} in browser..."
        open "http://localhost:{{port}}"
    else
        echo "Error: No server found running on port {{port}}"
        echo "Run 'just preview {{port}}' to start the server first."
        exit 1
    fi

# View: starts preview then opens browser
view port=port:
    @just preview {{port}}
    @just open {{port}}

# Clean: removes built files
clean:
    rm -rf dist

# Install: installs dependencies
install:
    npm install