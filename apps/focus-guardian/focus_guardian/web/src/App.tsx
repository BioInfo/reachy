import { useEffect, useState } from "react";
import { RingGauge, StatusDot, Button, Toggle, Stepper, StatPill, useLiveState, command } from "@kit";

// -- live state shape (mirrors app.py _snapshot) ----------------------------

type Attention = { present: boolean; engaged: boolean; focused: boolean; source: string; detail: string } | null;
type FGState = {
  state: "idle" | "focusing" | "distracted" | "break" | "completed";
  active: boolean;
  remaining: string;
  progress: number;
  stats: { focused_s: number; distracted_s: number; nudges: number; focus_score: number };
  robot: string;
  attention: Attention;
  totals: { sessions: number; completed: number; focus_minutes: number; nudges: number; avg_score: number };
  config: {
    duration_minutes: number; break_minutes: number; sound_enabled: boolean;
    camera_enabled: boolean; detector_kind: string; vlm_enabled: boolean;
  };
};

const CYAN = "#00ffd5", AMBER = "#ffaa00", SUCCESS = "#4ade80", INFO = "#60a5fa", MUTED = "#3a3a42";

// the ring is the signal: its color = the robot's read on you + the session phase
function ringColor(s: FGState): { color: string; pulsing: boolean } {
  if (s.state === "completed") return { color: SUCCESS, pulsing: false };
  if (s.state === "break") return { color: INFO, pulsing: true };
  if (!s.active) return { color: MUTED, pulsing: false };
  const drifted = s.attention && s.config.camera_enabled && !s.attention.focused;
  return drifted ? { color: AMBER, pulsing: true } : { color: CYAN, pulsing: true };
}

// the creature's reaction, in plain language (no robot jargon up front)
function reaction(s: FGState): string {
  if (s.state === "completed") return "Session done. Nice work.";
  if (s.state === "break") return "Take a breath. Break time.";
  if (!s.active) return "Ready when you are.";
  if (s.config.camera_enabled && s.attention && !s.attention.focused) {
    return s.robot.includes("escalate") ? "Still gone. Come on back."
      : s.robot.includes("nudge") ? "Nudging you back."
      : "Noticed you slip. Holding.";
  }
  return "Locked in with you.";
}

function attentionChip(s: FGState) {
  if (!s.config.camera_enabled) return { tone: "idle", text: "camera off · manual" };
  if (!s.active || !s.attention) return { tone: "idle", text: "not watching" };
  const a = s.attention;
  const src = a.source === "vlm" ? "vlm" : "motion";
  if (a.focused) return { tone: "live", text: `engaged · ${src}` };
  if (a.present) return { tone: "amber", text: `looked away · ${src}` };
  return { tone: "amber", text: `away · ${src}` };
}

export function App() {
  const { state, conn } = useLiveState<FGState>({ pollMs: 1000 });

  // local control values; seed from config once, then user owns them
  const [dur, setDur] = useState(25);
  const [brk, setBrk] = useState(true);
  const [cam, setCam] = useState(true);
  const [snd, setSnd] = useState(false);
  const [seeded, setSeeded] = useState(false);
  useEffect(() => {
    if (state && !seeded) {
      setDur(state.config.duration_minutes);
      setBrk(state.config.break_minutes > 0);
      setCam(state.config.camera_enabled);
      setSnd(state.config.sound_enabled);
      setSeeded(true);
    }
  }, [state, seeded]);

  if (!state) {
    return (
      <div className="wrap">
        <Header conn={conn} />
        <div className="card pad center secondary">connecting to the robot…</div>
      </div>
    );
  }

  const active = state.active;
  const { color, pulsing } = ringColor(state);
  const chip = attentionChip(state);
  const stateWord =
    state.state === "completed" ? "DONE"
    : state.state === "break" ? "BREAK"
    : state.state === "focusing" ? "FOCUS"
    : state.state === "distracted" ? "DRIFT"
    : "READY";

  const start = () =>
    command("start", {
      duration_minutes: dur,
      break_minutes: brk ? 5 : 0,
      camera_enabled: cam,
      sound_enabled: snd,
    });
  const stop = () => command("stop", {});

  return (
    <div className="wrap">
      <Header conn={conn} />

      {/* signature: the focus signal ring */}
      <section className="signal">
        <RingGauge progress={active || state.state === "completed" ? state.progress : 0} color={color} pulsing={pulsing} size={252} stroke={13}>
          <div className="mono time" style={{ color }}>{active ? state.remaining : `${dur}:00`}</div>
          <div className="eyebrow" style={{ marginTop: 6 }}>{stateWord}</div>
        </RingGauge>
        <div className="reaction">
          <span className="robot-face" aria-hidden>{faceFor(state)}</span>
          <div>
            <div className="reaction-line">{reaction(state)}</div>
            <div className="chip" style={{ marginTop: 8 }}>
              <StatusDot tone={chip.tone} />
              <span className="secondary">{chip.text}</span>
            </div>
          </div>
        </div>
      </section>

      {/* controls */}
      <section className="card pad controls">
        <Row label="Session">
          <Stepper value={dur} onChange={setDur} min={5} max={90} step={5} suffix="m" />
        </Row>
        <div className="toggles">
          <Toggle checked={brk} onChange={setBrk} label="Break after" />
          <Toggle checked={cam} onChange={setCam} label="Camera" />
          <Toggle checked={snd} onChange={setSnd} label="Sound" />
        </div>
        <div className="actions">
          {active ? (
            <Button variant="danger" block onClick={stop}>Stop session</Button>
          ) : (
            <Button variant="primary" block onClick={start}>Start focus</Button>
          )}
        </div>
      </section>

      {/* today */}
      <section className="today">
        <div className="eyebrow" style={{ marginBottom: 10 }}>Today</div>
        <div className="strip">
          <StatPill num={state.totals.sessions} label="sessions" />
          <StatPill num={state.totals.focus_minutes} label="focus min" tone={CYAN} />
          <StatPill num={`${state.totals.avg_score}`} label="avg score" tone={SUCCESS} />
          <StatPill num={state.totals.nudges} label="nudges" tone={AMBER} />
        </div>
      </section>
    </div>
  );
}

function Header({ conn }: { conn: string }) {
  const tone = conn === "live" ? "live" : conn === "polling" ? "amber" : "idle";
  return (
    <header className="hdr">
      <div>
        <div className="brand">Focus Guardian</div>
        <div className="eyebrow">reachy mini · body double</div>
      </div>
      <div className="chip">
        <StatusDot tone={tone} />
        <span className="secondary" style={{ fontSize: 12 }}>{conn}</span>
      </div>
    </header>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="row">
      <span className="secondary">{label}</span>
      {children}
    </div>
  );
}

// a tiny expressive face that reflects the robot's mood, domain identity at a glance
function faceFor(s: FGState): string {
  if (s.state === "completed") return "◠‿◠";
  if (s.state === "break") return "︶ω︶";
  if (!s.active) return "•__•";
  if (s.config.camera_enabled && s.attention && !s.attention.focused) return "•︵•";
  return "•‿•";
}
