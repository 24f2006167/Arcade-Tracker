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
 *   - Signal pulses traveling along constellation lines
 *   - Rotating radar scan sweep across the globe surface
 *
 * Lazy-loaded (ssr:false) from page.tsx — never runs on the server.
 */

import { useRef, useMemo, useState, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Points, PointMaterial, AdaptiveDpr, PerformanceMonitor } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import SignalPulses from "./SignalPulses";
import ScanSweep from "./ScanSweep";

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

interface HexNodeData {
  position: [number, number, number];
  rotation: [number, number, number];
  color: string;
  speed: number;
  offset: number;
  baseScale: number;
}

function SingleHexNode({ node }: { node: HexNodeData }) {
  const meshRef = useRef<THREE.Mesh>(null!);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    const pulse = Math.sin(t * node.speed + node.offset);
    const s = node.baseScale * (1.0 + pulse * 0.22);
    meshRef.current.scale.set(s, s, s);

    if (meshRef.current.material && !Array.isArray(meshRef.current.material)) {
      meshRef.current.material.opacity = 0.4 + (pulse + 1.0) * 0.15; // opacity ranges 0.4 to 0.7
    }
  });

  return (
    <mesh ref={meshRef} position={node.position} rotation={node.rotation}>
      {/* 6-segmented circle geometry creates a perfect flat hexagon */}
      <circleGeometry args={[0.9, 6]} />
      <meshBasicMaterial
        color={node.color}
        transparent
        opacity={0.55}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}

// ─── 3D CyberGlobe (procedural transparent continents, satellites, and line constellations) ──
function CyberGlobe({ mouseRef }: { mouseRef: React.MutableRefObject<{ x: number; y: number }> }) {
  const groupRef = useRef<THREE.Group>(null!);
  const globeRef = useRef<THREE.Points>(null!);
  const ring1Ref = useRef<THREE.Mesh>(null!);
  const ring2Ref = useRef<THREE.Mesh>(null!);
  const ring3Ref = useRef<THREE.Mesh>(null!);
  const sat1Ref = useRef<THREE.Mesh>(null!);
  const sat2Ref = useRef<THREE.Mesh>(null!);
  const sat3Ref = useRef<THREE.Mesh>(null!);

  const lerpedMouse = useRef({ x: 0, y: 0 });

  // Generate Hex nodes data
  const NODE_COUNT = 48;
  const hexNodesData = useMemo(() => {
    const arr: HexNodeData[] = [];
    const colors = ["#22e5e5", "#ff6fb3", "#b389ff"];
    for (let i = 0; i < NODE_COUNT; i++) {
      const r = 1.46 + Math.random() * 0.15; // Positioned just above globe surface (radius ~1.46 - 1.61)
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      const position = new THREE.Vector3(x, y, z);
      const rotation = new THREE.Euler().setFromQuaternion(
        new THREE.Quaternion().setFromUnitVectors(
          new THREE.Vector3(0, 0, 1),
          position.clone().normalize()
        )
      );

      arr.push({
        position: [x, y, z],
        rotation: [rotation.x, rotation.y, rotation.z],
        color: colors[i % colors.length],
        speed: 1.6 + Math.random() * 1.8,
        offset: Math.random() * Math.PI * 2,
        baseScale: 0.035 + Math.random() * 0.03,
      });
    }
    return arr;
  }, []);

  // Generate floating network constellation lines (connecting floating points + hex nodes)
  const networkLines = useMemo(() => {
    const coords = [];
    const count = 48;
    const allPoints = [];

    // Add random floating points
    for (let i = 0; i < count; i++) {
      const r = 1.45 + Math.random() * 0.22;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      allPoints.push(new THREE.Vector3(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      ));
    }

    // Add hex nodes coordinates to connect them in the constellation
    hexNodesData.forEach((node) => {
      allPoints.push(new THREE.Vector3(node.position[0], node.position[1], node.position[2]));
    });

    const ptsCount = allPoints.length;
    for (let i = 0; i < ptsCount; i++) {
      for (let j = i + 1; j < ptsCount; j++) {
        const dist = allPoints[i].distanceTo(allPoints[j]);
        if (dist < 0.65) { // connect close neighbors
          coords.push(allPoints[i].x, allPoints[i].y, allPoints[i].z);
          coords.push(allPoints[j].x, allPoints[j].y, allPoints[j].z);
        }
      }
    }
    return new Float32Array(coords);
  }, [hexNodesData]);

  // Procedural Earth GLSL shader (transparent ocean point cloud)
  const globeMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
      },
      transparent: true,
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = 18.0 / -mvPosition.z; // size attenuation
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        uniform float uTime;

        float hash(vec3 p) {
          p = fract(p * 0.3183099 + .1);
          p *= 17.0;
          return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
        }

        float noise(in vec3 x) {
          vec3 i = floor(x);
          vec3 f = fract(x);
          f = f*f*(3.0-2.0*f);
          return mix(mix(mix(hash(i+vec3(0,0,0)), hash(i+vec3(1,0,0)),f.x),
                         mix(hash(i+vec3(0,1,0)), hash(i+vec3(1,1,0)),f.x),f.y),
                     mix(mix(hash(i+vec3(0,0,1)), hash(i+vec3(1,0,1)),f.x),
                         mix(hash(i+vec3(0,1,1)), hash(i+vec3(1,1,1)),f.x),f.y),f.z);
        }

        float fbm(vec3 p) {
          float v = 0.0;
          float a = 0.5;
          vec3 shift = vec3(100.0);
          for (int i = 0; i < 4; ++i) {
            v += a * noise(p);
            p = p * 2.0 + shift;
            a *= 0.5;
          }
          return v;
        }

        void main() {
          // Slow rotation rotation
          float angle = uTime * 0.02;
          mat3 rot = mat3(
            cos(angle), -sin(angle), 0.0,
            sin(angle),  cos(angle), 0.0,
            0.0,         0.0,        1.0
          );
          vec3 p = rot * vPosition;

          // Force point to render as circular dot
          vec2 cxy = 2.0 * gl_PointCoord - 1.0;
          float r = dot(cxy, cxy);
          if (r > 1.0) {
            discard;
          }

          float n = fbm(p * 1.6);
          float land = smoothstep(0.42, 0.45, n); // Fuller continents threshold

          vec3 finalColor;
          float baseAlpha;

          if (land > 0.1) {
            // Land (glowing magenta/pink)
            vec3 landColor = vec3(1.0, 0.18, 0.65);
            vec3 peakColor = vec3(1.0, 0.45, 0.85);
            finalColor = mix(landColor, peakColor, smoothstep(0.48, 0.65, n));
            baseAlpha = 0.95;
          } else {
            // Ocean (faint, dark digital blue/indigo dots for a complete spherical shape)
            finalColor = vec3(0.08, 0.35, 0.72); // glowing digital blue
            baseAlpha = 0.22; // subtle backdrop dot visibility
          }

          float alpha = (1.0 - smoothstep(0.8, 1.0, r)) * baseAlpha;
          gl_FragColor = vec4(finalColor, alpha);
        }
      `,
    });
  }, []);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();

    // Pass time uniform to shader
    globeMaterial.uniforms.uTime.value = t;

    // Slow rotation of the globe
    if (globeRef.current) {
      globeRef.current.rotation.y = t * 0.045;
    }

    // 2. Slow orbit ring rotations
    if (ring1Ref.current) {
      ring1Ref.current.rotation.z = t * 0.05;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.z = -t * 0.07;
    }
    if (ring3Ref.current) {
      ring3Ref.current.rotation.x = t * 0.04;
    }

    // 3. Satellites traveling along circular orbits
    if (sat1Ref.current) {
      // Orbiting Ring 1 (X-Z plane)
      sat1Ref.current.position.x = Math.cos(t * 0.5) * 1.95;
      sat1Ref.current.position.z = Math.sin(t * 0.5) * 1.95;
    }
    if (sat2Ref.current) {
      // Orbiting Ring 2 (Y-Z plane, slightly tilted)
      const angle = t * 0.62;
      sat2Ref.current.position.y = Math.cos(angle) * 2.15;
      sat2Ref.current.position.z = Math.sin(angle) * 2.15;
    }
    if (sat3Ref.current) {
      // Orbiting Ring 3 (X-Y diagonal plane)
      const angle = t * 0.4;
      sat3Ref.current.position.x = Math.cos(angle) * 2.35;
      sat3Ref.current.position.y = Math.sin(angle) * 2.35;
      sat3Ref.current.position.z = Math.sin(angle) * 0.8;
    }

    // 4. Parallax cursor response
    lerpedMouse.current.x += (mouseRef.current.x - lerpedMouse.current.x) * 0.04;
    lerpedMouse.current.y += (mouseRef.current.y - lerpedMouse.current.y) * 0.04;
    groupRef.current.rotation.y = lerpedMouse.current.x * 0.26;
    groupRef.current.rotation.x = lerpedMouse.current.y * 0.2;
  });

  return (
    <group ref={groupRef}>
      {/* Core Globe Points with custom procedural Earth shader */}
      <points ref={globeRef}>
        <sphereGeometry args={[1.42, 140, 140]} />
        <primitive object={globeMaterial} attach="material" />
      </points>

      {/* Atmospheric Thin Outer Halo Bounding Ring */}
      <mesh>
        <torusGeometry args={[1.43, 0.005, 8, 64]} />
        <meshBasicMaterial color="#22e5e5" transparent opacity={0.35} toneMapped={false} />
      </mesh>

      {/* Radar scan sweep across the globe surface */}
      <ScanSweep radius={1.44} color="#22e5e5" />

      {/* Pulsing HexNodes scattered just above the surface */}
      {hexNodesData.map((node, i) => (
        <SingleHexNode key={i} node={node} />
      ))}

      {/* Floating Network Constellation Line Vectors (connecting points + hex nodes) */}
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[networkLines, 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#22e5e5" transparent opacity={0.28} depthWrite={false} />
      </lineSegments>

      {/* Data packets traveling along the constellation lines */}
      <SignalPulses lines={networkLines} count={14} color="#22e5e5" />
      <SignalPulses lines={networkLines} count={8} color="#ff6fb3" speed={0.6} />

      {/* Orbit Ring 1: Cyan satin loop */}
      <mesh ref={ring1Ref} rotation={[Math.PI / 2.5, 0, 0]}>
        <torusGeometry args={[1.95, 0.008, 8, 64]} />
        <meshBasicMaterial color="#22e5e5" transparent opacity={0.35} toneMapped={false} />
      </mesh>

      {/* Orbit Ring 2: Pink loop */}
      <mesh ref={ring2Ref} rotation={[0, Math.PI / 6, Math.PI / 4]}>
        <torusGeometry args={[2.15, 0.006, 8, 64]} />
        <meshBasicMaterial color="#ff6fb3" transparent opacity={0.25} toneMapped={false} />
      </mesh>

      {/* Orbit Ring 3: Purple loop */}
      <mesh ref={ring3Ref} rotation={[Math.PI / 3, -Math.PI / 4, 0]}>
        <torusGeometry args={[2.35, 0.007, 8, 64]} />
        <meshBasicMaterial color="#b389ff" transparent opacity={0.3} toneMapped={false} />
      </mesh>

      {/* Satellite 1: Glowing Cyan Packet */}
      <mesh ref={sat1Ref}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial color="#22e5e5" emissive="#22e5e5" emissiveIntensity={3.0} toneMapped={false} />
      </mesh>

      {/* Satellite 2: Glowing Pink Packet */}
      <mesh ref={sat2Ref}>
        <sphereGeometry args={[0.048, 8, 8]} />
        <meshStandardMaterial color="#ff6fb3" emissive="#ff6fb3" emissiveIntensity={3.2} toneMapped={false} />
      </mesh>

      {/* Satellite 3: Glowing Purple Packet */}
      <mesh ref={sat3Ref}>
        <sphereGeometry args={[0.055, 8, 8]} />
        <meshStandardMaterial color="#b389ff" emissive="#b389ff" emissiveIntensity={2.8} toneMapped={false} />
      </mesh>
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
      <ambientLight intensity={0.15} />
      <pointLight position={[4, 4, 4]} intensity={3} color="#22e5e5" />
      <pointLight position={[-4, -3, -2]} intensity={2} color="#b389ff" />
      <pointLight position={[0, -4, 2]} intensity={1.5} color="#ff6fb3" />

      {/* 3D objects */}
      <CyberGlobe mouseRef={mouseRef} />
      <ParticleField />

      {/* Post-processing */}
      {bloomEnabled && (
        <EffectComposer>
          <Bloom
            luminanceThreshold={0.12}
            luminanceSmoothing={0.45}
            intensity={2.8}
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