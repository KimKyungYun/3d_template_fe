import { type RefObject, useLayoutEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { Color, type InstancedMesh, type Matrix4 } from 'three';

/** 인스턴스 행렬(과 선택적으로 색)을 메시에 써 넣는다 */
export function useInstances(ref: RefObject<InstancedMesh | null>, matrices: Matrix4[], colors?: string[]) {
  const invalidate = useThree((s) => s.invalidate);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    matrices.forEach((m, i) => mesh.setMatrixAt(i, m));
    mesh.instanceMatrix.needsUpdate = true;
    if (colors) {
      const c = new Color();
      colors.forEach((hex, i) => mesh.setColorAt(i, c.set(hex)));
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }
    mesh.computeBoundingSphere();
    invalidate();
  }, [ref, matrices, colors, invalidate]);
}

export const NO_RAYCAST = () => null;

/**
 * 모듈·인버터 클릭 판에 붙이는 표시. 화면 폭 기준으로 굵게 잡히는 트레이 선이
 * 같은 자리의 모듈·인버터 클릭을 가로채지 않도록, 트레이는 이 표시가 함께 맞으면 양보한다
 */
export const PRIORITY_PICK = { priorityPick: true } as const;

export const hasPriorityPick = (intersections: { object: { userData: Record<string, unknown> } }[]) =>
  intersections.some((i) => i.object.userData.priorityPick === true);
