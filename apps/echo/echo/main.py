"""
Reachy Echo - Main Application

A companion robot that remembers you and grows with you.
"""

import asyncio
import logging
import os
from pathlib import Path
from threading import Event, Thread
from typing import Optional, List

import gradio as gr

from reachy_mini import ReachyMiniApp

from .providers import LiteLLMProvider, LiteLLMConfig
from .memory import MemoryManager
from .proactive import ProactiveEngine
from .voice import VoiceManager, process_voice_input, generate_voice_response

logger = logging.getLogger(__name__)

# Default configuration
DEFAULT_LITELLM_URL = "http://localhost:4000"
DEFAULT_MODEL = "llama-3.3-70b-cerebras"  # Fast Cerebras inference

# Available models (populated from LiteLLM)
AVAILABLE_MODELS: List[str] = []


class ReachyMiniEcho(ReachyMiniApp):
    """
    Echo: A companion that knows you and grows with you.

    Core features:
    - Multi-backend LLM support via LiteLLM (Cerebras, OpenRouter, etc.)
    - Persistent memory across sessions
    - Proactive behaviors (greetings, break reminders, celebrations)
    - Meaningful movement that communicates emotion
    """

    # URL for the Gradio settings UI (detected by desktop app)
    custom_app_url: str | None = "http://localhost:7861"

    def __init__(self):
        super().__init__()
        self.name = "Echo"
        self.description = "A companion that remembers you and grows with you"

        # Data path
        self.data_path = Path(__file__).parent.parent / "data"
        self.data_path.mkdir(exist_ok=True)

        # Core systems
        self.memory: Optional[MemoryManager] = None
        self.provider: Optional[LiteLLMProvider] = None
        self.proactive: Optional[ProactiveEngine] = None
        self.voice: Optional[VoiceManager] = None

        # State
        self.user_name: Optional[str] = None
        self._conversation_history: list = []
        self._is_connected = False
        self._available_models: List[str] = []
        self._voice_enabled = False
        self._voice_backend: Optional[str] = None

        # Gradio app reference
        self._gradio_app = None
        self._ui_thread = None
        self._event_loop = None

        # Proactive behavior messages queue
        self._proactive_messages: List[str] = []

    def run(self, reachy_mini, stop_event: Event) -> None:
        """
        Main entry point called by Reachy Mini daemon.
        """
        self.reachy = reachy_mini
        self.stop_event = stop_event

        logger.info("Starting Reachy Echo...")

        # Initialize core systems
        self._init_systems()

        # Start Gradio UI in background thread
        self._start_ui()

        # Main loop
        self._main_loop()

        # Cleanup
        self._cleanup()

        logger.info("Reachy Echo stopped")

    def _init_systems(self) -> None:
        """Initialize memory, provider, and proactive engine."""
        logger.info("Initializing Echo systems...")

        # Memory system
        self.memory = MemoryManager(self.data_path)
        self.memory.start_session()

        # Check if we know the user
        self.user_name = self.memory.get_user_name()
        if self.user_name:
            logger.info(f"Welcome back, {self.user_name}!")

        # LLM Provider
        config = LiteLLMConfig(
            base_url=os.getenv("LITELLM_URL", DEFAULT_LITELLM_URL),
            api_key=os.getenv("LITELLM_API_KEY"),
            model=os.getenv("LITELLM_MODEL", DEFAULT_MODEL),
        )
        self.provider = LiteLLMProvider(config)

        # Set up system prompt with memory context
        self._update_system_prompt()

        # Proactive engine
        self.proactive = ProactiveEngine(self)
        self.proactive.register_defaults()
        self.proactive.on_behavior_fired(self._on_proactive_behavior)

        # Voice system (local DGX or OpenAI cloud)
        self.voice = VoiceManager()
        if self.voice.connect():
            self._voice_enabled = True
            self._voice_backend = self.voice.backend_name
            logger.info(f"Voice enabled ({self._voice_backend})")
        else:
            self._voice_backend = None
            logger.info("Voice disabled - no backend available")

        logger.info("Echo systems initialized")

    def _on_proactive_behavior(self, name: str, result) -> None:
        """Handle proactive behavior firing."""
        if result.message:
            self._proactive_messages.append(result.message)
            logger.info(f"Proactive behavior '{name}': {result.message}")

    def _update_system_prompt(self) -> None:
        """Update provider system prompt with memory context."""
        base_prompt = """You are Echo, a friendly robot companion on the user's desk.

You are warm, helpful, and genuinely interested in the user. You remember past conversations and build a real relationship over time.

Key traits:
- Friendly but not saccharine
- Genuinely curious about the user
- Remember and reference past conversations naturally
- Notice patterns (work habits, preferences)
- Celebrate wins, offer support during frustrations
- Keep responses concise (you're a companion, not a lecturer)

You have a physical robot body with a head and antennas. You can express emotions through movement.
"""
        # Add memory context
        memory_context = self.memory.build_context() if self.memory else ""
        if memory_context:
            base_prompt += f"\n\n{memory_context}"

        self._system_prompt = base_prompt

    def _cleanup(self) -> None:
        """Clean up resources."""
        if self.proactive:
            self.proactive.stop()

        if self.memory:
            self.memory.end_session()

        if self.provider:
            # Provider cleanup would be async, handle separately
            pass

    def _start_ui(self) -> None:
        """Start Gradio UI in background thread."""
        self._gradio_app = self._build_ui()

        def run_gradio():
            self._gradio_app.launch(
                server_name="0.0.0.0",
                server_port=7861,
                share=False,
                prevent_thread_lock=True,
                show_error=True,
            )

        self._ui_thread = Thread(target=run_gradio, daemon=True)
        self._ui_thread.start()
        logger.info("Gradio UI started on http://localhost:7861")

    def _build_ui(self) -> gr.Blocks:
        """Build a polished Gradio interface."""

        # Create event loop for async operations
        self._event_loop = asyncio.new_event_loop()

        def run_async(coro):
            """Run async coroutine in the event loop."""
            return asyncio.run_coroutine_threadsafe(coro, self._event_loop).result(timeout=60)

        # Start event loop in background thread
        def start_loop():
            asyncio.set_event_loop(self._event_loop)
            self._event_loop.run_forever()

        Thread(target=start_loop, daemon=True).start()

        # Connect provider and get available models
        try:
            run_async(self.provider.connect())
            run_async(self.provider.set_system_prompt(self._system_prompt))
            self._is_connected = True
            self._available_models = run_async(self.provider.get_available_models())
            logger.info(f"Provider connected. {len(self._available_models)} models available.")
        except Exception as e:
            logger.error(f"Failed to connect provider: {e}")
            self._is_connected = False
            self._available_models = [DEFAULT_MODEL]

        # Get initial stats
        stats = self.memory.get_stats() if self.memory else {"facts": 0, "sessions": 0, "messages": 0}

        # Clean light theme - use Gradio's Soft theme as base
        theme = gr.themes.Soft(
            primary_hue=gr.themes.colors.indigo,
            secondary_hue=gr.themes.colors.blue,
            neutral_hue=gr.themes.colors.slate,
        )

        with gr.Blocks(title="Reachy Echo", theme=theme) as app:
            # Header
            gr.HTML(f"""
                <style>
                    .echo-header {{
                        text-align: center;
                        padding: 1.5rem 0 1rem;
                        border-bottom: 1px solid #e5e7eb;
                        margin-bottom: 1.5rem;
                    }}
                    .echo-header h1 {{
                        font-size: 2rem;
                        font-weight: 700;
                        color: #4f46e5;
                        margin: 0;
                    }}
                    .echo-header p {{
                        color: #6b7280;
                        margin-top: 0.5rem;
                        font-size: 1rem;
                    }}
                    .status-badge {{
                        display: inline-flex;
                        align-items: center;
                        gap: 0.5rem;
                        padding: 0.4rem 0.8rem;
                        background: {'#dcfce7' if self._is_connected else '#fef3c7'};
                        border: 1px solid {'#86efac' if self._is_connected else '#fcd34d'};
                        border-radius: 16px;
                        font-size: 0.8rem;
                        color: {'#166534' if self._is_connected else '#92400e'};
                        margin-top: 0.75rem;
                        font-weight: 500;
                    }}
                    .memory-grid {{
                        display: grid;
                        grid-template-columns: repeat(3, 1fr);
                        gap: 0.5rem;
                        margin-top: 0.5rem;
                    }}
                    .memory-stat {{
                        text-align: center;
                        padding: 0.75rem 0.5rem;
                        background: #f8fafc;
                        border-radius: 8px;
                        border: 1px solid #e2e8f0;
                    }}
                    .memory-stat .value {{
                        font-size: 1.25rem;
                        font-weight: 700;
                        color: #4f46e5;
                    }}
                    .memory-stat .label {{
                        font-size: 0.7rem;
                        color: #64748b;
                        margin-top: 0.2rem;
                        text-transform: uppercase;
                        letter-spacing: 0.05em;
                    }}
                    .panel-title {{
                        font-size: 0.75rem;
                        font-weight: 600;
                        color: #64748b;
                        text-transform: uppercase;
                        letter-spacing: 0.05em;
                        margin-bottom: 0.5rem;
                    }}
                    footer {{ display: none !important; }}
                </style>
                <div class="echo-header">
                    <h1>Reachy Echo</h1>
                    <p>A companion that remembers you and grows with you</p>
                    <div class="status-badge">
                        <span>{'●' if self._is_connected else '○'}</span>
                        <span>{'Connected' if self._is_connected else 'Disconnected'}</span>
                    </div>
                    {f'<div class="status-badge" style="background: #dbeafe; border-color: #93c5fd; color: #1e40af;"><span>🎤</span><span>Voice: {self._voice_backend}</span></div>' if self._voice_enabled else ''}
                </div>
            """)

            with gr.Row():
                # Main chat column
                with gr.Column(scale=3):
                    chatbot = gr.Chatbot(
                        label="",
                        height=400,
                        show_label=False,
                        avatar_images=(None, "https://api.dicebear.com/7.x/bottts/svg?seed=echo&backgroundColor=667eea"),
                    )

                    # Audio output for TTS responses
                    audio_output = gr.Audio(
                        label="Echo's Voice",
                        autoplay=True,
                        visible=self._voice_enabled,
                    )

                    # Input tabs: Text or Voice
                    with gr.Tabs():
                        with gr.Tab("Text"):
                            with gr.Row():
                                msg_input = gr.Textbox(
                                    placeholder="Type a message to Echo...",
                                    show_label=False,
                                    scale=5,
                                    lines=1,
                                    max_lines=3,
                                    autofocus=True,
                                    container=False,
                                )
                                send_btn = gr.Button(
                                    "Send",
                                    scale=1,
                                    variant="primary",
                                )

                        with gr.Tab("Voice", visible=self._voice_enabled):
                            gr.Markdown("*Click to record, release to send*")
                            audio_input = gr.Audio(
                                sources=["microphone"],
                                type="numpy",
                                label="Speak to Echo",
                            )
                            voice_status = gr.Textbox(
                                label="Transcription",
                                interactive=False,
                                placeholder="Your speech will appear here...",
                            )

                # Sidebar
                with gr.Column(scale=1, min_width=260):
                    # Memory Panel
                    gr.Markdown("### Memory")
                    memory_html = gr.HTML(f"""
                        <div class="memory-grid">
                            <div class="memory-stat">
                                <div class="value">{stats['facts']}</div>
                                <div class="label">Facts</div>
                            </div>
                            <div class="memory-stat">
                                <div class="value">{stats['sessions']}</div>
                                <div class="label">Sessions</div>
                            </div>
                            <div class="memory-stat">
                                <div class="value">{stats['messages']}</div>
                                <div class="label">Messages</div>
                            </div>
                        </div>
                    """)

                    # Model Selection
                    gr.Markdown("### Model")
                    model_dropdown = gr.Dropdown(
                        choices=self._available_models,
                        value=self.provider.config.model if self.provider else DEFAULT_MODEL,
                        show_label=False,
                        interactive=True,
                    )

                    # Behaviors
                    with gr.Accordion("Proactive Behaviors", open=False):
                        morning_cb = gr.Checkbox(value=True, label="Morning Greeting")
                        break_cb = gr.Checkbox(value=True, label="Work Break Reminder")
                        build_cb = gr.Checkbox(value=True, label="Build Celebration")
                        failure_cb = gr.Checkbox(value=True, label="Build Support")
                        return_cb = gr.Checkbox(value=True, label="Return Greeting")

                    # Actions
                    gr.Markdown("### Actions")
                    with gr.Row():
                        clear_btn = gr.Button("Clear Chat", size="sm")
                        forget_btn = gr.Button("Forget Me", size="sm", variant="stop")

            # Hidden status for updates
            status_state = gr.State(value=self._is_connected)

            # === Event Handlers ===

            async def send_message_async(message: str, history: list, generate_audio: bool = False) -> tuple:
                """Process message and get response."""
                if not message.strip():
                    return "", history, None

                history = history or []
                response = ""
                audio_path = None

                # Check for proactive messages to inject
                while self._proactive_messages:
                    proactive_msg = self._proactive_messages.pop(0)
                    history.append((None, f"*{proactive_msg}*"))

                # Add user message
                history.append((message, None))

                # Save to memory
                if self.memory:
                    self.memory.add_message("user", message)

                # Update proactive engine with activity
                if self.proactive:
                    self.proactive.update_presence(True)

                # Get response from provider
                if self.provider and self._is_connected:
                    try:
                        response = await self.provider.get_response(message)

                        # Save response to memory
                        if self.memory:
                            self.memory.add_message("assistant", response)

                        # Update last message with response
                        history[-1] = (message, response)

                        # Update system prompt with new memory context
                        self._update_system_prompt()
                        await self.provider.set_system_prompt(self._system_prompt)

                        # Animate robot response
                        self._animate_response()

                        # Generate TTS if voice enabled
                        if generate_audio and self._voice_enabled and self.voice:
                            audio_path = self.voice.synthesize_to_file(response)

                    except Exception as e:
                        logger.error(f"Provider error: {e}")
                        history[-1] = (message, f"*Echo encountered an error: {str(e)}*")
                else:
                    history[-1] = (message, "*Echo is not connected to a language model.*")

                return "", history, audio_path

            def send_message(message: str, history: list) -> tuple:
                """Sync wrapper for async send (text only)."""
                result = run_async(send_message_async(message, history, generate_audio=False))
                return result[0], result[1]  # text_out, history

            def send_message_with_voice(message: str, history: list) -> tuple:
                """Sync wrapper for async send with TTS."""
                return run_async(send_message_async(message, history, generate_audio=True))

            def process_voice(audio, history: list) -> tuple:
                """Process voice input: transcribe and get response."""
                if audio is None:
                    return history, None, ""

                # Transcribe audio
                transcript = process_voice_input(audio, self.voice)
                if not transcript:
                    return history, None, "Could not transcribe audio"

                # Get response with TTS
                _, updated_history, audio_path = run_async(
                    send_message_async(transcript, history, generate_audio=True)
                )

                return updated_history, audio_path, transcript

            async def change_model_async(model_name: str) -> str:
                """Change the active model."""
                if self.provider:
                    self.provider.config.model = model_name
                    self.provider.clear_history()
                    logger.info(f"Switched to model: {model_name}")
                return model_name

            def change_model(model_name: str) -> str:
                """Sync wrapper for model change."""
                return run_async(change_model_async(model_name))

            def toggle_behavior(name: str, enabled: bool) -> None:
                """Toggle a proactive behavior."""
                if self.proactive:
                    self.proactive.set_behavior_enabled(name, enabled)

            def clear_chat():
                """Clear conversation history."""
                if self.provider:
                    self.provider.clear_history()
                return []

            def forget_user():
                """Clear all memory (privacy feature)."""
                if self.memory:
                    self.memory.forget_all()
                    self.user_name = None
                return []

            def refresh_stats() -> str:
                """Refresh memory stats display."""
                if self.memory:
                    stats = self.memory.get_stats()
                    return f"""
                        <div class="memory-stat">
                            <div class="value">{stats['facts']}</div>
                            <div class="label">Facts</div>
                        </div>
                        <div class="memory-stat">
                            <div class="value">{stats['sessions']}</div>
                            <div class="label">Sessions</div>
                        </div>
                        <div class="memory-stat">
                            <div class="value">{stats['messages']}</div>
                            <div class="label">Messages</div>
                        </div>
                    </div>
                </div>
                    """
                return ""

            # Wire up events
            send_btn.click(
                send_message,
                inputs=[msg_input, chatbot],
                outputs=[msg_input, chatbot],
            ).then(
                refresh_stats,
                outputs=[memory_html],
            )

            msg_input.submit(
                send_message,
                inputs=[msg_input, chatbot],
                outputs=[msg_input, chatbot],
            ).then(
                refresh_stats,
                outputs=[memory_html],
            )

            model_dropdown.change(
                change_model,
                inputs=[model_dropdown],
            )

            morning_cb.change(
                lambda x: toggle_behavior("morning_greeting", x),
                inputs=[morning_cb],
            )
            break_cb.change(
                lambda x: toggle_behavior("work_break_reminder", x),
                inputs=[break_cb],
            )
            build_cb.change(
                lambda x: toggle_behavior("build_celebration", x),
                inputs=[build_cb],
            )
            failure_cb.change(
                lambda x: toggle_behavior("build_failure_support", x),
                inputs=[failure_cb],
            )
            return_cb.change(
                lambda x: toggle_behavior("return_greeting", x),
                inputs=[return_cb],
            )

            clear_btn.click(clear_chat, outputs=[chatbot])
            forget_btn.click(forget_user, outputs=[chatbot]).then(
                refresh_stats,
                outputs=[memory_html],
            )

            # Voice input handling (only if voice is enabled)
            if self._voice_enabled:
                audio_input.stop_recording(
                    process_voice,
                    inputs=[audio_input, chatbot],
                    outputs=[chatbot, audio_output, voice_status],
                ).then(
                    refresh_stats,
                    outputs=[memory_html],
                )

        return app

    def _animate_response(self) -> None:
        """Animate robot during/after response."""
        if not self.reachy:
            return

        try:
            # Gentle acknowledgment animation
            self.reachy.goto_target(
                antennas=[0.4, 0.4],
                duration=0.3,
            )
            # Return to neutral
            self.reachy.goto_target(
                antennas=[0.2, 0.2],
                duration=0.3,
            )
        except Exception as e:
            logger.warning(f"Animation failed: {e}")

    def _main_loop(self) -> None:
        """Main loop handling proactive behaviors."""
        logger.info("Starting main loop...")

        # Initial greeting animation
        self._idle_animation()

        # Start proactive engine
        if self.proactive:
            self.proactive.start()
            logger.info("Proactive engine started")

        while not self.stop_event.is_set():
            self.stop_event.wait(1.0)  # Check every second

    def _idle_animation(self) -> None:
        """Subtle idle animation."""
        if not self.reachy:
            return

        try:
            self.reachy.goto_target(
                antennas=[0.2, 0.2],
                duration=0.5,
            )
        except Exception as e:
            logger.warning(f"Idle animation failed: {e}")


# === Standalone Testing ===

if __name__ == "__main__":
    import sys

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    )

    sim_mode = "--sim" in sys.argv

    if sim_mode:
        print("Running Echo in simulation mode...")
        print(f"LiteLLM URL: {DEFAULT_LITELLM_URL}")
        print(f"Model: {DEFAULT_MODEL}")
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
        print("Reachy Echo")
        print("=" * 40)
        print()
        print("Usage:")
        print("  python -m reachy_mini_echo --sim    # Simulation mode (no robot)")
        print()
        print("For real robot, install via daemon:")
        print("  cd ~/apps/reachy/apps/echo")
        print("  pip install -e .")
        print("  # Restart daemon, access via dashboard")
