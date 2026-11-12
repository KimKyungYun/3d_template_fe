import { useRef } from 'react';
import { Line } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import type { Vec3 } from '@/plants/model/types';
import type { Line2 } from 'three-stdlib';

/** 점선 마디·간격(m)과 흐르는 속도(m/s) */
const DASH = 2.4;
const GAP = 2;
const SPEED = 9;
/** 트레이·지붕에 가려도 경로가 보이도록 깊이 검사 없이 맨 나중에 그린다 */
const RENDER_ORDER = 10;

interface FlowLineProps {
  points: Vec3[];
  color: string;
  /** 바탕 띠 두께(px) — 흐르는 점선은 이보다 가늘다 */
  width: number;
  /** false 면 점선을 멈춰 둔다 (동작 줄이기 설정) */
  flowing: boolean;
}

/** 옅은 바탕 띠 위로 점선이 점 순서 방향으로 흐르는 선 */
export default function FlowLine({ points, color, width, flowing }: FlowLineProps) {
  const dashRef = useRef<Line2>(null);

  useFrame((_, delta) => {
    // 오프셋을 줄이면 무늬가 선 거리가 늘어나는 쪽(점 순서 방향)으로 밀린다
    if (flowing && dashRef.current) dashRef.current.material.dashOffset -= delta * SPEED;
  });

  return (
    <>
      <Line
        points={points}
        color={color}
        lineWidth={width}
        transparent
        opacity={0.32}
        depthTest={false}
        depthWrite={false}
        toneMapped={false}
        renderOrder={RENDER_ORDER}
      />
      <Line
        ref={dashRef}
        points={points}
        color={color}
        lineWidth={width * 0.45}
        dashed
        dashSize={DASH}
        gapSize={GAP}
        transparent
        depthTest={false}
        depthWrite={false}
        toneMapped={false}
        renderOrder={RENDER_ORDER + 1}
      />
    </>
  );
}
