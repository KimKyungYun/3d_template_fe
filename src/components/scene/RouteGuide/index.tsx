import { useEffect, useMemo, useState } from 'react';
import { Html } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useResolvedTheme } from '@/hooks/useResolvedTheme';
import { ACCENT_COLORS } from '@/configs/status';
import { fieldRouteOf } from '@/plants/builders/fieldGuide';
import { usePlantModel, useScene } from '../SceneContext';
import FlowLine from '../WiringTrace/FlowLine';
import styles from './RouteGuide.module.scss';

interface RouteGuideProps {
  unitId: string;
}

/** 찾아가는 길 — 전기실에서 고장 인버터를 거쳐 가장 먼 모듈 쪽까지 바닥에 흐르는 길과 거리 표시 */
export default function RouteGuide({ unitId }: RouteGuideProps) {
  const model = usePlantModel();
  const route = useScene((s) => s.route);
  const theme = useResolvedTheme();
  const invalidate = useThree((s) => s.invalidate);
  const [flowing] = useState(() => !window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const path = useMemo(
    () => (route && route.unitId === unitId ? fieldRouteOf(model, unitId, route.no) : null),
    [model, route, unitId],
  );

  useEffect(() => invalidate(), [path, invalidate]);

  if (!path) return null;

  const start = path.points[0];
  const end = path.points[path.points.length - 1];

  return (
    <group>
      <FlowLine points={path.points} color={ACCENT_COLORS[theme]} width={5} flowing={flowing} />
      <Html position={start} center zIndexRange={[5, 0]} className={styles.pin}>
        <span className={styles.pin__label} data-kind="start">출발 · 전기실</span>
      </Html>
      <Html position={end} center zIndexRange={[5, 0]} className={styles.pin}>
        <span className={styles.pin__label} data-kind="end">도착 · 약 {Math.round(path.length)}m</span>
      </Html>
    </group>
  );
}
