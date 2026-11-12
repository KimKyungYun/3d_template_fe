import { usePlantScope } from '@/hooks/usePlantScope';
import { useGenerationStats } from '@/queries/useGenerationQueries';
import { useStatisticsFilter } from './useStatisticsFilter';

/** 두 뎁스와 3D 히트맵이 나눠 쓰는 발전소 기간 통계 — 조회는 한 벌이다 */
export function useStatisticsData() {
  const { plantId } = usePlantScope();
  const filter = useStatisticsFilter();
  const query = useGenerationStats(plantId ?? '', filter.period, filter.date);

  return { filter, stats: plantId ? query.data : undefined, isPending: query.isPending, isFetching: query.isFetching };
}
