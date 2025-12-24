"""
Reachy Echo - Main Application

A companion robot that remembers you and grows with you.
"""

import asyncio
import logging
import os
import random
import time
from pathlib import Path
from threading import Event, Thread
from typing import Optional, List

import gradio as gr

from reachy_mini import ReachyMiniApp
from reachy_mini.utils import create_head_pose

from .providers import LiteLLMProvider, LiteLLMConfig
from .memory import MemoryManager
from .proactive import ProactiveEngine
from .voice import VoiceManager, process_voice_input, generate_voice_response

logger = logging.getLogger(__name__)

# Default configuration - OpenRouter direct
DEFAULT_LITELLM_URL = os.getenv("LITELLM_URL", "https://openrouter.ai/api")
DEFAULT_API_KEY = os.getenv("OPENROUTER_API_KEY") or os.getenv("LITELLM_API_KEY", "")
DEFAULT_MODEL = os.getenv("LITELLM_MODEL", "google/gemini-2.5-flash-lite")

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
    custom_app_url: str | None = "http://localhost:7863"
    # Don't start ReachyMiniApp's built-in webserver - we use Gradio
    dont_start_webserver: bool = True

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
            base_url=DEFAULT_LITELLM_URL,
            api_key=DEFAULT_API_KEY,
            model=DEFAULT_MODEL,
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

IMPORTANT: Never describe your physical movements, gestures, or body language in your responses. Don't write things like "*waves antenna*" or "My head turns toward you". Just speak naturally - your physical body handles movement separately.
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
                server_port=7863,
                share=False,
                prevent_thread_lock=True,
                show_error=True,
            )

        self._ui_thread = Thread(target=run_gradio, daemon=True)
        self._ui_thread.start()
        logger.info("Gradio UI started on http://localhost:7863")

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

        # Connect provider and get available models (with fast timeout)
        try:
            run_async(self.provider.connect())
            run_async(self.provider.set_system_prompt(self._system_prompt))
            self._is_connected = True
            self._available_models = run_async(self.provider.get_available_models())
            logger.info(f"Provider connected. {len(self._available_models)} models available.")
        except Exception as e:
            logger.warning(f"Provider not available (will retry on use): {e}")
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

                    # Audio output for TTS responses (always visible, autoplay when available)
                    audio_output = gr.Audio(
                        label="Echo's Voice",
                        autoplay=True,
                        visible=True,  # Always visible, will be empty if no TTS
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

                    # LLM Settings
                    with gr.Accordion("LLM", open=True):
                        llm_provider_dropdown = gr.Dropdown(
                            choices=[
                                ("OpenRouter", "openrouter"),
                                ("LiteLLM", "litellm"),
                                ("OpenAI", "openai"),
                            ],
                            value="openrouter",
                            label="Provider",
                            interactive=True,
                        )
                        model_dropdown = gr.Dropdown(
                            choices=self._available_models[:10] if self._available_models else [DEFAULT_MODEL],
                            value=self.provider.config.model if self.provider else DEFAULT_MODEL,
                            label="Model",
                            interactive=True,
                        )

                    # Voice Settings
                    with gr.Accordion("Voice", open=True):
                        voice_provider_dropdown = gr.Dropdown(
                            choices=[
                                ("Edge TTS (Free)", "edge"),
                                ("OpenAI TTS", "openai"),
                                ("LiteLLM (DGX)", "local"),
                                ("Off", "off"),
                            ],
                            value="edge" if self._voice_enabled else "off",
                            label="Provider",
                            interactive=True,
                        )
                        voice_dropdown = gr.Dropdown(
                            choices=[
                                ("Aria (Natural)", "en-US-AriaNeural"),
                                ("Guy (Male)", "en-US-GuyNeural"),
                                ("Jenny (Friendly)", "en-US-JennyNeural"),
                            ],
                            value="en-US-AriaNeural",
                            label="Voice",
                            interactive=True,
                        )
                        test_voice_btn = gr.Button("🔊 Test", size="sm")

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

            async def send_message_async(message: str, history: list) -> tuple:
                """Process message and get response with TTS."""
                if not message.strip():
                    return "", history, None

                history = history or []
                response = ""
                audio_path = None

                # Check for proactive messages to inject (Gradio 6 format)
                while self._proactive_messages:
                    proactive_msg = self._proactive_messages.pop(0)
                    history.append({"role": "assistant", "content": f"*{proactive_msg}*"})

                # Add user message (Gradio 6 format)
                history.append({"role": "user", "content": message})

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

                        # Add assistant response (Gradio 6 format)
                        history.append({"role": "assistant", "content": response})

                        # Update system prompt with new memory context
                        self._update_system_prompt()
                        await self.provider.set_system_prompt(self._system_prompt)

                        # Animate robot response in background (don't block)
                        Thread(target=self._animate_response, args=(response,), daemon=True).start()

                        # Always generate TTS when voice is enabled
                        if self._voice_enabled and self.voice:
                            audio_path = self.voice.synthesize_to_file(response)
                            logger.info(f"Generated TTS: {audio_path}")

                    except Exception as e:
                        logger.error(f"Provider error: {e}")
                        history.append({"role": "assistant", "content": f"*Echo encountered an error: {str(e)}*"})
                else:
                    history.append({"role": "assistant", "content": "*Echo is not connected to a language model.*"})

                return "", history, audio_path

            def send_message(message: str, history: list) -> tuple:
                """Sync wrapper for async send with TTS."""
                result = run_async(send_message_async(message, history))
                # Return: (cleared input, updated history, audio path)
                return result[0], result[1], result[2]

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
                    send_message_async(transcript, history)
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

            def change_llm_provider(provider: str):
                """Change the LLM provider and update model list."""
                # Default models for each provider
                provider_models = {
                    "openrouter": [
                        ("Gemini 2.5 Flash Lite", "google/gemini-2.5-flash-lite"),
                        ("Gemini 2.0 Flash", "google/gemini-2.0-flash-exp:free"),
                        ("Claude 3.5 Sonnet", "anthropic/claude-3.5-sonnet"),
                        ("GPT-4o Mini", "openai/gpt-4o-mini"),
                    ],
                    "litellm": [
                        ("Llama 3.3 70B", "llama-3.3-70b-cerebras"),
                        ("Qwen 3 235B", "qwen-3-235b-cerebras"),
                        ("Gemma 3 27B", "gemma-3-27b-ollama"),
                        ("DeepSeek V3", "deepseek-v3.2-openrouter"),
                    ],
                    "openai": [
                        ("GPT-4o", "gpt-4o"),
                        ("GPT-4o Mini", "gpt-4o-mini"),
                    ],
                }
                models = provider_models.get(provider, [("Default", "default")])
                default = models[0][1] if models else "default"

                # Update provider config with correct URL and API key
                if provider == "openrouter":
                    self.provider.config.base_url = "https://openrouter.ai/api"
                    self.provider.config.api_key = os.getenv("OPENROUTER_API_KEY", "")
                elif provider == "litellm":
                    self.provider.config.base_url = os.getenv("LITELLM_URL", "http://100.101.43.40:4000")
                    self.provider.config.api_key = os.getenv("LITELLM_API_KEY", "sk-1234")
                elif provider == "openai":
                    self.provider.config.base_url = "https://api.openai.com"
                    self.provider.config.api_key = os.getenv("OPENAI_API_KEY", "")

                self.provider.config.model = default
                self.provider.clear_history()

                # Reconnect with new settings
                try:
                    run_async(self.provider.connect())
                    logger.info(f"Switched to {provider}: {default}")
                except Exception as e:
                    logger.error(f"Failed to connect to {provider}: {e}")

                return gr.update(choices=models, value=default)

            def change_voice_provider(provider: str):
                """Change the voice provider and update voice list."""
                if provider == "off":
                    self._voice_enabled = False
                    self._voice_backend = None
                    self.voice = None
                    return gr.update(choices=[("None", "none")], value="none")

                # Reinitialize voice manager with new backend
                from .voice import VoiceManager
                self.voice = VoiceManager(backend=provider)
                connected = self.voice.connect()

                # Update voice choices based on provider
                if provider == "edge":
                    choices = [
                        ("Aria (Natural)", "en-US-AriaNeural"),
                        ("Guy (Male)", "en-US-GuyNeural"),
                        ("Jenny (Friendly)", "en-US-JennyNeural"),
                    ]
                    default = "en-US-AriaNeural"
                elif provider == "openai":
                    choices = [
                        ("Nova", "nova"),
                        ("Alloy", "alloy"),
                        ("Shimmer", "shimmer"),
                    ]
                    default = "nova"
                else:  # local/litellm
                    choices = [
                        ("Alloy", "alloy"),
                        ("Nova", "nova"),
                        ("Shimmer", "shimmer"),
                    ]
                    default = "alloy"

                if connected:
                    self._voice_enabled = True
                    self._voice_backend = provider
                    logger.info(f"Voice provider changed to: {provider}")
                else:
                    self._voice_enabled = False
                    logger.warning(f"Failed to connect to voice provider: {provider}")

                return gr.update(choices=choices, value=default)

            def change_voice(voice: str):
                """Change the TTS voice."""
                if self.voice and self.voice._manager and hasattr(self.voice._manager, 'set_voice'):
                    self.voice._manager.set_voice(voice)

            def test_voice():
                """Test the current voice."""
                if not self._voice_enabled or not self.voice:
                    return None
                return self.voice.synthesize_to_file("Hello! I'm Echo.")

            # Wire up events
            send_btn.click(
                send_message,
                inputs=[msg_input, chatbot],
                outputs=[msg_input, chatbot, audio_output],
            ).then(
                refresh_stats,
                outputs=[memory_html],
            )

            msg_input.submit(
                send_message,
                inputs=[msg_input, chatbot],
                outputs=[msg_input, chatbot, audio_output],
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

            # LLM provider change
            llm_provider_dropdown.change(
                change_llm_provider,
                inputs=[llm_provider_dropdown],
                outputs=[model_dropdown],
            )

            # Voice settings
            voice_provider_dropdown.change(
                change_voice_provider,
                inputs=[voice_provider_dropdown],
                outputs=[voice_dropdown],
            )
            voice_dropdown.change(
                change_voice,
                inputs=[voice_dropdown],
            )
            test_voice_btn.click(
                test_voice,
                outputs=[audio_output],
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

    def _animate_response(self, response_text: str = "") -> None:
        """
        Animate robot expressively during/after response.

        Creates lifelike movement with head gestures, antenna expressions,
        and subtle body sway that makes Echo feel alive.
        """
        if not self.reachy:
            return

        try:
            # Choose animation style based on response content/length
            response_len = len(response_text)

            if response_len < 50:
                # Short response: quick acknowledgment
                self._animate_quick_response()
            elif response_len < 150:
                # Medium response: thoughtful nod
                self._animate_thoughtful_response()
            else:
                # Long response: engaged listening pose
                self._animate_engaged_response()

        except Exception as e:
            logger.warning(f"Animation failed: {e}")

    def _animate_quick_response(self) -> None:
        """Quick, friendly acknowledgment for short responses."""
        # Perk up with antenna raise
        self.reachy.goto_target(
            antennas=[0.5, 0.5],
            duration=0.2,
        )
        time.sleep(0.15)

        # Slight head tilt - shows attention
        head = create_head_pose(z=5, roll=8, mm=True, degrees=True)
        self.reachy.goto_target(
            head=head,
            antennas=[0.4, 0.3],
            duration=0.25,
        )
        time.sleep(0.2)

        # Return to friendly neutral
        head = create_head_pose(z=0, roll=0, mm=True, degrees=True)
        self.reachy.goto_target(
            head=head,
            antennas=[0.25, 0.25],
            duration=0.3,
        )

    def _animate_thoughtful_response(self) -> None:
        """Thoughtful nod and engagement for medium responses."""
        # Attentive lean forward
        head = create_head_pose(z=8, roll=0, mm=True, degrees=True)
        self.reachy.goto_target(
            head=head,
            antennas=[0.4, 0.4],
            duration=0.3,
        )
        time.sleep(0.25)

        # Gentle antenna wave while "thinking"
        self.reachy.goto_target(
            antennas=[0.5, 0.3],
            duration=0.2,
        )
        time.sleep(0.15)
        self.reachy.goto_target(
            antennas=[0.3, 0.5],
            duration=0.2,
        )
        time.sleep(0.15)

        # Slight head tilt with nod
        head = create_head_pose(z=3, roll=6, mm=True, degrees=True)
        self.reachy.goto_target(
            head=head,
            antennas=[0.35, 0.35],
            duration=0.25,
        )
        time.sleep(0.2)

        # Return to relaxed neutral
        head = create_head_pose(z=0, roll=0, mm=True, degrees=True)
        self.reachy.goto_target(
            head=head,
            antennas=[0.2, 0.2],
            duration=0.4,
        )

    def _animate_engaged_response(self) -> None:
        """Full engaged animation for longer responses."""
        # Excited perk up
        head = create_head_pose(z=10, roll=0, mm=True, degrees=True)
        self.reachy.goto_target(
            head=head,
            antennas=[0.6, 0.6],
            duration=0.3,
        )
        time.sleep(0.25)

        # Alternating antenna gesture - like talking with hands
        for _ in range(2):
            self.reachy.goto_target(
                antennas=[0.5, 0.3],
                duration=0.15,
            )
            time.sleep(0.12)
            self.reachy.goto_target(
                antennas=[0.3, 0.5],
                duration=0.15,
            )
            time.sleep(0.12)

        # Slight body sway for liveliness
        head = create_head_pose(z=5, roll=8, mm=True, degrees=True)
        self.reachy.goto_target(
            head=head,
            antennas=[0.4, 0.35],
            duration=0.3,
        )
        time.sleep(0.25)

        head = create_head_pose(z=5, roll=-8, mm=True, degrees=True)
        self.reachy.goto_target(
            head=head,
            antennas=[0.35, 0.4],
            duration=0.3,
        )
        time.sleep(0.25)

        # Settle to attentive neutral
        head = create_head_pose(z=3, roll=0, mm=True, degrees=True)
        self.reachy.goto_target(
            head=head,
            antennas=[0.25, 0.25],
            duration=0.4,
        )

    def _animate_listening(self) -> None:
        """Subtle animation while user is typing/speaking."""
        if not self.reachy:
            return

        try:
            # Attentive pose with slight head tilt
            tilt = random.choice([-5, 5])
            head = create_head_pose(z=5, roll=tilt, mm=True, degrees=True)
            self.reachy.goto_target(
                head=head,
                antennas=[0.3, 0.3],
                duration=0.4,
            )
        except Exception as e:
            logger.warning(f"Listening animation failed: {e}")

    def _animate_thinking(self) -> None:
        """Animation while waiting for LLM response."""
        if not self.reachy:
            return

        try:
            # Thoughtful upward gaze
            head = create_head_pose(z=12, roll=5, mm=True, degrees=True)
            self.reachy.goto_target(
                head=head,
                antennas=[0.45, 0.35],
                duration=0.4,
            )
        except Exception as e:
            logger.warning(f"Thinking animation failed: {e}")

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



# === Entry Point for Daemon ===

if __name__ == "__main__":
    app = ReachyMiniEcho()
    try:
        app.wrapped_run()
    except KeyboardInterrupt:
        app.stop()
