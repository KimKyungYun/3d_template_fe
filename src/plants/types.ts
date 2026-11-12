/*
  발전소 사양 — 3D 지오메트리와 목데이터가 함께 기대는 가벼운 메타데이터.
  three 를 import 하지 않는다. 3D 빌더는 plants/registry.ts 에서 따로 등록한다.
*/

export interface InverterSpec {
  /** 인버터 번호 (1부터) */
  no: number;
  /** 도면 표기 직병렬 구성 — '14직렬×12병렬 + 13직렬×4병렬' */
  config: string;
  modules: number;
}

export interface UnitSpec {
  /** 호기 열쇠 — URL 에 그대로 실린다 ('1', '2') */
  id: string;
  name: string;
  shortName: string;
  site: string;
  moduleCount: number;
  capacityKw: number;
  inverters: InverterSpec[];
}

export interface PlantSpec {
  id: string;
  name: string;
  shortName: string;
  region: string;
  address: string;
  /** 모델 근거 — 화면에 출처로 적는다 */
  source: string;
  /** 3D 배치가 도면·위성과 맞는 정도. 개략이면 화면에 「개략」을 붙인다 */
  accuracy: 'surveyed' | 'approximate';
  moduleWatt: number;
  inverterRatedKw: number;
  units: UnitSpec[];
}

/** 직병렬 한 묶음 — 직렬 장수 × 병렬 스트링 수 */
export interface StringGroup {
  series: number;
  parallel: number;
}

/** '14직렬×12병렬 + 13직렬×4병렬' → [{14, 12}, {13, 4}] */
export const stringGroupsOf = (config: string): StringGroup[] =>
  [...config.matchAll(/(\d+)직렬\s*×\s*(\d+)병렬/g)].map((m) => ({ series: Number(m[1]), parallel: Number(m[2]) }));

/** 인버터 하나의 스트링별 직렬 장수 — 병렬 수만큼 펼친다 */
export const stringSeriesOf = (config: string): number[] =>
  stringGroupsOf(config).flatMap((g) => Array.from({ length: g.parallel }, () => g.series));

/** 설비 열쇠 — 발전소·호기·인버터를 한 줄로. 목데이터·3D·URL 이 같은 값을 쓴다 */
export const inverterKey = (plantId: string, unitId: string, no: number) => `${plantId}:${unitId}:${no}`;

export const unitCapacityKw = (unit: UnitSpec, moduleWatt: number) => (unit.moduleCount * moduleWatt) / 1000;
