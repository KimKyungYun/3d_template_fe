import { BarChart, LineChart } from 'echarts/charts';
import { GridComponent, MarkAreaComponent, MarkLineComponent, TooltipComponent } from 'echarts/components';
import * as echarts from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import ReactEChartsCore from 'echarts-for-react/esm/core';
import { useTheme } from '@/stores/themeStore';
import styles from './EChart.module.scss';
import type { EChartsOption } from 'echarts';

// 쓰는 차트·부품만 싣는다 — 전체 echarts 는 1MB 가 넘는다
echarts.use([BarChart, LineChart, GridComponent, TooltipComponent, MarkLineComponent, MarkAreaComponent, CanvasRenderer]);

interface EChartProps {
  option: EChartsOption;
  height?: number | string;
  /** 차트를 대신할 글 요약 — 스크린리더가 읽는다 */
  summary: string;
  className?: string;
  /** 차트 이벤트 — { click: (params) => … } */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onEvents?: Record<string, (params: any) => void>;
}

export function EChart({ option, height = 240, summary, className, onEvents }: EChartProps) {
  const theme = useTheme();

  return (
    <figure className={className ? `${styles.chart} ${className}` : styles.chart}>
      <ReactEChartsCore
        // 테마가 바뀌면 색을 새로 잡도록 인스턴스를 다시 만든다
        key={theme}
        echarts={echarts}
        option={option}
        style={{ height: typeof height === 'number' ? `${height}px` : height, width: '100%' }}
        opts={{ renderer: 'canvas' }}
        onEvents={onEvents}
        notMerge
      />
      <figcaption className={styles.chart__summary}>{summary}</figcaption>
    </figure>
  );
}
