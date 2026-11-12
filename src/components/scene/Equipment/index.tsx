import { PRIORITY_PICK } from '@/hooks/useInstances';
import { useResolvedTheme } from '@/hooks/useResolvedTheme';
import { ACCENT_COLORS } from '@/configs/status';
import { inverterColor, SCENE_COLORS } from '@/plants/builders/colors';
import { unitIndexOf } from '@/plants/model/types';
import type { EquipmentItem, HoverTarget, Selection } from '@/plants/model/types';
import { usePlantModel, useScene, useSceneApi } from '../SceneContext';
import { isSameTarget } from '../store';
import type { ThreeEvent } from '@react-three/fiber';

/** 인버터 상자를 감싸는 보이지 않는 클릭 상자 — 폭 0.95m 상자보다 넉넉하게 */
const INVERTER_PICK: [number, number, number] = [1.25, 2, 1.6];

interface EquipmentProps {
  unitId: string;
  interactive: boolean;
}

const targetOf = (unitId: string, item: EquipmentItem): Selection & HoverTarget =>
  item.kind === 'inverter' && item.inverterNo
    ? { kind: 'inverter', unitId, no: item.inverterNo }
    : { kind: 'equipment', unitId, id: item.id };

/** 전기실·인버터 함·한전 설비 상자 */
export default function Equipment({ unitId, interactive }: EquipmentProps) {
  const model = usePlantModel();
  const api = useSceneApi();
  const theme = useResolvedTheme();
  const visible = useScene((s) => s.layers.equipment);
  const colorMode = useScene((s) => s.colorMode);
  const selection = useScene((s) => s.selection);
  const hover = useScene((s) => s.hover.target);
  // 상세 모델로 그리는 동안은 단순 상자를 숨긴다 (설비 랙·RTU 함)
  const detailed = useScene((s) => s.detailed);
  const { equipment } = model.units[unitId];
  const colors = SCENE_COLORS[theme];
  const accent = ACCENT_COLORS[theme];
  const total = model.spec.units.find((u) => u.id === unitId)?.inverters.length ?? 0;
  const unitIndex = unitIndexOf(model, unitId);

  const colorOf = (item: EquipmentItem) => {
    if (item.kind === 'room') return colors.room;
    if (item.kind === 'rtu') return colors.rtu;
    if (item.kind === 'kepco') return colors.kepco;
    if (colorMode === 'inverter' && item.inverterNo) {
      return inverterColor(unitIndex, item.inverterNo, total, theme);
    }

    return colors.inverter;
  };

  if (!visible) return null;

  return (
    <group>
      {equipment.map((item) => {
        if (item.kind === 'inverter' && detailed.includes(`${unitId}:${item.inverterNo}`)) return null;
        if (item.kind === 'rtu' && detailed.includes(`${unitId}:rtu`)) return null;

        const target = targetOf(unitId, item);
        const active = isSameTarget(selection, target);
        const hovered = !active && isSameTarget(hover, target);
        const handlers = interactive
          ? {
            onClick: (e: ThreeEvent<MouseEvent>) => {
              e.stopPropagation();
              api.getState().select(target);
            },
            onPointerMove: (e: ThreeEvent<PointerEvent>) => {
              e.stopPropagation();
              document.body.style.cursor = 'pointer';
              api.getState().setHover(target, [e.point.x, e.point.y, e.point.z]);
            },
            onPointerOut: () => {
              document.body.style.cursor = '';
              api.getState().clearHover();
            },
          }
          : {};
        const isInverter = item.kind === 'inverter';

        return (
          <group key={item.id} position={item.position} rotation-y={item.rotationY}>
            <mesh
              position-y={isInverter ? 0 : item.size[1] / 2}
              castShadow
              receiveShadow
              {...(isInverter ? {} : handlers)}
            >
              <boxGeometry args={item.size} />
              <meshStandardMaterial
                color={colorOf(item)}
                emissive={active || hovered ? accent : '#000000'}
                emissiveIntensity={active ? 0.7 : hovered ? 0.3 : 0}
                roughness={0.6}
                metalness={0.1}
              />
            </mesh>
            {isInverter && (
              <>
                <mesh position-y={-0.6}>
                  <boxGeometry args={[0.08, 0.42, 0.08]} />
                  <meshStandardMaterial color={colors.steel} />
                </mesh>
                <mesh position-y={0.1} userData={PRIORITY_PICK} {...handlers}>
                  <boxGeometry args={INVERTER_PICK} />
                  <meshBasicMaterial visible={false} />
                </mesh>
              </>
            )}
          </group>
        );
      })}
    </group>
  );
}
