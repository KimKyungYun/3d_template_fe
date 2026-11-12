/*
  공용 현장 자료 — 받은 접속반·RTU 함체·현장 사진과 그 위 핫스팟 좌표(사진 가로·세로 %).
  실제 발전소와 1:1 로 맞춘 사진이 아니라 설비 유형 참고용 더미다. 사진을 바꾸면 좌표도 함께 고친다
*/
import combinerSrc from '@/assets/field/combiner-box.webp';
import siteSrc from '@/assets/field/field-site.webp';
import rtuCabinetSrc from '@/assets/field/rtu-cabinet.webp';

export interface PhotoPoint {
  x: number;
  y: number;
}

export const COMBINER_PHOTO = {
  src: combinerSrc,
  /** 위 (+)입력 퓨즈 10칸 */
  plus: [21, 26.8, 32.8, 38.8, 44.6, 50.6, 56.4, 62, 67.8, 73.8].map((x): PhotoPoint => ({ x, y: 15 })),
  /** 아래 (−)입력 퓨즈 10칸 */
  minus: [14.2, 20.4, 26.6, 32.6, 38.6, 44.6, 50.6, 56.4, 62.2, 67.8].map((x): PhotoPoint => ({ x, y: 67 })),
  parts: [
    { id: 'monitor', x: 44, y: 44, title: '스트링 감시 기판', description: '스트링별 전류를 측정해 RTU 4번 포트로 보냅니다. 이 기판이 끊기면 스트링 값이 모두 들어오지 않습니다.' },
    { id: 'smps', x: 53.5, y: 44, title: 'SMPS · 제어 전원', description: '감시 기판과 통신기의 직류 전원입니다. 램프가 꺼져 있으면 차단기부터 확인합니다.' },
    { id: 'terminal', x: 26, y: 44, title: '통신 단자대', description: 'RS485 A·B 선이 들어오는 단자입니다. 선이 풀리면 RTU 에서 통신단절로 표시됩니다.' },
    { id: 'mccb', x: 82, y: 56, title: '직류 주 차단기 (MCCB)', description: '퓨즈·단자 작업 전에 반드시 이 차단기를 내립니다.' },
  ],
} as const;

export const RTU_CABINET_PHOTO = {
  src: rtuCabinetSrc,
  parts: [
    { id: 'breaker', x: 31, y: 30, title: '함 주 차단기', description: 'RTU 함 전체 전원입니다. 내리면 모든 포트가 함께 끊깁니다.' },
    { id: 'meter', x: 63, y: 30, title: '전력량계', description: 'ID 1 장비가 4핀으로 읽어 RTU 2번 포트로 보냅니다.' },
    { id: 'id1', x: 30, y: 60, title: 'ID 1 · 전력량계 수집', description: 'RS485 → RTU 2번 포트' },
    { id: 'id2', x: 50, y: 60, title: 'ID 2 · 인버터 수집', description: 'RS485 → RTU 3번 포트, DCPLC → 일사량계' },
    { id: 'id3', x: 70, y: 60, title: 'ID 3 · 접속반 감시 수집', description: 'RS485 → RTU 4번 포트, DCPLC → 모듈 온도계' },
    { id: 'terminal', x: 68, y: 77, title: 'DC 12V 단자대', description: 'ID 1~3 이 함께 쓰는 12V 전원입니다. 이 단자가 풀리면 세 장비가 모두 꺼집니다.' },
  ],
} as const;

export const SITE_PHOTO = {
  src: siteSrc,
  inverters: [
    { x: 27, y: 48 },
    { x: 40, y: 48 },
    { x: 50, y: 49 },
  ] as PhotoPoint[],
  parts: [
    { id: 'combiner', x: 58, y: 47, title: '접속반 함', description: '스트링 퓨즈와 감시 기판' },
    { id: 'panel', x: 65, y: 46, title: '분전반', description: '인버터 교류 출력이 모이는 함' },
    { id: 'rtu', x: 70, y: 45, title: 'RTU 함', description: '전력량계·인버터·접속반 값을 모아 서버로 보냅니다.' },
    { id: 'tracker', x: 87, y: 36, title: '추적식 모듈', description: '해를 따라 기울기가 바뀌는 가대' },
  ],
} as const;
