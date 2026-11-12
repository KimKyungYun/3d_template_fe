import { usePlantScope } from '@/hooks/usePlantScope';
import { useInverterStats } from '@/queries/useGenerationQueries';
import { useStatisticsFilter } from '../../hooks/useStatisticsFilter';

/** 인버터 뎁스 조각들이 나눠 쓰는 인버터 기간 통계 — 조회는 한 벌이다 */
export function useInverterDetail() {
  const { plantId, spec, unitId, no } = usePlantScope();
  const filter = useStatisticsFilter();
  const query = useInverterStats(plantId ?? '', unitId ?? '', no ?? 0, filter.period, filter.date);
  const unit = spec?.units.find((u) => u.id === unitId);
  const inverterSpec = unit?.inverters.find((i) => i.no === no);

  return { filter, plantId, spec, unit, inverterSpec, detail: query.data ?? null };
}
