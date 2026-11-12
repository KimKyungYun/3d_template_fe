// 고장코드 사전 — 충남도교육청 AI 진단의 0~7 분류를 따르고, 8(스트링 결선 불량)을 더했다 (asiad_3d_blueprint 에서 옮김)

export type FaultCodeId = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

/** 스트링 결선 불량 — 3D 결선 경로에서 그 스트링 선을 꺼진 선으로 그린다 */
export const STRING_WIRING_FAULT: FaultCodeId = 8;
export type FaultSeverity = 'info' | 'caution' | 'critical';

export interface FaultCode {
  code: FaultCodeId;
  label: string;
  /** 한 줄 설명 — 표·카드의 상태 밴드에 쓴다 */
  summary: string;
  severity: FaultSeverity;
  /** 어떤 문제인지 */
  description: string[];
  /** 현장 조치 */
  plan: string[];
}

export const FAULT_CODES: Record<FaultCodeId, FaultCode> = {
  0: {
    code: 0,
    label: '정상',
    summary: '예측 대비 정상 범위로 발전 중',
    severity: 'info',
    description: ['측정 발전량이 모델 예측값의 85~105% 범위입니다.'],
    plan: ['별도 조치가 필요하지 않습니다.'],
  },
  1: {
    code: 1,
    label: 'PID 열화',
    summary: '모듈 전위 유도 열화로 출력 점진 저하',
    severity: 'caution',
    description: [
      '프레임과 셀 사이 전위차로 누설 전류가 생겨 셀 출력이 줄어드는 현상입니다.',
      '며칠에 걸쳐 스트링 전압이 조금씩 낮아집니다.',
    ],
    plan: ['접지 상태와 절연 저항을 측정합니다.', 'PID 회복 장치(야간 역전압 인가) 적용을 검토합니다.'],
  },
  2: {
    code: 2,
    label: '다이오드 단락',
    summary: '바이패스 다이오드 단락으로 스트링 전압 저하 고정',
    severity: 'caution',
    description: [
      '바이패스 다이오드가 단락되면 모듈 한 장의 1/3 이 빠진 채로 동작합니다.',
      '일사량과 관계없이 같은 비율로 낮은 것이 특징입니다.',
    ],
    plan: ['해당 스트링의 모듈별 개방 전압(Voc)을 측정해 단락 모듈을 찾습니다.', '모듈 정션박스나 모듈을 교체합니다.'],
  },
  3: {
    code: 3,
    label: '오염·부분 음영',
    summary: '먼지·이물질 또는 부분 음영으로 효율 저하',
    severity: 'caution',
    description: [
      '먼지, 조류 배설물, 낙엽이 쌓였거나 구조물 그림자가 일부 모듈을 가리고 있습니다.',
      '맑은 날 한낮에 차이가 가장 큽니다.',
    ],
    plan: ['현장 사진으로 오염 정도를 확인합니다.', '모듈 세척 일정을 앞당깁니다.'],
  },
  4: {
    code: 4,
    label: '광범위 음영',
    summary: '여러 스트링 동시 저하 (적설·대형 음영 의심)',
    severity: 'caution',
    description: [
      '한 인버터의 스트링 대부분이 같은 시간대에 함께 떨어졌습니다.',
      '적설이나 큰 구조물 그림자일 가능성이 큽니다.',
    ],
    plan: ['기상 기록(적설·결빙)과 대조합니다.', '그림자가 원인이면 계절 변동으로 기록합니다.'],
  },
  5: {
    code: 5,
    label: '일사량계 이상',
    summary: '기준 일사량 오류로 효율 계산 오차',
    severity: 'info',
    description: ['일사량계 값이 이웃 계측과 맞지 않아 예측 발전량이 부정확합니다.'],
    plan: ['일사량계 오염·기울기를 점검하고 교정합니다.'],
  },
  6: {
    code: 6,
    label: '핫스팟',
    summary: '셀 국부 발열로 스트링 출력 급감',
    severity: 'critical',
    description: [
      '셀 균열이나 접합 불량으로 한 지점에 열이 몰리고 있습니다.',
      '방치하면 백시트 손상·화재로 이어질 수 있습니다.',
    ],
    plan: ['열화상 카메라로 해당 스트링을 점검합니다.', '발열 모듈을 분리하고 교체합니다.'],
  },
  7: {
    code: 7,
    label: '인버터 정지',
    summary: '인버터 정지로 발전량 0',
    severity: 'critical',
    description: ['인버터가 보호 동작이나 고장으로 출력을 내지 않고 있습니다.'],
    plan: [
      '인버터 표시창의 에러 코드를 확인합니다.',
      '계통 전압·절연 이상이 없으면 재기동하고, 반복되면 제조사 점검을 요청합니다.',
    ],
  },
  8: {
    code: 8,
    label: '스트링 결선 불량',
    summary: '스트링 케이블 접속 풀림으로 해당 스트링 전류 0',
    severity: 'critical',
    description: [
      '접속반 단자나 스트링 커넥터(MC4)가 풀리거나 빠져 이 스트링이 인버터와 끊겼습니다.',
      '같은 인버터의 다른 스트링은 정상이고 이 스트링만 0%입니다. 모든 스트링이 0%인 인버터 정지와 다릅니다.',
      '풀린 접속부에서 아크가 생기면 화재로 이어질 수 있습니다.',
    ],
    plan: [
      '직류 차단기를 내린 뒤 접속반에서 해당 스트링의 단자·퓨즈 상태를 확인합니다.',
      '스트링 커넥터 탈락이나 피복 손상 구간을 찾아 다시 체결하거나 교체합니다.',
      '복구 전에 극성과 개방 전압(Voc)을 측정합니다.',
    ],
  },
};
