/*
  부품 카드 내용 — 진단·RTU·접속반 데이터를 카드 글로 바꾼다. 모델 파일은 이 함수로 PartInfo 를 만들어 Part 에 넘긴다.
  화면 문구는 합쇼체·명사형으로 쓴다.
*/
import { FAULT_CODES } from '@/configs/faultCodes';
import { STATUS_META } from '@/configs/status';
import type { OperationStatus } from '@/configs/status';
import type { InverterDiagnosis } from '@/interface/diagnosis';
import type { FuseSlot, RtuDevice } from '@/interface/equipment';
import type { PartInfo } from '../store';

const effText = (eff: number | null) => (eff === null ? '계측 없음' : `효율 ${eff}%`);

/** 인버터 정지 고장코드 — 이 코드일 때만 인버터 본체가 멈춘 것으로 본다 */
const INVERTER_STOP_CODE = 7;

/**
 * 인버터 본체만의 상태 — 스트링 일부 이상은 본체는 돌고 있으므로 본체를 고장으로 칠하지 않는다.
 * 통신단절·인버터 정지만 본체 이상이고, 스트링 이상은 '주의(RUN!)'로 표시창에만 알린다
 */
export function inverterBodyStatus(diag: InverterDiagnosis | null): OperationStatus | null {
  if (!diag) return null;
  if (diag.status === 'commLost') return 'commLost';
  if (diag.faultCode === INVERTER_STOP_CODE) return 'fault';
  if (diag.status !== 'running') return 'degraded';

  return 'running';
}

/** 인버터 본체 */
export function inverterPart(unitId: string, no: number, diag: InverterDiagnosis | null): PartInfo {
  const body = inverterBodyStatus(diag);
  // 본체 이상(정지·통신단절)일 때만 본체에 상태 막을 씌운다 — 스트링 이상은 퓨즈 칸이 맡는다
  const status = body === 'fault' || body === 'commLost' ? body : null;
  const code = diag?.faultCode ? FAULT_CODES[diag.faultCode] : null;
  const badStrings = diag?.strings.filter((st) => st.status !== 'running').map((st) => st.no) ?? [];

  return {
    key: `${unitId}:${no}:inverter`,
    title: `인버터 #${no}`,
    subtitle: '본체',
    status,
    lines: diag
      ? [
        `${STATUS_META[diag.status].label} · ${effText(diag.efficiency)}`,
        `현재 출력 ${diag.outputKw === null ? '-' : `${diag.outputKw} kW`} · 용량 ${diag.capacityKw} kW`,
        ...(code && diag.faultCode ? [`고장코드 ${diag.faultCode} · ${code.label}`] : []),
        ...(status === null && badStrings.length ? [`스트링 ${badStrings.join(', ')} 이상 · 뒷면 접속반 확인`] : []),
      ]
      : ['운전 정보 불러오는 중'],
    actions: status === 'fault' && code ? code.plan : status === 'commLost' ? ['RS485 단자 체결과 표시창 전원을 확인합니다.'] : undefined,
  };
}

/** 접속반 퓨즈 칸 — (+)·(−) 한 쌍이 스트링 하나 */
export function fusePart(unitId: string, no: number, fuse: FuseSlot, pole: '+' | '-'): PartInfo {
  const status: OperationStatus | null = fuse.status === 'running' ? null : fuse.status;
  const code = fuse.faultCode ? FAULT_CODES[fuse.faultCode] : null;

  return {
    key: `${unitId}:${no}:fuse${pole}${fuse.stringNo}`,
    title: `스트링 ${fuse.stringNo} · (${pole === '+' ? '+' : '−'})입력 퓨즈`,
    subtitle: `인버터 #${no} 접속반 ${fuse.board}`,
    status,
    lines: [`${STATUS_META[fuse.status].label} · ${effText(fuse.efficiency)}`, ...(code && fuse.faultCode ? [code.summary] : [])],
    actions: status ? [`직류 주 차단기를 내린 뒤 ${fuse.stringNo}번 (+)·(−) 퓨즈와 단자 체결을 확인합니다.`, ...(code?.plan ?? [])] : undefined,
  };
}

/** RTU ID 수집 모듈 */
export function devicePart(unitId: string, device: RtuDevice): PartInfo {
  const lost = device.status === 'lost';

  return {
    key: `${unitId}:rtu:id${device.deviceId}`,
    title: `ID ${device.deviceId} · ${device.label}`,
    subtitle: `RTU ${device.port}번 포트`,
    status: lost ? 'commLost' : null,
    lines: [
      lost ? `통신단절 · 마지막 수신 ${device.lastSeen}` : `정상 · 마지막 수신 ${device.lastSeen}`,
      `RS485 → P${device.port}${device.sensor ? ` · DCPLC → ${device.sensor.label}` : ' · 4핀 → 전력량계'}`,
    ],
    actions: lost
      ? ['ID 모듈 전원 램프를 확인합니다.', `RS485 A·B 선이 P${device.port} 단자에 체결됐는지 확인합니다.`, '인버터 통신 설정(국번·속도)을 확인합니다.']
      : undefined,
  };
}

/** 고정 설명만 있는 부품 (차단기·SMPS·단자대 등) */
export function staticPart(key: string, title: string, subtitle: string, lines: string[], status: OperationStatus | null = null): PartInfo {
  return { key, title, subtitle, status, lines };
}
