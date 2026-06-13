/* Shared "Signal" UI primitives for Reachy Mini app panels.
   Reusable across robot apps (Focus Guardian, DJ Reactor, Echo) and the devlog.
   The RingGauge is the centerpiece: a live progress ring whose color and pulse
   are driven by app state, not decoration. */

import React from "react";

// -- RingGauge: the signature element ---------------------------------------
// A circular progress ring. Apps drive `color` + `pulsing` from live state so
// the ring becomes a status object (here: time left fused with attention).

export function RingGauge({
  progress,
  color,
  pulsing = false,
  size = 248,
  stroke = 12,
  trackColor = "rgba(255,255,255,0.07)",
  children,
}: {
  progress: number; // 0..1
  color: string;
  pulsing?: boolean;
  size?: number;
  stroke?: number;
  trackColor?: string;
  children?: React.ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, progress));
  const offset = c * (1 - clamped);
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} className={pulsing ? "ring-svg pulsing" : "ring-svg"}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={trackColor} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{
            transition: "stroke-dashoffset .6s ease, stroke .4s ease",
            filter: `drop-shadow(0 0 10px ${color}66)`,
          }}
        />
      </svg>
      <div className="ring-center">{children}</div>
    </div>
  );
}

// -- StatusDot ---------------------------------------------------------------

export function StatusDot({ tone = "idle", label }: { tone?: string; label?: string }) {
  const cls = tone === "live" ? "dot live" : tone === "amber" ? "dot amber" : tone === "success" ? "dot success" : "dot";
  return (
    <span>
      <span className={cls} />
      {label}
    </span>
  );
}

// -- Button ------------------------------------------------------------------

export function Button({
  variant = "default",
  block = false,
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "default" | "primary" | "danger"; block?: boolean }) {
  const cls = ["btn", variant !== "default" ? variant : "", block ? "block" : ""].filter(Boolean).join(" ");
  return (
    <button className={cls} {...rest}>
      {children}
    </button>
  );
}

// -- Toggle ------------------------------------------------------------------

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="toggle">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="track" />
      <span className="secondary" style={{ fontSize: 13 }}>{label}</span>
    </label>
  );
}

// -- Stepper -----------------------------------------------------------------

export function Stepper({
  value,
  onChange,
  min = 0,
  max = 999,
  step = 1,
  suffix = "",
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
}) {
  const set = (v: number) => onChange(Math.max(min, Math.min(max, v)));
  return (
    <div className="stepper">
      <button onClick={() => set(value - step)} aria-label="decrease">-</button>
      <span className="val">{value}{suffix}</span>
      <button onClick={() => set(value + step)} aria-label="increase">+</button>
    </div>
  );
}

// -- StatPill (one number in the today-strip) --------------------------------

export function StatPill({ num, label, tone }: { num: React.ReactNode; label: string; tone?: string }) {
  return (
    <div className="stat">
      <div className="num" style={tone ? { color: tone } : undefined}>{num}</div>
      <div className="lbl">{label}</div>
    </div>
  );
}
