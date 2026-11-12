/*
  씬 하나의 상태. 페이지마다 독립된 스토어를 만들어 SceneProvider 가 들고 있다 —
  3D 가 한 화면에 둘 이상 떠도(홈 + 미니 씬) 선택·호버·스캔이 서로 섞이지 않게.
*/
import { createStore } from 'zustand';
import { alertSignature } from '@/plants/builders/alerts';
import { VIEW_ALL } from '@/plants/builders/camera';
import type { OperationStatus } from '@/configs/status';
import type { EquipmentAlert } from '@/interface/diagnosis';
import type { HeatScale } from '@/plants/builders/colors';
import type { HoverTarget, Selection, Vec3 } from '@/plants/model/types';
import type { StoreApi } from 'zustand';

/** 'all' 또는 호기 열쇠 */
export type ViewId = string;

export type ColorMode = 'default' | 'inverter' | 'zone' | 'heat';

/** 발전량 히트맵 — 인버터 열쇠('호기:번호') 마다 값. 값의 뜻은 scale 이 정한다 */
export interface HeatMap {
  scale: HeatScale;
  values: Record<string, number | null>;
}

export const heatKey = (unitId: string, no: number) => `${unitId}:${no}`;

/** 설비 부품 하나의 카드 내용 — 부품 모델이 데이터로 만들어 넘긴다 */
export interface PartInfo {
  /** 씬 안에서 유일한 열쇠 — '1:7:fuse+5' 처럼 */
  key: string;
  title: string;
  /** 제목 옆 작은 글 — 소속 설비 */
  subtitle?: string;
  /** 이상 상태 — 정상 부품은 null */
  status: OperationStatus | null;
  /** 상태·사양 줄 */
  lines: string[];
  /** 현장 조치 순서 */
  actions?: string[];
}

export interface PartSlice {
  selected: PartInfo | null;
  hovered: PartInfo | null;
  /** 카드 줄기를 세울 월드 좌표 */
  anchor: Vec3 | null;
  hoverAnchor: Vec3 | null;
  /** 마지막으로 연 카드 — 닫힐 때 옅어지는 애니메이션용 */
  lastSelected: PartInfo | null;
  /** 목록에서 고른 부품 — 그 부품 모델이 붙는 순간 스스로 골라지고 카메라를 부른다 */
  pendingKey: string | null;
}

/** 카메라를 한 점으로 다가가게 하는 요청 — 부품 목록에서 고를 때 */
export interface FocusRequest {
  target: Vec3;
  distance: number;
  /** 다가갈 방향 (수평 xz, 대상 → 카메라). 비우면 지금 보는 방향을 지킨다 */
  from: [number, number] | null;
  nonce: number;
}

export type LayerId = 'modules' | 'trays' | 'equipment' | 'details' | 'alerts';

export interface HoverSlice {
  target: HoverTarget | null;
  /** 툴팁 줄기를 세울 월드 좌표 (툴팁 없이 강조만 할 때는 null) */
  anchor: Vec3 | null;
  /** 마지막으로 툴팁을 띄운 대상·좌표 — 커서가 떠난 뒤에도 남겨 두어 사라지는 애니메이션을 그린다 */
  lastShown: { target: HoverTarget; anchor: Vec3 } | null;
}

export interface AlertSlice {
  /** 지금 도면에 점등·카드로 보이는 이상 설비 — 스캔이 끝날 때만 바뀐다 */
  shown: EquipmentAlert[];
  /** 마지막 스캔에서 새로 붙은 이상의 서명 — 카드 등장 강조에 쓴다 */
  fresh: string[];
  /** 스캔을 시작한 시각(performance.now) — 스캔 중이 아니면 null */
  scanStartedAt: number | null;
  /** 이번 스캔이 전체를 훑는 시간 (ms) — 첫 스캔은 짧게 돈다 */
  scanDuration: number;
  /** 스캔을 마친 횟수 — 알림이 스캔마다 새로 뜨게 하는 열쇠 */
  scans: number;
  /** 이상 카드를 앞에서부터 몇 장까지 보일지 — null 이면 모두. 연출이 카드를 하나씩 띄울 때 쓴다 */
  cardLimit: number | null;
}

export interface SceneState {
  // ── 보기 ──────────────────────────────────────────────
  view: ViewId;
  /** 같은 뷰를 다시 눌러도 카메라가 다시 날아가도록 쓰는 카운터 */
  viewNonce: number;
  colorMode: ColorMode;
  layers: Record<LayerId, boolean>;
  explode: number;
  selection: Selection | null;
  /** 인버터 자동 순회 중인지 — 직접 조작하면 멈춘다 */
  touring: boolean;
  setView: (view: ViewId) => void;
  setColorMode: (mode: ColorMode) => void;
  toggleLayer: (id: LayerId) => void;
  setExplode: (value: number) => void;
  select: (selection: Selection | null) => void;
  setTouring: (touring: boolean) => void;
  /** 발전량 히트맵 — colorMode 가 'heat' 일 때 모듈 색을 정한다 */
  heat: HeatMap | null;
  setHeat: (heat: HeatMap | null) => void;

  // ── 현장 조치 ─────────────────────────────────────────
  /** 현장 시점 — 이 인버터 앞으로 사람 눈높이까지 내려간다. 값이 바뀔 때마다 한 번 날아간다 */
  fieldView: { unitId: string; no: number; nonce: number } | null;
  /** 찾아가는 길 — 전기실에서 이 인버터·모듈까지 바닥에 경로를 그린다 */
  route: { unitId: string; no: number } | null;
  showFieldView: (unitId: string, no: number) => void;
  setRoute: (route: { unitId: string; no: number } | null) => void;

  // ── 설비 부품 ─────────────────────────────────────────
  part: PartSlice;
  selectPart: (info: PartInfo | null, anchor?: Vec3 | null) => void;
  hoverPart: (info: PartInfo | null, anchor?: Vec3 | null) => void;
  /** 목록에서 부품을 고른다 — 모델이 아직 없으면(멀리 있으면) 붙을 때까지 기다린다 */
  requestPart: (key: string | null) => void;
  /** 열린 문 — 문 열쇠마다 true/false */
  doors: Record<string, boolean>;
  setDoor: (id: string, open: boolean) => void;
  toggleDoor: (id: string) => void;
  /** 지금 상세 모델로 그리는 설비 — 단순 상자를 숨기는 데 쓴다 */
  detailed: string[];
  setDetailed: (key: string, on: boolean) => void;
  focusRequest: FocusRequest | null;
  focusOn: (target: Vec3, distance: number, from?: [number, number] | null) => void;

  // ── 호버 ──────────────────────────────────────────────
  hover: HoverSlice;
  setHover: (target: HoverTarget, anchor?: Vec3 | null) => void;
  clearHover: () => void;

  // ── 이상 ──────────────────────────────────────────────
  alerts: AlertSlice;
  startScan: (duration: number) => void;
  /** 스캔 결과 반영 — 이전에도 있던 이상은 그대로 두고, 새 것만 fresh 로 표시 */
  commitAlerts: (alerts: EquipmentAlert[]) => void;
  setCardLimit: (limit: number | null) => void;
}

export type SceneStore = StoreApi<SceneState>;

const sameTarget = (a: HoverTarget | null, b: HoverTarget | null) =>
  a === b ||
  (!!a &&
    !!b &&
    a.kind === b.kind &&
    a.unitId === b.unitId &&
    (a.kind === 'inverter' ? a.no === (b as typeof a).no : a.id === (b as typeof a).id));

export function createSceneStore(): SceneStore {
  return createStore<SceneState>((set, get) => ({
    view: VIEW_ALL,
    viewNonce: 0,
    colorMode: 'default',
    layers: { modules: true, trays: true, equipment: true, details: true, alerts: true },
    explode: 0,
    selection: null,
    touring: false,
    // 뷰를 바꾸면 순회 목록이 달라지므로 순회를 멈춘다
    setView: (view) => set((s) => ({ view, viewNonce: s.viewNonce + 1, touring: false })),
    setColorMode: (colorMode) => set({ colorMode }),
    toggleLayer: (id) => set((s) => ({ layers: { ...s.layers, [id]: !s.layers[id] } })),
    setExplode: (explode) => set({ explode }),
    // 빈 곳을 눌러 선택을 풀면 부품 카드도 함께 닫는다
    select: (selection) => set((s) => (selection === null ? { selection, part: { ...s.part, selected: null } } : { selection })),
    setTouring: (touring) => set({ touring }),
    heat: null,
    setHeat: (heat) => set({ heat }),
    fieldView: null,
    route: null,
    showFieldView: (unitId, no) => set((s) => ({ fieldView: { unitId, no, nonce: (s.fieldView?.nonce ?? 0) + 1 } })),
    setRoute: (route) => set({ route }),
    part: { selected: null, hovered: null, anchor: null, hoverAnchor: null, lastSelected: null, pendingKey: null },
    requestPart: (key) => set((s) => ({ part: { ...s.part, pendingKey: key } })),
    selectPart: (info, anchor = null) =>
      set((s) => ({
        part: { ...s.part, selected: info, anchor: info ? anchor : s.part.anchor, lastSelected: info ?? s.part.lastSelected },
      })),
    hoverPart: (info, anchor = null) => {
      const prev = get().part;

      if (prev.hovered?.key === info?.key) return;

      set({ part: { ...prev, hovered: info, hoverAnchor: info ? anchor : prev.hoverAnchor } });
    },
    doors: {},
    setDoor: (id, open) => set((s) => (s.doors[id] === open ? s : { doors: { ...s.doors, [id]: open } })),
    toggleDoor: (id) => set((s) => ({ doors: { ...s.doors, [id]: !s.doors[id] } })),
    detailed: [],
    setDetailed: (key, on) =>
      set((s) => {
        const has = s.detailed.includes(key);

        if (has === on) return s;

        return { detailed: on ? [...s.detailed, key] : s.detailed.filter((k) => k !== key) };
      }),
    focusRequest: null,
    focusOn: (target, distance, from = null) =>
      set((s) => ({ focusRequest: { target, distance, from, nonce: (s.focusRequest?.nonce ?? 0) + 1 } })),

    hover: { target: null, anchor: null, lastShown: null },
    setHover: (target, anchor = null) => {
      const prev = get().hover;

      // 같은 대상 안에서 움직이면 처음 닿은 자리를 그대로 둔다 — 툴팁이 떨리지 않고, 구독자(모듈 색 계산)도 다시 돌지 않는다
      if (sameTarget(prev.target, target) && (prev.anchor === null) === (anchor === null)) return;

      set({ hover: { target, anchor, lastShown: anchor ? { target, anchor } : prev.lastShown } });
    },
    clearHover: () => set((s) => ({ hover: { ...s.hover, target: null, anchor: null } })),

    alerts: { shown: [], fresh: [], scanStartedAt: null, scanDuration: 0, scans: 0, cardLimit: null },
    startScan: (duration) =>
      set((s) => ({ alerts: { ...s.alerts, scanStartedAt: performance.now(), scanDuration: duration } })),
    commitAlerts: (alerts) => {
      const prev = get().alerts;
      const before = new Set(prev.shown.map(alertSignature));

      set({
        alerts: {
          shown: alerts,
          fresh: alerts.map(alertSignature).filter((s) => !before.has(s)),
          scanStartedAt: null,
          scanDuration: prev.scanDuration,
          scans: prev.scans + 1,
          cardLimit: prev.cardLimit,
        },
      });
    },
    setCardLimit: (cardLimit) => set((s) => ({ alerts: { ...s.alerts, cardLimit } })),
  }));
}

/** 이 호기에서 마우스를 올린 인버터 번호 — 모듈 색 계산이 구독한다 */
export const hoveredInverterOf = (state: SceneState, unitId: string) =>
  state.hover.target?.kind === 'inverter' && state.hover.target.unitId === unitId ? state.hover.target.no : null;

/** 선택·호버 대상이 같은 것을 가리키는지 */
export const isSameTarget = (a: Selection | HoverTarget | null, b: Selection | HoverTarget) =>
  !!a &&
  a.kind === b.kind &&
  a.unitId === b.unitId &&
  (a.kind === 'inverter'
    ? a.no === (b as typeof a).no
    : a.kind === 'equipment' || a.kind === 'tray'
      ? a.id === (b as typeof a).id
      : false);
