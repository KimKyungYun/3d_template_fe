import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HudPanel } from '@/components/common/HudPanel';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { Skeleton } from '@/components/common/Skeleton';
import { usePlantModel, useSceneApi } from '@/components/scene/SceneContext';
import { useResolvedTheme } from '@/hooks/useResolvedTheme';
import { heatColor } from '@/plants/builders/colors';
import { buildPath } from '@/routes/buildPath';
import { formatNumber } from '@/utils/format';
import { useStatisticsData } from '../../hooks/useStatisticsData';
import styles from './InverterRanking.module.scss';

type Sort = 'worst' | 'number';

const SORT_OPTIONS: { value: Sort; label: string }[] = [
  { value: 'worst', label: '낮은 순' },
  { value: 'number', label: '번호 순' },
];

/**
 * 왼쪽 HUD — 인버터별 달성률. 줄에 올리면 3D 에서 그 묶음이 밝아지고, 누르면 인버터 뎁스로 들어간다.
 * 막대 색은 3D 히트맵과 같은 눈금이다
 */
export function InverterRanking() {
  const { filter, stats } = useStatisticsData();
  const model = usePlantModel();
  const api = useSceneApi();
  const theme = useResolvedTheme();
  const navigate = useNavigate();
  const [sort, setSort] = useState<Sort>('worst');
  const multiUnit = model.unitIds.length > 1;

  const rows = useMemo(() => {
    const list = [...(stats?.inverters ?? [])];

    if (sort === 'worst') list.sort((a, b) => (a.ratio ?? -1) - (b.ratio ?? -1));
    else list.sort((a, b) => model.unitIds.indexOf(a.unitId) - model.unitIds.indexOf(b.unitId) || a.no - b.no);

    return list;
  }, [stats, sort, model.unitIds]);

  return (
    <HudPanel
      title="인버터별 달성률"
      flush
      className={styles.panel}
      action={<SegmentedControl options={SORT_OPTIONS} value={sort} onChange={setSort} label="정렬" size="sm" />}
    >
      {!stats ? (
        <div className={styles.ranking__skeleton}>
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} height={28} />)}
        </div>
      ) : (
        <ul className={styles.ranking} onPointerLeave={() => api.getState().clearHover()}>
          {rows.map((inv) => {
            const pct = inv.ratio === null ? null : inv.ratio * 100;

            return (
              <li key={inv.key}>
                <button
                  type="button"
                  className={styles.ranking__row}
                  onPointerEnter={() => api.getState().setHover({ kind: 'inverter', unitId: inv.unitId, no: inv.no })}
                  onClick={() => navigate(`${buildPath.statistics(model.id, inv.unitId, inv.no)}${filter.search}`)}
                >
                  <span className={styles.ranking__name}>
                    {multiUnit ? `${inv.unitId}호기 ` : ''}#{inv.no}
                  </span>
                  <span className={styles.ranking__track} aria-hidden>
                    <span
                      className={styles.ranking__fill}
                      style={{
                        width: `${Math.min(100, (pct ?? 0) / 1.1)}%`,
                        backgroundColor: heatColor('ratio', inv.ratio, theme),
                      }}
                    />
                  </span>
                  <span className={styles.ranking__value}>
                    {pct === null ? '단절' : `${formatNumber(pct, 1)}%`}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </HudPanel>
  );
}
