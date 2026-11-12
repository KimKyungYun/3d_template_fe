import { useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useResolvedTheme } from '@/hooks/useResolvedTheme';
import { STATUS_COLORS } from '@/configs/status';
import { scanPositionAt } from '@/plants/builders/alerts';
import { useAlertShader, usePlantModel, useScene } from '../SceneContext';

/** 선 색 — 어두운 하늘에서는 옅은 하늘색, 밝은 바탕에서는 진한 파랑 */
const SCAN_COLOR = { light: '#1f7ae0', dark: '#6fd3ff' } as const;

/** 이상 점등·스캔 선 유니폼을 매 프레임 맞추고, 움직이는 동안 다음 프레임을 요청한다 (frameloop="demand") */
export default function AlertDriver() {
  const model = usePlantModel();
  const shader = useAlertShader();
  const theme = useResolvedTheme();
  const visible = useScene((s) => s.layers.alerts);
  const count = useScene((s) => s.alerts.shown.length);
  const scanStartedAt = useScene((s) => s.alerts.scanStartedAt);
  const scanDuration = useScene((s) => s.alerts.scanDuration);
  const invalidate = useThree((s) => s.invalidate);
  const [blink] = useState(() => !window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  useEffect(() => {
    const colors = STATUS_COLORS[theme];

    shader.setColors({
      fault: colors.fault,
      caution: colors.degraded,
      offline: colors.commLost,
      scan: SCAN_COLOR[theme],
    });
    shader.setFlags(visible, blink);
    invalidate();
  }, [shader, theme, visible, blink, invalidate]);

  // 스캔이 시작되면 멈춰 있던 렌더 루프를 깨운다
  useEffect(() => invalidate(), [scanStartedAt, invalidate]);

  useFrame(({ clock }) => {
    shader.setTime(clock.elapsedTime);

    const position = scanPositionAt(model.scanRange, scanStartedAt, performance.now(), scanDuration);
    // 동작 줄이기에서는 선을 그리지 않는다 (목록 반영은 그대로)
    const scanning = visible && blink && position !== null;

    shader.setScan(scanning, position ?? 0);

    if (scanning || (visible && blink && count > 0)) invalidate();
  });

  return null;
}
