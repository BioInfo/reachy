#!/bin/bash
# Run the test script against the simulation
# Make sure the simulation is running first!

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
source "$REPO_DIR/venv/bin/activate"

# Optional: pass --port to target the sim (default 8080); test_sim.py reads REACHY_PORT
python "$SCRIPT_DIR/test_sim.py" "$@"
