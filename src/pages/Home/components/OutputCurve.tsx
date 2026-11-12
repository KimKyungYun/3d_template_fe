import { useMemo } from 'react';
import { EChart } from '@/components/common/EChart';
import { HudPanel } from '@/components/common/HudPanel';
import { Skeleton } from '@/components/common/Skeleton';
import { useChartPalette } from '@/hooks/useChartPalette';
import { useTodayOutput } from '@/queries/useGenerationQueries';
import { usePlantId } from '@/stores/plantStore';
import { formatNumber } from '@/utils/format';
import styles from './OutputCurve.module.scss';
import type { EChartsOption } from 'echarts';

/** 가운데 아래 띠 — 금일 발전 곡선 (실측·예측 출력) */
export function OutputCurve() {
  const plantId = usePlantId();
  const { data } = useTodayOutput(plantId);
  const p = useChartPalette();

  const peak = useMemo(
    () => (data ? Math.max(...data.points.map((pt) => pt.actualKw ?? 0)) : 0),
    [data],
  );

  const option = useMemo<EChartsOption | null>(() => {
    if (!data) return null;

    const font = { fontFamily: p.fontData, fontSize: 10, color: p.textMuted };

    return {
      animationDuration: 900,
      grid: { left: 44, right: 12, top: 12, bottom: 22 },
      tooltip: {
        trigger: 'axis',
        backgroundColor: p.surface,
        borderColor: p.line,
        textStyle: { ...font, fontSize: 11, color: p.textStrong },
        valueFormatter: (v) => (v === null || v === undefined ? '-' : `${formatNumber(Number(v), 1)} kW`),
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: data.points.map((pt) => pt.time),
        axisLine: { lineStyle: { color: p.grid } },
        axisTick: { show: false },
        axisLabel: { ...font, interval: 17 },
      },
      yAxis: {
        type: 'value',
        splitNumber: 3,
        splitLine: { lineStyle: { color: p.grid } },
        axisLabel: { ...font, formatter: (v: number) => formatNumber(v) },
      },
      series: [
        {
          name: '예측',
          type: 'line',
          data: data.points.map((pt) => pt.expectedKw),
          symbol: 'none',
          lineStyle: { color: p.expected, width: 1.2, type: 'dashed' },
          z: 1,
        },
        {
          name: '실측',
          type: 'line',
          data: data.points.map((pt) => pt.actualKw),
          symbol: 'none',
          smooth: 0.3,
          lineStyle: { color: p.actual, width: 2, shadowBlur: 8, shadowColor: p.actual },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: `${p.actual}55` },
                { offset: 1, color: `${p.actual}00` },
              ],
            },
          },
          markLine: {
            symbol: 'none',
            silent: true,
            label: { ...font, color: p.accent, formatter: `NOW ${data.until}`, position: 'insideEndTop' },
            lineStyle: { color: p.accent, type: 'solid', width: 1 },
            data: [{ xAxis: data.until }],
          },
          z: 2,
        },
      ],
    };
  }, [data, p]);

  return (
    <HudPanel
      avoid={false}
      title="금일 발전 곡선"
      order={3}
      className={styles.panel}
      action={(
        <span className={styles.curve__legend}>
          <span className={styles.curve__key} data-kind="actual">실측</span>
          <span className={styles.curve__key} data-kind="expected">예측</span>
          {data ? <span className={styles.curve__peak}>PEAK {formatNumber(peak, 0)} kW</span> : null}
        </span>
      )}
    >
      {option ? (
        <EChart
          option={option}
          height="100%"
          className={styles.curve__chart}
          summary={`금일 ${data?.until} 까지 최고 출력 ${formatNumber(peak, 0)} kW`}
        />
      ) : (
        <Skeleton height="100%" />
      )}
    </HudPanel>
  );
}
