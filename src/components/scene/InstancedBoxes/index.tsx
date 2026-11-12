import { type ReactNode, useRef } from 'react';
import { BoxGeometry, type InstancedMesh, type Matrix4 } from 'three';
import { NO_RAYCAST, useInstances } from '@/hooks/useInstances';

// 단위 상자 하나를 늘여 쓰는 인스턴스 메시들이 같은 지오메트리를 나눠 쓴다
const BOX = new BoxGeometry(1, 1, 1);

interface InstancedBoxesProps {
  matrices: Matrix4[];
  /** 재질 (meshStandardMaterial 등) */
  children: ReactNode;
  positionY?: number;
  visible?: boolean;
  castShadow?: boolean;
  receiveShadow?: boolean;
}

/** 단위 상자 인스턴스 묶음 — 클릭 대상이 아닌 구조물·시설물용 */
export default function InstancedBoxes({
  matrices,
  children,
  positionY = 0,
  visible = true,
  castShadow = false,
  receiveShadow = false,
}: InstancedBoxesProps) {
  const ref = useRef<InstancedMesh>(null);
  useInstances(ref, matrices);
  if (matrices.length === 0) return null;
  return (
    <instancedMesh
      ref={ref}
      args={[BOX, undefined, matrices.length]}
      position-y={positionY}
      visible={visible}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
      raycast={NO_RAYCAST}
    >
      {children}
    </instancedMesh>
  );
}
