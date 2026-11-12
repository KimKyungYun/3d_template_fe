import { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Vec3 } from '@/plants/model/types';
import { useSceneApi } from '../SceneContext';
import type { ReactNode } from 'react';

/** 다시 숨길 때는 조금 더 멀어져야 한다 — 경계에서 깜빡이지 않게 */
const HYSTERESIS = 1.25;

interface NearOnlyProps {
  /** 설비 열쇠 — 상세로 그리는 동안 스토어 detailed 에 올라 단순 상자를 숨긴다 */
  detailKey: string;
  /** 거리를 잴 월드 좌표 */
  position: Vec3;
  /** 이 거리(m) 안으로 카메라가 들어오면 상세 모델을 그린다 */
  distance: number;
  /** 거리와 상관없이 그린다 (현장 시점 대상) */
  force?: boolean;
  children: ReactNode;
}

/** 카메라가 가까울 때만 상세 모델을 붙인다 — 수십 대 설비를 늘 그리지 않게 */
export function NearOnly({ detailKey, position, distance, force = false, children }: NearOnlyProps) {
  const api = useSceneApi();
  const [near, setNear] = useState(false);
  const nearRef = useRef(false);
  const [x, y, z] = position;

  useFrame(({ camera }) => {
    const d = camera.position.distanceTo({ x, y, z } as never);
    const next = nearRef.current ? d < distance * HYSTERESIS : d < distance;

    if (next !== nearRef.current) {
      nearRef.current = next;
      setNear(next);
    }
  });

  const shown = near || force;

  useEffect(() => {
    api.getState().setDetailed(detailKey, shown);

    return () => api.getState().setDetailed(detailKey, false);
  }, [api, detailKey, shown]);

  return shown ? children : null;
}
