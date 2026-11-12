/*
  3D 모델 규약 — 발전소마다 다른 지오메트리를 한 모양(PlantModel)으로 맞춘다.
  씬 컴포넌트는 이 타입만 알고, 발전소별 빌더(plants/<발전소>/model.ts)가 값을 채운다.
*/
import type { PlantSpec } from '@/plants/types';
import type { ComponentType } from 'react';
import type { Matrix4 } from 'three';

export type Vec3 = [number, number, number];

export interface ModuleSize {
  /** 장변 (m) */
  length: number;
  /** 단변 (m) */
  width: number;
  thickness: number;
}

export interface ModuleSet {
  matrices: Matrix4[];
  /** 모듈별 인버터 번호 (1부터) */
  inverter: number[];
  /** 모듈별 스트링 구역 id */
  zone: string[];
}

export interface FrameSet {
  posts: Matrix4[];
  girders: Matrix4[];
  purlins: Matrix4[];
  braces: Matrix4[];
}

export interface TrayRoute {
  id: string;
  label: string;
  points: Vec3[];
  /** 지중 구간이면 점선으로 그린다 */
  underground?: boolean;
  /** 이 트레이로 스트링 케이블을 모으는 구역 id — 없으면 지나가기만 하는 간선 */
  zones?: string[];
  /** 툴팁 아래 줄에 적는 사양 — 발전소마다 다르므로 모델이 글을 쥔다 */
  note?: string;
}

export type EquipmentKind = 'room' | 'inverter' | 'kepco' | 'rtu';

export interface EquipmentItem {
  id: string;
  kind: EquipmentKind;
  label: string;
  position: Vec3;
  size: Vec3;
  rotationY: number;
  /** kind 가 inverter 일 때 인버터 번호 */
  inverterNo?: number;
  /** 툴팁 아래 줄에 적는 사양 */
  note?: string;
}

export type GroundTone = 'paving' | 'apron' | 'track';

/** 중심선을 따라 폭을 가진 바닥 띠 (산책로·트랙 등) */
export interface GroundRibbon {
  points: Vec3[];
  width: number;
  tone: GroundTone;
  closed?: boolean;
}

/** 가대 아래 포장면 (로컬 x·z 크기, y축 회전) */
export interface GroundPad {
  center: Vec3;
  size: [number, number];
  rotY: number;
}

/** 카메라가 담아야 할 범위 — 회전 중심과 반경 */
export interface FocusSpot {
  target: Vec3;
  radius: number;
}

export interface UnitLayout {
  /** 호기 열쇠 — PlantSpec.units[].id 와 같은 문자열 */
  unitId: string;
  /** 월드 좌표에서 이 호기의 원점 */
  origin: Vec3;
  modules: ModuleSet;
  frame: FrameSet;
  trays: TrayRoute[];
  equipment: EquipmentItem[];
  ground: { ribbons: GroundRibbon[]; pads: GroundPad[] };
  /** 카메라 포커스용 (로컬 좌표) */
  focus: FocusSpot;
}

/** 상시 떠 있는 장소 이름표 */
export interface SceneLabelData {
  key: string;
  unitId: string;
  kind: 'equipment' | 'landmark';
  /** equipment 면 설비 id */
  refId: string;
  text: string;
  /** 월드 좌표 */
  position: Vec3;
}

/** 3D 에서 고를 수 있는 것 */
export type Selection =
  | { kind: 'inverter'; unitId: string; no: number }
  | { kind: 'equipment'; unitId: string; id: string }
  | { kind: 'tray'; unitId: string; id: string };

/** 마우스를 올린 것 — 트레이는 호버 툴팁을 띄우지 않는다 */
export type HoverTarget =
  | { kind: 'inverter'; unitId: string; no: number }
  | { kind: 'equipment'; unitId: string; id: string };

/**
 * 결선 경로(개략) — 트레이 선을 그래프로 엮고, 인버터에 물린 모듈이 닿는 트레이 지점에서
 * 전기실까지 최단 경로를 이어 붙인다. 실제 케이블 포설도가 아니라 트레이를 따라간 근사 경로다
 */
export interface WireRoute {
  /** 직류 구간 — 모듈 쪽 끝에서 전기실 쪽으로 이어지는 꺾은선들 (흐름 방향 = 점 순서) */
  dc: Vec3[][];
  /** 트레이 끝에서 인버터 상자까지 내려가는 꺾은선들 (분해 보기에서 첫 점만 트레이와 함께 들린다) */
  drop: Vec3[][];
  /** 교류 구간 — 인버터 → 전기실 (→ 한전 PAD) */
  ac: Vec3[];
  /** 경유 트레이 id — 모듈 쪽에서 전기실 쪽 순서 */
  trays: string[];
  /** 가장 먼 모듈 접점에서 인버터까지 (m) */
  length: number;
}

/** 결선 불량 스트링 한 가닥 — 끊긴 지점에서 트레이를 따라 인버터까지, 살아 있는 선과 겹치지 않게 옆으로 비켜 놓는다 */
export interface StringLane {
  /** 끊긴 지점(스트링 모듈 묶음 가운데) → 트레이 점들 → 전기실 쪽 트레이 끝. 첫 점은 모듈과, 나머지는 트레이와 함께 들린다 */
  cable: Vec3[];
  /** 트레이 끝 → 인버터 상자 (첫 점만 트레이와 함께 들린다) */
  drop: Vec3[];
}

export interface UnitWiring {
  /** 인버터 번호별 결선 경로 */
  routes: Map<number, WireRoute>;
  /** 한 스트링의 꺼진 가닥 — slot 이 클수록 더 비킨다 */
  lane: (no: number, stringNo: number, slot: number) => StringLane | null;
}

/**
 * 배치까지만 끝난 모델 — 결선·이름표·스캔 범위를 계산하는 빌더가 이 조각만 받는다
 * (모델을 다 만들기 전에도 쓸 수 있도록 PlantModel 에서 떼어 놓았다)
 */
export interface PlantGeometry {
  spec: PlantSpec;
  /** 호기 열쇠 순서 (spec.units 순서) */
  unitIds: string[];
  /** 호기 열쇠 → 3D 배치 */
  units: Record<string, UnitLayout>;
}

/**
 * 발전소 3D 모델 한 벌. plants/registry.ts 가 처음 쓸 때 한 번 만들어 담아 둔다.
 * 호기 순회는 반드시 unitIds 순서로 — 호기 수와 열쇠는 발전소마다 다르다
 */
export interface PlantModel extends PlantGeometry {
  /** spec.id 와 같다 */
  id: string;
  /** 모듈 한 장 크기 — 모듈 박스·클릭 판·발광 판이 함께 쓴다 */
  moduleSize: ModuleSize;
  /** 호기 열쇠 → 결선 경로 */
  wiring: Record<string, UnitWiring>;
  /** 상시 장소 이름표 (월드 좌표) */
  labels: SceneLabelData[];
  /** 이상 스캔 선이 지나는 월드 X 범위 */
  scanRange: { from: number; to: number };
  /** 전체 보기의 회전 중심·반경 (월드 좌표) */
  overview: FocusSpot;
  /** 호기 열쇠 → 그 호기만 볼 때의 회전 중심·반경 (월드 좌표) */
  unitFocus: Record<string, FocusSpot>;
  /** 주변 환경 — 지형·하늘·부지 시설. 발전소마다 다른 R3F 노드 묶음 */
  Environment: ComponentType;
}

/** 호기가 spec.units 에서 몇 번째인지 — 인버터 범례 색이 호기마다 갈리도록 */
export const unitIndexOf = (model: PlantModel, unitId: string) => model.unitIds.indexOf(unitId);
