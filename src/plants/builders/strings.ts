/*
  스트링(인버터 아래 단위) ↔ 모듈 묶음. 도면에 모듈별 스트링 배정이 없어서,
  인버터 묶음을 배치 순서대로 스트링 직렬 장수에 비례해 나눈 근사 위치다.
*/
import { stringSeriesOf } from '@/plants/types';
import type { PlantGeometry } from '@/plants/model/types';

/** 인버터 한 대의 스트링별 직렬 장수 (스트링 번호 = 순서 + 1) */
export function stringSeries(model: PlantGeometry, unitId: string, no: number): number[] {
  const spec = model.spec.units.find((u) => u.id === unitId)?.inverters.find((i) => i.no === no);

  return spec ? stringSeriesOf(spec.config) : [];
}

/** 인버터 묶음의 모듈 번호 (배치 순서) */
export function inverterModules(model: PlantGeometry, unitId: string, no: number): number[] {
  const layout = model.units[unitId];

  if (!layout) return [];

  return layout.modules.inverter.flatMap((n, i) => (n === no ? [i] : []));
}

/** 스트링에 물린 모듈 번호. strings 가 null 이면 인버터 묶음 전부 */
export function stringModules(model: PlantGeometry, unitId: string, no: number, strings: number[] | null): number[] {
  const own = inverterModules(model, unitId, no);
  const series = stringSeries(model, unitId, no);

  if (!strings || series.length === 0 || own.length === 0) return own;

  const total = series.reduce((a, b) => a + b, 0);
  // 스트링마다 [시작, 끝) 비율 구간
  const ranges: [number, number][] = [];
  let acc = 0;

  for (const s of series) {
    ranges.push([acc / total, (acc + s) / total]);
    acc += s;
  }

  return own.filter((_, k) => {
    const r = (k + 0.5) / own.length;

    return strings.some((c) => ranges[c - 1] && r >= ranges[c - 1][0] && r < ranges[c - 1][1]);
  });
}
