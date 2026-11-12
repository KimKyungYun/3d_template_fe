/*
  설비 랙 상세 모델이 쓰는 치수와 지오메트리.
  좌표는 랙 바닥 가운데(지면 y=0) 기준이고 +z 가 앞면(인버터 쪽), −z 가 뒷면(접속반 함 쪽)입니다.
  누를 일 없는 반복 장식(방열판 핀, 덕트 슬릿, 단자 나사, 레일 볼트)은 한 덩이로 합쳐
  랙 하나의 draw call 을 줄이고, 모든 지오메트리는 처음 쓸 때 한 번만 만들어 랙 수십 대가 나눠 씁니다.
*/
import { BoxGeometry, CylinderGeometry, PlaneGeometry, Quaternion, SphereGeometry, Vector3 } from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { BufferGeometry } from 'three';

/** 처음 쓸 때 한 번만 만든다 — 모듈을 불러오는 것만으로 지오메트리를 만들지 않도록 */
function once<T>(make: () => T): () => T {
  let value: T | undefined;
  let done = false;

  return () => {
    if (!done) {
      value = make();
      done = true;
    }

    return value as T;
  };
}

/** 상자 하나 — 중심을 옮겨 둔 채로 돌려준다 (합치기 전에 자리를 잡아 두는 용도) */
export const box = (w: number, h: number, d: number, x = 0, y = 0, z = 0): BufferGeometry =>
  new BoxGeometry(w, h, d).translate(x, y, z);

/** 두 점을 잇는 원통 — 케이블·배관에 쓴다 */
export function tube(a: Vector3, b: Vector3, radius: number, radial = 6): BufferGeometry {
  const dir = new Vector3().subVectors(b, a);
  const len = dir.length() || 0.001;
  const g = new CylinderGeometry(radius, radius, len, radial, 1);

  g.applyQuaternion(new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), dir.clone().normalize()));
  g.translate((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);

  return g;
}

const merge = (parts: BufferGeometry[]): BufferGeometry => mergeGeometries(parts)!;

/* ───────────── 치수 ───────────── */

/** 아연도금 강관 랙 — 각관 기둥 네 개에 가로대를 걸고 바닥 앞쪽에 케이블 트레이를 단다 */
export const RACK = {
  /** 기둥 중심 자리 */
  halfX: 0.4,
  halfZ: 0.18,
  post: 0.06,
  height: 1.72,
  /** 가로대 높이 — 인버터와 접속반 함이 여기에 걸린다 */
  railLow: 0.72,
  railHigh: 1.52,
} as const;

/** 앞면 인버터 (DASS 25) */
export const INVERTER = { w: 0.6, h: 0.75, d: 0.25, y: 1.125, z: 0.33 } as const;

/** 뒷면 접속반 함 — 문이 −z 를 향한다. 함 높이는 한 대든 두 대든 같게 두고 자리만 달리한다 */
export const CABINET = { w: 0.8, h: 0.78, d: 0.26, z: -0.35, wall: 0.015 } as const;

/** 한 함의 퓨즈 칸 수 */
export const SLOTS_PER_BOARD = 10;
const SLOT_GAP = 0.069;

/** 함 안에서 i 번째 칸의 x 자리 */
export const slotX = (slot: number): number => -0.311 + slot * SLOT_GAP;

/** 함 안쪽 기준선 — 함 중심 기준 로컬 좌표 */
export const BOARD = {
  /** 부착판 앞면 */
  plateZ: 0.1,
  /** (+)입력 퓨즈 줄 */
  plusY: 0.278,
  /** (−)입력 퓨즈 줄 */
  minusY: -0.195,
  /** (+)줄 아래 주황 단자 */
  plusTerminalY: 0.238,
  /** (−)줄은 파란 받침을 지나 단자가 더 아래에 붙는다 */
  minusTerminalY: -0.253,
  /** 퓨즈 홀더가 앉는 깊이 */
  holderZ: 0.083,
  /** 주황 단자가 앉는 깊이 */
  terminalZ: 0.087,
  /** 케이블 글랜드가 놓인 함 바닥 */
  glandY: -0.352,
} as const;

/* ───────────── 랙 구조물 ───────────── */

/** 각관 기둥·가로대·발판·케이블 트레이를 한 덩이로 */
export const rackGeometry = once(() => {
  const { halfX, halfZ, post, height, railLow, railHigh } = RACK;
  const parts: BufferGeometry[] = [];

  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      parts.push(box(post, height, post, sx * halfX, height / 2, sz * halfZ));
      parts.push(box(0.14, 0.02, 0.14, sx * halfX, 0.01, sz * halfZ));
    }

    // 옆면을 잇는 짧은 가로대
    for (const y of [railLow, railHigh]) {
      parts.push(box(0.05, 0.055, halfZ * 2, sx * halfX, y, 0));
    }
  }

  // 앞뒤 긴 가로대
  for (const y of [railLow, railHigh]) {
    for (const sz of [-1, 1]) {
      parts.push(box(halfX * 2 - post, 0.065, 0.045, 0, y, sz * halfZ));
    }
  }

  // 바닥 앞쪽 케이블 트레이 (각관 트레이) — 가로대 하나에 얕은 바닥판과 양옆 턱
  parts.push(box(halfX * 2 + 0.1, 0.012, 0.24, 0, 0.3, 0.34));
  parts.push(box(halfX * 2 + 0.1, 0.05, 0.016, 0, 0.32, 0.34 - 0.112));
  parts.push(box(halfX * 2 + 0.1, 0.05, 0.016, 0, 0.32, 0.34 + 0.112));
  parts.push(box(0.05, 0.3, 0.05, 0, 0.15, 0.34));

  // 트레이 가로살 — 사다리꼴 트레이 느낌만 낸다
  for (let i = 0; i < 9; i += 1) {
    parts.push(box(0.018, 0.016, 0.21, -0.4 + i * 0.1, 0.308, 0.34));
  }

  return merge(parts);
});

/* ───────────── 인버터 ───────────── */

/** 옆면 방열판 핀 — 양옆 14장씩 */
export const finGeometry = once(() => {
  const parts: BufferGeometry[] = [];
  const count = 14;

  for (let i = 0; i < count; i += 1) {
    const z = INVERTER.z - INVERTER.d / 2 + 0.03 + (i * (INVERTER.d - 0.06)) / (count - 1);

    for (const sx of [-1, 1]) {
      parts.push(box(0.03, INVERTER.h - 0.12, 0.009, sx * (INVERTER.w / 2 + 0.014), INVERTER.y, z));
    }
  }

  return merge(parts);
});

/** 인버터 아래 DC 커넥터 줄과 케이블 — 트레이 쪽으로 빠진다 */
export const dcConnectorGeometry = once(() => {
  const parts: BufferGeometry[] = [];
  const bottom = INVERTER.y - INVERTER.h / 2;

  for (let i = 0; i < 8; i += 1) {
    const x = -0.21 + i * 0.06;

    parts.push(new CylinderGeometry(0.014, 0.016, 0.05, 8).translate(x, bottom - 0.025, INVERTER.z));
  }

  return merge(parts);
});

export const dcCableGeometry = once(() => {
  const parts: BufferGeometry[] = [];
  const bottom = INVERTER.y - INVERTER.h / 2 - 0.045;

  for (let i = 0; i < 8; i += 1) {
    const x = -0.21 + i * 0.06;
    const mid = new Vector3(x, 0.52, INVERTER.z + 0.03);

    parts.push(tube(new Vector3(x, bottom, INVERTER.z), mid, 0.009));
    parts.push(tube(mid, new Vector3(x * 0.5, 0.33, 0.34), 0.009));
  }

  return merge(parts);
});

/* ───────────── 접속반 함 ───────────── */

/** 스테인리스 함 몸통 — 뒤판·천장·바닥·양옆 (문은 따로) */
export const cabinetShellGeometry = once(() => {
  const { w, h, d, wall } = CABINET;
  const half = d / 2;

  return merge([
    box(w, h, wall, 0, 0, half - wall / 2),
    box(w, wall, d, 0, h / 2 - wall / 2, 0),
    box(w, wall, d, 0, -h / 2 + wall / 2, 0),
    box(wall, h - wall * 2, d, -w / 2 + wall / 2, 0, 0),
    box(wall, h - wall * 2, d, w / 2 - wall / 2, 0, 0),
  ]);
});

/** 문짝 테두리 — 가운데 창을 비워 둔 네 짝. 경첩을 원점으로 그린다 */
export const doorFrameGeometry = once(() => {
  const { w } = CABINET;

  return merge([
    box(w, 0.17, 0.012, w / 2, 0.305, 0),
    box(w, 0.21, 0.012, w / 2, -0.285, 0),
    box(0.14, 0.4, 0.012, 0.07, 0.02, 0),
    box(0.14, 0.4, 0.012, w - 0.07, 0.02, 0),
  ]);
});

/** 문 손잡이 — 바깥(−z)으로 나온 막대 */
export const doorHandleGeometry = once(() =>
  merge([
    box(0.028, 0.11, 0.022, 0.73, -0.26, -0.022),
    box(0.024, 0.028, 0.03, 0.73, -0.2, -0.012),
    box(0.024, 0.028, 0.03, 0.73, -0.32, -0.012),
  ]));

/** 흰 케이블 덕트 두 줄 — 뚜껑에 슬릿을 판다 */
export const ductGeometry = once(() => {
  const parts: BufferGeometry[] = [];
  const rows: [number, number][] = [[0.178, 0.055], [-0.118, 0.045]];

  for (const [y, height] of rows) {
    parts.push(box(0.72, height, 0.045, 0, y, BOARD.plateZ - 0.0225));

    for (let i = 0; i < 17; i += 1) {
      parts.push(box(0.006, height * 0.55, 0.004, -0.33 + i * 0.041, y, BOARD.plateZ - 0.047));
    }
  }

  return merge(parts);
});

/** (+)·(−) 줄의 받침 — 녹색 기판 띠와 (−)쪽 파란 받침, DIN 레일과 볼트 */
export const rowSubstrateGeometry = once(() =>
  merge([
    box(0.72, 0.09, 0.006, 0, BOARD.plusY - 0.02, BOARD.plateZ - 0.003),
    box(0.72, 0.09, 0.006, 0, BOARD.minusY - 0.03, BOARD.plateZ - 0.003),
  ]));

/** (−)쪽 파란 받침 띠 */
export const blueBaseGeometry = once(() => box(0.72, 0.024, 0.032, 0, BOARD.minusY - 0.036, BOARD.plateZ - 0.018));

/** 함 안쪽 부착판 */
export const mountPlateGeometry = once(() => box(0.74, 0.72, 0.008, 0, 0, BOARD.plateZ + 0.004));

/** 문 창 유리 — 경첩을 원점으로 그린다 */
export const doorWindowGeometry = once(() => box(0.52, 0.4, 0.004, CABINET.w / 2, 0.02, 0));

/** 가운데 칸 DIN 레일과 그 위 소형 차단기 — 누를 일 없는 장식 */
export const railGeometry = once(() => {
  const parts: BufferGeometry[] = [box(0.46, 0.012, 0.014, 0.02, -0.03, BOARD.plateZ - 0.012)];

  for (let i = 0; i < 6; i += 1) {
    parts.push(new CylinderGeometry(0.004, 0.004, 0.01, 6).rotateX(Math.PI / 2).translate(-0.18 + i * 0.08, -0.03, BOARD.plateZ - 0.022));
  }

  for (let i = 0; i < 3; i += 1) {
    parts.push(box(0.016, 0.07, 0.042, 0.112 + i * 0.018, 0.015, BOARD.plateZ - 0.024));
  }

  return merge(parts);
});

/** 퓨즈 홀더 한 칸 — 흰 몸체 두 개 */
export const fuseHolderGeometry = once(() =>
  merge([
    box(0.024, 0.062, 0.034, -0.016, 0, 0),
    box(0.024, 0.062, 0.034, 0.016, 0, 0),
    box(0.056, 0.008, 0.03, 0, 0.035, 0),
  ]));

/** 퓨즈 칸 아래 주황 단자 한 쌍 */
export const fuseTerminalGeometry = once(() =>
  merge([
    box(0.019, 0.018, 0.026, -0.016, 0, 0),
    box(0.019, 0.018, 0.026, 0.016, 0, 0),
  ]));

/** 정상 칸의 주황 단자를 (+)·(−) 두 줄 통틀어 한 덩이로 — 이상 칸은 Part 안에서 따로 그린다 */
export function mergedTerminals(slots: number[], rows: number[], z: number): BufferGeometry | null {
  if (slots.length === 0) return null;

  const parts = slots.flatMap((slot) => rows.map((y) => fuseTerminalGeometry().clone().translate(slotX(slot), y, z)));

  return merge(parts);
}

/** 단자대 두 개 — 검정 몸체에 단자 줄 */
export const terminalBlockGeometry = once(() => {
  const parts: BufferGeometry[] = [];

  for (const x of [-0.3, -0.19]) {
    parts.push(box(0.085, 0.032, 0.035, x, 0.055, BOARD.plateZ - 0.018));

    for (let i = 0; i < 6; i += 1) {
      parts.push(new CylinderGeometry(0.0035, 0.0035, 0.008, 6).rotateX(Math.PI / 2).translate(x - 0.033 + i * 0.013, 0.055, BOARD.plateZ - 0.039));
    }
  }

  return merge(parts);
});

/** 스트링 감시 PCB — 녹색 기판에 칩 몇 개 */
export const monitorPcbGeometry = once(() =>
  merge([
    box(0.12, 0.072, 0.008, -0.05, 0.03, BOARD.plateZ - 0.004),
    box(0.03, 0.016, 0.006, -0.08, 0.05, BOARD.plateZ - 0.011),
    box(0.022, 0.022, 0.006, -0.03, 0.045, BOARD.plateZ - 0.011),
    box(0.05, 0.012, 0.008, -0.05, 0.004, BOARD.plateZ - 0.012),
  ]));

/** SMPS — DIN 레일 위 직류 전원 */
export const smpsGeometry = once(() =>
  merge([
    box(0.055, 0.078, 0.045, 0.068, 0.018, BOARD.plateZ - 0.0225),
    box(0.05, 0.012, 0.012, 0.068, -0.025, BOARD.plateZ - 0.051),
  ]));

/** MCCB — 큰 회색 몸체에 손잡이 */
export const mccbGeometry = once(() =>
  merge([
    box(0.13, 0.19, 0.075, 0.253, 0.01, BOARD.plateZ - 0.037),
    box(0.046, 0.058, 0.024, 0.253, 0.01, BOARD.plateZ - 0.086),
    box(0.13, 0.02, 0.055, 0.253, 0.09, BOARD.plateZ - 0.027),
    box(0.13, 0.02, 0.055, 0.253, -0.07, BOARD.plateZ - 0.027),
  ]));

/** SPD — 서지 보호기 */
export const spdGeometry = once(() =>
  merge([
    box(0.046, 0.086, 0.05, 0.352, 0.02, BOARD.plateZ - 0.025),
    box(0.03, 0.012, 0.008, 0.352, 0.056, BOARD.plateZ - 0.052),
  ]));

/** 함 바닥 케이블 글랜드 묶음 — 검정 고무 */
export const glandGeometry = once(() => {
  const parts: BufferGeometry[] = [];

  for (let i = 0; i < SLOTS_PER_BOARD; i += 1) {
    const x = slotX(i);

    parts.push(new CylinderGeometry(0.011, 0.013, 0.026, 8).translate(x, BOARD.glandY, 0.02));
    parts.push(new CylinderGeometry(0.008, 0.005, 0.03, 8).translate(x, BOARD.glandY - 0.026, 0.02));
  }

  return merge(parts);
});

/** 왼쪽 아래 굵은 전원 케이블 두 가닥 (빨강·검정 자리) */
export const powerCableGeometry = once(() =>
  merge([
    tube(new Vector3(-0.34, 0.03, 0.06), new Vector3(-0.36, -0.3, 0.02), 0.014, 8),
    tube(new Vector3(-0.36, -0.3, 0.02), new Vector3(-0.3, -0.39, 0.0), 0.014, 8),
  ]));

/** 스트링 케이블 한 가닥 — (−) 단자에서 바닥 글랜드로 */
export function stringCable(slot: number, cut: boolean): BufferGeometry {
  const x = slotX(slot);
  const from = new Vector3(x, BOARD.minusTerminalY - 0.008, BOARD.terminalZ - 0.014);
  const to = new Vector3(x, BOARD.glandY + 0.014, 0.02);

  if (!cut) return tube(from, to, 0.0062, 6);

  // 결선 불량 — 가운데를 끊어 빈 구간을 둔다
  const a = from.clone().lerp(to, 0.42);
  const b = from.clone().lerp(to, 0.62);

  return merge([tube(from, a, 0.0062, 6), tube(b, to, 0.0062, 6)]);
}

/** 정상 스트링 케이블을 한 덩이로 */
export function mergedCables(slots: number[]): BufferGeometry | null {
  if (slots.length === 0) return null;

  return merge(slots.map((slot) => stringCable(slot, false)));
}

/** 끊긴 자리에 띄우는 작은 구 */
export const breakGeometry = once(() => new SphereGeometry(0.011, 8, 6));

/** 경고 스티커 판 세 장 — 문 쪽(−z)을 보게 돌린 뒤 자리를 잡는다 */
export const stickerGeometry = once(() => {
  const face = (size: number, x: number, y: number, z: number) =>
    new PlaneGeometry(size, size).rotateY(Math.PI).translate(x, y, z);

  return merge([
    face(0.05, 0.12, 0.345, BOARD.plateZ - 0.005),
    face(0.044, -0.02, -0.165, BOARD.plateZ - 0.005),
    face(0.044, 0.33, 0.12, BOARD.plateZ - 0.056),
  ]);
});

/** 인버터 앞판 — 문구·통풍구를 그린 판 (+z 를 본다) */
export const inverterFaceGeometry = once(() => new PlaneGeometry(INVERTER.w - 0.04, INVERTER.h - 0.05));

/** 인버터 표시창 */
export const displayGeometry = once(() => new PlaneGeometry(0.16, 0.1));

/** 표시창 옆 LED 한 알 */
export const ledGeometry = once(() => new CylinderGeometry(0.0085, 0.0085, 0.006, 10).rotateX(Math.PI / 2));

/** 앞판 위에서 표시창·LED 가 앉는 자리 (인버터 중심 기준) */
export const FACE = {
  /** 앞판 바로 앞 */
  z: INVERTER.z + INVERTER.d / 2,
  displayY: 0.037,
  ledY: -0.07,
  ledX: 0.0656,
} as const;
