#!/bin/bash
# Launch Reachy Mini simulation on macOS
# Usage: ./run_sim.sh [--scene minimal] [--port 8080]

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
VENV="$SCRIPT_DIR/venv"

# Activate virtual environment
source "$VENV/bin/activate"

# Default values
SCENE_ARG=""
PORT=8080

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
        *)
            shift
            ;;
    esac
done

echo "Starting Reachy Mini simulation..."
echo "Dashboard will be available at: http://localhost:$PORT"
echo "Press Ctrl+C to stop"
echo ""

# On macOS, use mjpython for MuJoCo rendering
mjpython -m reachy_mini.daemon.app.main --sim --fastapi-port $PORT $SCENE_ARG
