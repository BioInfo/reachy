# Focus Guardian — web UI

React (vite) control panel for the app. Built on the shared **Signal** UI kit at
`shared/ui/react/` (reused across robot apps + the runreachyrun devlog).

## Build

```bash
npm install
npm run build      # -> dist/  (the app's FastAPI server serves this)
npm run dev        # vite dev server, proxy /api + /ws to the running app
```

`dist/` is git-ignored (build artifact). The Python app serves `web/dist` if
present, otherwise a built-in fallback console — so the app still runs unbuilt,
just without the polished UI. **The HuggingFace publish step builds `dist/` and
vendors it (plus `shared/`) into the Space.**

## Shape

- `src/App.tsx` — the panel. Signature element = the **Focus Signal ring**
  (countdown fused with the robot's attention-on-you; cyan = engaged, amber =
  drifted), plus the plain-language robot reaction line.
- imports `@kit` → `shared/ui/react` (RingGauge, useLiveState WS hook, command
  client, primitives). Reusable by DJ Reactor / Echo.
- talks to the app over `GET /api/state` + `WS /ws` + `POST /api/cmd/{start,stop}`.
