import { cn } from '@/utils/cn';
import type { RtuDevice, RtuState } from '@/interface/equipment';
import styles from './RtuDiagram.module.scss';

interface RtuDiagramProps {
  rtu: RtuState;
  /** 결선도에서 짚을 장비 ID */
  activeId: number | null;
  onPick: (deviceId: number) => void;
}

/*
  받은 RTU 결선도를 태양광용으로 바꿔 그린 것.
  · DC 12V 전원은 세 장비가 함께 쓴다 (빨강 +, 검정 GND)
  · RS485 는 묶지 않고 장비마다 RTU 포트로 따로 간다 (ID1→2번, ID2→3번, ID3→4번)
  · DCPLC 로 센서를 읽는다 (ID2 일사량계, ID3 모듈 온도계), ID1 은 4핀으로 전력량계를 읽는다
*/
const W = 600;
const MODULE_W = 170;
const MODULE_Y = 168;
const MODULE_H = 78;
const PORT_Y = 74;
const PORT_X: Record<number, number> = { 1: 220, 2: 270, 3: 330, 4: 390 };
const MODULE_X = [20, 215, 410];
const SENSOR_Y = 330;

const deviceTone = (d: RtuDevice) => (d.status === 'lost' ? 'lost' : 'ok');

/** RTU 결선도 (그리기 전용) — 끊긴 포트는 회색 점선과 빨간 끊김 점, 살아 있는 선은 흐른다 */
export function RtuDiagram({ rtu, activeId, onPick }: RtuDiagramProps) {
  const portOf = new Map(rtu.devices.map((d) => [d.port, d]));

  return (
    <svg className={styles.diagram} viewBox={`0 0 ${W} 420`} role="img" aria-label="RTU 결선도">
      {/* DC 12V 전원 */}
      <g className={styles.diagram__box}>
        <rect x={20} y={18} width={120} height={50} rx={4} />
        <text x={80} y={40} textAnchor="middle" className={styles.diagram__title}>DC 12V</text>
        <text x={80} y={60} textAnchor="middle" className={styles.diagram__small}>{rtu.power.volt}V</text>
      </g>
      {/* RTU */}
      <g className={styles.diagram__box} data-kind="rtu">
        <rect x={190} y={14} width={230} height={60} rx={4} />
        <text x={305} y={38} textAnchor="middle" className={styles.diagram__title}>RTU</text>
        <text x={305} y={58} textAnchor="middle" className={styles.diagram__small}>RS485 포트</text>
        {[1, 2, 3, 4].map((port) => {
          const device = portOf.get(port);
          const state = !device ? 'idle' : deviceTone(device);

          return (
            <g key={port} className={styles.diagram__port} data-state={state}>
              <circle cx={PORT_X[port]} cy={PORT_Y} r={7} />
              <text x={PORT_X[port]} y={PORT_Y + 22} textAnchor="middle" className={styles.diagram__small}>P{port}</text>
            </g>
          );
        })}
      </g>

      {/* 전원 버스 — 빨강 +, 검정 GND */}
      {/* 전원 버스는 ID 1 상자를 비켜 왼쪽 끝으로 내려간다 */}
      <path className={styles.diagram__power} data-pole="plus" d={`M 20 36 H 6 V 296 H ${MODULE_X[2] + 30}`} />
      <path className={styles.diagram__power} data-pole="gnd" d={`M 20 52 H 12 V 306 H ${MODULE_X[2] + 50}`} />

      {rtu.devices.map((d, i) => {
        const x = MODULE_X[i];
        const tone = deviceTone(d);
        const a = x + 125;
        const b = x + 145;
        const port = PORT_X[d.port];
        const midY = 112 + i * 10;

        return (
          <g
            key={d.deviceId}
            className={cn(styles.diagram__device, { [styles['diagram__device--active']]: activeId === d.deviceId })}
            data-state={tone}
            onClick={() => onPick(d.deviceId)}
            role="button"
            tabIndex={0}
            aria-label={`ID ${d.deviceId} ${d.label} ${tone === 'lost' ? '통신단절' : '정상'}`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') onPick(d.deviceId);
            }}
          >
            {/* RS485 A·B — 장비마다 따로 RTU 포트로 */}
            <path className={styles.diagram__bus} d={`M ${a} ${MODULE_Y} V ${midY} H ${port - 4} V ${PORT_Y + 7}`} />
            <path className={styles.diagram__bus} d={`M ${b} ${MODULE_Y} V ${midY + 6} H ${port + 4} V ${PORT_Y + 7}`} />
            {tone === 'lost' ? <circle className={styles.diagram__break} cx={(a + port) / 2} cy={midY + 3} r={5} /> : null}

            <rect className={styles.diagram__module} x={x} y={MODULE_Y} width={MODULE_W} height={MODULE_H} rx={4} />
            <text x={x + 10} y={MODULE_Y + 22} className={styles.diagram__title}>ID : {d.deviceId}</text>
            <text x={x + 10} y={MODULE_Y + 44} className={styles.diagram__small}>{d.label}</text>
            <text x={x + 10} y={MODULE_Y + 68} className={styles.diagram__small}>전원</text>
            <text x={a - 6} y={MODULE_Y + 66} className={styles.diagram__small}>A</text>
            <text x={b - 4} y={MODULE_Y + 66} className={styles.diagram__small}>B</text>

            {/* 전원 단자 */}
            <path className={styles.diagram__power} data-pole="plus" d={`M ${x + 30} ${MODULE_Y + MODULE_H} V 296`} />
            <path className={styles.diagram__power} data-pole="gnd" d={`M ${x + 50} ${MODULE_Y + MODULE_H} V 306`} />

            {/* 센서 — ID1 은 전력량계 4핀, ID2·3 은 DCPLC */}
            <path
              className={styles.diagram__sensorLine}
              data-kind={d.sensor ? 'dcplc' : 'pin'}
              d={`M ${x + 95} ${MODULE_Y + MODULE_H} V ${SENSOR_Y}`}
            />
            <rect className={styles.diagram__sensor} x={x + 25} y={SENSOR_Y} width={140} height={44} rx={22} />
            <text x={x + 95} y={SENSOR_Y + 27} textAnchor="middle" className={styles.diagram__small}>
              {d.sensor ? d.sensor.label : '전력량계'}
            </text>
          </g>
        );
      })}

      <text x={W / 2} y={410} textAnchor="middle" className={styles.diagram__note}>
        RS485 는 묶지 않고 장비마다 포트에 따로 · 초록 DCPLC · 노랑 4핀
      </text>
    </svg>
  );
}
