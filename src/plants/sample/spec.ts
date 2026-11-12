// 평지형 샘플 발전소 — 규격 몇 줄로 3D 를 만들어, 발전소를 더 등록하는 길이 열려 있음을 보인다.
// 실재하는 현장이 아니므로 화면에 「샘플」·「개략」을 붙인다.
import type { InverterSpec, PlantSpec } from '@/plants/types';

export const SAMPLE_PLANT_ID = 'saebit';

/** 모듈 한 장 크기 (m) — 3D 빌더가 읽는다 */
export const SAMPLE_MODULE_SIZE = { length: 2.216, width: 1.045, thickness: 0.035 } as const;

/** 가대 배치 규격 — 3D 빌더(plants/sample/layout.ts)가 이 값만 읽는다 */
export const SAMPLE_LAYOUT_SPEC = {
  /** 가대 한 동의 모듈 배열 (세로 2단 × 가로 20장) */
  tableRows: 2,
  tableCols: 20,
  /** 동 사이 간격 (m) — 남북 그림자 거리 */
  rowPitch: 7.2,
  /** 동 묶음 — 인버터 하나가 맡는 동 수 */
  tablesPerInverter: 5,
  /** 블록 배치 — 인버터 6대를 3열 × 2행으로 */
  blockCols: 3,
  blockRows: 2,
  /** 블록 사이 통로 (m) */
  aisle: 6,
  tilt: 18,
} as const;

const modulesPerInverter = SAMPLE_LAYOUT_SPEC.tableRows * SAMPLE_LAYOUT_SPEC.tableCols * SAMPLE_LAYOUT_SPEC.tablesPerInverter;

const inverters: InverterSpec[] = Array.from({ length: 6 }, (_, i) => ({
  no: i + 1,
  config: '20직렬×10병렬',
  modules: modulesPerInverter,
}));

export const SAMPLE_SPEC: PlantSpec = {
  id: SAMPLE_PLANT_ID,
  name: '새빛 평지형 태양광 (샘플)',
  shortName: '새빛 샘플',
  region: '충남 당진',
  address: '샘플 부지 — 실제 현장 아님',
  source: '규격 JSON 으로 생성한 샘플',
  accuracy: 'approximate',
  moduleWatt: 480,
  inverterRatedKw: 100,
  units: [
    {
      id: '1',
      name: '새빛 샘플 1호기',
      shortName: '1호기 · 평지 가대',
      site: '평지 부지',
      moduleCount: modulesPerInverter * inverters.length,
      capacityKw: (modulesPerInverter * inverters.length * 480) / 1000,
      inverters,
    },
  ],
};
