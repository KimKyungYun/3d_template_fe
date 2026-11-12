import { useEffect } from 'react';
import { useSceneApi } from '@/components/scene/SceneContext';
import { heatKey } from '@/components/scene/store';
import { useScrubber } from '../hooks/useScrubber';
import { useStatisticsData } from '../hooks/useStatisticsData';

/**
 * 기간 통계를 3D 히트맵 값으로 옮긴다 (그리는 것 없음).
 * 스크러버가 칸을 고르면 그 칸의 값, 아니면 기간 전체 달성률을 칠한다
 */
export function HeatDriver() {
  const api = useSceneApi();
  const { filter, stats } = useStatisticsData();
  const index = useScrubber((s) => s.index);

  useEffect(() => {
    const { setColorMode, setHeat } = api.getState();

    setColorMode('heat');

    return () => {
      setColorMode('default');
      setHeat(null);
    };
  }, [api]);

  useEffect(() => {
    if (!stats) return;

    const values: Record<string, number | null> = {};
    const bucket = index === null ? null : stats.buckets[index];

    for (const inv of stats.inverters) {
      const key = heatKey(inv.unitId, inv.no);

      if (!bucket || index === null) {
        values[key] = inv.ratio;
      } else if (filter.heat === 'intensity') {
        // 한 시간 칸의 kWh ÷ 용량(kW) = 그 시간 평균 출력 비율
        const v = inv.buckets[index];

        values[key] = v === null ? null : v / inv.capacityKw;
      } else {
        const expected = bucket.expectedKwh * (inv.capacityKw / stats.capacityKw);
        const v = inv.buckets[index];

        values[key] = v === null || expected <= 0 ? null : v / expected;
      }
    }

    api.getState().setHeat({ scale: index === null ? 'ratio' : filter.heat, values });
  }, [api, stats, index, filter.heat]);

  return null;
}
