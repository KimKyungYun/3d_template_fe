import { CatmullRomCurve3, Vector3 } from 'three';
import {
  acrossOf,
  assignSequential,
  beamMatrix,
  emptyFrame,
  LAYER_Y,
  moduleMatrix,
  pitchShort,
  toVec3,
} from '@/plants/builders/geometry';
import type { EquipmentItem, FrameSet, TrayRoute, UnitLayout, Vec3 } from '@/plants/model/types';
import { ASIAD_MODULE_SPEC, ASIAD_SPEC, ASIAD_UNIT1_SECTION } from './spec';
import { SITE } from './siteMap';

const MODULE_PITCH_SHORT = pitchShort(ASIAD_MODULE_SPEC);

/**
 * 모듈 띠 — 현장 사진 1~4번처럼 모듈이 캐노피 폭 전체를 가로지르는 한 줄(띠)로 놓이고,
 * 띠마다 진행 방향으로 12° 기운다(도면 E-10). 모듈 긴 변이 진행 방향이라 띠 앞뒤 높이가 약 4.0~4.5m 가 된다
 */
const BAND = { perRow: 22, pitch: 2.25 } as const;
/** 끝단 광장(고해상도 위성 사진 약 42×42m): 폭 8경간 × 5.2m 에 39장 띠 10줄, 띠 사이를 넓게 띄운다 (마지막 줄 4장 덜 놓음) */
const PLAZA = { perRow: 39, pitch: 4.2, rows: 10, trim: 4, crossBays: 8, crossBayWidth: 5.2 } as const;

const TILT = (ASIAD_UNIT1_SECTION.moduleTilt * Math.PI) / 180;
/** 띠 낮은 쪽 모서리가 퍼린 윗면(+틈) 위에 오도록 모듈 중심 높이를 잡는다 */
const MODULE_Y =
  ASIAD_UNIT1_SECTION.eaveHeight +
  LAYER_Y.purlin +
  0.075 +
  0.02 +
  (ASIAD_MODULE_SPEC.length / 2) * Math.sin(TILT) +
  ASIAD_MODULE_SPEC.thickness / 2;

interface Frame {
  p: Vector3;
  along: Vector3;
  across: Vector3;
}

interface BandOptions {
  frameAt: (u: number) => Frame;
  rows: number;
  perRow: number;
  pitch: number;
  crossBays: number;
  crossBayWidth: number;
  /** 마지막 띠에서 뺄 모듈 수 */
  trimLast?: number;
}

function buildBand(o: BandOptions, frame: FrameSet) {
  const halfW = (o.crossBays * o.crossBayWidth) / 2;
  const top = ASIAD_UNIT1_SECTION.eaveHeight;
  const at = (f: Frame, s: number, y: number) => f.p.clone().addScaledVector(f.across, s).setY(y);
  const length = o.rows * o.pitch;

  const modules = [];
  for (let r = 0; r < o.rows; r += 1) {
    const f = o.frameAt((r + 0.5) * o.pitch);
    const count = o.perRow - (r === o.rows - 1 ? (o.trimLast ?? 0) : 0);
    // 긴 변(로컬 x)을 진행 방향으로, 로컬 z 는 오른손 좌표계를 맞추려 가로 방향의 반대로 둔다
    const backward = f.across.clone().negate();
    for (let k = 0; k < count; k += 1) {
      const s = (k - (o.perRow - 1) / 2) * MODULE_PITCH_SHORT;
      modules.push(moduleMatrix(at(f, s, MODULE_Y), f.along, backward, TILT));
    }
  }

  const bays = Math.ceil(length / ASIAD_UNIT1_SECTION.postPitch);
  const crossLines = Array.from({ length: o.crossBays + 1 }, (_, k) => -halfW + k * o.crossBayWidth);
  const purlinLines = Array.from({ length: o.crossBays * 2 + 1 }, (_, k) => -halfW + (k * o.crossBayWidth) / 2);
  const postTop = top - 0.08;

  for (let b = 0; b <= bays; b += 1) {
    const f = o.frameAt(Math.min(b * ASIAD_UNIT1_SECTION.postPitch, length));
    crossLines.forEach((s) => {
      frame.posts.push(beamMatrix(at(f, s, 0), at(f, s, postTop), 0.15, 0.1));
      // 방장 브레이스: 기둥 상부에서 양옆 거더로
      for (const dir of [-1, 1]) {
        const ns = s + dir * 1.1;
        if (ns < -halfW || ns > halfW) continue;
        frame.braces.push(beamMatrix(at(f, s, postTop - 1.1), at(f, ns, top - 0.12), 0.08, 0.08));
      }
    });
    frame.girders.push(beamMatrix(at(f, -halfW, top + LAYER_Y.girder), at(f, halfW, top + LAYER_Y.girder), 0.1, 0.15));
    if (b === bays) break;
    const f1 = o.frameAt(Math.min((b + 1) * ASIAD_UNIT1_SECTION.postPitch, length));
    for (const s of purlinLines) {
      const y = top + LAYER_Y.purlin;
      frame.purlins.push(beamMatrix(at(f, s, y), at(f1, s, y), 0.075, 0.15));
    }
  }
  return { modules, length, halfWidth: halfW };
}

export function buildUnit1Layout(): UnitLayout {
  const spec = ASIAD_SPEC.units[0];
  const perRow = BAND.perRow;
  const plazaCount = PLAZA.rows * PLAZA.perRow - PLAZA.trim;
  const bandCount = spec.moduleCount - plazaCount;
  const bandRows = Math.ceil(bandCount / perRow);
  const rowPitch = BAND.pitch;
  const bandLength = bandRows * rowPitch;

  // 위성 사진 중심선을 시작점 기준으로 띠 길이에 맞춰 늘이거나 줄인다 (축척 추정 오차 흡수)
  const trace = SITE.canopyTrace.map((p) => new Vector3(...p));
  const raw = new CatmullRomCurve3(trace, false, 'centripetal');
  const fit = bandLength / raw.getLength();
  const start = trace[0];
  const curve = new CatmullRomCurve3(
    trace.map((p) => p.clone().sub(start).multiplyScalar(fit).add(start)),
    false,
    'centripetal',
  );
  const length = curve.getLength();
  const curveFrame = (u: number): Frame => {
    const t = Math.min(Math.max(u / length, 0), 1);
    const along = curve.getTangentAt(t).setY(0).normalize();
    return { p: curve.getPointAt(t), along, across: acrossOf(along) };
  };

  const frame = emptyFrame();
  const band = buildBand(
    {
      frameAt: curveFrame,
      rows: bandRows,
      perRow,
      pitch: rowPitch,
      crossBays: ASIAD_UNIT1_SECTION.crossBays,
      crossBayWidth: ASIAD_UNIT1_SECTION.crossBayWidth,
      trimLast: bandRows * perRow - bandCount,
    },
    frame,
  );

  const end = curveFrame(length);
  const plazaGap = 1.5;
  const plazaFrame = (u: number): Frame => ({
    p: end.p.clone().addScaledVector(end.along, plazaGap + u),
    along: end.along,
    across: end.across,
  });
  const plaza = buildBand(
    {
      frameAt: plazaFrame,
      rows: PLAZA.rows,
      perRow: PLAZA.perRow,
      pitch: PLAZA.pitch,
      crossBays: PLAZA.crossBays,
      crossBayWidth: PLAZA.crossBayWidth,
      trimLast: PLAZA.trim,
    },
    frame,
  );

  const matrices = [...band.modules, ...plaza.modules];
  const inverter = assignSequential(matrices.length, spec.inverters);
  const zoneOf = (no: number): string => (no <= 5 ? 'A' : no <= 10 ? 'B' : no <= 15 ? 'C' : 'D');
  const zone = inverter.map(zoneOf);

  // 구역 경계(모듈 인덱스 → 진행 거리)
  const zoneStartIndex = (id: string) => zone.indexOf(id);
  const uOfIndex = (i: number) => (i < band.modules.length ? Math.floor(i / perRow) * rowPitch : length);

  const trayY = 3.55;
  const zoneIds = ['A', 'B', 'C', 'D'];
  const trays: TrayRoute[] = zoneIds.map((id, zi) => {
    const u0 = uOfIndex(zoneStartIndex(id));
    const u1 = zi < zoneIds.length - 1 ? uOfIndex(zoneStartIndex(zoneIds[zi + 1])) : length;
    const pts = [];
    for (let u = u0; u < u1; u += 3) pts.push(toVec3(curveFrame(u).p.setY(trayY)));
    pts.push(toVec3(curveFrame(u1).p.setY(trayY)));
    if (id === 'D') {
      for (let u = 0; u <= plaza.length; u += 3) pts.push(toVec3(plazaFrame(u).p.setY(trayY)));
    }
    return { id: `u1-tray-${id}`, label: `TRAY ROUTE ${id}`, points: pts, zones: [id] };
  });

  // 전력간선 평면도(E-33): 1전기실은 캐노피 북동쪽 시작부 남쪽(파크골프장 쪽)에 있고,
  // 22.9kV 간선이 캐노피 남동쪽을 따라 내려가 봉수대로·국제대로 모퉁이의 한전 PAD S/W 에 닿는다
  const ROOM_U = length * 0.22;
  const ROOM_OFFSET = band.halfWidth + 29;
  const HV_OFFSET = band.halfWidth + 27;
  const mid = curveFrame(ROOM_U);
  const roomPos = mid.p.clone().addScaledVector(mid.across, ROOM_OFFSET);
  const roomYaw = Math.atan2(mid.along.x, mid.along.z);
  const kepcoPos = plazaFrame(plaza.length * 0.5).p.addScaledVector(end.across, plaza.halfWidth + 10);

  const trayBranch: TrayRoute = {
    id: 'u1-tray-room',
    label: '전기실 인입 TRAY',
    points: [
      toVec3(mid.p.clone().setY(trayY)),
      toVec3(mid.p.clone().addScaledVector(mid.across, band.halfWidth).setY(trayY)),
      toVec3(mid.p.clone().addScaledVector(mid.across, band.halfWidth).setY(0.3)),
      toVec3(roomPos.clone().addScaledVector(mid.across, -4).setY(0.3)),
    ],
  };
  const hvPoints: Vec3[] = [toVec3(roomPos.clone().setY(0.15))];
  for (let u = ROOM_U + 12; u < length; u += 6) {
    const f = curveFrame(u);
    hvPoints.push(toVec3(f.p.addScaledVector(f.across, HV_OFFSET).setY(0.15)));
  }
  hvPoints.push(toVec3(kepcoPos.clone().setY(0.15)));
  const hvLine: TrayRoute = { id: 'u1-hv', label: '22.9kV 지중 전선로', underground: true, points: hvPoints };

  const equipment: EquipmentItem[] = [
    {
      id: 'u1-room',
      kind: 'room',
      label: '1전기실',
      position: toVec3(roomPos),
      // 로컬 x = 곡선 가로 방향, z = 곡선 진행 방향
      size: [6, 3.2, 14],
      rotationY: roomYaw,
    },
    {
      id: 'u1-kepco',
      kind: 'kepco',
      label: '한전 PAD S/W',
      position: toVec3(kepcoPos),
      size: [2.2, 1.6, 1.4],
      rotationY: roomYaw,
    },
  ];
  // 인버터: 전기실 바깥쪽(캐노피 반대편) 두 줄
  spec.inverters.forEach((inv, i) => {
    const row = i < 10 ? 0 : 1;
    const col = row === 0 ? i : i - 10;
    const offsetAlong = (col - 4.5) * 1.3;
    const pos = roomPos
      .clone()
      .addScaledVector(mid.across, 5 + row * 2.2)
      .addScaledVector(mid.along, offsetAlong)
      .setY(0.4 + 0.39);
    equipment.push({
      id: `u1-inv-${inv.no}`,
      kind: 'inverter',
      label: `INV #${inv.no}`,
      position: toVec3(pos),
      size: [0.3625, 0.779, 0.95],
      rotationY: roomYaw,
      inverterNo: inv.no,
    });
  });

  const box = { minX: Infinity, maxX: -Infinity, minZ: Infinity, maxZ: -Infinity };
  for (let u = 0; u <= length; u += 10) {
    const { p } = curveFrame(u);
    box.minX = Math.min(box.minX, p.x);
    box.maxX = Math.max(box.maxX, p.x);
    box.minZ = Math.min(box.minZ, p.z);
    box.maxZ = Math.max(box.maxZ, p.z);
  }

  const walkway: Vec3[] = [];
  for (let u = 0; u < length; u += 3) walkway.push(toVec3(curveFrame(u).p));
  walkway.push(toVec3(end.p));

  return {
    unitId: spec.id,
    origin: [0, 0, 0],
    modules: { matrices, inverter, zone },
    frame,
    trays: [...trays, trayBranch, hvLine],
    equipment,
    ground: {
      ribbons: [
        { points: walkway, width: band.halfWidth * 2 + 8, tone: 'paving' },
        {
          points: [toVec3(plazaFrame(-2).p), toVec3(plazaFrame(plaza.length + 4).p)],
          width: plaza.halfWidth * 2 + 8,
          tone: 'paving',
        },
      ],
      pads: [],
    },
    focus: {
      target: [(box.minX + box.maxX) / 2, 0, (box.minZ + box.maxZ) / 2],
      radius: Math.max(box.maxX - box.minX, box.maxZ - box.minZ) / 2 + 40,
    },
  };
}
