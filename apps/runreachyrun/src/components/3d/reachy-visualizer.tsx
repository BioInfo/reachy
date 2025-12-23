"use client";

import { useRef, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, Float } from "@react-three/drei";
import * as THREE from "three";

interface ReachyModelProps {
  headRotation?: { x: number; y: number; z: number };
  antennaLeft?: number;
  antennaRight?: number;
  bodyRotation?: number;
  expression?: "neutral" | "happy" | "surprised" | "thinking";
  animate?: boolean;
}

function ReachyModel({
  headRotation = { x: 0, y: 0, z: 0 },
  antennaLeft = 0,
  antennaRight = 0,
  bodyRotation = 0,
  expression = "neutral",
  animate = true,
}: ReachyModelProps) {
  const headRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const antennaLeftRef = useRef<THREE.Group>(null);
  const antennaRightRef = useRef<THREE.Group>(null);
  const eyeLeftRef = useRef<THREE.Mesh>(null);
  const eyeRightRef = useRef<THREE.Mesh>(null);

  // Animation loop
  useFrame((state) => {
    if (!animate) return;
    const t = state.clock.getElapsedTime();

    // Gentle idle breathing animation
    if (headRef.current) {
      headRef.current.rotation.x = headRotation.x + Math.sin(t * 0.8) * 0.02;
      headRef.current.rotation.y = headRotation.y + Math.sin(t * 0.5) * 0.03;
      headRef.current.rotation.z = headRotation.z + Math.sin(t * 0.3) * 0.01;
    }

    // Body gentle sway
    if (bodyRef.current) {
      bodyRef.current.rotation.y = bodyRotation + Math.sin(t * 0.4) * 0.02;
    }

    // Antenna bounce
    if (antennaLeftRef.current) {
      antennaLeftRef.current.rotation.z =
        antennaLeft + Math.sin(t * 2 + 0.5) * 0.15;
    }
    if (antennaRightRef.current) {
      antennaRightRef.current.rotation.z =
        antennaRight + Math.sin(t * 2) * 0.15;
    }

    // Eye blink occasionally
    if (eyeLeftRef.current && eyeRightRef.current) {
      const blink = Math.sin(t * 0.2) > 0.98 ? 0.1 : 1;
      eyeLeftRef.current.scale.y = blink;
      eyeRightRef.current.scale.y = blink;
    }
  });

  // Colors matching the actual Reachy Mini (white/off-white)
  const colors = {
    body: "#e8e8e8",
    bodyLight: "#f5f5f5",
    bodyDark: "#d0d0d0",
    head: "#f0f0f0",
    eyeSocket: "#2a2a2a",
    eyeLens: "#1a1a1a",
    eyeRing: "#404040",
    antenna: "#1a1a1a",
    antennaSpring: "#333333",
    base: "#1a1a1a",
    accent: "#00ffd5",
  };

  // Eye shape based on expression
  const getEyeScale = () => {
    switch (expression) {
      case "happy":
        return { x: 1.2, y: 0.6 };
      case "surprised":
        return { x: 1.3, y: 1.3 };
      case "thinking":
        return { x: 0.8, y: 1 };
      default:
        return { x: 1, y: 1 };
    }
  };

  const eyeScale = getEyeScale();

  return (
    <group>
      {/* Base / Foot - small black disc */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.12, 0.14, 0.03, 32]} />
        <meshStandardMaterial color={colors.base} metalness={0.3} roughness={0.7} />
      </mesh>

      {/* Body */}
      <group ref={bodyRef} position={[0, 0.22, 0]}>
        {/* Main body - egg/oval shape (scaled sphere) */}
        <mesh castShadow scale={[1, 1.15, 0.9]}>
          <sphereGeometry args={[0.18, 32, 32]} />
          <meshStandardMaterial color={colors.body} metalness={0.1} roughness={0.4} />
        </mesh>

        {/* Subtle seam line around body */}
        <mesh position={[0, 0.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.165, 0.003, 8, 64]} />
          <meshStandardMaterial color={colors.bodyDark} />
        </mesh>

        {/* Head */}
        <group ref={headRef} position={[0, 0.32, 0]}>
          {/* Main head - rounded rectangle/capsule shape */}
          <mesh castShadow scale={[1.3, 0.85, 0.9]}>
            <sphereGeometry args={[0.14, 32, 32]} />
            <meshStandardMaterial color={colors.head} metalness={0.1} roughness={0.4} />
          </mesh>

          {/* Left eye socket - goggle style */}
          <group position={[-0.07, 0, 0.1]}>
            {/* Outer ring */}
            <mesh rotation={[0, 0, 0]}>
              <torusGeometry args={[0.045, 0.008, 16, 32]} />
              <meshStandardMaterial color={colors.eyeRing} metalness={0.3} roughness={0.6} />
            </mesh>
            {/* Socket depression */}
            <mesh position={[0, 0, 0.01]}>
              <cylinderGeometry args={[0.042, 0.042, 0.02, 32]} />
              <meshStandardMaterial color={colors.eyeSocket} metalness={0.2} roughness={0.8} />
            </mesh>
            {/* Lens */}
            <mesh ref={eyeLeftRef} position={[0, 0, 0.02]} scale={[eyeScale.x, eyeScale.y, 1]}>
              <circleGeometry args={[0.035, 32]} />
              <meshStandardMaterial color={colors.eyeLens} metalness={0.8} roughness={0.2} />
            </mesh>
          </group>

          {/* Right eye socket - goggle style */}
          <group position={[0.07, 0, 0.1]}>
            {/* Outer ring */}
            <mesh rotation={[0, 0, 0]}>
              <torusGeometry args={[0.045, 0.008, 16, 32]} />
              <meshStandardMaterial color={colors.eyeRing} metalness={0.3} roughness={0.6} />
            </mesh>
            {/* Socket depression */}
            <mesh position={[0, 0, 0.01]}>
              <cylinderGeometry args={[0.042, 0.042, 0.02, 32]} />
              <meshStandardMaterial color={colors.eyeSocket} metalness={0.2} roughness={0.8} />
            </mesh>
            {/* Lens */}
            <mesh ref={eyeRightRef} position={[0, 0, 0.02]} scale={[eyeScale.x, eyeScale.y, 1]}>
              <circleGeometry args={[0.035, 32]} />
              <meshStandardMaterial color={colors.eyeLens} metalness={0.8} roughness={0.2} />
            </mesh>
          </group>

          {/* Left Antenna - thin wire with spring coil */}
          <group ref={antennaLeftRef} position={[-0.08, 0.12, 0]}>
            {/* Spring coil section (at base) */}
            {[...Array(6)].map((_, i) => (
              <mesh key={`spring-l-${i}`} position={[0, i * 0.012, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.012, 0.002, 8, 16]} />
                <meshStandardMaterial color={colors.antennaSpring} metalness={0.6} roughness={0.4} />
              </mesh>
            ))}
            {/* Thin wire stalk */}
            <mesh position={[-0.015, 0.18, 0]} rotation={[0, 0, 0.15]}>
              <cylinderGeometry args={[0.003, 0.003, 0.28, 8]} />
              <meshStandardMaterial color={colors.antenna} metalness={0.7} roughness={0.3} />
            </mesh>
            {/* Small tip */}
            <mesh position={[-0.035, 0.32, 0]}>
              <sphereGeometry args={[0.006, 8, 8]} />
              <meshStandardMaterial color={colors.antenna} metalness={0.7} roughness={0.3} />
            </mesh>
          </group>

          {/* Right Antenna - thin wire with spring coil */}
          <group ref={antennaRightRef} position={[0.08, 0.12, 0]}>
            {/* Spring coil section (at base) */}
            {[...Array(6)].map((_, i) => (
              <mesh key={`spring-r-${i}`} position={[0, i * 0.012, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.012, 0.002, 8, 16]} />
                <meshStandardMaterial color={colors.antennaSpring} metalness={0.6} roughness={0.4} />
              </mesh>
            ))}
            {/* Thin wire stalk */}
            <mesh position={[0.015, 0.18, 0]} rotation={[0, 0, -0.15]}>
              <cylinderGeometry args={[0.003, 0.003, 0.28, 8]} />
              <meshStandardMaterial color={colors.antenna} metalness={0.7} roughness={0.3} />
            </mesh>
            {/* Small tip */}
            <mesh position={[0.035, 0.32, 0]}>
              <sphereGeometry args={[0.006, 8, 8]} />
              <meshStandardMaterial color={colors.antenna} metalness={0.7} roughness={0.3} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
}

interface ReachyVisualizerProps {
  className?: string;
  height?: string;
  interactive?: boolean;
  showControls?: boolean;
  expression?: "neutral" | "happy" | "surprised" | "thinking";
}

export function ReachyVisualizer({
  className = "",
  height = "400px",
  interactive = true,
  showControls = true,
  expression = "happy",
}: ReachyVisualizerProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // SSR placeholder
    return (
      <div
        className={`bg-[var(--bg-secondary)] rounded-xl flex items-center justify-center ${className}`}
        style={{ height }}
      >
        <div className="text-[var(--text-muted)] font-mono text-sm">
          Loading 3D...
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl overflow-hidden ${className}`}
      style={{ height, background: "linear-gradient(180deg, #0d0d0f 0%, #141418 100%)" }}
    >
      <Canvas
        shadows
        camera={{ position: [0, 0.4, 1.2], fov: 40 }}
        gl={{ antialias: true }}
      >
        {/* Lighting - brighter to show white robot */}
        <ambientLight intensity={0.7} />
        <directionalLight
          position={[3, 5, 5]}
          intensity={1.2}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <directionalLight
          position={[-3, 3, 2]}
          intensity={0.4}
        />
        {/* Subtle rim light */}
        <pointLight position={[0, 2, -2]} intensity={0.3} color="#ffffff" />
        {/* Accent light for teal glow effect */}
        <pointLight position={[0.5, 0, 1]} intensity={0.15} color="#00ffd5" />

        {/* Environment for reflections */}
        <Environment preset="city" />

        {/* The Robot - centered at proper height */}
        <group position={[0, -0.15, 0]}>
          <Float speed={1.5} rotationIntensity={0.05} floatIntensity={0.05}>
            <ReachyModel expression={expression} animate />
          </Float>
        </group>

        {/* Subtle floor reflection */}
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -0.16, 0]}
          receiveShadow
        >
          <circleGeometry args={[0.8, 64]} />
          <meshStandardMaterial
            color="#1a1a1f"
            metalness={0.9}
            roughness={0.1}
            transparent
            opacity={0.6}
          />
        </mesh>

        {/* Subtle glow ring */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.155, 0]}>
          <ringGeometry args={[0.18, 0.22, 64]} />
          <meshBasicMaterial color="#00ffd5" transparent opacity={0.1} />
        </mesh>

        {/* Controls */}
        {interactive && (
          <OrbitControls
            enableZoom={showControls}
            enablePan={false}
            minDistance={0.8}
            maxDistance={2.5}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={Math.PI / 2.2}
            autoRotate
            autoRotateSpeed={0.5}
            target={[0, 0.25, 0]}
          />
        )}
      </Canvas>
    </div>
  );
}

export default ReachyVisualizer;
