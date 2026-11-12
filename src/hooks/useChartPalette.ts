import { useEffect, useState } from 'react';
import { useTheme } from '@/stores/themeStore';

const VARIABLES = {
  grid: '--chart-grid',
  axis: '--chart-axis',
  actual: '--chart-actual',
  expected: '--chart-expected',
  irradiance: '--chart-irradiance',
  accent: '--accent',
  solar: '--solar',
  text: '--text',
  textMuted: '--text-muted',
  textStrong: '--text-strong',
  surface: '--glass-strong',
  line: '--line-strong',
  ok: '--ok',
  caution: '--caution',
  critical: '--critical',
  offline: '--offline',
  fontData: '--font-data',
} as const;

export type ChartPalette = Record<keyof typeof VARIABLES, string>;

function readPalette(): ChartPalette {
  const computed = getComputedStyle(document.documentElement);

  return Object.fromEntries(
    Object.entries(VARIABLES).map(([key, variable]) => [key, computed.getPropertyValue(variable).trim()]),
  ) as ChartPalette;
}

/**
 * 차트(캔버스)는 CSS 변수를 직접 못 읽으므로, 지금 테마의 계산값을 읽어 옵션에 넘긴다.
 * 테마가 바뀌면 data-theme 이 바뀐 뒤 다시 읽는다
 */
export function useChartPalette(): ChartPalette {
  const theme = useTheme();
  const [palette, setPalette] = useState<ChartPalette>(readPalette);

  useEffect(() => {
    const timer = window.setTimeout(() => setPalette(readPalette()), 30);

    return () => window.clearTimeout(timer);
  }, [theme]);

  return palette;
}
