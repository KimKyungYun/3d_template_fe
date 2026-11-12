import type { FaultCodeId } from '@/configs/faultCodes';
import type { OperationStatus } from '@/configs/status';

/** RTU 포트 통신 상태 */
export type PortStatus = 'ok' | 'lost' | 'idle';

/** RTU 에 물린 장비 한 대 (결선도의 ID 모듈 한 칸) */
export interface RtuDevice {
  /** 장비 ID — 결선도의 ID:1·2·3 */
  deviceId: number;
  /** RS485 로 물린 RTU 포트 번호 */
  port: number;
  kind: 'meter' | 'inverter' | 'combiner';
  label: string;
  /** DCPLC 로 함께 읽는 센서 — 없으면 null */
  sensor: { label: string; status: PortStatus } | null;
  status: PortStatus;
  /** 마지막으로 값을 받은 시각 (HH:mm) — 끊겼으면 끊기기 전 시각 */
  lastSeen: string;
}

export interface RtuState {
  /** DC 12V 공유 전원 */
  power: { volt: number; ok: boolean };
  devices: RtuDevice[];
}

/** 접속반 퓨즈 칸 하나 = 스트링 하나 */
export interface FuseSlot {
  stringNo: number;
  /** 접속반 번호 (1부터) — 한 함에 10회로씩 */
  board: number;
  /** 함 안의 칸 (0~9) */
  slot: number;
  status: OperationStatus;
  faultCode: FaultCodeId | null;
  efficiency: number | null;
}

export interface InverterEquipment {
  rtu: RtuState;
  fuses: FuseSlot[];
  boards: number;
}
