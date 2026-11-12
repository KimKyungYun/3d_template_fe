import { useEffect, useMemo, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useResolvedTheme } from '@/hooks/useResolvedTheme';
import { STATUS_COLORS } from '@/configs/status';
import { STRING_WIRING_FAULT } from '@/configs/faultCodes';
import { inverterColor, SCENE_COLORS } from '@/plants/builders/colors';
import { EXPLODE_LIFT } from '@/plants/builders/scene';
import { stringSeries } from '@/plants/builders/strings';
import { unitIndexOf } from '@/plants/model/types';
import type { Vec3 } from '@/plants/model/types';
import { usePlantModel, useScene } from '../SceneContext';
import DeadLine from './DeadLine';
import FlowLine from './FlowLine';

/** 트레이 선 분해 오프셋과 같은 비율 (CableTray 와 맞춘다) */
const TRAY_LIFT = EXPLODE_LIFT.girders * 0.5;

const lifted = ([x, y, z]: Vec3, by: number): Vec3 => [x, y + by, z];

interface WiringTraceProps {
  unitId: string;
}

/**
 * 선택한 인버터의 결선 경로 — 직류(모듈 → 트레이 → 인버터)는 인버터 색, 교류(→ 전기실·한전)는 고압선 색.
 * 스트링 결선 불량(코드 8)인 스트링은 흐르는 선 옆에 꺼진 가닥으로 따로 그린다
 */
export default function WiringTrace({ unitId }: WiringTraceProps) {
  const model = usePlantModel();
  const selection = useScene((s) => s.selection);
  const explode = useScene((s) => s.explode);
  const alertsVisible = useScene((s) => s.layers.alerts);
  const alerts = useScene((s) => s.alerts.shown);
  const theme = useResolvedTheme();
  const invalidate = useThree((s) => s.invalidate);
  const [flowing] = useState(() => !window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const no = selection?.kind === 'inverter' && selection.unitId === unitId ? selection.no : null;
  // 부품 카드를 연 근접 화면에서는 경로 선이 부품을 가리므로 숨긴다
  const closeUp = useScene((s) => s.part.selected !== null);
  const route = no === null ? null : model.wiring[unitId]?.routes.get(no);
  const lift = explode * TRAY_LIFT;

  // 인버터 쪽으로 내려가는 선은 트레이 끝(첫 점)만 트레이와 함께 들린다
  const drops = useMemo(
    () => route?.drop.map(([head, ...rest]): Vec3[] => [lifted(head, lift), ...rest]) ?? [],
    [route, lift],
  );

  // 스캔에 잡힌 결선 불량 스트링 — 끊긴 지점은 모듈과, 트레이 구간은 트레이와 함께 들린다
  const deadLanes = useMemo(() => {
    if (no === null || !alertsVisible) return [];

    const wiring = alerts.find(
      (a) => a.unitId === unitId && a.no === no && a.faultCode === STRING_WIRING_FAULT,
    );

    if (!wiring) return [];

    const strings = wiring.strings ?? stringSeries(model, unitId, no).map((_, i) => i + 1);

    return strings.flatMap((stringNo, slot) => {
      const lane = model.wiring[unitId]?.lane(no, stringNo, slot);

      if (!lane) return [];

      const [breakPoint, ...cable] = lane.cable;
      const [, ...drop] = lane.drop;
      const points: Vec3[] = [
        lifted(breakPoint, explode * EXPLODE_LIFT.modules),
        ...cable.map((p) => lifted(p, lift)),
        ...drop,
      ];

      return [{ stringNo, points }];
    });
  }, [model, alerts, alertsVisible, unitId, no, explode, lift]);

  useEffect(() => invalidate(), [route, invalidate]);

  useFrame(() => {
    // frameloop="demand" 라 경로가 보이는 동안 다음 프레임을 계속 요청한다
    if (route && flowing) invalidate();
  });

  if (!route || no === null || closeUp) return null;

  const total = model.spec.units.find((u) => u.id === unitId)?.inverters.length ?? 0;
  const dcColor = inverterColor(unitIndexOf(model, unitId), no, total, theme);
  const acColor = SCENE_COLORS[theme].hv;

  return (
    <>
      <group position-y={lift}>
        {route.dc.map((points, i) => (
          <FlowLine key={i} points={points} color={dcColor} width={9} flowing={flowing} />
        ))}
      </group>
      {drops.map((points, i) => (
        <FlowLine key={i} points={points} color={dcColor} width={9} flowing={flowing} />
      ))}
      <FlowLine points={route.ac} color={acColor} width={6} flowing={flowing} />
      {deadLanes.map((lane) => (
        <DeadLine
          key={lane.stringNo}
          points={lane.points}
          color={SCENE_COLORS[theme].deadWire}
          casing={SCENE_COLORS[theme].deadWireCasing}
          breakColor={STATUS_COLORS[theme].fault}
        />
      ))}
    </>
  );
}
