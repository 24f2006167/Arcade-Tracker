"use client";

/**
 * HeroScene — React Three Fiber 3D hero canvas.
 *
 * Contains:
 *   - Glowing torus-knot (auto-rotating, emissive teal/violet)
 *   - Particle field (1 500 pts, sphere distribution)
 *   - Mouse-parallax camera tilt via useFrame lerp
 *   - Bloom post-processing (auto-disabled below 55 fps via PerformanceMonitor)
 *   - AdaptiveDpr to cap pixel ratio on mobile
 *
 * Lazy-loaded (ssr:false) from page.tsx — never runs on the server.
 */

import { useRef, useMemo, useState, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Points, PointMaterial, AdaptiveDpr, PerformanceMonitor } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";

// ─── Detect mobile once ───────────────────────────────────────────────────────
const isMobile =
  typeof window !== "undefined" &&
  window.matchMedia("(max-width: 768px)").matches;

// ─── Particle field ───────────────────────────────────────────────────────────
const PARTICLE_COUNT = isMobile ? 800 : 1_500;

function ParticleField() {
  const ref = useRef<THREE.Points>(null!);

  // Distribute points on a sphere surface
  const positions = useMemo(() => {
    const arr = new Float32Array(PARTICLE_COUNT * 3);
    const spherical = new THREE.Spherical();
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      spherical.set(
        2.4 + Math.random() * 1.6,           // radius 2.4–4.0
        Math.acos(2 * Math.random() - 1),    // phi
        Math.random() * Math.PI * 2           // theta
      );
      const v = new THREE.Vector3().setFromSpherical(spherical);
      arr[i * 3]     = v.x;
      arr[i * 3 + 1] = v.y;
      arr[i * 3 + 2] = v.z;
    }
    return arr;
  }, []);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.y = clock.getElapsedTime() * 0.04;
    ref.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.02) * 0.08;
  });

  return (
    <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#b389ff"
        size={0.022}
        sizeAttenuation
        depthWrite={false}
        opacity={0.65}
      />
    </Points>
  );
}

// ─── Central torus knot ───────────────────────────────────────────────────────
function TorusKnot({ mouseRef }: { mouseRef: React.MutableRefObject<{ x: number; y: number }> }) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const lerpedMouse = useRef({ x: 0, y: 0 });

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();

    // Auto-rotation
    meshRef.current.rotation.x = t * 0.18;
    meshRef.current.rotation.y = t * 0.28;
    meshRef.current.rotation.z = t * 0.08;

    // Lerp toward mouse position for parallax tilt
    lerpedMouse.current.x += (mouseRef.current.x - lerpedMouse.current.x) * 0.04;
    lerpedMouse.current.y += (mouseRef.current.y - lerpedMouse.current.y) * 0.04;
    meshRef.current.rotation.y += lerpedMouse.current.x * 0.08;
    meshRef.current.rotation.x += lerpedMouse.current.y * 0.06;

    // Pulse the emissive intensity
    const mat = meshRef.current.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = 0.9 + Math.sin(t * 1.4) * 0.35;
  });

  return (
    <mesh ref={meshRef}>
      <torusKnotGeometry args={[0.9, 0.32, 200, 24, 2, 3]} />
      <meshStandardMaterial
        color="#22e5e5"
        emissive="#b389ff"
        emissiveIntensity={1.1}
        metalness={0.6}
        roughness={0.2}
        toneMapped={false}
      />
    </mesh>
  );
}

// ─── Ambient rings ────────────────────────────────────────────────────────────
function AmbientRings() {
  const r1 = useRef<THREE.Mesh>(null!);
  const r2 = useRef<THREE.Mesh>(null!);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (r1.current) {
      r1.current.rotation.x = t * 0.12;
      r1.current.rotation.z = t * 0.07;
    }
    if (r2.current) {
      r2.current.rotation.y = -t * 0.09;
      r2.current.rotation.z = t * 0.05;
    }
  });

  return (
    <>
      <mesh ref={r1}>
        <torusGeometry args={[1.55, 0.01, 8, 120]} />
        <meshBasicMaterial color="#22e5e5" transparent opacity={0.25} toneMapped={false} />
      </mesh>
      <mesh ref={r2}>
        <torusGeometry args={[2.0, 0.008, 8, 120]} />
        <meshBasicMaterial color="#ff6fb3" transparent opacity={0.18} toneMapped={false} />
      </mesh>
    </>
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
      <ambientLight intensity={0.15} />
      <pointLight position={[4, 4, 4]} intensity={3} color="#22e5e5" />
      <pointLight position={[-4, -3, -2]} intensity={2} color="#b389ff" />
      <pointLight position={[0, -4, 2]} intensity={1.5} color="#ff6fb3" />

      {/* 3D objects */}
      <TorusKnot mouseRef={mouseRef} />
      <AmbientRings />
      <ParticleField />

      {/* Post-processing */}
      {bloomEnabled && (
        <EffectComposer>
          <Bloom
            luminanceThreshold={0.18}
            luminanceSmoothing={0.4}
            intensity={1.8}
            mipmapBlur
          />
          <Vignette eskil={false} offset={0.25} darkness={0.6} />
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
      camera={{ position: [0, 0, 5.5], fov: 52 }}
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
