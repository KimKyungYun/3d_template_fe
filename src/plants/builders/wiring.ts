/*
  결선 경로(개략) — 모델링한 트레이 선을 그래프로 엮고, 인버터에 물린 모듈이 닿는 트레이 지점에서
  전기실까지 최단 경로(다익스트라)를 이어 붙인다. 실제 케이블 포설도가 아니라 트레이를 따라간 근사 경로다.
*/
import type {
  EquipmentItem,
  PlantGeometry,
  StringLane,
  TrayRoute,
  UnitWiring,
  Vec3,
  WireRoute,
} from '@/plants/model/types';
import { stringModules } from './strings';

/** 다른 트레이 끝과 이 거리 안이면 같은 접속점으로 본다 (m) */
const JOIN_DISTANCE = 4;
/** 전기실 외곽에서 이 거리 안에 끝나는 트레이는 전기실로 들어간다 (m) */
const ROOM_REACH = 3;
/** 꺼진 가닥을 살아 있는 선 옆으로 비키는 거리, 가닥이 여럿이면 하나마다 더 비키는 간격 (m) */
const LANE_OFFSET = 2.2;
const LANE_STEP = 1.2;

interface Graph {
  points: Vec3[];
  tray: string[];
  edges: { to: number; w: number }[][];
}

const dist = (a: Vec3, b: Vec3) => Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
const distXZ = (a: Vec3, b: Vec3) => Math.hypot(b[0] - a[0], b[2] - a[2]);

function buildGraph(trays: TrayRoute[]): { graph: Graph; ends: number[] } {
  const graph: Graph = { points: [], tray: [], edges: [] };
  const ends: number[] = [];
  const link = (a: number, b: number, w: number) => {
    graph.edges[a].push({ to: b, w });
    graph.edges[b].push({ to: a, w });
  };

  for (const t of trays) {
    const first = graph.points.length;

    t.points.forEach((p, i) => {
      graph.points.push(p);
      graph.tray.push(t.id);
      graph.edges.push([]);
      if (i > 0) link(first + i - 1, first + i, dist(t.points[i - 1], p));
    });
    ends.push(first, graph.points.length - 1);
  }

  // 트레이 끝을 다른 트레이의 가장 가까운 점에 잇는다 (분기·연결부)
  for (const e of ends) {
    let best = -1;
    let bestD = JOIN_DISTANCE;

    graph.points.forEach((p, i) => {
      if (graph.tray[i] === graph.tray[e]) return;

      const d = dist(graph.points[e], p);

      if (d <= bestD) {
        best = i;
        bestD = d;
      }
    });
    if (best >= 0) link(e, best, bestD);
  }

  return { graph, ends };
}

/** 전기실에 닿은 트레이 끝들을 출발점(거리 0)으로 하는 최단 경로 트리 */
function shortestTree(graph: Graph, roots: number[]) {
  const n = graph.points.length;
  const d = new Array<number>(n).fill(Infinity);
  const parent = new Array<number>(n).fill(-1);
  const done = new Array<boolean>(n).fill(false);

  for (const r of roots) d[r] = 0;

  for (;;) {
    let u = -1;

    for (let i = 0; i < n; i += 1) if (!done[i] && d[i] < Infinity && (u < 0 || d[i] < d[u])) u = i;
    if (u < 0) break;
    done[u] = true;

    for (const { to, w } of graph.edges[u]) {
      if (d[u] + w < d[to]) {
        d[to] = d[u] + w;
        parent[to] = u;
      }
    }
  }

  return { d, parent };
}

/** 꺾은선을 수평면에서 옆으로 민다 — 점마다 앞뒤 마디의 수평 법선을 평균하고, 수직 마디의 점은 이웃 점의 법선을 빌린다 */
function offsetXZ(points: Vec3[], by: number): Vec3[] {
  const normals = points.map((_, i): [number, number] | null => {
    let nx = 0;
    let nz = 0;

    for (const [a, b] of [
      [i - 1, i],
      [i, i + 1],
    ]) {
      const p = points[a];
      const q = points[b];

      if (!p || !q) continue;

      const len = distXZ(p, q);

      if (len < 1e-3) continue;
      nx -= (q[2] - p[2]) / len;
      nz += (q[0] - p[0]) / len;
    }

    const len = Math.hypot(nx, nz);

    return len < 1e-3 ? null : [nx / len, nz / len];
  });

  for (let i = 1; i < normals.length; i += 1) normals[i] ??= normals[i - 1];
  for (let i = normals.length - 2; i >= 0; i -= 1) normals[i] ??= normals[i + 1];

  return points.map((p, i) => {
    const [nx, nz] = normals[i] ?? [0, 0];

    return [p[0] + nx * by, p[1], p[2] + nz * by];
  });
}

/** 호기 하나의 결선 — 트레이가 없거나 전기실이 없으면 빈 경로를 돌려준다 */
function buildUnitWiring(model: PlantGeometry, unitId: string): UnitWiring {
  const layout = model.units[unitId];
  const empty: UnitWiring = { routes: new Map(), lane: () => null };

  if (!layout) return empty;

  const room = layout.equipment.find((e) => e.kind === 'room');

  if (!room) return empty;

  const hv = layout.trays.find((t) => t.underground);
  const { graph, ends } = buildGraph(layout.trays.filter((t) => !t.underground));

  if (graph.points.length === 0) return empty;

  const reach = Math.max(room.size[0], room.size[2]) / 2 + ROOM_REACH;
  const roots = ends.filter((e) => distXZ(graph.points[e], room.position) <= reach);
  const { d, parent } = shortestTree(graph, roots.length > 0 ? roots : [ends[0]]);

  // 구역마다 스트링 케이블을 모으는 트레이 점 — 지정이 없는 구역은 닿을 수 있는 모든 점
  const collectors = new Map<string, number[]>();
  const trayZones = new Map(layout.trays.map((t) => [t.id, t.zones ?? []]));
  const allReachable = graph.points.flatMap((_, i) => (d[i] < Infinity ? [i] : []));
  const collectorsOf = (zone: string) => {
    if (!collectors.has(zone)) {
      const own = allReachable.filter((i) => trayZones.get(graph.tray[i])?.includes(zone));

      collectors.set(zone, own.length ? own : allReachable);
    }

    return collectors.get(zone)!;
  };

  const { matrices, inverter, zone } = layout.modules;
  const modulePosition = (mi: number): Vec3 => {
    const e = matrices[mi].elements;

    return [e[12], e[13], e[14]];
  };
  /** 모듈이 제 구역 트레이에서 가장 가까이(수평 거리) 닿는 점 — 없으면 -1 */
  const touchOf = (mi: number) => {
    const p = modulePosition(mi);
    let best = -1;

    for (const i of collectorsOf(zone[mi])) {
      if (best < 0 || distXZ(p, graph.points[i]) < distXZ(p, graph.points[best])) best = i;
    }

    return best;
  };
  const inverters = layout.equipment.filter((e): e is EquipmentItem & { inverterNo: number } => !!e.inverterNo);
  const out = new Map<number, WireRoute>();

  for (const box of inverters) {
    const no = box.inverterNo;
    // 모듈 묶음이 트레이에 닿는 접점들
    const touched = new Set<number>();

    matrices.forEach((_, mi) => {
      if (inverter[mi] !== no) return;

      const best = touchOf(mi);

      if (best >= 0) touched.add(best);
    });

    // 먼 접점부터 전기실 쪽으로 거슬러 올라가며, 이미 지난 길을 만나면 거기서 끊는다
    const visited = new Set<number>();
    const chains: number[][] = [];

    for (const t of [...touched].sort((a, b) => d[b] - d[a])) {
      if (visited.has(t)) continue;

      const chain = [t];

      visited.add(t);

      for (let cur = t; parent[cur] >= 0;) {
        const p = parent[cur];

        chain.push(p);
        if (visited.has(p)) break;
        visited.add(p);
        cur = p;
      }
      chains.push(chain);
    }

    // 전기실에 닿은 끝마다 인버터 상자까지 내려간다 (바닥 높이로 옮긴 뒤 상자 높이로)
    const inv = box.position;
    const drop = chains
      .map((c) => c[c.length - 1])
      .filter((last) => parent[last] < 0)
      .map((last): Vec3[] => {
        const p = graph.points[last];

        return [p, [inv[0], p[1], inv[2]], inv];
      });

    const trays: string[] = [];

    for (const c of chains) for (const i of c) if (!trays.includes(graph.tray[i])) trays.push(graph.tray[i]);

    const dropLength = Math.min(...drop.map((l) => dist(l[0], l[1]) + dist(l[1], l[2])));
    const farthest = Math.max(0, ...[...touched].map((t) => d[t]));
    const roomFloor: Vec3 = [room.position[0], inv[1], room.position[2]];

    out.set(no, {
      dc: chains.filter((c) => c.length > 1).map((c) => c.map((i) => graph.points[i])),
      drop,
      ac: hv ? [inv, roomFloor, ...hv.points] : [inv, roomFloor],
      trays: hv ? [...trays, hv.id] : trays,
      length: farthest + (Number.isFinite(dropLength) ? dropLength : 0),
    });
  }

  // 스트링 모듈 묶음 가운데(끊긴 지점) → 가장 먼 트레이 접점 → 전기실 쪽 트레이 끝 → 인버터
  const buildLane = (no: number, stringNo: number, slot: number): StringLane | null => {
    const box = inverters.find((b) => b.inverterNo === no);
    const modules = stringModules(model, unitId, no, [stringNo]);

    if (!box || modules.length === 0) return null;

    const mid: Vec3 = [0, 0, 0];
    let start = -1;

    for (const mi of modules) {
      const p = modulePosition(mi);

      for (let k = 0; k < 3; k += 1) mid[k] += p[k] / modules.length;

      const t = touchOf(mi);

      if (t >= 0 && (start < 0 || d[t] > d[start])) start = t;
    }

    if (start < 0) return null;

    const chain = [start];

    for (let cur = start; parent[cur] >= 0; cur = parent[cur]) chain.push(parent[cur]);

    const end = graph.points[chain[chain.length - 1]];
    const inv = box.position;
    const path = offsetXZ(
      [mid, ...chain.map((i) => graph.points[i]), [inv[0], end[1], inv[2]], inv],
      LANE_OFFSET + slot * LANE_STEP,
    );

    // path = [끊긴 지점, 트레이 점들…, 바닥 꺾임, 인버터] — 트레이 끝(chain.length 번째)에서 나눈다
    return { cable: path.slice(0, chain.length + 1), drop: path.slice(chain.length) };
  };
  const lanes = new Map<string, StringLane | null>();

  return {
    routes: out,
    lane: (no, stringNo, slot) => {
      const key = `${no}:${stringNo}:${slot}`;

      if (!lanes.has(key)) lanes.set(key, buildLane(no, stringNo, slot));

      return lanes.get(key)!;
    },
  };
}

/** 모든 호기의 결선 — 모델을 만들 때 한 번 계산한다 */
export function buildWiring(model: PlantGeometry): Record<string, UnitWiring> {
  return Object.fromEntries(model.unitIds.map((unitId) => [unitId, buildUnitWiring(model, unitId)]));
}
