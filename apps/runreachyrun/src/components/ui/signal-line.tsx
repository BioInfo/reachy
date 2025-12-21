"use client";

import { motion } from "framer-motion";

interface SignalLineProps {
  variant?: "horizontal" | "vertical";
  animate?: boolean;
  className?: string;
}

export function SignalLine({
  variant = "horizontal",
  animate = true,
  className = "",
}: SignalLineProps) {
  const isHorizontal = variant === "horizontal";

  return (
    <div
      className={`
        relative overflow-hidden
        ${isHorizontal ? "h-px w-full" : "w-px h-full"}
        ${className}
      `}
    >
      {/* Base line */}
      <div
        className={`
          absolute inset-0
          ${isHorizontal ? "bg-gradient-to-r" : "bg-gradient-to-b"}
          from-transparent via-[var(--accent-cyan)] to-transparent
          opacity-30
        `}
      />

      {/* Animated pulse */}
      {animate && (
        <motion.div
          className={`
            absolute
            ${isHorizontal ? "h-full w-24" : "w-full h-24"}
            ${isHorizontal ? "bg-gradient-to-r" : "bg-gradient-to-b"}
            from-transparent via-[var(--accent-cyan)] to-transparent
          `}
          initial={isHorizontal ? { x: "-100%" } : { y: "-100%" }}
          animate={isHorizontal ? { x: "400%" } : { y: "400%" }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "linear",
            repeatDelay: 2,
          }}
        />
      )}
    </div>
  );
}
