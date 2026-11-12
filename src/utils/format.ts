/** 천 단위 쉼표 + 자릿수. 끝자리 0 은 지운다 (1,234.5 · 1,200) */
export function formatNumber(value: number, fractionDigits = 0): string {
  return value.toLocaleString('ko-KR', { maximumFractionDigits: fractionDigits });
}

/** 자릿수를 고정한다. 숫자가 굴러가는 동안 폭이 흔들리지 않게 쓴다 */
export function formatNumberFixed(value: number, fractionDigits = 0): string {
  return value.toLocaleString('ko-KR', { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits });
}

/** kW 가 1,000 을 넘으면 MW 로 올린다 */
export function formatPower(kw: number): { value: string; unit: 'kW' | 'MW' } {
  if (Math.abs(kw) >= 1000) return { value: formatNumberFixed(kw / 1000, 2), unit: 'MW' };

  return { value: formatNumber(kw, 1), unit: 'kW' };
}

/** kWh 가 1,000 을 넘으면 MWh 로 올린다 */
export function formatEnergy(kwh: number): { value: string; unit: 'kWh' | 'MWh' } {
  if (Math.abs(kwh) >= 1000) return { value: formatNumberFixed(kwh / 1000, 2), unit: 'MWh' };

  return { value: formatNumber(kwh, 0), unit: 'kWh' };
}

export const formatPercent = (ratio: number, fractionDigits = 0) => `${formatNumber(ratio * 100, fractionDigits)}%`;
