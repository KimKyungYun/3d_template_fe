import { useResolvedTheme } from '@/hooks/useResolvedTheme';
import { SCENE_COLORS } from '@/plants/builders/colors';
import { EXPLODE_LIFT } from '@/plants/builders/scene';
import InstancedBoxes from '../InstancedBoxes';
import { usePlantModel, useScene } from '../SceneContext';
import type { Matrix4 } from 'three';

interface StructureFrameProps {
  unitId: string;
}

/** 가대 — 기둥·거더·퍼린·브레이스. 분해 보기에서 층마다 다른 높이로 들린다 */
export default function StructureFrame({ unitId }: StructureFrameProps) {
  const model = usePlantModel();
  const theme = useResolvedTheme();
  const explode = useScene((s) => s.explode);
  const { frame } = model.units[unitId];
  const steel = SCENE_COLORS[theme].steel;

  const members: { key: string; matrices: Matrix4[]; lift: number }[] = [
    { key: 'purlins', matrices: frame.purlins, lift: EXPLODE_LIFT.purlins },
    { key: 'girders', matrices: frame.girders, lift: EXPLODE_LIFT.girders },
    { key: 'braces', matrices: frame.braces, lift: EXPLODE_LIFT.girders / 2 },
    { key: 'posts', matrices: frame.posts, lift: EXPLODE_LIFT.posts },
  ];

  return (
    <>
      {members.map((m) => (
        <InstancedBoxes key={m.key} matrices={m.matrices} positionY={explode * m.lift} castShadow>
          <meshStandardMaterial color={steel} metalness={0.55} roughness={0.45} />
        </InstancedBoxes>
      ))}
    </>
  );
}
