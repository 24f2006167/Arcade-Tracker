"use client";

/**
 * HeroScene — React Three Fiber 3D hero canvas.
 *
 * Contains:
 *   - Realistic Earth (textured, day/night lights, normal maps, cloud layer, atmospheric glow)
 *   - Hacker Figure (procedural rotating particle humanoid beside the globe)
 *   - Particle field (1 500 pts, sphere distribution)
 *   - Mouse-parallax camera tilt / object tilt
 *   - Bloom post-processing (auto-disabled below 55 fps via PerformanceMonitor)
 *   - AdaptiveDpr to cap pixel ratio on mobile
 *
 * Lazy-loaded (ssr:false) from page.tsx — never runs on the server.
 */

import { useRef, useMemo, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Points, PointMaterial, AdaptiveDpr, PerformanceMonitor } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import { RealisticEarth } from "./RealisticEarth";
import { HackerFigure } from "./HackerFigure";

// ─── Detect mobile once ───────────────────────────────────────────────────────
const isMobile =
  typeof window !== "undefined" &&
  window.matchMedia("(max-width: 768px)").matches;

// ─── Particle field ───────────────────────────────────────────────────────────
const PARTICLE_COUNT = isMobile ? 800 : 2_500;

function ParticleField() {
  const ref = useRef<THREE.Points>(null!);

  // Distribute points on a sphere surface
  const positions = useMemo(() => {
    const arr = new Float32Array(PARTICLE_COUNT * 3);
    const spherical = new THREE.Spherical();
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      spherical.set(
        2.4 + Math.random() * 3.1,           // radius 2.4–5.5
        Math.acos(2 * Math.random() - 1),    // phi
        Math.random() * Math.PI * 2           // theta
      );
      const v = new THREE.Vector3().setFromSpherical(spherical);
      arr[i * 3] = v.x;
      arr[i * 3 + 1] = v.y;
      arr[i * 3 + 2] = v.z;
    }
    return arr;
  }, []);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.y = clock.getElapsedTime() * 0.03;
    ref.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.02) * 0.06;
  });

  return (
    <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#b389ff"
        size={0.02}
        sizeAttenuation
        depthWrite={false}
        opacity={0.6}
      />
    </Points>
  );
}

// ─── Interactive Scene Group ──────────────────────────────────────────────────
function SceneObjects({ mouseRef }: { mouseRef: React.MutableRefObject<{ x: number; y: number }> }) {
  const groupRef = useRef<THREE.Group>(null!);
  const lerpedMouse = useRef({ x: 0, y: 0 });

  useFrame(() => {
    if (!groupRef.current) return;
    lerpedMouse.current.x += (mouseRef.current.x - lerpedMouse.current.x) * 0.04;
    lerpedMouse.current.y += (mouseRef.current.y - lerpedMouse.current.y) * 0.04;
    groupRef.current.rotation.y = lerpedMouse.current.x * 0.26;
    groupRef.current.rotation.x = lerpedMouse.current.y * 0.2;
  });

  // Hacker figure position is slightly adjusted depending on device to prevent screen clipping
  const hackerPosition: [number, number, number] = isMobile ? [0, -3.2, 0] : [3.0, 0, 0];

  return (
    <group ref={groupRef}>
      <RealisticEarth />
      <HackerFigure position={hackerPosition} />
    </group>
  );
}

// ─── Mouse-parallax camera rig ────────────────────────────────────────────────
function CameraRig({ mouseRef }: { mouseRef: React.MutableRefObject<{ x: number; y: number }> }) {
  const { camera } = useThree();
  const lerped = useRef({ x: 0, y: 0 });

  useFrame(() => {
    lerped.current.x += (mouseRef.current.x - lerped.current.x) * 0.03;
    lerped.current.y += (mouseRef.current.y - lerped.current.y) * 0.03;
    camera.position.x = lerped.current.x * 0.6;
    camera.position.y = lerped.current.y * 0.4;
    camera.lookAt(0, 0, 0);
  });

  return null;
}

// ─── Scene ────────────────────────────────────────────────────────────────────
function Scene({ mouseRef }: { mouseRef: React.MutableRefObject<{ x: number; y: number }> }) {
  const [bloomEnabled, setBloomEnabled] = useState(true);

  return (
    <>
      <PerformanceMonitor
        onDecline={() => setBloomEnabled(false)}
        onIncline={() => setBloomEnabled(true)}
        flipflops={3}
      />
      <AdaptiveDpr pixelated />
      <CameraRig mouseRef={mouseRef} />

      {/* Lighting */}
      <ambientLight intensity={0.25} />
      <pointLight position={[5, 5, 5]} intensity={4} color="#22e5e5" />
      <pointLight position={[-5, -4, -3]} intensity={3} color="#b389ff" />
      <pointLight position={[0, -5, 3]} intensity={2} color="#ff6fb3" />

      {/* 3D objects with mouse-parallax container */}
      <SceneObjects mouseRef={mouseRef} />
      <ParticleField />

      {/* Post-processing */}
      {bloomEnabled && (
        <EffectComposer>
          <Bloom
            luminanceThreshold={0.12}
            luminanceSmoothing={0.45}
            intensity={2.0}
            mipmapBlur
          />
          <Vignette eskil={false} offset={0.25} darkness={0.65} />
        </EffectComposer>
      )}
    </>
  );
}

// ─── Exported canvas wrapper ──────────────────────────────────────────────────
export default function HeroScene({
  mouseRef,
}: {
  mouseRef: React.MutableRefObject<{ x: number; y: number }>;
}) {
  return (
    <Canvas
      camera={{ position: [0, 0, 5.8], fov: 52 }}
      dpr={[1, isMobile ? 1 : 1.5]}
      gl={{
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.2,
      }}
      style={{ background: "transparent" }}
    >
      <Scene mouseRef={mouseRef} />
    </Canvas>
  );
}