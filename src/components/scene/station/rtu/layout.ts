/*
  RTU 함 치수와 부품 자리 — 받은 함 내부 사진의 격자 비율을 m 로 옮긴 값.
  원점은 함을 받치는 기둥 바닥 가운데(지면 y=0), 로컬 +z 가 함 앞면(문 쪽)이다.
  함 안쪽 좌표는 모두 함 가운데를 기준으로 적고, 함 한 벌을 CABINET_Z 만큼 기둥 앞으로 내보낸다.
*/

/** 함이 기둥 앞으로 나온 거리 — 함 안쪽 좌표는 이 자리를 원점으로 적는다 */
export const CABINET_Z = 0.18;

/** 외함 — 밝은 회색 플라스틱 함체 */
export const CABINET = {
  width: 0.5,
  height: 0.65,
  depth: 0.22,
  /** 함 바닥 높이 */
  bottom: 1,
  /** 함체 벽 두께 */
  wall: 0.02,
} as const;

export const CABINET_TOP = CABINET.bottom + CABINET.height;
export const CABINET_MID_Y = CABINET.bottom + CABINET.height / 2;
export const HALF_W = CABINET.width / 2;
export const HALF_D = CABINET.depth / 2;

/** 부품이 올라앉는 뒤판 앞면 */
export const PANEL_Z = -0.085;
/** 배선이 지나는 깊이 — 뒤판과 부품 사이 */
export const WIRE_Z = -0.068;

/** 아연도금 각관 기둥 */
export const POST = { size: 0.08, top: 1.72 } as const;
/** 기둥 아래 베이스 판 */
export const BASE = { width: 0.3, height: 0.04 } as const;

/** 위 왼쪽 4P 차단기 */
export const BREAKER = { x: -0.1, y: 1.452, width: 0.14, height: 0.115, depth: 0.075 } as const;

/** 위 오른쪽 전력량계 */
export const METER = { x: 0.086, y: 1.462, width: 0.16, height: 0.17, depth: 0.068 } as const;
/** 전력량계 표시창에 그릴 고정 지침 */
export const METER_READING = '012457.3';

/** 가운데 줄 ID 수집 모듈 */
export const MODULE = { y: 1.265, width: 0.1, height: 0.055, depth: 0.045 } as const;

/**
 * 함 안에 붙박인 ID 모듈 자리 — 2D 결선도와 같은 구성(ID1→P2, ID2→P3, ID3→P4).
 * 데이터가 오기 전에도 같은 자리에 같은 수만큼 그린다
 */
export const MODULE_SLOTS = [
  { deviceId: 1, port: 2, x: -0.075 },
  { deviceId: 2, port: 3, x: 0.04 },
  { deviceId: 3, port: 4, x: 0.155 },
] as const;

/** 왼쪽 세로 DIN 레일에 선 RTU 본체 */
export const RTU_BODY = { x: -0.185, y: 1.285, width: 0.07, height: 0.18, depth: 0.05 } as const;

/** RTU 포트 높이 — P1 이 위, 아래로 P4 */
export const PORT_Y = [1.345, 1.315, 1.285, 1.255] as const;

/** 아래 오른쪽 DC 12V 단자대 */
export const DC_BLOCK = { x: 0.112, y: 1.138, width: 0.115, height: 0.05, depth: 0.04 } as const;

/** 아래 왼쪽 황동 접지 바 */
export const GROUND_BAR = { x: -0.069, y: 1.095, width: 0.11, size: 0.014 } as const;

/** 함 아래 글랜드 — 케이블이 빠져나가는 구멍 자리 */
export const GLAND_X = [-0.08, 0.02, 0.12] as const;

/** 실제 부품 색 — 정상일 때 쓰는 색. 정상을 초록으로 칠하지 않는다 */
export const RTU_COLORS = {
  shell: '#c9ced3',
  back: '#f2f4f6',
  post: '#9aa3ab',
  rail: '#b6bcc2',
  breaker: '#24272b',
  lever: '#f0f1f2',
  screw: '#8d949b',
  meter: '#b9bfc4',
  module: '#f3f5f6',
  pcb: '#1f7a3d',
  brass: '#b08d2e',
  block: '#26292d',
  rtu: '#3b4249',
  rtuFace: '#596470',
  cover: '#bcd8e8',
  frame: '#aeb5bb',
} as const;

/** 전선 색 */
export const WIRE_COLORS = {
  plus: '#d23b2e',
  gnd: '#1b1e21',
  rs485: '#2f6fd0',
  pin: '#e0b32a',
  dcplc: '#2f9e5a',
  earthYellow: '#d8c531',
  earthGreen: '#2f9e5a',
  mains: '#17191c',
  control: '#9aa3ab',
} as const;
