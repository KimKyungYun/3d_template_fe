/**
 * 파라미터가 없는 정적 경로만 둔다.
 * `:plantId` 가 붙는 뎁스 경로는 buildPath.ts 의 빌더로 만든다 — Link 의 타입 검사를 헐겁게 하지 않으려는 것이다.
 */
export const PATH = {
  /** 대시보드 — 발전소를 고르면 3D 가 그 자리로 날아간다 */
  HOME: '/',
  LOGIN: '/login',
  /** 발전통계 — 발전소 › 인버터 */
  STATISTICS: '/statistics',
  /** 고장진단 — 발전소 › 인버터 */
  DIAGNOSIS: '/diagnosis',
} as const;

export type StaticPath = (typeof PATH)[keyof typeof PATH];
