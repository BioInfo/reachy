# legacy_v1 — parts bin (not shipped, not run)

The original "Echo" companion-platform build (gradio UI + SQLite memory + a
proactive trigger/behavior engine + provider clients + an edge-tts voice path).

It is **kept for salvage only** — it is not imported by the v2 `hey_reachy`
package, not part of the installed app, and not included in the published Space.
Pieces worth lifting into v2 later: `memory/` (fact extraction), `proactive/`
(trigger→behavior engine), `providers/litellm.py`, `voice.py`.

These modules use package-relative imports from their old location and will not
run as-is from here. Treat them as reference.
