#!/bin/bash
# Run the test script against the simulation
# Make sure the simulation is running first!

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/venv/bin/activate"

python "$SCRIPT_DIR/test_sim.py"
