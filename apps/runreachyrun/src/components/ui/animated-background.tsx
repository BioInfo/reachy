"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
}

export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Initialize particles
    const particleCount = 30;
    particlesRef.current = Array.from({ length: particleCount }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      size: Math.random() * 2 + 1,
      opacity: Math.random() * 0.3 + 0.1,
    }));

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw grid lines
      ctx.strokeStyle = "rgba(0, 255, 213, 0.03)";
      ctx.lineWidth = 1;
      const gridSize = 60;

      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }

      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Draw and update particles
      particlesRef.current.forEach((p) => {
        // Update position
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around edges
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 255, 213, ${p.opacity})`;
        ctx.fill();
      });

      // Draw connections between nearby particles
      ctx.strokeStyle = "rgba(0, 255, 213, 0.05)";
      ctx.lineWidth = 0.5;
      for (let i = 0; i < particlesRef.current.length; i++) {
        for (let j = i + 1; j < particlesRef.current.length; j++) {
          const p1 = particlesRef.current[i];
          const p2 = particlesRef.current[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 150) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ opacity: 0.6 }}
    />
  );
}

export function RobotSilhouette() {
  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1, delay: 0.5 }}
    >
      <motion.svg
        viewBox="0 0 200 200"
        className="w-96 h-96 opacity-[0.04]"
        animate={{
          scale: [1, 1.02, 1],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        {/* Robot head silhouette */}
        <ellipse cx="100" cy="80" rx="50" ry="45" fill="currentColor" className="text-[var(--accent-cyan)]" />
        {/* Left antenna */}
        <motion.line
          x1="65"
          y1="40"
          x2="50"
          y2="15"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          className="text-[var(--accent-cyan)]"
          animate={{ x2: [50, 45, 50], y2: [15, 12, 15] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
        <circle cx="50" cy="12" r="6" fill="currentColor" className="text-[var(--accent-cyan)]" />
        {/* Right antenna */}
        <motion.line
          x1="135"
          y1="40"
          x2="150"
          y2="15"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          className="text-[var(--accent-cyan)]"
          animate={{ x2: [150, 155, 150], y2: [15, 12, 15] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        />
        <circle cx="150" cy="12" r="6" fill="currentColor" className="text-[var(--accent-cyan)]" />
        {/* Eyes */}
        <ellipse cx="75" cy="75" rx="12" ry="8" fill="var(--bg-primary)" />
        <ellipse cx="125" cy="75" rx="12" ry="8" fill="var(--bg-primary)" />
        {/* Neck */}
        <rect x="85" y="125" width="30" height="20" rx="5" fill="currentColor" className="text-[var(--accent-cyan)]" />
        {/* Body base */}
        <ellipse cx="100" cy="165" rx="45" ry="25" fill="currentColor" className="text-[var(--accent-cyan)]" />
      </motion.svg>
    </motion.div>
  );
}

export function GlowOrb() {
  return (
    <motion.div
      className="absolute w-64 h-64 rounded-full pointer-events-none"
      style={{
        background: "radial-gradient(circle, rgba(0, 255, 213, 0.15) 0%, transparent 70%)",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      }}
      animate={{
        scale: [1, 1.2, 1],
        opacity: [0.5, 0.8, 0.5],
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}
