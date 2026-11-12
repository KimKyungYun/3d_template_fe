import { useState } from 'react';
import { Skeleton } from '@/components/common/Skeleton';
import { cn } from '@/utils/cn';
import { useInverterScope } from '../hooks/useInverterScope';
import { RtuDiagram } from './RtuDiagram';
import styles from './RtuView.module.scss';

const STATUS_TEXT = { ok: '정상', lost: '통신단절', idle: '비어 있음' } as const;

/** RTU 결선 탭 — 결선도와 포트별 통신 상태. 끊긴 포트는 무엇부터 볼지 적어 준다 */
export function RtuView() {
  const { equipment } = useInverterScope();
  const [active, setActive] = useState<number | null>(null);

  if (!equipment) return <Skeleton height={260} />;

  const { rtu } = equipment;
  const lost = rtu.devices.filter((d) => d.status === 'lost');

  return (
    <div className={styles.rtu}>
      <RtuDiagram rtu={rtu} activeId={active} onPick={setActive} />
      <table className={styles.rtu__table}>
        <thead>
          <tr>
            <th>포트</th>
            <th>장비</th>
            <th>상태</th>
            <th>마지막 수신</th>
          </tr>
        </thead>
        <tbody>
          {rtu.devices.map((d) => (
            <tr
              key={d.deviceId}
              className={cn({ [styles['rtu__row--active']]: active === d.deviceId })}
              data-state={d.status}
              onClick={() => setActive(d.deviceId)}
            >
              <td>P{d.port}</td>
              <td>ID {d.deviceId} · {d.label}</td>
              <td className={styles.rtu__state}>{STATUS_TEXT[d.status]}</td>
              <td>{d.lastSeen}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {lost.length > 0 ? (
        <p className={styles.rtu__advice}>
          P{lost.map((d) => d.port).join('·P')} 통신이 끊겼습니다. 같은 12V 전원을 쓰는 ID 1 은 정상이므로
          공용 전원보다 해당 장비의 RS485 A·B 체결과 장비 전원 램프를 먼저 확인합니다.
        </p>
      ) : null}
    </div>
  );
}
