/*
  이상 점등·스캔 선. 유니폼은 씬마다 한 벌 만든다 —
  한 화면에 3D 가 둘 이상 떠도(홈 + 미니 씬) 서로의 스캔 위치를 흔들지 않게.
*/
import { Color } from 'three';
import type { AlertStatus, EquipmentAlert } from '@/interface/diagnosis';
import type { PlantGeometry, Vec3 } from '@/plants/model/types';
import { stringModules } from './strings';
import { moduleAnchor } from './labels';
import type { WebGLProgramParametersWithUniforms } from 'three';

/** 셰이더에 넘기는 인스턴스별 이상 단계 — 0 이면 정상 */
const ALERT_LEVEL: Record<AlertStatus, number> = { fault: 1, degraded: 2, commLost: 3 };

/** 스캔 한 번 길이 (ms) — 선이 전체를 훑는 시간 */
export const SCAN_DURATION = 2600;

/** 스캔 주기 (ms) — 한 스캔이 시작해 다음 스캔이 시작하기까지 */
export const SCAN_CYCLE = 10000;

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

/** 스캔 선의 지금 월드 X — 스캔 중이 아니면 null. 3D 셰이더와 2D 목록 하이라이트가 같은 값을 쓴다 */
export function scanPositionAt(
  range: { from: number; to: number },
  startedAt: number | null,
  now: number,
  duration = SCAN_DURATION,
) {
  if (startedAt === null || duration <= 0) return null;

  const t = (now - startedAt) / duration;

  if (t < 0 || t >= 1) return null;

  return range.from + (range.to - range.from) * easeInOut(t);
}

/** 처음 스캔까지 기다리는 시간 (ms) — 화면에 들어오자마자 바로 훑는다 */
export const SCAN_FIRST_DELAY = 250;

/** 첫 스캔 한 번 길이 (ms) — 첫 결과를 빨리 보이도록 평소보다 짧게 */
export const SCAN_FIRST_DURATION = 900;

/** 선 앞머리 두께와 뒤로 남는 잔광 길이 (m) */
const SCAN_HEAD = 6;
const SCAN_TRAIL = 80;

/** 한 장씩 스캔에서 모듈이 번쩍이는 길이 (진행도 단위) */
const SEQ_FLASH = 0.03;

/** 햇빛 반사 띠의 반폭 (m) */
const SWEEP_HALF = 16;

/** 햇빛 반사 띠가 흐르는 방향 — 남서에서 북동으로 (x 동, z 남) */
export const SWEEP_AXIS: [number, number] = [Math.SQRT1_2, -Math.SQRT1_2];

/** 이상 설비에 해당하는 모듈 번호 — 스트링 단위면 스트링 배분 근사 위치 */
const alertModules = (model: PlantGeometry, alert: EquipmentAlert): number[] =>
  stringModules(model, alert.unitId, alert.no, alert.strings);

/** 호기 모듈마다 이상 단계 (모듈 순서 = 배치 순서) */
export function moduleAlertLevels(model: PlantGeometry, unitId: string, alerts: EquipmentAlert[]): Float32Array {
  const levels = new Float32Array(model.units[unitId]?.modules.inverter.length ?? 0);

  for (const a of alerts) {
    if (a.unitId !== unitId) continue;

    for (const i of alertModules(model, a)) levels[i] = ALERT_LEVEL[a.status];
  }

  return levels;
}

/** 이상 카드 DOM 키 */
export const alertLabelKey = (alert: EquipmentAlert) => `alert:${alert.key}`;

/** 같은 설비라도 상태·이름·스트링이 바뀌면 다른 이상으로 본다 */
export const alertSignature = (a: EquipmentAlert) =>
  `${a.key}|${a.status}|${a.label}|${a.strings?.join(',') ?? '*'}`;

/** 이상 카드를 세울 월드 좌표 */
export const alertAnchor = (model: PlantGeometry, alert: EquipmentAlert): Vec3 | null =>
  moduleAnchor(model, alert.unitId, alertModules(model, alert));

/** 스캔 선이 지나는 월드 X 범위 — 모든 모듈의 양 끝에서 조금 더 */
export function scanRangeOf(model: PlantGeometry) {
  let min = Infinity;
  let max = -Infinity;

  for (const unitId of model.unitIds) {
    const layout = model.units[unitId];

    if (!layout) continue;

    for (const m of layout.modules.matrices) {
      const x = m.elements[12] + layout.origin[0];

      min = Math.min(min, x);
      max = Math.max(max, x);
    }
  }

  if (!Number.isFinite(min)) return { from: -100, to: 100 };

  return { from: min - 30, to: max + 30 };
}

/** 대각선 띠가 지나는 범위 — 모든 모듈을 SWEEP_AXIS 위에 투영한 양 끝에서 조금 더 */
export function sweepRangeOf(model: PlantGeometry) {
  let min = Infinity;
  let max = -Infinity;

  for (const unitId of model.unitIds) {
    const layout = model.units[unitId];

    if (!layout) continue;

    for (const m of layout.modules.matrices) {
      const along = (m.elements[12] + layout.origin[0]) * SWEEP_AXIS[0] + (m.elements[14] + layout.origin[2]) * SWEEP_AXIS[1];

      min = Math.min(min, along);
      max = Math.max(max, along);
    }
  }

  if (!Number.isFinite(min)) return { from: -100, to: 100 };

  return { from: min - 40, to: max + 40 };
}

/** 정수 해시 → 0~1 (모듈마다 고정된 흔들림) */
const hash01 = (i: number) => {
  let h = Math.imul(i ^ 0x9e3779b9, 0x85ebca6b);

  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;

  return (h >>> 0) / 4294967296;
};

/**
 * 한 장씩 스캔 순서 (0~1). 서쪽에서 동쪽으로 훑되 모듈마다 조금씩 흔들어,
 * 매끈한 선이 아니라 패널이 하나하나 '쫘라라락' 켜지는 것처럼 보이게 한다
 */
export function moduleScanOrder(model: PlantGeometry, unitId: string): Float32Array {
  const layout = model.units[unitId];
  const orders = new Float32Array(layout?.modules.matrices.length ?? 0);

  if (!layout) return orders;

  const { from, to } = scanRangeOf(model);
  const span = Math.max(1, to - from);

  layout.modules.matrices.forEach((m, i) => {
    const x = (m.elements[12] + layout.origin[0] - from) / span;

    orders[i] = Math.min(1, Math.max(0, x * 0.9 + hash01(i + unitId.length * 7919) * 0.1));
  });

  return orders;
}

interface AlertUniforms {
  uTime: { value: number };
  /** 선 앞머리의 월드 X */
  uScanPos: { value: number };
  uScanOn: { value: number };
  uAlertOn: { value: number };
  /** 1 이면 깜빡이고, 0 이면 고정 점등 (동작 줄이기) */
  uBlink: { value: number };
  uScanColor: { value: Color };
  uFault: { value: Color };
  uCaution: { value: Color };
  uOffline: { value: Color };
  // ── 연출(로그인·배너) ─────────────────────────────────
  /** 1 이면 연출 모드 — 이상 점등이 스캔이 지나간 모듈에만 드러난다 */
  uShowOn: { value: number };
  /** 한 장씩 스캔 진행도 (0~1.1) — 모듈의 scanOrder 보다 크면 스캔을 마친 모듈 */
  uSeqProgress: { value: number };
  /** 스캔을 마친 모듈에 남는 옅은 확인 빛 (0~1) */
  uChecked: { value: number };
  /** 햇빛 반사 띠 — 남서→북동 대각선 위의 월드 위치 */
  uSweepOn: { value: number };
  uSweepPos: { value: number };
  uSweepColor: { value: Color };
}

/**
 * 한 씬의 모듈 재질이 함께 쓰는 유니폼과 그 값을 바꾸는 손잡이.
 * 값을 바꾸는 일은 모두 이 안에서 한다 — 컴포넌트가 유니폼 객체를 직접 고치면
 * 셰이더가 쓰는 객체와 리액트가 보는 값이 어긋나기 쉽다
 */
export interface AlertShader {
  /** 재질에 그대로 넘기는 유니폼 — three 가 직접 읽는다 */
  uniforms: AlertUniforms;
  /** 재질에 얹는 onBeforeCompile */
  onBeforeCompile: (shader: WebGLProgramParametersWithUniforms) => void;
  setTime: (seconds: number) => void;
  /** 스캔 선 — on 이 false 면 선을 그리지 않는다 */
  setScan: (on: boolean, worldX: number) => void;
  setColors: (colors: { fault: string; caution: string; offline: string; scan: string }) => void;
  /** alertOn: 이상 점등 켜기, blink: 깜빡임 (동작 줄이기면 false) */
  setFlags: (alertOn: boolean, blink: boolean) => void;
  /** 연출 — on 이면 progress 까지 스캔한 모듈만 이상이 드러나고, 막 지나간 모듈이 번쩍인다 */
  setShow: (on: boolean, progress: number, checked: number) => void;
  /** 햇빛 반사 띠 — on 이 false 면 그리지 않는다 */
  setSweep: (on: boolean, position: number, color?: string) => void;
}

/** 씬마다 한 벌 만든다 — 3D 가 둘 이상 떠도 서로의 스캔 위치를 흔들지 않게 */
export function createAlertShader(): AlertShader {
  const uniforms: AlertUniforms = {
    uTime: { value: 0 },
    uScanPos: { value: 0 },
    uScanOn: { value: 0 },
    uAlertOn: { value: 1 },
    uBlink: { value: 1 },
    uScanColor: { value: new Color('#6fd3ff') },
    uFault: { value: new Color('#ff4d5e') },
    uCaution: { value: new Color('#ff9d2e') },
    uOffline: { value: new Color('#7a8699') },
    uShowOn: { value: 0 },
    uSeqProgress: { value: 0 },
    uChecked: { value: 0 },
    uSweepOn: { value: 0 },
    uSweepPos: { value: 0 },
    uSweepColor: { value: new Color('#ffe2a8') },
  };

  return {
    uniforms,
    onBeforeCompile: alertShader(uniforms),
    setTime: (seconds) => {
      uniforms.uTime.value = seconds;
    },
    setScan: (on, worldX) => {
      uniforms.uScanOn.value = on ? 1 : 0;
      if (on) uniforms.uScanPos.value = worldX;
    },
    setColors: (colors) => {
      uniforms.uFault.value.set(colors.fault);
      uniforms.uCaution.value.set(colors.caution);
      uniforms.uOffline.value.set(colors.offline);
      uniforms.uScanColor.value.set(colors.scan);
    },
    setFlags: (alertOn, blink) => {
      uniforms.uAlertOn.value = alertOn ? 1 : 0;
      uniforms.uBlink.value = blink ? 1 : 0;
    },
    setShow: (on, progress, checked) => {
      uniforms.uShowOn.value = on ? 1 : 0;
      uniforms.uSeqProgress.value = progress;
      uniforms.uChecked.value = checked;
    },
    setSweep: (on, position, color) => {
      uniforms.uSweepOn.value = on ? 1 : 0;
      uniforms.uSweepPos.value = position;
      if (color) uniforms.uSweepColor.value.set(color);
    },
  };
}

/**
 * 모듈 재질에 이상 점등과 스캔 선을 얹는 onBeforeCompile 을 만든다.
 * 이상 단계는 인스턴스 속성 alertLevel, 선 위치는 인스턴스 원점의 월드 X 로 판단한다
 */
function alertShader(uniforms: AlertUniforms) {
  return (shader: WebGLProgramParametersWithUniforms) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
attribute float alertLevel;
attribute float scanOrder;
varying float vAlert;
varying float vOrder;
varying vec2 vScanXZ;`,
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
vAlert = alertLevel;
vOrder = scanOrder;
#ifdef USE_INSTANCING
vScanXZ = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xz;
#else
vScanXZ = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xz;
#endif`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
uniform float uTime;
uniform float uScanPos;
uniform float uScanOn;
uniform float uAlertOn;
uniform float uBlink;
uniform vec3 uScanColor;
uniform vec3 uFault;
uniform vec3 uCaution;
uniform vec3 uOffline;
uniform float uShowOn;
uniform float uSeqProgress;
uniform float uChecked;
uniform float uSweepOn;
uniform float uSweepPos;
uniform vec3 uSweepColor;
varying float vAlert;
varying float vOrder;
varying vec2 vScanXZ;`,
      )
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
// 연출 모드에서는 스캔이 지나간 모듈만 이상이 드러난다
float revealed = uShowOn > 0.5 ? step(vOrder, uSeqProgress) : 1.0;
if (uAlertOn > 0.5 && vAlert > 0.5 && revealed > 0.5) {
  vec3 alertColor = vAlert < 1.5 ? uFault : (vAlert < 2.5 ? uCaution : uOffline);
  float pulse = mix(0.7, 0.5 + 0.5 * sin(uTime * 3.4), uBlink);
  diffuseColor.rgb = mix(diffuseColor.rgb, alertColor, 0.8);
  totalEmissiveRadiance += alertColor * (0.15 + 0.6 * pulse);
}
if (uScanOn > 0.5) {
  // d > 0: 선이 지나간 뒤(잔광), d < 0: 아직 오지 않은 앞쪽
  float d = uScanPos - vScanXZ.x;
  float head = 1.0 - smoothstep(0.0, ${SCAN_HEAD.toFixed(1)}, abs(d));
  float trail = d > 0.0 ? 1.0 - smoothstep(0.0, ${SCAN_TRAIL.toFixed(1)}, d) : 0.0;
  diffuseColor.rgb = mix(diffuseColor.rgb, uScanColor, head * 0.8);
  totalEmissiveRadiance += uScanColor * (head * 2.2 + trail * trail * 0.7);
}
if (uShowOn > 0.5) {
  // 한 장씩 스캔 — 막 지나간 모듈이 번쩍이고, 지나간 자리에는 옅은 확인 빛이 남는다
  float seq = uSeqProgress - vOrder;
  float flash = seq > 0.0 ? 1.0 - smoothstep(0.0, ${SEQ_FLASH.toFixed(3)}, seq) : 0.0;
  float checked = seq > 0.0 ? uChecked : 0.0;
  diffuseColor.rgb = mix(diffuseColor.rgb, uScanColor, flash * 0.85);
  totalEmissiveRadiance += uScanColor * (flash * 2.8 + checked * 0.08);
}
if (uSweepOn > 0.5) {
  // 햇빛 반사 — 대각선 띠가 패널 위를 쓸고 지나간다
  float along = dot(vScanXZ, vec2(${SWEEP_AXIS[0].toFixed(6)}, ${SWEEP_AXIS[1].toFixed(6)}));
  float glint = 1.0 - smoothstep(0.0, ${SWEEP_HALF.toFixed(1)}, abs(along - uSweepPos));
  diffuseColor.rgb = mix(diffuseColor.rgb, uSweepColor, glint * 0.45);
  totalEmissiveRadiance += uSweepColor * glint * glint * 1.6;
}`,
      );
  };
}
