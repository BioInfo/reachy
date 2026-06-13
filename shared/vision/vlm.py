"""VLM attention detector — real engagement via a vision LLM.

Calls an OpenAI-compatible /chat/completions endpoint with the camera frame and
asks: is a person present, and are they engaged with their work? Honest
attention, unlike motion-presence.

Design constraints:
- **Disabled by default.** No endpoint configured -> `available is False`, and
  the factory won't pick it. This keeps an app publishable to HuggingFace with
  no secret baked in; the user points it at their own gateway via config/env.
- **Never stalls the control loop.** A vision call takes 1-3s; the loop runs at
  ~2Hz. So `detect()` returns the last cached read instantly and refreshes in a
  background thread, throttled to `min_interval_s`.
- **Endpoint-agnostic.** base_url + model + api_key are config. Justin points it
  at the homelab LiteLLM gateway; someone else points it at OpenAI.
"""

from __future__ import annotations

import json
import logging
import threading
import time
from typing import Optional

import numpy as np

from .base import AttentionResult, BaseDetector
from .frames import encode_jpeg_b64

logger = logging.getLogger(__name__)

DEFAULT_PROMPT = (
    "You are watching a person at their desk through a webcam. "
    "Reply with ONLY a compact JSON object, no prose: "
    '{"present": bool, "engaged": bool, "detail": "<=4 words}. '
    "present = a person is visibly at the desk. "
    "engaged = they appear to be working/attending (looking at screen, reading, "
    "writing, typing) rather than looking away, on their phone, or absent."
)


class VLMAttentionDetector(BaseDetector):
    name = "vlm"

    def __init__(
        self,
        *,
        base_url: Optional[str] = None,
        api_key: Optional[str] = None,
        model: str = "",
        prompt: str = DEFAULT_PROMPT,
        min_interval_s: float = 8.0,
        timeout_s: float = 12.0,
        max_width: int = 640,
    ):
        self.base_url = (base_url or "").rstrip("/")
        self.api_key = api_key or ""
        self.model = model
        self.prompt = prompt
        self.min_interval_s = min_interval_s
        self.timeout_s = timeout_s
        self.max_width = max_width

        self._last: AttentionResult = AttentionResult(True, True, 0.0, self.name, "warming up")
        self._last_call = 0.0
        self._lock = threading.Lock()
        self._refreshing = False
        self._requests = None
        if self.base_url and self.model:
            try:
                import requests  # noqa: F401
                self._requests = requests
            except Exception as e:  # noqa: BLE001
                logger.warning("VLM detector: requests unavailable, disabling: %s", e)

    @property
    def available(self) -> bool:
        return bool(self.base_url and self.model and self._requests is not None)

    def reset(self) -> None:
        self._last = AttentionResult(True, True, 0.0, self.name, "warming up")
        self._last_call = 0.0

    def detect(self, frame: np.ndarray) -> AttentionResult:
        if not self.available:
            return AttentionResult(True, True, 0.0, self.name, "disabled")
        now = time.monotonic()
        due = (now - self._last_call) >= self.min_interval_s
        if due and not self._refreshing:
            self._refreshing = True
            self._last_call = now
            # snapshot the frame so the worker reads a stable buffer
            snap = frame.copy()
            threading.Thread(target=self._refresh, args=(snap,), daemon=True).start()
        return self._last

    # -- background worker -------------------------------------------------

    def _refresh(self, frame: np.ndarray) -> None:
        try:
            result = self._call_vlm(frame)
            if result is not None:
                with self._lock:
                    self._last = result
        except Exception as e:  # noqa: BLE001
            logger.debug("VLM refresh error: %s", e)
        finally:
            self._refreshing = False

    def _call_vlm(self, frame: np.ndarray) -> Optional[AttentionResult]:
        b64 = encode_jpeg_b64(frame, max_width=self.max_width)
        if b64 is None:
            return None
        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        payload = {
            "model": self.model,
            "max_tokens": 60,
            "temperature": 0,
            "messages": [{
                "role": "user",
                "content": [
                    {"type": "text", "text": self.prompt},
                    {"type": "image_url",
                     "image_url": {"url": f"data:image/jpeg;base64,{b64}"}},
                ],
            }],
        }
        resp = self._requests.post(
            f"{self.base_url}/chat/completions",
            headers=headers, json=payload, timeout=self.timeout_s,
        )
        resp.raise_for_status()
        content = resp.json()["choices"][0]["message"]["content"]
        return self._parse(content)

    @staticmethod
    def _parse(content: str) -> AttentionResult:
        text = content.strip()
        # tolerate ```json fences / surrounding prose
        start, end = text.find("{"), text.rfind("}")
        if start != -1 and end != -1:
            text = text[start:end + 1]
        try:
            data = json.loads(text)
        except Exception:  # noqa: BLE001
            return AttentionResult(True, True, 0.0, "vlm", "parse error")
        present = bool(data.get("present", True))
        engaged = bool(data.get("engaged", True))
        detail = str(data.get("detail", ""))[:40]
        return AttentionResult(present, engaged, 0.9, "vlm", detail or "vlm")
