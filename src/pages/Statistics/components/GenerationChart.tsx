import { useMemo } from 'react';
import { EChart } from '@/components/common/EChart';
import { useChartPalette } from '@/hooks/useChartPalette';
import { formatNumber } from '@/utils/format';
import type { StatBucket } from '@/interface/generation';
import type { EChartsOption } from 'echarts';

interface GenerationChartProps {
  buckets: StatBucket[];
  /** 스크러버가 고른 칸 — 막대를 밝힌다 */
  activeIndex: number | null;
  onPick?: (index: number) => void;
  height?: number | string;
}

/** 칸별 실측 막대 + 기대 점선 (그리기 전용) — 막대를 누르면 그 칸을 3D 에 칠한다 */
export function GenerationChart({ buckets, activeIndex, onPick, height = 220 }: GenerationChartProps) {
  const p = useChartPalette();

  const option = useMemo<EChartsOption>(() => {
    const font = { fontFamily: p.fontData, fontSize: 10, color: p.textMuted };

    return {
      animationDuration: 700,
      grid: { left: 46, right: 8, top: 14, bottom: 22 },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: p.surface,
        borderColor: p.line,
        textStyle: { ...font, fontSize: 11, color: p.textStrong },
        valueFormatter: (v) => (v === null || v === undefined ? '-' : `${formatNumber(Number(v), 1)} kWh`),
      },
      xAxis: {
        type: 'category',
        data: buckets.map((b) => b.label),
        axisLine: { lineStyle: { color: p.grid } },
        axisTick: { show: false },
        axisLabel: { ...font, interval: buckets.length > 16 ? Math.ceil(buckets.length / 8) - 1 : 0 },
      },
      yAxis: {
        type: 'value',
        splitNumber: 3,
        splitLine: { lineStyle: { color: p.grid } },
        axisLabel: { ...font, formatter: (v: number) => (v >= 10000 ? `${formatNumber(v / 1000)}k` : formatNumber(v)) },
      },
      series: [
        {
          name: '실측',
          type: 'bar',
          barMaxWidth: 14,
          data: buckets.map((b, i) => ({
            value: b.actualKwh,
            itemStyle: {
              color: p.actual,
              opacity: activeIndex === null || activeIndex === i ? 1 : 0.35,
              borderRadius: [2, 2, 0, 0],
              shadowBlur: activeIndex === i ? 12 : 0,
              shadowColor: p.actual,
            },
          })),
        },
        {
          name: '기대',
          type: 'line',
          data: buckets.map((b) => b.expectedKwh),
          symbol: 'none',
          step: 'middle',
          lineStyle: { color: p.expected, width: 1.2, type: 'dashed' },
        },
      ],
    };
  }, [buckets, activeIndex, p]);

  const total = buckets.reduce((sum, b) => sum + (b.actualKwh ?? 0), 0);

  return (
    <EChart
      option={option}
      height={height}
      summary={`기간 실측 합계 ${formatNumber(total)} kWh, ${buckets.length}칸`}
      onEvents={onPick ? { click: (e: { dataIndex: number }) => onPick(e.dataIndex) } : undefined}
    />
  );
}
