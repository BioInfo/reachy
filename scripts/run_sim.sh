#!/bin/bash
# Launch Reachy Mini simulation on macOS.
# Usage: ./run_sim.sh [--scene minimal] [--port 8000] [--headless]
#
# Port defaults to 8000 because installed apps (focus_guardian, echo, ...) connect
# their SDK client to localhost:8000 with no override hook — the daemon must live
# there for the app->daemon loop to work. Override with --port or REACHY_PORT.

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
VENV="$REPO_DIR/venv"

# Activate virtual environment
source "$VENV/bin/activate"

# Defaults (all overridable)
SCENE_ARG=""
PORT="${REACHY_PORT:-8000}"
HEADLESS_ARG=""

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --scene)
            SCENE_ARG="--scene $2"
            shift 2
            ;;
        --port)
            PORT="$2"
            shift 2
            ;;
        --headless)
            HEADLESS_ARG="--headless"
            shift
            ;;
        *)
            shift
            ;;
    esac
done

echo "Starting Reachy Mini simulation on :$PORT ..."
echo "Dashboard / API: http://localhost:$PORT  (Swagger at /docs)"
echo "Press Ctrl+C to stop"
echo ""

# On macOS, MuJoCo's viewer needs mjpython (main-thread GUI). Headless skips the
# viewer and runs physics only, so plain python is fine there.
if [[ -n "$HEADLESS_ARG" ]]; then
    python -m reachy_mini.daemon.app.main --sim --headless --fastapi-port "$PORT" $SCENE_ARG
else
    mjpython -m reachy_mini.daemon.app.main --sim --fastapi-port "$PORT" $SCENE_ARG
fi
