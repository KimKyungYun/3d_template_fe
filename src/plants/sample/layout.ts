/*
  평지형 샘플 배치 — SAMPLE_LAYOUT_SPEC 의 규격 몇 줄에서 가대·트레이·전기실을 펼친다.
  발전소를 새로 등록할 때 베낄 수 있는 가장 단순한 모양이다.
*/
import { Vector3 } from 'three';
import {
  assignSequential,
  buildTable,
  emptyFrame,
  mergeFrames,
  pitchLong,
  pitchShort,
  toVec3,
} from '@/plants/builders/geometry';
import type { EquipmentItem, GroundPad, TrayRoute, UnitLayout, Vec3 } from '@/plants/model/types';
import { SAMPLE_LAYOUT_SPEC, SAMPLE_MODULE_SIZE, SAMPLE_SPEC } from './spec';

const L = SAMPLE_LAYOUT_SPEC;
const TILT = (L.tilt * Math.PI) / 180;
/** 가대 앞단 기둥 높이 (m) */
const POST_HEIGHT = 1.1;
/** 트레이 선 높이 (m) — 가대 뒤쪽 아래를 지난다 */
const TRAY_Y = 0.45;

/** 한 동의 가로 폭·세로 깊이 (m) */
const tableWidth = L.tableCols * pitchShort(SAMPLE_MODULE_SIZE);
const tableDepth = L.tableRows * pitchLong(SAMPLE_MODULE_SIZE) * Math.cos(TILT);

/** 블록(인버터 하나) 한 칸의 크기 — 동 5개가 rowPitch 간격으로 남북으로 늘어선다 */
const blockWidth = tableWidth + L.aisle;
const blockDepth = L.tablesPerInverter * L.rowPitch + L.aisle;

/** 블록 묶음 전체 크기 */
const siteWidth = L.blockCols * blockWidth;
const siteDepth = L.blockRows * blockDepth;

/** 블록 (col, row) 의 가운데 */
function blockCenter(col: number, row: number) {
  return new Vector3(
    (col - (L.blockCols - 1) / 2) * blockWidth,
    0,
    (row - (L.blockRows - 1) / 2) * blockDepth,
  );
}

export function buildSampleLayout(): UnitLayout {
  const unit = SAMPLE_SPEC.units[0];
  const frame = emptyFrame();
  const matrices = [];
  const pads: GroundPad[] = [];

  // 인버터 순서대로 블록을 채운다 — 서→동, 북→남
  for (let i = 0; i < unit.inverters.length; i += 1) {
    const col = i % L.blockCols;
    const row = Math.floor(i / L.blockCols);
    const center = blockCenter(col, row);

    for (let t = 0; t < L.tablesPerInverter; t += 1) {
      const z = center.z + (t - (L.tablesPerInverter - 1) / 2) * L.rowPitch;
      const result = buildTable(
        {
          center: new Vector3(center.x, 0, z),
          // 모듈 장변이 동서(가로)로 눕고 경사가 남쪽을 보도록 진행축을 동서로 둔다
          yaw: Math.PI / 2,
          rows: L.tableRows,
          cols: L.tableCols,
          tilt: TILT,
          postHeight: POST_HEIGHT,
          postsAlong: 4,
          postsAcross: 2,
        },
        SAMPLE_MODULE_SIZE,
      );

      matrices.push(...result.modules);
      mergeFrames(frame, result.frame);
      pads.push({ center: [center.x, 0, z], size: [tableWidth + 1.2, tableDepth + 1.2], rotY: 0 });
    }
  }

  const inverter = assignSequential(matrices.length, unit.inverters);
  // 구역은 블록 열마다 — 범례 색상 모드(zone)가 쓴다
  const ZONES = ['A', 'B', 'C'];
  const zone = inverter.map((no) => ZONES[(no - 1) % L.blockCols] ?? 'A');

  // 전기실은 부지 남쪽 가운데, 인버터 함은 그 앞에 한 줄
  const roomZ = siteDepth / 2 + 8;
  const room: EquipmentItem = {
    id: 'sample-room',
    kind: 'room',
    label: '전기실',
    position: [0, 0, roomZ],
    size: [9, 3, 5],
    rotationY: 0,
    note: '수배전반 · 인버터 · 통신설비 (샘플)',
  };
  const equipment: EquipmentItem[] = [room];

  unit.inverters.forEach((inv, i) => {
    equipment.push({
      id: `sample-inv-${inv.no}`,
      kind: 'inverter',
      label: `INV #${inv.no}`,
      position: [(i - (unit.inverters.length - 1) / 2) * 1.4, 0.79, roomZ - 4.2],
      size: [0.95, 0.779, 0.3625],
      rotationY: 0,
      inverterNo: inv.no,
    });
  });

  // 트레이: 블록 열마다 남북 간선 한 줄 + 전기실 앞 동서 간선 한 줄
  const spineZ = roomZ - 6;
  const trays: TrayRoute[] = [
    {
      id: 'sample-tray-main',
      label: '전기실 인입 간선 트레이',
      points: [
        [-siteWidth / 2 + blockWidth / 2, TRAY_Y, spineZ],
        [siteWidth / 2 - blockWidth / 2, TRAY_Y, spineZ],
      ],
      note: 'AC 간선 경로 (샘플)',
    },
  ];

  for (let col = 0; col < L.blockCols; col += 1) {
    const x = blockCenter(col, 0).x;
    const points: Vec3[] = [
      [x, TRAY_Y, -siteDepth / 2 + L.aisle / 2],
      [x, TRAY_Y, spineZ],
    ];

    trays.push({
      id: `sample-tray-${ZONES[col]}`,
      label: `TRAY ROUTE ${ZONES[col]}`,
      points,
      zones: [ZONES[col]],
      note: 'DC 스트링 케이블 경로 (샘플)',
    });
  }

  const focusCenter = toVec3(new Vector3(0, 0, siteDepth * 0.05));

  return {
    unitId: unit.id,
    origin: [0, 0, 0],
    modules: { matrices, inverter, zone },
    frame,
    trays,
    equipment,
    ground: {
      ribbons: [
        {
          points: [
            [0, 0, -siteDepth / 2 - 4],
            [0, 0, roomZ + 8],
          ],
          width: siteWidth + 8,
          tone: 'apron',
        },
      ],
      pads,
    },
    focus: { target: focusCenter, radius: Math.max(siteWidth, siteDepth) / 2 + 24 },
  };
}

/** 울타리가 둘러야 할 부지 크기 — 주변 환경이 쓴다 */
export const SAMPLE_SITE = {
  width: siteWidth + 16,
  depth: siteDepth + 34,
  centerZ: 8,
} as const;
