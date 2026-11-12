import { useEffect } from 'react';
import { HudPanel } from '@/components/common/HudPanel';
import { Icon } from '@/components/common/Icon';
import { useResolvedTheme } from '@/hooks/useResolvedTheme';
import { HEAT_STOPS } from '@/plants/builders/colors';
import { cn } from '@/utils/cn';
import { useScrubber } from '../hooks/useScrubber';
import { useStatisticsData } from '../hooks/useStatisticsData';
import styles from './TimeScrubber.module.scss';

/** 한 칸에 머무는 시간 (ms) */
const STEP_MS = 700;

/**
 * 가운데 아래 시간 스크러버 — 칸을 고르거나 재생하면 3D 패널 색이 그 칸 값으로 바뀐다.
 * 일 단위면 해가 뜨고 지는 동안 발전소가 달아올랐다 식는 모습을 본다
 */
export function TimeScrubber() {
  const { filter, stats } = useStatisticsData();
  const theme = useResolvedTheme();
  const index = useScrubber((s) => s.index);
  const playing = useScrubber((s) => s.playing);
  const setIndex = useScrubber((s) => s.setIndex);
  const setPlaying = useScrubber((s) => s.setPlaying);
  const buckets = stats?.buckets ?? [];
  // 계측이 있는 칸까지만 재생한다
  const lastMeasured = buckets.reduce((last, b, i) => (b.actualKwh !== null ? i : last), -1);
  const firstMeasured = buckets.findIndex((b) => b.actualKwh !== null);
  const peak = Math.max(1, ...buckets.map((b) => b.actualKwh ?? 0));
  const scale = index === null ? 'ratio' : filter.heat;

  useEffect(() => {
    if (!playing || lastMeasured < 0) return undefined;

    const id = window.setInterval(() => {
      const { index: now } = useScrubber.getState();
      const next = now === null || now >= lastMeasured ? Math.max(0, firstMeasured) : now + 1;

      setIndex(next);
      if (next >= lastMeasured) setPlaying(false);
    }, STEP_MS);

    return () => window.clearInterval(id);
  }, [playing, lastMeasured, firstMeasured, setIndex, setPlaying]);

  // 기간·발전소가 바뀌면 처음으로
  useEffect(() => () => {
    setIndex(null);
    setPlaying(false);
  }, [stats?.plantId, stats?.period, stats?.date, setIndex, setPlaying]);

  // 범례는 눈금 위치 비율대로 그린다 — 같은 자리 두 눈금은 색이 끊기는 경계로 보인다
  const stops = HEAT_STOPS[scale][theme];
  const span = stops[stops.length - 1].at - stops[0].at;
  const percent = (at: number) => ((at - stops[0].at) / span) * 100;
  const gradient = `linear-gradient(90deg, ${stops.map((s) => `${s.color} ${percent(s.at).toFixed(1)}%`).join(', ')})`;
  const ticks = [...new Set(stops.map((s) => s.at))];

  return (
    <HudPanel avoid={false} order={3} className={styles.panel}>
      <div className={styles.scrubber}>
        <div className={styles.scrubber__controls}>
          <button
            type="button"
            className={styles.scrubber__play}
            onClick={() => setPlaying(!playing)}
            disabled={lastMeasured < 0}
            aria-label={playing ? '정지' : '재생'}
          >
            <Icon name={playing ? 'pause' : 'play'} size={14} />
          </button>
          <button
            type="button"
            className={cn(styles.scrubber__all, { [styles['scrubber__all--active']]: index === null })}
            onClick={() => {
              setPlaying(false);
              setIndex(null);
            }}
          >
            기간 전체
          </button>
          <span className={styles.scrubber__now}>
            {index === null ? stats?.rangeLabel ?? '' : buckets[index]?.label}
          </span>
        </div>
        <div className={styles.scrubber__bars} role="listbox" aria-label="칸 고르기">
          {buckets.map((b, i) => (
            <button
              key={b.key}
              type="button"
              role="option"
              aria-selected={index === i}
              aria-label={`${b.label} ${b.actualKwh ?? '-'} kWh`}
              disabled={b.actualKwh === null}
              className={cn(styles.scrubber__bar, { [styles['scrubber__bar--active']]: index === i })}
              onClick={() => {
                setPlaying(false);
                setIndex(index === i ? null : i);
              }}
            >
              <span style={{ height: `${Math.max(4, ((b.actualKwh ?? 0) / peak) * 100)}%` }} />
            </button>
          ))}
        </div>
        <div className={styles.scrubber__legend}>
          <span className={styles.scrubber__legendTitle}>{scale === 'ratio' ? '기대 대비 달성률' : '용량 대비 출력'}</span>
          <span className={styles.scrubber__gradient} style={{ background: gradient }} aria-hidden />
          <span className={styles.scrubber__ticks}>
            {ticks.map((at) => (
              <span key={at} style={{ left: `${percent(at)}%` }}>{Math.round(at * 100)}%</span>
            ))}
          </span>
        </div>
      </div>
    </HudPanel>
  );
}
