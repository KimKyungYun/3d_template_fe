import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { NO_RAYCAST } from '@/hooks/useInstances';
import type { Vec3 } from '@/plants/model/types';
import { UNIT_SPHERE } from './geometry';
import type { MeshStandardMaterial } from 'three';

/** blink: 경고 깜빡임 · steady: 켜짐 · off: 꺼짐 */
export type LedMode = 'blink' | 'off' | 'steady';

interface LedProps {
  position: Vec3;
  color: string;
  mode: LedMode;
  radius?: number;
}

/** 작은 표시등 — 깜빡일 때만 프레임을 깨운다 (frameloop="demand") */
export function Led({ position, color, mode, radius = 0.005 }: LedProps) {
  const material = useRef<MeshStandardMaterial>(null);
  const invalidate = useThree((s) => s.invalidate);

  useFrame(({ clock }) => {
    if (mode !== 'blink' || !material.current) return;

    material.current.emissiveIntensity = 0.2 + 1.4 * (0.5 + 0.5 * Math.sin(clock.elapsedTime * 6));
    invalidate();
  });

  const lit = mode !== 'off';

  return (
    <mesh
      position={position}
      scale={radius}
      geometry={UNIT_SPHERE()}
      raycast={NO_RAYCAST}
    >
      <meshStandardMaterial
        ref={material}
        color={lit ? color : '#3f4448'}
        emissive={lit ? color : '#000000'}
        emissiveIntensity={mode === 'steady' ? 0.7 : mode === 'blink' ? 1 : 0}
        roughness={0.35}
      />
    </mesh>
  );
}
