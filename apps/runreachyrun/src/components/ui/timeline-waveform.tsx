"use client";

import { useEffect, useRef } from "react";

interface TimelineWaveformProps {
  className?: string;
}

export function TimelineWaveform({ className = "" }: TimelineWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const animate = () => {
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      ctx.clearRect(0, 0, width, height);
      timeRef.current += 0.015;

      // Draw multiple waveform layers
      drawWave(ctx, width, height, {
        amplitude: 8,
        frequency: 0.02,
        speed: 1,
        offset: 0,
        opacity: 0.15,
        lineWidth: 1.5,
      });

      drawWave(ctx, width, height, {
        amplitude: 5,
        frequency: 0.035,
        speed: 1.5,
        offset: Math.PI / 3,
        opacity: 0.1,
        lineWidth: 1,
      });

      drawWave(ctx, width, height, {
        amplitude: 3,
        frequency: 0.05,
        speed: 2,
        offset: Math.PI / 2,
        opacity: 0.08,
        lineWidth: 0.5,
      });

      // Draw subtle pulse dots at intervals
      drawPulseNodes(ctx, width, height);

      animationRef.current = requestAnimationFrame(animate);
    };

    const drawWave = (
      ctx: CanvasRenderingContext2D,
      width: number,
      height: number,
      config: {
        amplitude: number;
        frequency: number;
        speed: number;
        offset: number;
        opacity: number;
        lineWidth: number;
      }
    ) => {
      const { amplitude, frequency, speed, offset, opacity, lineWidth } = config;
      const centerX = 20; // Align with timeline spine

      ctx.beginPath();
      ctx.strokeStyle = `rgba(0, 255, 213, ${opacity})`;
      ctx.lineWidth = lineWidth;

      for (let y = 0; y < height; y += 2) {
        const wave =
          Math.sin(y * frequency + timeRef.current * speed + offset) * amplitude;
        const x = centerX + wave;

        if (y === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.stroke();
    };

    const drawPulseNodes = (
      ctx: CanvasRenderingContext2D,
      width: number,
      height: number
    ) => {
      const centerX = 20;
      const nodeSpacing = 120;
      const pulseRadius = 2 + Math.sin(timeRef.current * 2) * 1;

      for (let y = 60; y < height; y += nodeSpacing) {
        const wave = Math.sin(y * 0.02 + timeRef.current) * 8;
        const x = centerX + wave;

        // Outer glow
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, pulseRadius * 3);
        gradient.addColorStop(0, "rgba(0, 255, 213, 0.2)");
        gradient.addColorStop(1, "rgba(0, 255, 213, 0)");

        ctx.beginPath();
        ctx.arc(x, y, pulseRadius * 3, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Core dot
        ctx.beginPath();
        ctx.arc(x, y, pulseRadius, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0, 255, 213, 0.3)";
        ctx.fill();
      }
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
      className={`absolute left-0 top-0 w-16 h-full pointer-events-none ${className}`}
      style={{ opacity: 0.8 }}
    />
  );
}
