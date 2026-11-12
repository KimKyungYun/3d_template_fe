import { Line } from '@react-three/drei';
import { hasPriorityPick } from '@/hooks/useInstances';
import { useResolvedTheme } from '@/hooks/useResolvedTheme';
import { SCENE_COLORS } from '@/plants/builders/colors';
import { EXPLODE_LIFT } from '@/plants/builders/scene';
import { usePlantModel, useScene, useSceneApi } from '../SceneContext';
import type { ThreeEvent } from '@react-three/fiber';

interface CableTrayProps {
  unitId: string;
  interactive: boolean;
}

/** 케이블 트레이·덕트 선 — 지중 구간은 점선 */
export default function CableTray({ unitId, interactive }: CableTrayProps) {
  const model = usePlantModel();
  const api = useSceneApi();
  const theme = useResolvedTheme();
  const visible = useScene((s) => s.layers.trays);
  const explode = useScene((s) => s.explode);
  const selection = useScene((s) => s.selection);
  const { trays } = model.units[unitId];
  const colors = SCENE_COLORS[theme];
  // 이 호기 인버터의 결선 경로를 그리는 동안에는 트레이를 옅게 깔아 경로가 도드라지게 한다
  const tracing = selection?.kind === 'inverter' && selection.unitId === unitId;

  if (!visible) return null;

  return (
    <group position-y={explode * EXPLODE_LIFT.girders * 0.5}>
      {trays.map((tray) => {
        const active = selection?.kind === 'tray' && selection.unitId === unitId && selection.id === tray.id;
        const handleClick = (e: ThreeEvent<MouseEvent>) => {
          if (hasPriorityPick(e.intersections)) return;

          e.stopPropagation();
          api.getState().select({ kind: 'tray', unitId, id: tray.id });
        };

        return (
          <Line
            key={tray.id}
            points={tray.points}
            color={tray.underground ? colors.hv : colors.tray}
            lineWidth={active ? 7 : 3.5}
            transparent={tracing}
            opacity={tracing ? 0.3 : 1}
            dashed={tray.underground}
            dashSize={3}
            gapSize={2}
            onClick={interactive ? handleClick : undefined}
          />
        );
      })}
    </group>
  );
}
