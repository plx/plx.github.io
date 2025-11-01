#!/usr/bin/env python3
"""
PostToolUse hook to run linter on JS/TS files after edit/write operations.
"""

import json
import subprocess
import sys
from pathlib import Path


def main():
    # Read hook input from stdin
    hook_data = json.load(sys.stdin)

    tool_name = hook_data.get("toolName", "")
    tool_input = hook_data.get("toolInput", {})

    # Only run for Edit and Write tools
    if tool_name not in ["Edit", "Write"]:
        sys.exit(0)

    # Get the file path that was edited/written
    file_path = tool_input.get("file_path", "")
    if not file_path:
        sys.exit(0)

    # Check if file is a JS/TS file
    if not file_path.endswith((".js", ".ts", ".jsx", ".tsx")):
        sys.exit(0)

    # Run the linter on the specific file
    try:
        result = subprocess.run(
            ["npm", "run", "lint:fix", "--", file_path],
            capture_output=True,
            text=True,
            cwd="/home/user/plx.github.io"
        )

        # Output the linter results
        if result.stdout:
            print(f"Linter output for {file_path}:")
            print(result.stdout)

        if result.stderr:
            print(f"Linter stderr:", file=sys.stderr)
            print(result.stderr, file=sys.stderr)

        # Exit with success (0) to continue
        sys.exit(0)

    except Exception as e:
        print(f"Error running linter: {e}", file=sys.stderr)
        sys.exit(0)  # Don't block on linter errors


if __name__ == "__main__":
    main()
