// 인천아시아드경기장 1·2호 태양광발전소 전기도면(㈜조은엔지니어링, 2024.01 / 2024.07)에서 옮긴 수치
// 원본: asiad_3d_blueprint(src/data/plant.ts)
import type { InverterSpec, PlantSpec } from '@/plants/types';

export const ASIAD_PLANT_ID = 'asiad';

export const ASIAD_MODULE_SPEC = {
  model: 'Q.PEAK DUO XL-G10.d BFG KR1 480',
  maker: '한화큐셀',
  type: '양면형',
  pmaxFront: 480,
  /** 단위 m */
  length: 2.216,
  width: 1.045,
  thickness: 0.035,
} as const;

export const ASIAD_INVERTER_SPEC = {
  model: 'DSP-33125KMHK(J)',
  maker: '다쓰테크',
  ratedKw: 125,
  acVoltage: '380V, 3상 4선식',
  mpptRange: '395 ~ 1,000V',
  combiner: '접속반 일체형 · 16회로 · 회로당 19.9A',
  /** 단위 m */
  width: 0.95,
  height: 0.779,
  depth: 0.3625,
} as const;

/** 1호기 산책로 캐노피 단면 치수 (구조물 설계도 E-10) */
export const ASIAD_UNIT1_SECTION = {
  postPitch: 6.5,
  crossBayWidth: 5.5,
  crossBays: 4,
  eaveHeight: 4.0,
  ridgeHeight: 4.56,
  moduleTilt: 12,
} as const;

/** 2호기 설치 타입별 모듈 수 (보조경기장 배치도 E-11) */
export const ASIAD_UNIT2_TYPES = {
  A: { label: 'A타입 · 트랙 1열형 포스트', modules: 588 },
  B: { label: 'B타입 · 본부석 하단', modules: 48 },
  C: { label: 'C타입 · 본부석 상단', modules: 56 },
  D: { label: 'D타입 · 캐노피 5동', modules: 210 },
  E: { label: 'E타입 · 출입구 캐노피', modules: 440 },
  F: { label: 'F타입 · 다이나믹 플라자', modules: 315 },
} as const;

export type AsiadUnit2TypeId = keyof typeof ASIAD_UNIT2_TYPES;

const unit1Inverters: InverterSpec[] = Array.from({ length: 19 }, (_, i) =>
  i < 15
    ? { no: i + 1, config: '14직렬×12병렬 + 13직렬×4병렬', modules: 220 }
    : { no: i + 1, config: '14직렬×8병렬 + 13직렬×6병렬', modules: 190 },
);

const unit2Inverters: InverterSpec[] = [
  { no: 1, config: '13직렬×14병렬', modules: 182 },
  { no: 2, config: '13직렬×11병렬 + 14직렬×4병렬', modules: 199 },
  { no: 3, config: '13직렬×11병렬 + 14직렬×4병렬', modules: 199 },
  { no: 4, config: '13직렬×14병렬', modules: 182 },
  { no: 5, config: '13직렬×4병렬 + 14직렬×11병렬', modules: 206 },
  { no: 6, config: '14직렬×15병렬', modules: 210 },
  { no: 7, config: '13직렬×11병렬 + 14직렬×4병렬', modules: 199 },
  { no: 8, config: '13직렬×11병렬 + 14직렬×4병렬', modules: 199 },
  { no: 9, config: '13직렬×3병렬 + 14직렬×3병렬', modules: 81 },
];

export const ASIAD_SPEC: PlantSpec = {
  id: ASIAD_PLANT_ID,
  name: '인천아시아드경기장 태양광발전소',
  shortName: '인천아시아드',
  region: '인천 서구',
  address: '인천광역시 서구 봉수대로 806',
  source: '전기도면 E-10~E-33 · 위성사진 · 현장사진',
  accuracy: 'surveyed',
  moduleWatt: ASIAD_MODULE_SPEC.pmaxFront,
  inverterRatedKw: ASIAD_INVERTER_SPEC.ratedKw,
  units: [
    {
      id: '1',
      name: '인천아시아드경기장 1호 태양광발전소',
      shortName: '1호기 · 산책로 캐노피',
      site: '경기장 산책로',
      moduleCount: 4060,
      capacityKw: 1948.8,
      inverters: unit1Inverters,
    },
    {
      id: '2',
      name: '인천아시아드경기장 2호 태양광발전소',
      shortName: '2호기 · 보조경기장',
      site: '보조경기장 + 진출입로',
      moduleCount: 1657,
      capacityKw: 795.36,
      inverters: unit2Inverters,
    },
  ],
};
