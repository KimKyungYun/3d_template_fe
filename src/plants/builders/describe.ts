/*
  툴팁·선택 카드 문구. 발전소마다 다른 사양 글귀는 모델의 note 에 담겨 오고,
  여기서는 spec 수치와 배치에서 셀 수 있는 것만 만든다.
*/
import type { ResolvedTheme } from '@/configs/status';
import type { HoverTarget, PlantModel, Selection } from '@/plants/model/types';
import { unitIndexOf } from '@/plants/model/types';
import { inverterModules } from './strings';
import { inverterColor } from './colors';

export interface TooltipInfo {
  /** 식별 키 — 대상이 바뀌면 내용 전환 애니메이션을 다시 돌린다 */
  key: string;
  /** 이름 앞 색 점 (인버터 범례 색) */
  accent: string | null;
  name: string;
  unitLabel: string;
  badge?: string;
  metrics: { label: string; value: string }[];
  note?: string;
}

const num = (v: number, digits = 0) => v.toLocaleString('ko-KR', { maximumFractionDigits: digits });

const UNKNOWN: TooltipInfo = { key: 'none', accent: null, name: '-', unitLabel: '', metrics: [] };

/** 툴팁 내용 — 이름 줄(호버)과 요약 지표(선택 카드)를 함께 만든다 */
export function describe(model: PlantModel, target: HoverTarget | Selection, theme: ResolvedTheme): TooltipInfo {
  const layout = model.units[target.unitId];
  const unit = model.spec.units.find((u) => u.id === target.unitId);

  if (!layout || !unit) return UNKNOWN;

  const unitLabel = model.spec.units.length > 1 ? `${unit.id}호기` : unit.shortName;

  if (target.kind === 'tray') {
    const tray = layout.trays.find((t) => t.id === target.id);

    if (!tray) return UNKNOWN;

    let length = 0;

    for (let i = 1; i < tray.points.length; i += 1) {
      const [ax, ay, az] = tray.points[i - 1];
      const [bx, by, bz] = tray.points[i];

      length += Math.hypot(bx - ax, by - ay, bz - az);
    }

    return {
      key: `${target.unitId}-tray-${tray.id}`,
      accent: null,
      name: tray.label,
      unitLabel,
      badge: tray.underground ? '지중 전선로' : '케이블 트레이 · 덕트',
      metrics: [{ label: '경로 길이', value: `약 ${num(length)}m` }],
      note: tray.note ?? (tray.underground ? '특고압 인출 경로' : 'DC 스트링 케이블 · AC 간선 경로'),
    };
  }

  if (target.kind === 'inverter') {
    const inv = unit.inverters.find((v) => v.no === target.no);

    if (!inv) return UNKNOWN;

    const idx = inverterModules(model, target.unitId, target.no);
    const zone = idx.length > 0 ? layout.modules.zone[idx[0]] : null;

    return {
      key: `${target.unitId}-inv-${target.no}`,
      accent: inverterColor(unitIndexOf(model, target.unitId), target.no, unit.inverters.length, theme),
      name: `INV #${target.no}`,
      unitLabel,
      badge: zone ? `구역 ${zone}` : undefined,
      metrics: [
        { label: '모듈', value: `${num(inv.modules)}장` },
        { label: 'DC 용량', value: `${num((inv.modules * model.spec.moduleWatt) / 1000, 2)}kW` },
        { label: 'AC 정격', value: `${model.spec.inverterRatedKw}kW` },
      ],
      note: inv.config,
    };
  }

  const item = layout.equipment.find((e) => e.id === target.id);

  if (!item) return UNKNOWN;

  if (item.kind === 'kepco') {
    return {
      key: `${target.unitId}-${item.id}`,
      accent: null,
      name: item.label,
      unitLabel,
      badge: '계통 연계',
      metrics: [{ label: '전압', value: '22.9kV' }],
      note: item.note ?? '특고압 수전설비',
    };
  }

  return {
    key: `${target.unitId}-${item.id}`,
    accent: null,
    name: item.label,
    unitLabel,
    badge: '전기실',
    metrics: [
      { label: '인버터', value: `${unit.inverters.length}대` },
      { label: 'AC 합계', value: `${num(model.spec.inverterRatedKw * unit.inverters.length)}kW` },
      { label: 'DC 용량', value: `${num(unit.capacityKw, 2)}kW` },
    ],
    note: item.note ?? '수배전반 · 인버터 · 통신설비',
  };
}
