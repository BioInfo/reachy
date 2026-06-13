"""CommandBrain — conversation through an external agent command.

Reserved for the assistant-bridge phase (post-MVP). Shells out to a configured
command: the user's turn goes in on stdin, the reply comes back on stdout. That's
the whole contract, so the operator can point it at any agent (a script, a CLI,
a personal assistant) without this repo knowing anything about it.

Generic and side-effect-light: a timeout, a clean failure path, no agent
specifics. The operator's wiring lives entirely in `ECHO_AGENT_CMD`.
"""

from __future__ import annotations

import logging
import shlex
import subprocess

from .base import Brain, Message, Reply

logger = logging.getLogger(__name__)


class CommandBrain:
    """Run a configured command per turn; its stdout is the reply."""

    name = "command"

    def __init__(self, command: str = "", *, timeout: float = 120.0) -> None:
        self.command = command
        self.timeout = timeout

    @property
    def available(self) -> bool:
        return bool(self.command.strip())

    def respond(self, text: str, history: list[Message]) -> Reply:
        if not self.available:
            return Reply.failed("No agent command is configured.", model=self.name)
        try:
            argv = shlex.split(self.command)
            proc = subprocess.run(
                argv,
                input=text,
                capture_output=True,
                text=True,
                timeout=self.timeout,
            )
        except subprocess.TimeoutExpired:
            return Reply.failed("The agent took too long to respond.", model=self.name)
        except FileNotFoundError:
            return Reply.failed(f"Agent command not found: {self.command!r}", model=self.name)
        except Exception as exc:  # noqa: BLE001 — stay graceful for the loop
            logger.warning("CommandBrain failed: %s", exc)
            return Reply.failed(f"Agent command failed ({exc.__class__.__name__}).", model=self.name)

        if proc.returncode != 0:
            err = (proc.stderr or "").strip()[:200]
            return Reply.failed(f"Agent exited {proc.returncode}: {err}", model=self.name)
        out = (proc.stdout or "").strip()
        if not out:
            return Reply.failed("The agent returned nothing.", model=self.name)
        return Reply(text=out, model=self.name)
