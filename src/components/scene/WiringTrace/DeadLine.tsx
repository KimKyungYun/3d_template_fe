import { Line } from '@react-three/drei';
import type { Vec3 } from '@/plants/model/types';

/** FlowLine(10·11) 위에 그린다 — 살아 있는 선 띠가 꺼진 가닥을 덮지 않도록 */
const RENDER_ORDER = 12;
/** 끊긴 지점 표시 반지름 (m) — 테두리 원이 이보다 조금 크다 */
const BREAK_RADIUS = 0.8;
const BREAK_CASING = 1.15;
/** 흐르는 선(FlowLine)과 같은 마디·간격 — 같은 선이 멈춰 꺼진 것처럼 보이게 */
const DASH = 2.4;
const GAP = 2;

interface DeadLineProps {
  /** 끊긴 지점부터 인버터까지 — 첫 점에 끊긴 표시를 둔다 */
  points: Vec3[];
  color: string;
  /** 바탕과 반대 밝기의 테두리 색 */
  casing: string;
  /** 끊긴 지점 색 */
  breakColor: string;
}

/** 꺼진 가닥 — 흐르는 선과 같은 점선이 색과 빛을 잃고 멈춘 모습(테두리 두름)과 끊긴 지점 표시 */
export default function DeadLine({ points, color, casing, breakColor }: DeadLineProps) {
  return (
    <>
      <Line
        points={points}
        color={casing}
        lineWidth={8}
        transparent
        opacity={0.85}
        depthTest={false}
        depthWrite={false}
        toneMapped={false}
        renderOrder={RENDER_ORDER}
      />
      <Line
        points={points}
        color={color}
        lineWidth={4}
        dashed
        dashSize={DASH}
        gapSize={GAP}
        depthTest={false}
        depthWrite={false}
        toneMapped={false}
        renderOrder={RENDER_ORDER + 1}
      />
      <group position={points[0]}>
        <mesh renderOrder={RENDER_ORDER + 2}>
          <sphereGeometry args={[BREAK_CASING, 16, 12]} />
          <meshBasicMaterial color={casing} depthTest={false} depthWrite={false} toneMapped={false} />
        </mesh>
        <mesh renderOrder={RENDER_ORDER + 3}>
          <sphereGeometry args={[BREAK_RADIUS, 16, 12]} />
          <meshBasicMaterial color={breakColor} depthTest={false} depthWrite={false} toneMapped={false} />
        </mesh>
      </group>
    </>
  );
}
