/*
  운전 상태·고장코드 메타.
  상태색은 3D 셰이더(점등)와 CSS 토큰이 함께 쓴다 — SCSS 쪽 값은 styles/tokens/_primitive.scss 의
  $critical-*·$caution-*·$offline-*·$ok-* 이며, 바꿀 때는 두 곳을 같이 고친다.
*/

export type OperationStatus = 'running' | 'degraded' | 'fault' | 'commLost';
export type StatusTone = 'ok' | 'caution' | 'critical' | 'offline';
export type ResolvedTheme = 'light' | 'dark';

/** short — 범례 칸처럼 좁은 자리에 쓰는 두 글자 이름 */
export const STATUS_META: Record<OperationStatus, { label: string; short: string; tone: StatusTone; rank: number }> = {
  fault: { label: '고장', short: '고장', tone: 'critical', rank: 0 },
  commLost: { label: '통신단절', short: '단절', tone: 'offline', rank: 1 },
  degraded: { label: '주의', short: '주의', tone: 'caution', rank: 2 },
  running: { label: '정상', short: '정상', tone: 'ok', rank: 3 },
};

/** 표·범례에 늘어놓는 순서 — 이상이 큰 것부터 */
export const STATUS_ORDER: OperationStatus[] = ['fault', 'commLost', 'degraded', 'running'];

export const STATUS_COLORS: Record<ResolvedTheme, Record<OperationStatus, string>> = {
  light: { running: '#0f9f6e', degraded: '#d9780a', fault: '#d92c3e', commLost: '#5b6577' },
  dark: { running: '#34d399', degraded: '#ff9d2e', fault: '#ff4d5e', commLost: '#7a8699' },
};

/** 3D 패널 기본 파랑 — 실제 패널 색. 정상은 초록으로 칠하지 않는다 */
export const PANEL_COLORS: Record<ResolvedTheme, string> = { light: '#1f4a9c', dark: '#2f5bb3' };

/** 스캔·선택 빛 */
export const ACCENT_COLORS: Record<ResolvedTheme, string> = { light: '#0a8fb3', dark: '#3ee0ff' };

/** 진단 효율(%) 판정 기준 — 이 아래면 주의, 고장 */
export const EFFICIENCY_WARN = 85;
export const EFFICIENCY_CRITICAL = 50;
