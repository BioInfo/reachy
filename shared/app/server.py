"""Reusable app server: FastAPI + WebSocket live-state + static React.

Every robot app needs the same shell: serve a UI, expose current state, accept a
few commands, push live updates. `AppServer` provides it so an app's own server
is a handful of lines — register a state provider and some command handlers,
point it at a built web dir, run it in a background thread alongside the control
loop.

- `GET  /api/state`        -> state_provider()  (a plain JSON-able dict snapshot)
- `GET  /api/health`       -> {"ok": true}
- `POST /api/cmd/{name}`   -> registered handler(body) -> JSON result
- `WS   /ws`               -> pushes state every `push_interval_s`
- `GET  /` and static      -> the React build at `web_dir` (with a usable
                              fallback page when no build is present)

Command handlers must be quick and non-blocking (set an intent flag the control
loop reads); never drive robot motion inside a request.
"""

from __future__ import annotations

import asyncio
import logging
import threading
from pathlib import Path
from typing import Any, Callable, Optional

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

logger = logging.getLogger(__name__)

StateProvider = Callable[[], dict[str, Any]]
CommandHandler = Callable[[dict[str, Any]], dict[str, Any]]


class AppServer:
    def __init__(
        self,
        app_name: str,
        state_provider: StateProvider,
        *,
        web_dir: Optional[Path] = None,
        host: str = "127.0.0.1",
        port: int = 7862,
        push_interval_s: float = 0.5,
    ):
        self.app_name = app_name
        self.state_provider = state_provider
        self.web_dir = Path(web_dir) if web_dir else None
        self.host = host
        self.port = port
        self.push_interval_s = push_interval_s
        self._commands: dict[str, CommandHandler] = {}
        self._server = None  # uvicorn.Server
        self._thread: Optional[threading.Thread] = None
        self.api = self._build_app()

    def register_command(self, name: str, handler: CommandHandler) -> None:
        self._commands[name] = handler

    # -- app wiring --------------------------------------------------------

    def _build_app(self) -> FastAPI:
        api = FastAPI(title=self.app_name)

        @api.get("/api/health")
        def health():  # noqa: ANN202
            return {"ok": True, "app": self.app_name}

        @api.get("/api/state")
        def state():  # noqa: ANN202
            return JSONResponse(self.state_provider())

        @api.post("/api/cmd/{name}")
        async def command(name: str, request_body: Optional[dict] = None):  # noqa: ANN202
            handler = self._commands.get(name)
            if handler is None:
                return JSONResponse({"error": f"unknown command {name}"}, status_code=404)
            try:
                result = handler(request_body or {})
                return JSONResponse({"ok": True, "result": result})
            except Exception as e:  # noqa: BLE001
                logger.warning("command %s failed: %s", name, e)
                return JSONResponse({"ok": False, "error": str(e)}, status_code=500)

        @api.websocket("/ws")
        async def ws(websocket: WebSocket):  # noqa: ANN202
            await websocket.accept()
            try:
                while True:
                    await websocket.send_json(self.state_provider())
                    await asyncio.sleep(self.push_interval_s)
            except WebSocketDisconnect:
                return
            except Exception as e:  # noqa: BLE001
                logger.debug("ws closed: %s", e)

        self._mount_web(api)
        return api

    def _mount_web(self, api: FastAPI) -> None:
        dist = self._resolve_web_dir()
        if dist is not None:
            api.mount("/", StaticFiles(directory=str(dist), html=True), name="web")
            logger.info("serving web build from %s", dist)
        else:
            @api.get("/", response_class=HTMLResponse)
            def fallback():  # noqa: ANN202
                return _FALLBACK_HTML.replace("__APP__", self.app_name)
            logger.info("no web build found; serving fallback console")

    def _resolve_web_dir(self) -> Optional[Path]:
        if self.web_dir is None:
            return None
        for cand in (self.web_dir / "dist", self.web_dir):
            if (cand / "index.html").exists():
                return cand
        return None

    # -- lifecycle ---------------------------------------------------------

    def start_in_thread(self) -> None:
        import uvicorn

        config = uvicorn.Config(self.api, host=self.host, port=self.port,
                                log_level="warning", ws="websockets")
        self._server = uvicorn.Server(config)
        self._thread = threading.Thread(target=self._server.run, daemon=True)
        self._thread.start()
        logger.info("%s server on http://%s:%d", self.app_name, self.host, self.port)

    def stop(self) -> None:
        if self._server is not None:
            self._server.should_exit = True


_FALLBACK_HTML = """<!doctype html><html><head><meta charset="utf-8">
<title>__APP__</title><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
 body{font:15px/1.5 -apple-system,system-ui,sans-serif;margin:0;background:#0b0e14;color:#e6e6e6}
 .wrap{max-width:520px;margin:0 auto;padding:24px}
 h1{font-size:20px;margin:0 0 4px} .sub{color:#8b95a7;font-size:13px;margin-bottom:20px}
 pre{background:#12161f;border:1px solid #1f2633;border-radius:10px;padding:16px;
     overflow:auto;font-size:13px;color:#9fe6b8}
 .dot{display:inline-block;width:8px;height:8px;border-radius:50%;background:#f0883e;margin-right:6px}
 .live .dot{background:#3fb950}
</style></head><body><div class="wrap">
 <h1>__APP__</h1>
 <div class="sub" id="status"><span class="dot"></span>connecting…</div>
 <pre id="state">waiting for state…</pre>
</div><script>
 const s=document.getElementById('status'),v=document.getElementById('state');
 function go(){const ws=new WebSocket((location.protocol==='https:'?'wss':'ws')+'://'+location.host+'/ws');
  ws.onopen=()=>{s.className='live';s.innerHTML='<span class="dot"></span>live';};
  ws.onmessage=e=>{v.textContent=JSON.stringify(JSON.parse(e.data),null,2);};
  ws.onclose=()=>{s.className='';s.innerHTML='<span class="dot"></span>reconnecting…';setTimeout(go,1000);};}
 go();
</script></body></html>"""
