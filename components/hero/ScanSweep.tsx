"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface ScanSweepProps {
  radius?: number;
  color?: string;
  arc?: number;
  speed?: number;
}

export default function ScanSweep({
  radius = 1.44,
  color = "#22e5e5",
  arc = Math.PI / 4,
  speed = 0.6,
}: ScanSweepProps) {
  const meshRef = useRef<THREE.Mesh>(null!);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.y = clock.getElapsedTime() * speed;
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[radius, 48, 32, 0, arc, 0, Math.PI]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.12}
        side={THREE.DoubleSide}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}