/** 목 응답에 네트워크 지연을 흉내 낸다 — 로딩 상태가 실제처럼 한 번은 보이게 */
export const delay = (ms = 240) => new Promise<void>((resolve) => { setTimeout(resolve, ms); });
