"use client";

import { motion } from "framer-motion";

type BadgeVariant = "cyan" | "amber" | "success" | "failure" | "default";

interface SignalBadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  pulse?: boolean;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  cyan: "text-[var(--accent-cyan)] bg-[var(--accent-cyan-glow)] border-[var(--accent-cyan-glow)]",
  amber:
    "text-[var(--accent-amber)] bg-[var(--accent-amber-glow)] border-[var(--accent-amber-glow)]",
  success:
    "text-[var(--semantic-success)] bg-[rgba(74,222,128,0.1)] border-[rgba(74,222,128,0.2)]",
  failure:
    "text-[var(--semantic-failure)] bg-[rgba(255,107,107,0.1)] border-[rgba(255,107,107,0.2)]",
  default:
    "text-[var(--text-secondary)] bg-[var(--bg-tertiary)] border-[var(--border-subtle)]",
};

export function SignalBadge({
  children,
  variant = "default",
  pulse = false,
  className = "",
}: SignalBadgeProps) {
  return (
    <motion.span
      className={`
        inline-flex items-center gap-1.5 px-2 py-1
        font-mono text-xs rounded border
        ${variantStyles[variant]}
        ${className}
      `}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span
            className={`
              animate-ping absolute inline-flex h-full w-full rounded-full opacity-75
              ${variant === "cyan" ? "bg-[var(--accent-cyan)]" : ""}
              ${variant === "amber" ? "bg-[var(--accent-amber)]" : ""}
              ${variant === "success" ? "bg-[var(--semantic-success)]" : ""}
              ${variant === "failure" ? "bg-[var(--semantic-failure)]" : ""}
              ${variant === "default" ? "bg-[var(--text-muted)]" : ""}
            `}
          />
          <span
            className={`
              relative inline-flex rounded-full h-2 w-2
              ${variant === "cyan" ? "bg-[var(--accent-cyan)]" : ""}
              ${variant === "amber" ? "bg-[var(--accent-amber)]" : ""}
              ${variant === "success" ? "bg-[var(--semantic-success)]" : ""}
              ${variant === "failure" ? "bg-[var(--semantic-failure)]" : ""}
              ${variant === "default" ? "bg-[var(--text-muted)]" : ""}
            `}
          />
        </span>
      )}
      {children}
    </motion.span>
  );
}
