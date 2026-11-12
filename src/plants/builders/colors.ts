/*
  3D 전용 색. 운전 상태색·패널 파랑·강조색은 configs/status 한 곳에서만 가져온다 —
  셰이더 점등과 CSS 토큰이 어긋나지 않게.
*/
import { Color } from 'three';
import { PANEL_COLORS, STATUS_COLORS } from '@/configs/status';
import type { ResolvedTheme } from '@/configs/status';

export interface SceneColors {
  paving: string;
  field: string;
  apron: string;
  track: string;
  /** 정상 패널 — 실제 결정질 모듈 파랑. 이상 설비만 셰이더가 상태색으로 덮는다 */
  module: string;
  moduleDim: string;
  steel: string;
  tray: string;
  hv: string;
  /** 결선 불량 스트링의 꺼진 가닥 — 흐르는 선 옆에서 빛 없이 가라앉은 회색 */
  deadWire: string;
  /** 꺼진 가닥 테두리 — 지붕·바닥 어느 쪽 위에서도 회색 선이 묻히지 않게 바탕과 반대 밝기로 두른다 */
  deadWireCasing: string;
  room: string;
  /** RTU 함 — 스테인리스 */
  rtu: string;
  inverter: string;
  kepco: string;
  hemiSky: string;
  hemiGround: string;
}

export const SCENE_COLORS: Record<ResolvedTheme, SceneColors> = {
  light: {
    paving: '#d9d3c7',
    field: '#6fa35c',
    apron: '#c9cbcc',
    track: '#5b97c9',
    module: PANEL_COLORS.light,
    moduleDim: '#9aa3b2',
    steel: '#a7afb9',
    tray: '#e07a1f',
    hv: '#c8332b',
    deadWire: '#4a525e',
    deadWireCasing: '#b3bac4',
    room: '#eef0f2',
    rtu: '#b9c2cc',
    inverter: '#dfe3e8',
    kepco: '#6e8b74',
    hemiSky: '#ffffff',
    hemiGround: '#8d9b80',
  },
  dark: {
    paving: '#2a2d31',
    field: '#29482a',
    apron: '#3d4146',
    track: '#2b5577',
    module: PANEL_COLORS.dark,
    moduleDim: '#2a3039',
    steel: '#6f7883',
    tray: '#f0913a',
    hv: '#ff6b5e',
    deadWire: '#8b95a3',
    deadWireCasing: '#1b222c',
    room: '#56606b',
    rtu: '#8d99a8',
    inverter: '#8a949f',
    kepco: '#5f8a69',
    hemiSky: '#b9c8de',
    hemiGround: '#20261f',
  },
};

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

/**
 * 인버터 범례 색 — 색상환을 고르게 나누되 이웃 번호끼리 멀어지도록 건너뛰며 고른다.
 * 건너뛰는 폭은 대수와 서로소여야 색이 한 바퀴를 다 돈다. 호기마다 시작 색을 비껴 두어 호기끼리도 갈린다
 */
export function inverterColor(unitIndex: number, no: number, total: number, theme: ResolvedTheme): string {
  if (total <= 0) return SCENE_COLORS[theme].module;

  let step = Math.max(1, Math.round(total * 0.37));

  while (step > 1 && gcd(step, total) !== 1) step -= 1;

  const hue = ((((no - 1) * step) % total) / total + unitIndex * 0.13) % 1;
  const c = new Color().setHSL(hue, theme === 'dark' ? 0.62 : 0.68, theme === 'dark' ? 0.6 : 0.47);

  return `#${c.getHexString()}`;
}

/** 스트링 구역 색 — 등록되지 않은 구역 id 는 패널 파랑으로 둔다 */
const ZONE_COLORS: Record<ResolvedTheme, Record<string, string>> = {
  light: { A: '#2f7ad1', B: '#d1782f', C: '#2f9e6b', D: '#9a4fc4' },
  dark: { A: '#5aa1f0', B: '#f0a35a', C: '#5ccf98', D: '#c18ae6' },
};

export const zoneColor = (theme: ResolvedTheme, zone: string) =>
  ZONE_COLORS[theme][zone] ?? SCENE_COLORS[theme].module;

export interface SceneryColors {
  skyZenith: string;
  skyHorizon: string;
  /** 지평선 아래(받침판 바깥 빈 배경) */
  skyNadir: string;
  sun: string;
  grass: string;
  asphalt: string;
  laneWhite: string;
  laneYellow: string;
  bikePath: string;
  /** 붉은 흙길 */
  dirt: string;
  dryLawn: string;
  sand: string;
  fairway: string;
  /** 건물 둘레 밝은 포장 */
  plaza: string;
  stadium: string;
  stadiumRoof: string;
  stadiumRoofWest: string;
  building: string;
  /** 받침판 옆면(흙) */
  soil: string;
  seat: string;
  riser: string;
  concrete: string;
  hedge: string;
  water: string;
  wood: string;
  fence: string;
  glass: string;
  cars: string[];
  lampPole: string;
  lampHead: string;
  /** 야간 발광 세기 (낮에는 0) */
  glow: number;
}

export const SCENERY_COLORS: Record<ResolvedTheme, SceneryColors> = {
  light: {
    skyZenith: '#5f9fd9',
    skyHorizon: '#cfdeea',
    skyNadir: '#bfc6ce',
    sun: '#fff3dc',
    grass: '#93b878',
    asphalt: '#6c7076',
    laneWhite: '#f4f4f0',
    laneYellow: '#f2c230',
    bikePath: '#b86a5c',
    dirt: '#a8765a',
    dryLawn: '#c4b47e',
    sand: '#d9c39a',
    fairway: '#7fae5c',
    plaza: '#e3e1dc',
    stadium: '#e4e7ea',
    stadiumRoof: '#f5f6f7',
    stadiumRoofWest: '#a9b0b8',
    building: '#e9e6df',
    soil: '#8a7258',
    seat: '#c3c7cc',
    riser: '#9ea4ab',
    concrete: '#d9d8d3',
    hedge: '#4f8a3f',
    water: '#4f8088',
    wood: '#a07b52',
    fence: '#3f9b5a',
    glass: '#33404d',
    cars: ['#f2f2f0', '#f2f2f0', '#c7cacf', '#2b2d31', '#8d9298', '#3d5a80', '#a33a32'],
    lampPole: '#8b939c',
    lampHead: '#d9dde1',
    glow: 0,
  },
  dark: {
    skyZenith: '#050912',
    skyHorizon: '#18243a',
    skyNadir: '#111a2b',
    sun: '#9fb4d8',
    grass: '#3a5233',
    asphalt: '#2f3339',
    laneWhite: '#8c8f93',
    laneYellow: '#9c7e24',
    bikePath: '#4f2e29',
    dirt: '#4a3428',
    dryLawn: '#4a4430',
    sand: '#5a4f3b',
    fairway: '#2e4a24',
    plaza: '#4a4c50',
    stadium: '#3a3f47',
    stadiumRoof: '#4a505a',
    stadiumRoofWest: '#3a4048',
    building: '#424852',
    soil: '#3b3127',
    seat: '#4a5058',
    riser: '#383d44',
    concrete: '#55585d',
    hedge: '#2c4a26',
    water: '#1d363b',
    wood: '#4f3d2b',
    fence: '#2a6a3d',
    glass: '#141a21',
    cars: ['#9a9c9f', '#9a9c9f', '#7a7e83', '#1b1d20', '#55595e', '#2e4562', '#6e2a25'],
    lampPole: '#3d434b',
    lampHead: '#ffcf8a',
    glow: 2.2,
  },
};

/** 발전량 히트맵 눈금 — 달성률(기대 대비)과 출력 강도(용량 대비) 두 가지 */
export type HeatScale = 'ratio' | 'intensity';

interface HeatStop {
  at: number;
  color: string;
}

/*
  달성률은 낮으면 상태색(고장 빨강·주의 주황), 기대 수준이면 실제 패널 파랑, 넘치면 시안.
  정상을 초록으로 칠하지 않는다 — 3D 의 다른 화면과 같은 규칙.
  출력 강도는 꺼진 남색 → 패널 파랑 → 햇빛 앰버 → 흰빛으로 달아오른다.
*/
export const HEAT_STOPS: Record<HeatScale, Record<ResolvedTheme, HeatStop[]>> = {
  // 주의 기준(85%)에서 색을 끊는다 — 주황과 파랑을 섞으면 회색이 나와 통신단절처럼 보인다
  ratio: {
    dark: [
      { at: 0.5, color: '#ff4d5e' },
      { at: 0.85, color: '#ff9d2e' },
      { at: 0.85, color: '#8aa6e6' },
      { at: 0.95, color: '#2f5bb3' },
      { at: 1.04, color: '#3ee0ff' },
    ],
    light: [
      { at: 0.5, color: '#d92c3e' },
      { at: 0.85, color: '#d9780a' },
      { at: 0.85, color: '#7d9ad8' },
      { at: 0.95, color: '#1f4a9c' },
      { at: 1.04, color: '#0a8fb3' },
    ],
  },
  intensity: {
    dark: [
      { at: 0, color: '#121c30' },
      { at: 0.3, color: '#2f5bb3' },
      { at: 0.65, color: '#ffb547' },
      { at: 0.85, color: '#fff1c9' },
    ],
    light: [
      { at: 0, color: '#c5d0de' },
      { at: 0.3, color: '#1f4a9c' },
      { at: 0.65, color: '#f29a1f' },
      { at: 0.85, color: '#ffcf7a' },
    ],
  },
};

const mixHex = (a: string, b: string, t: number) => {
  const pa = Number.parseInt(a.slice(1), 16);
  const pb = Number.parseInt(b.slice(1), 16);
  const ch = (shift: number) => Math.round(((pa >> shift) & 255) + ((((pb >> shift) & 255) - ((pa >> shift) & 255)) * t));

  return `#${((ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).padStart(6, '0')}`;
};

/** 값 → 히트맵 색. 계측이 없으면(null) 통신단절 회색 */
export function heatColor(scale: HeatScale, value: number | null, theme: ResolvedTheme): string {
  if (value === null || !Number.isFinite(value)) return STATUS_COLORS[theme].commLost;

  const stops = HEAT_STOPS[scale][theme];

  if (value <= stops[0].at) return stops[0].color;

  for (let i = 1; i < stops.length; i += 1) {
    if (value <= stops[i].at) {
      // 같은 자리에 둔 두 눈금은 색을 끊는 경계다
      if (stops[i].at === stops[i - 1].at) return stops[i - 1].color;

      const t = (value - stops[i - 1].at) / (stops[i].at - stops[i - 1].at);

      return mixHex(stops[i - 1].color, stops[i].color, t);
    }
  }

  return stops[stops.length - 1].color;
}
