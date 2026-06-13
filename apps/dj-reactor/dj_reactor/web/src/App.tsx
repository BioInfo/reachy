import { useEffect, useRef, useState } from "react";
import { StatusDot, Button, Toggle, StatPill, useLiveState, command } from "@kit";

// -- live state shape (mirrors app.py _snapshot) ----------------------------

type Audio = {
  bass: number; mid: number; treble: number; rms: number;
  beat: boolean; onset: number; bpm: number; beat_phase: number;
  silent: boolean; source: string;
};
type Genre = { value: string; label: string };
type DJState = {
  state: "idle" | "listening" | "vibing";
  active: boolean;
  vibing: boolean;
  audio: Audio;
  set: { elapsed_s: number; vibing_s: number; beats: number; drops: number; bpm: number; peak_bpm: number };
  robot: string;
  moving: boolean;
  audio_available: boolean;
  totals: { sets: number; vibing_minutes: number; beats: number; drops: number; peak_bpm: number };
  config: { genre: string; intensity: number; sensitivity: number; sound_enabled: boolean; react_to_drops: boolean };
  genres: Genre[];
};

// band hues are STRUCTURE here (one per frequency category), not decoration
const BASS = "#00ffd5", MID = "#ff5db1", TREBLE = "#ffaa00";
const SUCCESS = "#4ade80", MUTED = "#3a3a42";

// -- the signature: a beat-reactive spectrum --------------------------------
// Three concentric arcs track bass / mid / treble in real time; the core disc
// shows BPM and scales + flashes on every detected beat. This is the thing you
// screenshot, and it could only belong to a music visualizer.

function BeatSpectrum({ audio, vibing, beatKey, stateWord }: {
  audio: Audio; vibing: boolean; beatKey: number; stateWord: string;
}) {
  const size = 256, c = size / 2, stroke = 11;
  const rings = [
    { r: 110, level: audio.treble, color: TREBLE },
    { r: 86, level: audio.mid, color: MID },
    { r: 62, level: audio.bass, color: BASS },
  ];
  const live = vibing && !audio.silent;
  const scale = live ? 1 + 0.1 * Math.min(1, audio.rms) : 1;

  return (
    <div className="spectrum" style={{ width: size, height: size }}>
      <svg width={size} height={size} className={live ? "spectrum-svg live" : "spectrum-svg"}>
        {rings.map((ring) => {
          const circ = 2 * Math.PI * ring.r;
          const lvl = Math.max(0, Math.min(1, ring.level));
          return (
            <g key={ring.r}>
              <circle cx={c} cy={c} r={ring.r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
              <circle
                cx={c} cy={c} r={ring.r} fill="none"
                stroke={ring.color} strokeWidth={stroke} strokeLinecap="round"
                strokeDasharray={circ} strokeDashoffset={circ * (1 - lvl)}
                transform={`rotate(-90 ${c} ${c})`}
                style={{
                  transition: "stroke-dashoffset .12s linear, opacity .3s ease",
                  opacity: live ? 1 : 0.35,
                  filter: `drop-shadow(0 0 6px ${ring.color}88)`,
                }}
              />
            </g>
          );
        })}
      </svg>
      <div className="spectrum-core" style={{ transform: `scale(${scale})` }}>
        {/* re-keyed on each beat to retrigger the flash animation */}
        <span key={beatKey} className={live ? "beat-flash on" : "beat-flash"} aria-hidden />
        <div className="bpm mono">{Math.round(audio.bpm)}</div>
        <div className="bpm-lbl eyebrow">{live ? "BPM" : stateWord}</div>
      </div>
    </div>
  );
}

function face(s: DJState): string {
  if (s.robot.startsWith("drop")) return "☉o☉";
  if (s.vibing) return "♪◡♪";
  if (s.active) return "•ᴗ•?";
  return "•__•";
}

function reaction(s: DJState): string {
  if (s.robot.startsWith("drop")) return "Hit the drop.";
  if (s.vibing) return s.audio.bpm >= 140 ? "Locked into the groove." : "Riding the beat.";
  if (s.active) return s.audio_available ? "Listening for the beat…" : "No audio input found.";
  return "Ready to vibe. Press play and start a track.";
}

export function App() {
  const { state, conn } = useLiveState<DJState>({ pollMs: 1000 });

  // rising-edge beat -> bump a key so the core flash animation retriggers
  const prevBeat = useRef(false);
  const [beatKey, setBeatKey] = useState(0);
  useEffect(() => {
    const b = !!state?.audio?.beat;
    if (b && !prevBeat.current) setBeatKey((k) => k + 1);
    prevBeat.current = b;
  }, [state?.audio?.beat]);

  // local control mirror; seed from config once, then user owns
  const [genre, setGenre] = useState("electronic");
  const [intensity, setIntensity] = useState(0.7);
  const [sensitivity, setSensitivity] = useState(0.6);
  const [snd, setSnd] = useState(true);
  const [drops, setDrops] = useState(true);
  const [seeded, setSeeded] = useState(false);
  useEffect(() => {
    if (state && !seeded) {
      setGenre(state.config.genre);
      setIntensity(state.config.intensity);
      setSensitivity(state.config.sensitivity);
      setSnd(state.config.sound_enabled);
      setDrops(state.config.react_to_drops);
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
  const stateWord = state.vibing ? "VIBING" : active ? "LISTENING" : "READY";

  const pushConfig = (patch: Record<string, unknown>) => command("config", patch);
  const pickGenre = (g: string) => { setGenre(g); pushConfig({ genre: g }); };
  const onIntensity = (v: number) => { setIntensity(v); pushConfig({ intensity: v }); };
  const onSensitivity = (v: number) => { setSensitivity(v); pushConfig({ sensitivity: v }); };
  const onSound = (v: boolean) => { setSnd(v); pushConfig({ sound_enabled: v }); };
  const onDrops = (v: boolean) => { setDrops(v); pushConfig({ react_to_drops: v }); };

  const start = () => command("start", {
    genre, intensity, sensitivity, sound_enabled: snd, react_to_drops: drops,
  });
  const stop = () => command("stop", {});

  const chipTone = state.vibing ? "live" : active ? "amber" : "idle";
  const chipText = state.vibing
    ? `${Math.round(state.set.bpm)} bpm · ${state.set.beats} beats`
    : active ? "waiting for music" : "stopped";

  return (
    <div className="wrap">
      <Header conn={conn} />

      {/* signature: the beat spectrum */}
      <section className="signal">
        <BeatSpectrum audio={state.audio} vibing={state.vibing} beatKey={beatKey} stateWord={stateWord} />
        <div className="reaction">
          <span className="robot-face" aria-hidden>{face(state)}</span>
          <div>
            <div className="reaction-line">{reaction(state)}</div>
            <div className="chip" style={{ marginTop: 8 }}>
              <StatusDot tone={chipTone} />
              <span className="secondary">{chipText}</span>
            </div>
          </div>
        </div>
      </section>

      {/* controls */}
      <section className="card pad controls">
        <div>
          <div className="eyebrow" style={{ marginBottom: 10 }}>Genre</div>
          <div className="genres">
            {state.genres.map((g) => (
              <button
                key={g.value}
                className={"genre-pill" + (genre === g.value ? " active" : "")}
                onClick={() => pickGenre(g.value)}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        <Slider label="Intensity" value={intensity} min={0.1} max={1} step={0.05} onChange={onIntensity} />
        <Slider label="Sensitivity" value={sensitivity} min={0.2} max={1} step={0.05} onChange={onSensitivity} />

        <div className="toggles">
          <Toggle checked={snd} onChange={onSound} label="Sound" />
          <Toggle checked={drops} onChange={onDrops} label="Drop moves" />
        </div>

        <div className="actions">
          {active ? (
            <Button variant="danger" block onClick={stop}>Stop</Button>
          ) : (
            <Button variant="primary" block onClick={start}>Start the set</Button>
          )}
        </div>
      </section>

      {/* today */}
      <section className="today">
        <div className="eyebrow" style={{ marginBottom: 10 }}>Today</div>
        <div className="strip">
          <StatPill num={state.totals.sets} label="sets" />
          <StatPill num={state.totals.vibing_minutes} label="vibing min" tone={BASS} />
          <StatPill num={state.totals.beats} label="beats" tone={MID} />
          <StatPill num={state.totals.peak_bpm || 0} label="peak bpm" tone={TREBLE} />
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
        <div className="brand">DJ Reactor</div>
        <div className="eyebrow">reachy mini · music visualizer</div>
      </div>
      <div className="chip">
        <StatusDot tone={tone} />
        <span className="secondary" style={{ fontSize: 12 }}>{conn}</span>
      </div>
    </header>
  );
}

function Slider({ label, value, min, max, step, onChange }: {
  label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void;
}) {
  const pct = Math.round(((value - min) / (max - min)) * 100);
  return (
    <div className="slider-row">
      <div className="slider-head">
        <span className="secondary">{label}</span>
        <span className="mono slider-val">{pct}%</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ ["--pct" as string]: `${pct}%` }}
      />
    </div>
  );
}
