"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface SignalPulsesProps {
  lines: Float32Array;
  count?: number;
  color?: string;
  speed?: number;
  size?: number;
}

export default function SignalPulses({
  lines,
  count = 12,
  color = "#22e5e5",
  speed = 0.5,
  size = 0.018,
}: SignalPulsesProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const segments = useMemo(() => {
    const segs: [THREE.Vector3, THREE.Vector3][] = [];
    for (let i = 0; i + 5 < lines.length; i += 6) {
      segs.push([
        new THREE.Vector3(lines[i], lines[i + 1], lines[i + 2]),
        new THREE.Vector3(lines[i + 3], lines[i + 4], lines[i + 5]),
      ]);
    }
    return segs;
  }, [lines]);

  const assignments = useMemo(() => {
    if (segments.length === 0) return [];
    return Array.from({ length: count }, () => ({
      segIndex: Math.floor(Math.random() * segments.length),
      offset: Math.random(),
      laneSpeed: speed * (0.7 + Math.random() * 0.6),
    }));
  }, [segments.length, count, speed]);

  useFrame(({ clock }) => {
    if (!meshRef.current || segments.length === 0) return;
    const t = clock.getElapsedTime();

    assignments.forEach((a, i) => {
      const [start, end] = segments[a.segIndex];
      const raw = (t * a.laneSpeed + a.offset) % 1;
      const tt = raw < 0.5 ? raw * 2 : 2 - raw * 2;
      dummy.position.lerpVectors(start, end, tt);
      const s = size * (0.6 + Math.sin(t * 4 + i) * 0.4 + 0.6);
      dummy.scale.setScalar(s);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  if (segments.length === 0) return null;

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} frustumCulled={false}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial color={color} transparent opacity={0.9} toneMapped={false} />
    </instancedMesh>
  );
}