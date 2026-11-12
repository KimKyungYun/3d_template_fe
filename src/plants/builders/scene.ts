/** 분해 보기에서 레이어별로 들어 올리는 높이 (m, 슬라이더 1 기준) */
export const EXPLODE_LIFT = { modules: 6, purlins: 4, girders: 2, posts: 0 } as const;

/** 해(밤에는 달) 방향 — 그림자 조명과 하늘이 같은 값을 쓴다 */
export const SUN_DIR: [number, number, number] = (() => {
  const v = [-220, 380, 260];
  const len = Math.hypot(v[0], v[1], v[2]);
  return [v[0] / len, v[1] / len, v[2] / len];
})();

/**
 * 바닥 층 높이. 같은 높이의 면이 겹치면 깊이 값이 같아 깜빡이므로 층마다 확실히 띄운다
 */
export const GROUND_Y = {
  terrain: -0.3,
  /** 마른 잔디·모래·광장 같은 바닥 구역 — 도로·주차장 아래 */
  zone: -0.15,
  road: 0,
  parking: 0.03,
  path: 0.09,
  mark: 0.12,
  /** 발전소 부지 바닥(산책로 포장·트랙) 시작 높이 */
  site: 0.15,
} as const;

const SITE_TONE_Y = {
  paving: GROUND_Y.site,
  apron: GROUND_Y.site + 0.05,
  track: GROUND_Y.site + 0.1,
} as const;

/**
 * 부지 바닥 띠의 높이. 띠끼리 겹치는 곳(산책로 끝과 광장 등)이 깜빡이지 않도록 순번마다 더 띄운다.
 * 트랙 라인·자전거길처럼 띠 위에 얹는 표시도 이 값을 기준으로 올린다
 */
export const siteRibbonY = (tone: keyof typeof SITE_TONE_Y, index: number) => SITE_TONE_Y[tone] + index * 0.03;

/** 캐노피 아래 포장 패드 높이 — 패드끼리만 겹치므로 순번마다 띄운다 */
export const sitePadY = (index: number) => GROUND_Y.site + 0.02 + index * 0.03;
