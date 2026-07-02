"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface HackerFigureProps {
  position?: [number, number, number];
}

export function HackerFigure({ position = [3.5, 0, 0] }: HackerFigureProps) {
  const groupRef = useRef<THREE.Group>(null!);
  const pointsRef = useRef<THREE.Points>(null!);

  // Simple humanoid silhouette built from stacked particle rings
  const particles = useMemo(() => {
    const pts = [];
    const bodyCurve = (t: number) => {
      // t: 0 (feet) -> 1 (head)
      if (t < 0.5) return 0.25 + t * 0.3;      // legs -> hips widen
      if (t < 0.75) return 0.4 - (t - 0.5) * 0.6; // torso taper
      if (t < 0.85) return 0.25;                 // shoulders/neck
      return 0.18 - (t - 0.85) * 0.3;             // head taper
    };

    for (let i = 0; i < 4000; i++) {
      const t = Math.random();
      const radius = Math.max(bodyCurve(t), 0.05) * (0.6 + Math.random() * 0.4);
      const angle = Math.random() * Math.PI * 2;
      const y = (t - 0.5) * 4;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      pts.push(x, y, z);
    }
    return new Float32Array(pts);
  }, []);

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.4;
    }
    if (pointsRef.current && pointsRef.current.material) {
      const material = pointsRef.current.material as THREE.ShaderMaterial;
      if (material.uniforms && material.uniforms.uTime) {
        material.uniforms.uTime.value = state.clock.elapsedTime;
      }
    }
  });

  return (
    <group ref={groupRef} position={position}>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[particles, 3]}
          />
        </bufferGeometry>
        <shaderMaterial
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          uniforms={{ uTime: { value: 0 } }}
          vertexShader={`
            uniform float uTime;
            varying float vFlicker;
            void main() {
              vFlicker = sin(position.y * 6.0 + uTime * 3.0) * 0.5 + 0.5;
              vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
              gl_PointSize = 2.5 * (300.0 / -mvPosition.z);
              gl_Position = projectionMatrix * mvPosition;
            }
          `}
          fragmentShader={`
            varying float vFlicker;
            void main() {
              vec2 c = gl_PointCoord - 0.5;
              float d = length(c);
              if (d > 0.5) discard;
              vec3 col = mix(vec3(0.0, 1.0, 0.9), vec3(1.0, 0.15, 0.85), vFlicker);
              gl_FragColor = vec4(col, 1.0 - d * 1.5);
            }
          `}
        />
      </points>
    </group>
  );
}
