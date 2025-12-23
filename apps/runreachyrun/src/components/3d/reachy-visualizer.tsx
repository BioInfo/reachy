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

  // Colors matching the site theme
  const colors = {
    body: "#1a1a1f",
    bodyAccent: "#222228",
    head: "#1a1a1f",
    eyes: "#00ffd5",
    eyeGlow: "#00ffd5",
    antenna: "#333338",
    antennaLED: "#00ffd5",
    base: "#141418",
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
      {/* Base / Foot */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.3, 0.35, 0.08, 32]} />
        <meshStandardMaterial color={colors.base} metalness={0.3} roughness={0.7} />
      </mesh>

      {/* Body */}
      <group ref={bodyRef} position={[0, 0.25, 0]}>
        {/* Main body cylinder */}
        <mesh castShadow>
          <cylinderGeometry args={[0.18, 0.22, 0.4, 32]} />
          <meshStandardMaterial color={colors.body} metalness={0.4} roughness={0.6} />
        </mesh>

        {/* Body accent ring */}
        <mesh position={[0, 0.1, 0]}>
          <torusGeometry args={[0.19, 0.015, 16, 32]} />
          <meshStandardMaterial color={colors.eyeGlow} emissive={colors.eyeGlow} emissiveIntensity={0.3} />
        </mesh>

        {/* Neck */}
        <mesh position={[0, 0.25, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.1, 0.1, 16]} />
          <meshStandardMaterial color={colors.bodyAccent} metalness={0.5} roughness={0.5} />
        </mesh>

        {/* Head */}
        <group ref={headRef} position={[0, 0.45, 0]}>
          {/* Main head sphere */}
          <mesh castShadow>
            <sphereGeometry args={[0.2, 32, 32]} />
            <meshStandardMaterial color={colors.head} metalness={0.3} roughness={0.7} />
          </mesh>

          {/* Face plate */}
          <mesh position={[0, 0, 0.15]} rotation={[0, 0, 0]}>
            <circleGeometry args={[0.15, 32]} />
            <meshStandardMaterial color={colors.bodyAccent} metalness={0.5} roughness={0.4} />
          </mesh>

          {/* Left eye */}
          <mesh
            ref={eyeLeftRef}
            position={[-0.06, 0.02, 0.17]}
            scale={[eyeScale.x, eyeScale.y, 1]}
          >
            <circleGeometry args={[0.035, 32]} />
            <meshStandardMaterial
              color={colors.eyes}
              emissive={colors.eyeGlow}
              emissiveIntensity={0.8}
            />
          </mesh>

          {/* Right eye */}
          <mesh
            ref={eyeRightRef}
            position={[0.06, 0.02, 0.17]}
            scale={[eyeScale.x, eyeScale.y, 1]}
          >
            <circleGeometry args={[0.035, 32]} />
            <meshStandardMaterial
              color={colors.eyes}
              emissive={colors.eyeGlow}
              emissiveIntensity={0.8}
            />
          </mesh>

          {/* Mouth (subtle arc for happy) */}
          {expression === "happy" && (
            <mesh position={[0, -0.05, 0.17]} rotation={[0, 0, Math.PI]}>
              <torusGeometry args={[0.04, 0.008, 8, 16, Math.PI]} />
              <meshStandardMaterial color={colors.eyeGlow} emissive={colors.eyeGlow} emissiveIntensity={0.5} />
            </mesh>
          )}

          {/* Camera lens (top of head) */}
          <mesh position={[0, 0.15, 0.1]} rotation={[0.3, 0, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.02, 16]} />
            <meshStandardMaterial color="#111" metalness={0.8} roughness={0.2} />
          </mesh>

          {/* Left Antenna */}
          <group ref={antennaLeftRef} position={[-0.12, 0.18, 0]}>
            {/* Antenna base */}
            <mesh>
              <cylinderGeometry args={[0.015, 0.02, 0.05, 8]} />
              <meshStandardMaterial color={colors.antenna} metalness={0.5} roughness={0.5} />
            </mesh>
            {/* Antenna stalk */}
            <mesh position={[0, 0.08, 0]} rotation={[0, 0, 0.2]}>
              <cylinderGeometry args={[0.008, 0.012, 0.12, 8]} />
              <meshStandardMaterial color={colors.antenna} metalness={0.5} roughness={0.5} />
            </mesh>
            {/* Antenna LED tip */}
            <mesh position={[0.02, 0.14, 0]}>
              <sphereGeometry args={[0.018, 16, 16]} />
              <meshStandardMaterial
                color={colors.antennaLED}
                emissive={colors.antennaLED}
                emissiveIntensity={1}
              />
            </mesh>
          </group>

          {/* Right Antenna */}
          <group ref={antennaRightRef} position={[0.12, 0.18, 0]}>
            {/* Antenna base */}
            <mesh>
              <cylinderGeometry args={[0.015, 0.02, 0.05, 8]} />
              <meshStandardMaterial color={colors.antenna} metalness={0.5} roughness={0.5} />
            </mesh>
            {/* Antenna stalk */}
            <mesh position={[0, 0.08, 0]} rotation={[0, 0, -0.2]}>
              <cylinderGeometry args={[0.008, 0.012, 0.12, 8]} />
              <meshStandardMaterial color={colors.antenna} metalness={0.5} roughness={0.5} />
            </mesh>
            {/* Antenna LED tip */}
            <mesh position={[-0.02, 0.14, 0]}>
              <sphereGeometry args={[0.018, 16, 16]} />
              <meshStandardMaterial
                color={colors.antennaLED}
                emissive={colors.antennaLED}
                emissiveIntensity={1}
              />
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
        camera={{ position: [0.8, 0.5, 0.8], fov: 45 }}
        gl={{ antialias: true }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[5, 5, 5]}
          intensity={0.8}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <pointLight position={[-3, 2, -3]} intensity={0.3} color="#00ffd5" />
        <pointLight position={[3, 2, 3]} intensity={0.2} color="#ffaa00" />

        {/* Environment for reflections */}
        <Environment preset="night" />

        {/* The Robot */}
        <Float speed={1} rotationIntensity={0.1} floatIntensity={0.1}>
          <ReachyModel expression={expression} animate />
        </Float>

        {/* Floor */}
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -0.04, 0]}
          receiveShadow
        >
          <circleGeometry args={[1, 64]} />
          <meshStandardMaterial
            color="#0a0a0c"
            metalness={0.8}
            roughness={0.3}
            transparent
            opacity={0.8}
          />
        </mesh>

        {/* Ground glow ring */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, 0]}>
          <ringGeometry args={[0.35, 0.4, 64]} />
          <meshBasicMaterial color="#00ffd5" transparent opacity={0.15} />
        </mesh>

        {/* Controls */}
        {interactive && (
          <OrbitControls
            enableZoom={showControls}
            enablePan={false}
            minDistance={0.8}
            maxDistance={2.5}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={Math.PI / 2}
            autoRotate
            autoRotateSpeed={0.5}
          />
        )}
      </Canvas>
    </div>
  );
}

export default ReachyVisualizer;
