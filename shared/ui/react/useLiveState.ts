/* Live app state over WebSocket, with a REST poll fallback and auto-reconnect.
   Reusable: any Reachy app whose AppServer exposes /ws + /api/state. */

import { useEffect, useRef, useState } from "react";

export type Conn = "connecting" | "live" | "polling";

export function useLiveState<T>(opts?: { wsPath?: string; statePath?: string; pollMs?: number }) {
  const wsPath = opts?.wsPath ?? "/ws";
  const statePath = opts?.statePath ?? "/api/state";
  const pollMs = opts?.pollMs ?? 1000;

  const [state, setState] = useState<T | null>(null);
  const [conn, setConn] = useState<Conn>("connecting");
  const wsRef = useRef<WebSocket | null>(null);
  const pollRef = useRef<number | null>(null);

  useEffect(() => {
    let closed = false;

    const startPoll = () => {
      if (pollRef.current != null) return;
      setConn("polling");
      const tick = async () => {
        try {
          const r = await fetch(statePath);
          if (r.ok) setState(await r.json());
        } catch {
          /* ignore */
        }
      };
      tick();
      pollRef.current = window.setInterval(tick, pollMs);
    };
    const stopPoll = () => {
      if (pollRef.current != null) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };

    const connect = () => {
      if (closed) return;
      const proto = location.protocol === "https:" ? "wss" : "ws";
      const ws = new WebSocket(`${proto}://${location.host}${wsPath}`);
      wsRef.current = ws;
      ws.onopen = () => {
        stopPoll();
        setConn("live");
      };
      ws.onmessage = (e) => {
        try {
          setState(JSON.parse(e.data));
        } catch {
          /* ignore */
        }
      };
      ws.onclose = () => {
        wsRef.current = null;
        if (closed) return;
        startPoll(); // keep data flowing while we retry
        setTimeout(connect, 1500);
      };
      ws.onerror = () => ws.close();
    };

    connect();
    return () => {
      closed = true;
      stopPoll();
      wsRef.current?.close();
    };
  }, [wsPath, statePath, pollMs]);

  return { state, conn };
}
