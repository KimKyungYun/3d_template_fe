import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { PRIORITY_PICK } from '@/hooks/useInstances';
import type { Vec3 } from '@/plants/model/types';
import { useScene, useSceneApi } from '../SceneContext';
import type { ThreeEvent } from '@react-three/fiber';
import type { Group } from 'three';
import type { ReactNode } from 'react';

interface DoorProps {
  /** 문 열쇠 — 스토어의 doors 에 이 이름으로 열림 상태가 남는다 */
  id: string;
  /** 경첩 축 자리 (로컬) — 문 메시는 이 점을 원점으로 그린다 */
  hinge: Vec3;
  /** 열렸을 때 각도 (rad) — 부호로 여는 방향을 정한다 */
  openAngle: number;
  children: ReactNode;
}

/** 경첩을 축으로 열리고 닫히는 문 — 문을 누르면 여닫는다. 각도는 프레임마다 부드럽게 따라간다 */
export function Door({ id, hinge, openAngle, children }: DoorProps) {
  const api = useSceneApi();
  const open = useScene((s) => !!s.doors[id]);
  const ref = useRef<Group>(null);
  const invalidate = useThree((s) => s.invalidate);

  useFrame((_, dt) => {
    const g = ref.current;

    if (!g) return;

    const goal = open ? openAngle : 0;
    const next = g.rotation.y + (goal - g.rotation.y) * (1 - Math.exp(-dt * 7));

    g.rotation.y = Math.abs(goal - next) < 0.002 ? goal : next;
    if (g.rotation.y !== goal) invalidate();
  });

  const toggle = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    api.getState().toggleDoor(id);
    invalidate();
  };

  return (
    <group
      ref={ref}
      position={hinge}
      userData={PRIORITY_PICK}
      onClick={toggle}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        document.body.style.cursor = '';
      }}
    >
      {children}
    </group>
  );
}
