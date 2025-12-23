"""Entry point for python -m echo."""

import sys
import logging

from .main import ReachyMiniEcho, DEFAULT_LITELLM_URL, DEFAULT_MODEL


def main():
    """Main entry point."""
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    )

    sim_mode = "--sim" in sys.argv

    if sim_mode:
        from threading import Event

        print("=" * 50)
        print("  Reachy Echo - Simulation Mode")
        print("=" * 50)
        print()
        print(f"  LiteLLM: {DEFAULT_LITELLM_URL}")
        print(f"  Model:   {DEFAULT_MODEL}")
        print()

        # Create mock stop event
        stop_event = Event()

        # Initialize Echo
        echo = ReachyMiniEcho()
        echo.reachy = None
        echo.stop_event = stop_event

        # Initialize systems
        echo._init_systems()

        # Build and launch UI
        app = echo._build_ui()

        print("Starting Gradio UI...")
        print("Open http://localhost:7861 in your browser")
        print()

        try:
            app.launch(
                server_name="0.0.0.0",
                server_port=7861,
                show_error=True,
            )
        except KeyboardInterrupt:
            print("\nShutting down...")
            echo._cleanup()
    else:
        print()
        print("Reachy Echo")
        print("=" * 50)
        print()
        print("A companion robot that remembers you and grows with you.")
        print()
        print("Usage:")
        print("  python -m echo --sim    # Simulation mode (no robot)")
        print()
        print("For real robot:")
        print("  1. Install:  pip install -e ~/apps/reachy/apps/echo")
        print("  2. Restart Reachy daemon")
        print("  3. Access via dashboard or http://localhost:7861")
        print()


if __name__ == "__main__":
    main()
