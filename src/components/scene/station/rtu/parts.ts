/*
  RTU 함 부품 카드 내용 — 공용 partInfo(devicePart·staticPart)에 없는 부품만 여기서 만든다.
  화면 문구는 합쇼체·명사형으로 쓴다.
*/
import type { RtuDevice, RtuState } from '@/interface/equipment';
import type { PartInfo } from '@/components/scene/store';
import { staticPart } from '../partInfo';

const powerLine = (rtu: RtuState | null) => (rtu ? `DC ${rtu.power.volt} V · ${rtu.power.ok ? '정상' : '전압 이상'}` : '전원 불러오는 중');

/** 외함 — 함 전체 */
export function enclosurePart(unitId: string, rtu: RtuState | null): PartInfo {
  return staticPart(`${unitId}:rtu:enclosure`, 'RTU 함', '옥외 통신함', [
    '플라스틱 함체 · 투명 커버 문',
    '규격 500 × 650 × 220 mm · 각관 기둥 설치',
    powerLine(rtu),
  ]);
}

/** 4P 배선용 차단기 */
export function breakerPart(unitId: string): PartInfo {
  return staticPart(`${unitId}:rtu:breaker`, '4P 배선용 차단기', '교류 주 차단기', [
    '4극 30A · 수동 투입',
    '전력량계 1차측 보호',
  ]);
}

/** 전력량계 */
export function meterPart(unitId: string, reading: string, device: RtuDevice | null): PartInfo {
  const lost = device?.status === 'lost';

  return {
    key: `${unitId}:rtu:meter`,
    title: '전력량계',
    subtitle: '거래용 계량',
    status: lost ? 'commLost' : null,
    lines: [
      `지침 ${reading} kWh`,
      device ? `ID ${device.deviceId} 모듈과 4핀 연결 · ${lost ? '수집 단절' : '수집 정상'}` : '수집 상태 불러오는 중',
    ],
    actions: lost ? ['전력량계 4핀 커넥터 체결을 확인합니다.'] : undefined,
  };
}

/** DC 12V 단자대 */
export function dcBlockPart(unitId: string, rtu: RtuState | null): PartInfo {
  const bad = rtu !== null && !rtu.power.ok;

  return {
    key: `${unitId}:rtu:dc12v`,
    title: 'DC 12V 단자대',
    subtitle: '공유 전원',
    status: bad ? 'fault' : null,
    lines: [powerLine(rtu), 'ID 1·2·3 모듈 공통 급전 (빨강 +12V · 검정 GND)'],
    actions: bad ? ['단자대 전압을 계측하고 어댑터 출력을 확인합니다.'] : undefined,
  };
}

/** 황동 접지 바 */
export function groundBarPart(unitId: string): PartInfo {
  return staticPart(`${unitId}:rtu:ground`, '접지 바', '보호 접지', [
    '황동 바 · 접지선 노랑·초록 2가닥',
    '함체 · DIN 레일 공통 접지',
  ]);
}

/** RTU 본체 — DIN 레일형 통신기 */
export function rtuBodyPart(unitId: string, devices: RtuDevice[] | null): PartInfo {
  const lost = devices?.filter((d) => d.status === 'lost') ?? [];

  return {
    key: `${unitId}:rtu:body`,
    title: 'RTU 본체',
    subtitle: 'DIN 레일형 통신기',
    status: devices && lost.length > 0 ? 'commLost' : null,
    lines: [
      'RS485 4포트 · 안테나 단자 1구',
      !devices
        ? '포트 상태 불러오는 중'
        : lost.length > 0
          ? `통신단절 ${lost.map((d) => `P${d.port}`).join(' · ')}`
          : '전 포트 수집 정상',
    ],
    actions: devices && lost.length > 0 ? ['포트 LED 와 RS485 단자 체결을 확인합니다.', 'RTU 전원을 재투입합니다.'] : undefined,
  };
}

/** RTU 포트 한 구 — 연결 장비와 수집 상태 */
export function portPart(unitId: string, port: number, device: RtuDevice | null, loading: boolean): PartInfo {
  const lost = device?.status === 'lost';

  return {
    key: `${unitId}:rtu:port${port}`,
    title: `P${port} 포트`,
    subtitle: 'RS485 수집 포트',
    status: lost ? 'commLost' : null,
    lines: device
      ? [`연결 장비 ID ${device.deviceId} · ${device.label}`, `${lost ? '통신단절' : '정상'} · 마지막 수신 ${device.lastSeen}`]
      : loading
        ? ['연결 장비 불러오는 중']
        : ['비어 있음 · 연결 장비 없음'],
    actions: lost ? [`P${port} 단자의 A·B 선 체결과 극성을 확인합니다.`] : undefined,
  };
}

/** 데이터가 오기 전의 ID 수집 모듈 */
export function pendingDevicePart(unitId: string, deviceId: number, port: number): PartInfo {
  return staticPart(`${unitId}:rtu:id${deviceId}`, `ID ${deviceId}`, `RTU ${port}번 포트`, ['수집 상태 불러오는 중']);
}
