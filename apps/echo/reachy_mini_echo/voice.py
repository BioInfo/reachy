"""
Voice Module for Reachy Echo

Supports multiple backends:
- Local: faster-whisper (STT) + piper (TTS) via DGX voice server
- Cloud: OpenAI Whisper + TTS API

Set VOICE_BACKEND=local to use DGX, or VOICE_BACKEND=openai for cloud.
"""

import io
import logging
import os
import tempfile
from pathlib import Path
from typing import Optional, Tuple

import numpy as np
import requests

logger = logging.getLogger(__name__)

# Backend configuration
DEFAULT_VOICE_URL = "http://100.101.43.40:4001"  # DGX voice server
VOICE_BACKEND = os.getenv("VOICE_BACKEND", "local")  # "local" or "openai"

# Check for OpenAI (optional for cloud backend)
try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False


class LocalVoiceManager:
    """
    Voice manager using local models on DGX.

    Uses faster-whisper for STT and piper for TTS.
    """

    def __init__(self, voice_url: Optional[str] = None):
        self.voice_url = voice_url or os.getenv("VOICE_URL", DEFAULT_VOICE_URL)
        self._connected = False

    @property
    def is_available(self) -> bool:
        """Check if local voice server is available."""
        return self._connected

    def connect(self) -> bool:
        """Test connection to voice server."""
        try:
            response = requests.get(f"{self.voice_url}/health", timeout=5)
            if response.status_code == 200:
                self._connected = True
                logger.info(f"Local voice connected to {self.voice_url}")
                return True
        except Exception as e:
            logger.warning(f"Local voice server not available: {e}")

        self._connected = False
        return False

    def transcribe(self, audio_path: str) -> Optional[str]:
        """Transcribe audio file using faster-whisper on DGX."""
        if not self._connected:
            logger.error("Voice manager not connected")
            return None

        try:
            with open(audio_path, "rb") as f:
                response = requests.post(
                    f"{self.voice_url}/transcribe",
                    files={"audio": ("audio.wav", f, "audio/wav")},
                    timeout=30,
                )

            if response.status_code == 200:
                data = response.json()
                text = data.get("text", "").strip()
                logger.info(f"Transcribed (local): {text[:50]}...")
                return text
            else:
                logger.error(f"Transcription failed: {response.status_code}")
                return None

        except Exception as e:
            logger.error(f"Transcription failed: {e}")
            return None

    def transcribe_array(self, audio_array: np.ndarray, sample_rate: int) -> Optional[str]:
        """Transcribe numpy audio array."""
        if not self._connected:
            logger.error("Voice manager not connected")
            return None

        try:
            import soundfile as sf

            # Save to temp file
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
                temp_path = f.name
                sf.write(temp_path, audio_array, sample_rate)

            # Transcribe
            result = self.transcribe(temp_path)

            # Cleanup
            os.unlink(temp_path)
            return result

        except ImportError:
            logger.error("soundfile not installed - pip install soundfile")
            return None
        except Exception as e:
            logger.error(f"Array transcription failed: {e}")
            return None

    def synthesize(self, text: str) -> Optional[bytes]:
        """Synthesize text to speech using piper on DGX."""
        if not self._connected:
            logger.error("Voice manager not connected")
            return None

        if not text or not text.strip():
            return None

        try:
            response = requests.post(
                f"{self.voice_url}/synthesize",
                json={"text": text, "speed": 1.0},
                timeout=30,
            )

            if response.status_code == 200:
                audio_bytes = response.content
                logger.info(f"Synthesized (local) {len(audio_bytes)} bytes")
                return audio_bytes
            else:
                logger.error(f"TTS failed: {response.status_code}")
                return None

        except Exception as e:
            logger.error(f"TTS synthesis failed: {e}")
            return None

    def synthesize_to_file(self, text: str, output_path: Optional[str] = None) -> Optional[str]:
        """Synthesize text and save to file."""
        audio_bytes = self.synthesize(text)
        if not audio_bytes:
            return None

        try:
            if output_path:
                path = Path(output_path)
            else:
                # Create temp file (WAV format from piper)
                fd, path = tempfile.mkstemp(suffix=".wav")
                os.close(fd)
                path = Path(path)

            path.write_bytes(audio_bytes)
            return str(path)

        except Exception as e:
            logger.error(f"Failed to save audio: {e}")
            return None


class OpenAIVoiceManager:
    """
    Voice manager using OpenAI cloud APIs.

    Uses Whisper for STT and TTS API for synthesis.
    """

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        self._client: Optional[OpenAI] = None
        self._tts_voice = "nova"
        self._tts_model = "tts-1"

    @property
    def is_available(self) -> bool:
        """Check if OpenAI voice is available."""
        return OPENAI_AVAILABLE and bool(self.api_key)

    def connect(self) -> bool:
        """Initialize the OpenAI client."""
        if not self.is_available:
            logger.warning("OpenAI voice not available - missing API key")
            return False

        try:
            self._client = OpenAI(api_key=self.api_key)
            logger.info("Voice manager connected to OpenAI")
            return True
        except Exception as e:
            logger.error(f"Failed to connect voice manager: {e}")
            return False

    def transcribe(self, audio_path: str) -> Optional[str]:
        """Transcribe audio file using OpenAI Whisper."""
        if not self._client:
            logger.error("Voice manager not connected")
            return None

        try:
            with open(audio_path, "rb") as audio_file:
                transcript = self._client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file,
                    response_format="text"
                )

            text = transcript.strip() if isinstance(transcript, str) else str(transcript).strip()
            logger.info(f"Transcribed (OpenAI): {text[:50]}...")
            return text

        except Exception as e:
            logger.error(f"Transcription failed: {e}")
            return None

    def transcribe_array(self, audio_array: np.ndarray, sample_rate: int) -> Optional[str]:
        """Transcribe numpy audio array."""
        if not self._client:
            logger.error("Voice manager not connected")
            return None

        try:
            import soundfile as sf

            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
                temp_path = f.name
                sf.write(temp_path, audio_array, sample_rate)

            result = self.transcribe(temp_path)
            os.unlink(temp_path)
            return result

        except ImportError:
            logger.error("soundfile not installed - pip install soundfile")
            return None
        except Exception as e:
            logger.error(f"Array transcription failed: {e}")
            return None

    def synthesize(self, text: str) -> Optional[bytes]:
        """Synthesize text using OpenAI TTS."""
        if not self._client:
            logger.error("Voice manager not connected")
            return None

        if not text or not text.strip():
            return None

        try:
            response = self._client.audio.speech.create(
                model=self._tts_model,
                voice=self._tts_voice,
                input=text,
                response_format="mp3"
            )

            audio_bytes = response.content
            logger.info(f"Synthesized (OpenAI) {len(audio_bytes)} bytes")
            return audio_bytes

        except Exception as e:
            logger.error(f"TTS synthesis failed: {e}")
            return None

    def synthesize_to_file(self, text: str, output_path: Optional[str] = None) -> Optional[str]:
        """Synthesize text and save to file."""
        audio_bytes = self.synthesize(text)
        if not audio_bytes:
            return None

        try:
            if output_path:
                path = Path(output_path)
            else:
                fd, path = tempfile.mkstemp(suffix=".mp3")
                os.close(fd)
                path = Path(path)

            path.write_bytes(audio_bytes)
            return str(path)

        except Exception as e:
            logger.error(f"Failed to save audio: {e}")
            return None

    def set_voice(self, voice: str) -> None:
        """Set TTS voice. Options: alloy, echo, fable, onyx, nova, shimmer"""
        valid_voices = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"]
        if voice in valid_voices:
            self._tts_voice = voice
            logger.info(f"TTS voice set to: {voice}")

    def set_model(self, model: str) -> None:
        """Set TTS model. Options: tts-1, tts-1-hd"""
        if model in ["tts-1", "tts-1-hd"]:
            self._tts_model = model
            logger.info(f"TTS model set to: {model}")


class VoiceManager:
    """
    Unified voice manager that auto-selects backend.

    Priority:
    1. VOICE_BACKEND=local → Use DGX voice server
    2. VOICE_BACKEND=openai → Use OpenAI API
    3. Auto: Try local first, fall back to OpenAI
    """

    def __init__(self, backend: Optional[str] = None):
        self.backend = backend or VOICE_BACKEND
        self._manager = None
        self._backend_name = None

    @property
    def is_available(self) -> bool:
        """Check if any voice backend is available."""
        return self._manager is not None and self._manager.is_available

    def connect(self) -> bool:
        """Connect to the best available backend."""
        if self.backend == "local":
            # Try local only
            self._manager = LocalVoiceManager()
            if self._manager.connect():
                self._backend_name = "local"
                logger.info("Using local voice (faster-whisper + piper)")
                return True
            return False

        elif self.backend == "openai":
            # Try OpenAI only
            self._manager = OpenAIVoiceManager()
            if self._manager.connect():
                self._backend_name = "openai"
                logger.info("Using OpenAI voice")
                return True
            return False

        else:
            # Auto: try local first, then OpenAI
            self._manager = LocalVoiceManager()
            if self._manager.connect():
                self._backend_name = "local"
                logger.info("Using local voice (faster-whisper + piper)")
                return True

            logger.info("Local voice not available, trying OpenAI...")
            self._manager = OpenAIVoiceManager()
            if self._manager.connect():
                self._backend_name = "openai"
                logger.info("Using OpenAI voice")
                return True

            logger.warning("No voice backend available")
            return False

    def transcribe(self, audio_path: str) -> Optional[str]:
        """Transcribe audio file."""
        if self._manager:
            return self._manager.transcribe(audio_path)
        return None

    def transcribe_array(self, audio_array: np.ndarray, sample_rate: int) -> Optional[str]:
        """Transcribe numpy audio array."""
        if self._manager:
            return self._manager.transcribe_array(audio_array, sample_rate)
        return None

    def synthesize(self, text: str) -> Optional[bytes]:
        """Synthesize text to speech."""
        if self._manager:
            return self._manager.synthesize(text)
        return None

    def synthesize_to_file(self, text: str, output_path: Optional[str] = None) -> Optional[str]:
        """Synthesize text and save to file."""
        if self._manager:
            return self._manager.synthesize_to_file(text, output_path)
        return None

    @property
    def backend_name(self) -> Optional[str]:
        """Return the active backend name."""
        return self._backend_name


# Convenience functions for Gradio integration

def process_voice_input(audio: Tuple[int, np.ndarray], voice_manager: VoiceManager) -> Optional[str]:
    """
    Process audio input from Gradio microphone component.

    Args:
        audio: Tuple of (sample_rate, audio_array) from gr.Audio
        voice_manager: VoiceManager instance

    Returns:
        Transcribed text or None
    """
    if audio is None:
        return None

    sample_rate, audio_array = audio

    # Convert to mono if stereo
    if len(audio_array.shape) > 1:
        audio_array = audio_array.mean(axis=1)

    # Normalize if needed
    if audio_array.dtype == np.int16:
        audio_array = audio_array.astype(np.float32) / 32768.0
    elif audio_array.dtype == np.int32:
        audio_array = audio_array.astype(np.float32) / 2147483648.0

    return voice_manager.transcribe_array(audio_array, sample_rate)


def generate_voice_response(text: str, voice_manager: VoiceManager) -> Optional[str]:
    """
    Generate audio response for Gradio playback.

    Args:
        text: Text to synthesize
        voice_manager: VoiceManager instance

    Returns:
        Path to audio file for gr.Audio playback
    """
    return voice_manager.synthesize_to_file(text)
