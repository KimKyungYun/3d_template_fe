import { useEffect } from 'react';
import { getAlerts } from '@/service/plant';
import { SCAN_CYCLE, SCAN_DURATION, SCAN_FIRST_DELAY, SCAN_FIRST_DURATION } from '@/plants/builders/alerts';
import { usePlantModel, useSceneApi } from '../SceneContext';

/**
 * 주기 스캔 — 선이 전체 패널을 훑고 지나간 뒤 이상 설비를 다시 읽어 반영한다.
 * 이전에도 있던 이상은 스캔 중에도 그대로 보이고, 새 이상만 스캔이 끝난 뒤 붙는다.
 * 캔버스 안에 두어 렌더러가 준비된 뒤부터 시간을 잰다
 */
export default function AlertScanner() {
  const model = usePlantModel();
  const api = useSceneApi();

  useEffect(() => {
    const { startScan, commitAlerts } = api.getState();
    let alive = true;
    let timer = 0;
    let first = true;

    const run = () => {
      const startedAt = performance.now();
      // 첫 스캔은 짧게 훑어 첫 결과를 빨리 보인다. 그 뒤로는 평소 길이
      const duration = first ? SCAN_FIRST_DURATION : SCAN_DURATION;

      first = false;
      startScan(duration);
      timer = window.setTimeout(async () => {
        const latest = await getAlerts(model.id);

        if (!alive) return;

        commitAlerts(latest);
        // 스캔 시작 간격이 SCAN_CYCLE 이 되도록 남은 시간만 쉰다 (목록을 늦게 받아도 밀리지 않게)
        timer = window.setTimeout(run, Math.max(0, SCAN_CYCLE - (performance.now() - startedAt)));
      }, duration);
    };

    timer = window.setTimeout(run, SCAN_FIRST_DELAY);

    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [api, model.id]);

  return null;
}
