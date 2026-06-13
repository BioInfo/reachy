"""Pure-logic tests for the brain layer + EchoConfig wiring (no network).

Run from the repo root:  ./venv/bin/python -m pytest apps/echo/tests/test_brain.py
"""

from __future__ import annotations

import sys
from pathlib import Path
from types import SimpleNamespace

# Make repo-root `shared/` and the `echo` package importable when run directly.
REPO_ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(REPO_ROOT))
sys.path.insert(0, str(REPO_ROOT / "apps" / "echo"))

from shared.brain import build_brain, Reply             # noqa: E402
from shared.brain.litellm import LiteLLMBrain           # noqa: E402
from shared.brain.command import CommandBrain           # noqa: E402
from echo.config import EchoConfig, DEFAULT_PERSONA     # noqa: E402


# --- factory ---------------------------------------------------------------

def test_factory_builds_litellm():
    b = build_brain({"kind": "litellm", "litellm": {"base_url": "http://x/v1", "model": "m"}})
    assert isinstance(b, LiteLLMBrain)
    assert b.name == "litellm"


def test_factory_builds_command():
    b = build_brain({"kind": "command", "command": {"command": "cat"}})
    assert isinstance(b, CommandBrain)
    assert b.name == "command"


def test_factory_unknown_kind_falls_back_to_litellm():
    b = build_brain({"kind": "nope"})
    assert isinstance(b, LiteLLMBrain)


# --- LiteLLMBrain ----------------------------------------------------------

def test_litellm_unconfigured_is_unavailable_and_fails_gracefully():
    b = LiteLLMBrain()  # no base_url/model
    assert b.available is False
    reply = b.respond("hi", [])
    assert reply.ok is False and reply.text == "" and reply.error


def test_litellm_available_when_configured():
    b = LiteLLMBrain(base_url="http://x/v1", model="m")
    assert b.available is True


def test_litellm_builds_messages_with_system_and_trims_history():
    b = LiteLLMBrain(base_url="http://x/v1", model="m", system_prompt="SYS", max_history=2)
    history = [
        {"role": "user", "content": "a"},
        {"role": "assistant", "content": "b"},
        {"role": "user", "content": "c"},
        {"role": "assistant", "content": "d"},
    ]
    msgs = b._messages("now", history)
    assert msgs[0] == {"role": "system", "content": "SYS"}
    # last 2 history + the new user turn
    assert msgs[1:] == [
        {"role": "user", "content": "c"},
        {"role": "assistant", "content": "d"},
        {"role": "user", "content": "now"},
    ]


def test_litellm_respond_with_fake_client(monkeypatch):
    b = LiteLLMBrain(base_url="http://x/v1", model="gemma-4")

    def fake_create(**kwargs):
        # echo back what model + last message we were called with
        assert kwargs["model"] == "gemma-4"
        msg = SimpleNamespace(content="  Hey there!  ")
        return SimpleNamespace(choices=[SimpleNamespace(message=msg)])

    fake_client = SimpleNamespace(
        chat=SimpleNamespace(completions=SimpleNamespace(create=fake_create))
    )
    monkeypatch.setattr(b, "_ensure_client", lambda: fake_client)

    reply = b.respond("hello", [])
    assert reply.ok is True
    assert reply.text == "Hey there!"        # stripped
    assert reply.model == "gemma-4"


def test_litellm_respond_empty_reply_fails(monkeypatch):
    b = LiteLLMBrain(base_url="http://x/v1", model="m")
    fake_client = SimpleNamespace(
        chat=SimpleNamespace(completions=SimpleNamespace(
            create=lambda **k: SimpleNamespace(
                choices=[SimpleNamespace(message=SimpleNamespace(content=""))]
            )
        ))
    )
    monkeypatch.setattr(b, "_ensure_client", lambda: fake_client)
    reply = b.respond("hi", [])
    assert reply.ok is False


def test_litellm_respond_backend_error_is_graceful(monkeypatch):
    b = LiteLLMBrain(base_url="http://x/v1", model="m")

    def boom():
        raise RuntimeError("network down")

    monkeypatch.setattr(b, "_ensure_client", boom)
    reply = b.respond("hi", [])
    assert reply.ok is False and "network" not in reply.text  # error is user-friendly, not a stacktrace


# --- CommandBrain ----------------------------------------------------------

def test_command_unavailable_when_empty():
    b = CommandBrain()
    assert b.available is False
    assert b.respond("hi", []).ok is False


def test_command_runs_and_returns_stdout():
    # `cat` echoes stdin -> reply == input
    b = CommandBrain(command="cat")
    reply = b.respond("ping", [])
    assert reply.ok is True
    assert reply.text == "ping"


def test_command_missing_binary_is_graceful():
    b = CommandBrain(command="this-binary-does-not-exist-xyz")
    reply = b.respond("hi", [])
    assert reply.ok is False and reply.error


# --- EchoConfig ------------------------------------------------------------

def test_config_from_env_defaults(monkeypatch):
    for k in list(__import__("os").environ):
        if k.startswith("ECHO_"):
            monkeypatch.delenv(k, raising=False)
    cfg = EchoConfig.from_env()
    assert cfg.brain_kind == "litellm"
    assert cfg.ui_port == 7863
    assert cfg.persona == DEFAULT_PERSONA


def test_config_from_env_overrides(monkeypatch):
    monkeypatch.setenv("ECHO_BRAIN", "command")
    monkeypatch.setenv("ECHO_LLM_MODEL", "gemma-4")
    monkeypatch.setenv("ECHO_LLM_API_KEY", "vk-secret")
    monkeypatch.setenv("ECHO_INBOUND_TOKEN", "tok")
    cfg = EchoConfig.from_env()
    assert cfg.brain_kind == "command"
    assert cfg.llm_model == "gemma-4"
    assert cfg.inbound_enabled is True


def test_config_brain_spec_shape():
    cfg = EchoConfig(llm_base_url="http://x/v1", llm_model="gemma-4", llm_api_key="vk-x")
    spec = cfg.brain_spec()
    assert spec["kind"] == "litellm"
    assert spec["litellm"]["base_url"] == "http://x/v1"
    assert spec["litellm"]["model"] == "gemma-4"
    assert spec["litellm"]["system_prompt"] == cfg.persona


def test_config_public_dict_hides_secrets():
    cfg = EchoConfig(llm_api_key="vk-secretkey", inbound_token="inbound-secret", llm_model="gemma-4")
    pub = cfg.public_dict()
    flat = str(pub)
    assert "vk-secretkey" not in flat
    assert "inbound-secret" not in flat
    assert pub["llm_model"] == "gemma-4"


def test_config_apply_overrides_clamps_and_ignores_secrets():
    cfg = EchoConfig()
    cfg.apply_overrides(temperature=5.0, max_tokens=99999, llm_api_key="hacked")
    assert cfg.temperature == 2.0       # clamped
    assert cfg.max_tokens == 4096       # clamped
    assert cfg.llm_api_key == ""        # secret not overridable via UI


# --- reasoning toggle (extra_body) -----------------------------------------

class _CapturingClient:
    """Stand-in openai client that records the create() kwargs."""

    def __init__(self):
        self.calls = []

        class _Chat:
            def __init__(self, outer):
                self.completions = self

            def create(self, **kwargs):
                _CapturingClient._last = kwargs
                msg = SimpleNamespace(content="ok")
                return SimpleNamespace(choices=[SimpleNamespace(message=msg)])

        self.chat = _Chat(self)


def _brain_with_capture(reasoning_enabled):
    b = LiteLLMBrain(base_url="http://x/v1", model="m", reasoning_enabled=reasoning_enabled)
    cap = _CapturingClient()
    b._ensure_client = lambda: cap  # type: ignore[method-assign]
    return b


def test_reasoning_none_sends_no_extra_body():
    b = _brain_with_capture(None)
    b.respond("hi", [])
    assert "extra_body" not in _CapturingClient._last


def test_reasoning_false_disables_via_extra_body():
    b = _brain_with_capture(False)
    b.respond("hi", [])
    assert _CapturingClient._last["extra_body"] == {"reasoning": {"enabled": False}}


def test_reasoning_true_enables_via_extra_body():
    b = _brain_with_capture(True)
    b.respond("hi", [])
    assert _CapturingClient._last["extra_body"] == {"reasoning": {"enabled": True}}


def test_echo_config_threads_reasoning_into_brain_spec():
    cfg = EchoConfig(llm_base_url="http://x/v1", llm_model="m", reasoning_enabled=False)
    spec = cfg.brain_spec()
    assert spec["litellm"]["reasoning_enabled"] is False
    b = build_brain(spec)
    assert b.reasoning_enabled is False
