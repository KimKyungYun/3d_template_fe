/*
  설비 랙 상세 모델에만 쓰는 부품 카드 글. 공용 글(인버터 본체·퓨즈 칸)은 station/partInfo.ts 를 그대로 씁니다.
  화면 문구는 합쇼체·명사형으로 씁니다.
*/
import { staticPart } from '../partInfo';
import type { PartInfo } from '../../store';

/** 함 번호를 붙인 소속 표시 — '인버터 #7 접속반 2' */
const where = (no: number, board: number) => `인버터 #${no} 접속반 ${board}`;

/** 접속반 데이터가 아직 없을 때의 퓨즈 칸 — 자리와 극만 알려 준다 */
export function loadingFusePart(unitId: string, no: number, board: number, slot: number, pole: '+' | '-'): PartInfo {
  const stringNo = (board - 1) * 10 + slot + 1;

  return staticPart(
    `${unitId}:${no}:fuse${pole}${stringNo}`,
    `스트링 ${stringNo} · (${pole === '+' ? '+' : '−'})입력 퓨즈`,
    where(no, board),
    ['불러오는 중'],
  );
}

/** 스트링 감시 PCB — 회로별 전류를 읽어 RTU 로 넘기는 기판 */
export function monitorPart(unitId: string, no: number, board: number, lost: boolean): PartInfo {
  return staticPart(
    `${unitId}:${no}:board${board}:monitor`,
    '스트링 감시 PCB',
    where(no, board),
    lost
      ? ['통신단절 · 회로 전류 수신 없음', 'RS485 로 RTU 4번 포트에 물립니다.']
      : ['정상 · 회로 전류 수신 중', 'RS485 로 RTU 4번 포트에 물립니다.'],
    lost ? 'commLost' : null,
  );
}

/** SMPS — 감시 기판에 직류 12V 를 넣는 전원 */
export function smpsPart(unitId: string, no: number, board: number): PartInfo {
  return staticPart(
    `${unitId}:${no}:board${board}:smps`,
    'SMPS 직류 전원',
    where(no, board),
    ['출력 DC 12V · 감시 기판 전원', 'DIN 레일 위 소형 차단기에서 교류를 받습니다.'],
  );
}

/** MCCB — 접속반에서 인버터로 나가는 직류 주 차단기 */
export function mccbPart(unitId: string, no: number, board: number): PartInfo {
  return staticPart(
    `${unitId}:${no}:board${board}:mccb`,
    '직류 주 차단기 (MCCB)',
    where(no, board),
    ['스트링 10회로를 모아 인버터로 보내는 차단기', '점검 전 이 차단기를 먼저 내립니다.'],
  );
}

/** SPD — 서지 보호기 */
export function spdPart(unitId: string, no: number, board: number): PartInfo {
  return staticPart(
    `${unitId}:${no}:board${board}:spd`,
    '서지 보호기 (SPD)',
    where(no, board),
    ['낙뢰·개폐 서지로부터 직류 회로를 보호합니다.', '점검창이 붉게 바뀌면 교체 대상입니다.'],
  );
}

/** 단자대 — 감시 기판과 계측선을 모으는 자리 */
export function terminalBlockPart(unitId: string, no: number, board: number): PartInfo {
  return staticPart(
    `${unitId}:${no}:board${board}:terminal`,
    '계측 단자대',
    where(no, board),
    ['감시 기판 신호선과 접지선을 모으는 단자대', '체결 풀림은 계측 끊김으로 나타납니다.'],
  );
}

/** 케이블 글랜드 묶음 — 스트링 케이블이 함 밖으로 빠지는 자리 */
export function glandPart(unitId: string, no: number, board: number, count: number): PartInfo {
  return staticPart(
    `${unitId}:${no}:board${board}:gland`,
    '케이블 글랜드',
    where(no, board),
    [`스트링 케이블 ${count}가닥이 지나는 방수 글랜드`, '고무 패킹이 갈라지면 함 안으로 물이 듭니다.'],
  );
}
