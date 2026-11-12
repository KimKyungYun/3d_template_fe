import { Skeleton } from '@/components/common/Skeleton';
import { StatusBadge } from '@/components/common/StatusBadge';
import { usePlantModel, useScene, useSceneApi } from '@/components/scene/SceneContext';
import { inverterBodyStatus } from '@/components/scene/station/partInfo';
import { STATUS_META } from '@/configs/status';
import { cn } from '@/utils/cn';
import type { OperationStatus } from '@/configs/status';
import { useInverterScope } from '../hooks/useInverterScope';
import styles from './PartList.module.scss';

interface Row {
  key: string;
  label: string;
  meta: string;
  status: OperationStatus | null;
  /** 이 부품을 보려면 열어야 하는 문 */
  door: string | null;
  /** RTU 함 부품이면 true — 랙이 아니라 RTU 함으로 다가간다 */
  rtu: boolean;
}

const rank = (s: OperationStatus | null) => (s ? STATUS_META[s].rank : 9);

/**
 * 오른쪽 HUD — 3D 설비 부품 목록. 이상 부품이 위로 온다.
 * 누르면 그 설비로 다가가 문을 열고, 모델이 붙는 대로 부품을 골라 카드를 띄운다. 3D 에서 고른 부품은 목록에서 밝아진다
 */
export function PartList() {
  const model = usePlantModel();
  const api = useSceneApi();
  const { unitId, no, diag, equipment } = useInverterScope();
  const selectedKey = useScene((s) => s.part.selected?.key ?? null);

  if (!equipment || !diag) return <Skeleton height={240} />;

  // 인버터 줄은 본체 상태만 — 스트링 이상은 퓨즈 줄이 맡는다 (3D 와 같은 규칙)
  const body = inverterBodyStatus(diag);
  const rows: Row[] = [
    {
      key: `${unitId}:${no}:inverter`,
      label: `인버터 #${no}`,
      meta: '본체 · 표시창',
      status: body === 'fault' || body === 'commLost' ? body : null,
      door: null,
      rtu: false,
    },
    ...equipment.fuses.map((f): Row => ({
      key: `${unitId}:${no}:fuse+${f.stringNo}`,
      label: `스트링 ${f.stringNo} 퓨즈`,
      meta: `접속반 ${f.board} · ${f.efficiency === null ? '계측 없음' : `효율 ${f.efficiency}%`}`,
      status: f.status === 'running' ? null : f.status,
      door: `${unitId}:${no}:combiner${f.board}`,
      rtu: false,
    })),
    ...equipment.rtu.devices.map((d): Row => ({
      key: `${unitId}:rtu:id${d.deviceId}`,
      label: `RTU ID ${d.deviceId}`,
      meta: `${d.label} · P${d.port}`,
      status: d.status === 'lost' ? 'commLost' : null,
      door: `${unitId}:rtu:door`,
      rtu: true,
    })),
  ].sort((a, b) => rank(a.status) - rank(b.status));

  const pick = (row: Row) => {
    const state = api.getState();

    if (row.door) state.setDoor(row.door, true);

    if (row.rtu) {
      const layout = model.units[unitId];
      const rtu = layout?.equipment.find((e) => e.kind === 'rtu');

      if (layout && rtu) {
        state.focusOn([rtu.position[0] + layout.origin[0], layout.origin[1] + 1.3, rtu.position[2] + layout.origin[2]], 3);
      }
    } else {
      state.showFieldView(unitId, no);
    }

    state.requestPart(row.key);
  };

  return (
    <ul className={styles.list}>
      {rows.map((row) => (
        <li key={row.key}>
          <button
            type="button"
            className={cn(styles.list__row, { [styles['list__row--active']]: selectedKey === row.key })}
            onClick={() => pick(row)}
          >
            <span className={styles.list__text}>
              <span className={styles.list__label}>{row.label}</span>
              <span className={styles.list__meta}>{row.meta}</span>
            </span>
            {row.status ? <StatusBadge status={row.status} compact live /> : <span className={styles.list__ok}>정상</span>}
          </button>
        </li>
      ))}
    </ul>
  );
}
