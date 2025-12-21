"use client";

import { motion } from "framer-motion";

interface CardProps {
  children: React.ReactNode;
  variant?: "default" | "elevated" | "interactive";
  className?: string;
  onClick?: () => void;
}

export function Card({
  children,
  variant = "default",
  className = "",
  onClick,
}: CardProps) {
  const baseStyles = "rounded-lg border transition-all duration-250";

  const variantStyles = {
    default:
      "bg-[var(--bg-secondary)] border-[var(--border-subtle)] hover:border-[var(--border-default)]",
    elevated:
      "bg-[var(--bg-tertiary)] border-[var(--border-default)] shadow-md",
    interactive:
      "bg-[var(--bg-secondary)] border-[var(--border-subtle)] hover:border-[var(--accent-cyan)] hover:shadow-[var(--shadow-glow-cyan)] cursor-pointer",
  };

  const Component = onClick ? motion.button : motion.div;

  return (
    <Component
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      onClick={onClick}
      whileHover={variant === "interactive" ? { scale: 1.01 } : undefined}
      whileTap={variant === "interactive" ? { scale: 0.99 } : undefined}
    >
      {children}
    </Component>
  );
}
