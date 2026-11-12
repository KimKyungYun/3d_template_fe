/*
  RTU·접속반 목 — 인버터 진단(mocks/plantState)에서 끌어낸다.
  인버터가 통신단절이면 그 인버터를 읽는 RTU 포트가 끊기고, 스트링 이상은 같은 번호의 퓨즈 칸에 실린다.
  결선 구성은 받은 RTU 결선도(DC 12V 공유 전원 · RS485 포트별 개별 결선 · ID 모듈)를 태양광용으로 바꾼 공용 더미다.
*/
import dayjs from 'dayjs';
import type { FuseSlot, InverterEquipment, PortStatus } from '@/interface/equipment';
import { inverterDiagnosisOf, REFERENCE_CLOCK } from './plantState';

/** 접속반 한 함의 회로 수 — 받은 접속반 사진의 퓨즈 칸 수 */
export const FUSES_PER_BOARD = 10;

/** 통신단절 인버터는 단절이 시작된 날 아침부터 값이 없다 */
const lostSince = (date: string) => (date === REFERENCE_CLOCK.date ? '06:00' : dayjs(date).format('MM.DD 06:00'));

export function inverterEquipmentOf(plantId: string, unitId: string, no: number): InverterEquipment | null {
  const inv = inverterDiagnosisOf(plantId).find((i) => i.unitId === unitId && i.no === no);

  if (!inv) return null;

  const lost = inv.status === 'commLost';
  const firstLost = lost ? (inv.daily.find((d) => d.efficiency === null)?.date ?? REFERENCE_CLOCK.date) : null;
  const inverterPort: PortStatus = lost ? 'lost' : 'ok';
  const now = REFERENCE_CLOCK.time;

  const fuses: FuseSlot[] = inv.strings.map((s) => ({
    stringNo: s.no,
    board: Math.floor((s.no - 1) / FUSES_PER_BOARD) + 1,
    slot: (s.no - 1) % FUSES_PER_BOARD,
    status: s.status,
    faultCode: s.faultCode,
    efficiency: s.efficiency,
  }));

  return {
    boards: Math.max(1, Math.ceil(inv.strings.length / FUSES_PER_BOARD)),
    fuses,
    rtu: {
      power: { volt: 12.1, ok: true },
      devices: [
        { deviceId: 1, port: 2, kind: 'meter', label: '전력량계 (거래용)', sensor: null, status: 'ok', lastSeen: now },
        {
          deviceId: 2,
          port: 3,
          kind: 'inverter',
          label: `인버터 #${no}`,
          sensor: { label: '일사량계', status: 'ok' },
          status: inverterPort,
          lastSeen: firstLost ? lostSince(firstLost) : now,
        },
        {
          deviceId: 3,
          port: 4,
          kind: 'combiner',
          label: '접속반 감시 기판',
          sensor: { label: '모듈 온도계', status: 'ok' },
          // 인버터가 끊기면 같은 함의 접속반 감시도 함께 끊긴 것으로 본다 (같은 통신 경로)
          status: inverterPort,
          lastSeen: firstLost ? lostSince(firstLost) : now,
        },
      ],
    },
  };
}
