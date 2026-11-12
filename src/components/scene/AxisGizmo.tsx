import { GizmoHelper, GizmoViewport } from '@react-three/drei';
import { useThree } from '@react-three/fiber';

const AXIS_COLORS: [string, string, string] = ['#e5484d', '#30a46c', '#3e63dd'];

/** 화면 구석의 XYZ 축 표시 — 축을 누르면 그 방향에서 바라보도록 시점이 돈다 */
export default function AxisGizmo() {
  // 휴대폰은 3D 칸이 좁아 축 표시가 발전소를 가린다 — 빼고, 그 밖에는 왼쪽 아래 빈자리에 둔다
  const narrow = useThree((s) => s.size.width < 600);

  if (narrow) return null;

  return (
    <GizmoHelper alignment="bottom-left" margin={[76, 76]}>
      <GizmoViewport axisColors={AXIS_COLORS} labelColor="#ffffff" axisHeadScale={0.9} />
    </GizmoHelper>
  );
}
