# Jekyll development commands

# Default port
port := "4000"

# Preview: rebuilds site with auto-regenerate, launches server in background
# Fails early if another preview is already running
preview port=port:
    #!/usr/bin/env bash
    set -euo pipefail
    
    # Check if Jekyll is already running on the specified port
    if lsof -i :{{port}} | grep -q LISTEN; then
        echo "Error: Port {{port}} is already in use. Another preview may be running."
        echo "Run 'just shutdown {{port}}' to stop it first."
        exit 1
    fi
    
    # Start Jekyll server in background
    echo "Starting Jekyll server on port {{port}}..."
    bundle exec jekyll serve --port {{port}} > /tmp/jekyll-{{port}}.log 2>&1 &
    
    # Wait a moment for server to start
    sleep 2
    
    # Check if server started successfully
    if lsof -i :{{port}} | grep -q LISTEN; then
        echo "Jekyll server started successfully at http://127.0.0.1:{{port}}"
    else
        echo "Error: Failed to start Jekyll server. Check /tmp/jekyll-{{port}}.log for details."
        exit 1
    fi

# Shutdown: kills Jekyll server if running on specified port
shutdown port=port:
    #!/usr/bin/env bash
    set -euo pipefail
    
    # Find Jekyll process on the specified port
    PID=$(lsof -ti :{{port}} 2>/dev/null || true)
    
    if [ -z "$PID" ]; then
        echo "No server found running on port {{port}}"
    else
        echo "Stopping Jekyll server on port {{port}} (PID: $PID)..."
        kill $PID
        echo "Server stopped."
    fi

# Open: opens browser if server is running
open port=port:
    #!/usr/bin/env bash
    set -euo pipefail
    
    # Check if server is running on the specified port
    if lsof -i :{{port}} | grep -q LISTEN; then
        echo "Opening http://127.0.0.1:{{port}} in browser..."
        open "http://127.0.0.1:{{port}}"
    else
        echo "Error: No server found running on port {{port}}"
        echo "Run 'just preview {{port}}' to start the server first."
        exit 1
    fi

# View: starts preview then opens browser
view port=port:
    @just preview {{port}}
    @just open {{port}}