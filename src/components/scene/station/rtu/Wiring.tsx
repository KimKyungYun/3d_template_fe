/*
  함 안 배선 — 2D 결선도(RtuDiagram)와 같은 결선을 그대로 3D 로 잇는다.
  · DC 12V (빨강 +12V · 검정 GND) 는 ID 1·2·3 이 함께 쓴다
  · RS485 (파랑 A·B) 는 묶지 않고 장비마다 RTU 포트로 따로 간다 (ID1→P2, ID2→P3, ID3→P4)
  · ID1 은 노란 4핀으로 전력량계를, ID2·3 은 초록 DCPLC 로 함 밖 센서를 읽는다
  모두 누를 수 없는 장식이다
*/
import { useResolvedTheme } from '@/hooks/useResolvedTheme';
import { NO_RAYCAST } from '@/hooks/useInstances';
import { STATUS_COLORS } from '@/configs/status';
import type { RtuDevice } from '@/interface/equipment';
import { cutWire, merge, once, UNIT_SPHERE, vec, wire } from './geometry';
import { DC_BLOCK, GLAND_X, METER, MODULE, MODULE_SLOTS, PORT_Y, WIRE_COLORS, WIRE_Z } from './layout';
import type { Vector3 } from 'three';

const MODULE_BOTTOM = MODULE.y - MODULE.height / 2;
const MODULE_TOP = MODULE.y + MODULE.height / 2;
const PCB_TOP = MODULE_TOP + 0.034;
const BLOCK_TOP = DC_BLOCK.y + DC_BLOCK.height / 2;

/** DC 12V 공유 전원 — 단자대에서 왼쪽으로 깔리고 모듈마다 한 가닥씩 올라간다 */
const powerGeometry = once(() => {
  const plus: Vector3[][] = [[
    vec(DC_BLOCK.x - 0.03, BLOCK_TOP, -0.06),
    vec(DC_BLOCK.x - 0.05, 1.182, WIRE_Z),
    vec(0, 1.2, WIRE_Z),
    vec(MODULE_SLOTS[0].x - 0.03, 1.2, WIRE_Z),
  ]];
  const gnd: Vector3[][] = [[
    vec(DC_BLOCK.x - 0.006, BLOCK_TOP, -0.06),
    vec(DC_BLOCK.x - 0.03, 1.172, WIRE_Z),
    vec(0, 1.184, WIRE_Z),
    vec(MODULE_SLOTS[0].x - 0.012, 1.184, WIRE_Z),
  ]];

  MODULE_SLOTS.forEach((slot) => {
    plus.push([vec(slot.x - 0.03, 1.198, WIRE_Z), vec(slot.x - 0.03, 1.218, WIRE_Z), vec(slot.x - 0.03, MODULE_BOTTOM, -0.062)]);
    gnd.push([vec(slot.x - 0.012, 1.182, WIRE_Z), vec(slot.x - 0.012, 1.214, WIRE_Z), vec(slot.x - 0.012, MODULE_BOTTOM, -0.062)]);
  });

  return {
    plus: merge(plus.map((points) => wire(points, 0.0028))),
    gnd: merge(gnd.map((points) => wire(points, 0.0028))),
  };
});

/** RS485 A·B 한 쌍이 지나는 길 — 모듈 위 PCB 에서 본체 오른쪽을 돌아 앞면 포트로 내려간다 */
function rs485Path(x: number, index: number, portY: number, lane: number): Vector3[] {
  const band = 1.352 + index * 0.007 + lane * 0.004;

  return [
    vec(x + 0.036 + lane * 0.012, PCB_TOP, -0.063),
    vec(x + 0.058, band, WIRE_Z),
    vec(-0.05, band, WIRE_Z),
    vec(-0.142, band, -0.05),
    vec(-0.196 - lane * 0.006, band - 0.014, -0.027),
    vec(-0.2 - lane * 0.006, portY + 0.016, -0.028),
    vec(-0.19 + lane * 0.005, portY + 0.004 - lane * 0.008, -0.031),
  ];
}

/** 장비마다 성한 가닥 한 벌과 끊긴 가닥 한 벌을 미리 만들어 둔다 */
const rs485Geometry = once(() => MODULE_SLOTS.map((slot, index) => {
  const portY = PORT_Y[slot.port - 1];
  const paths = [0, 1].map((lane) => rs485Path(slot.x, index, portY, lane));
  const cuts = paths.map((points) => cutWire(points, 0.0022));

  return {
    whole: merge(paths.map((points) => wire(points, 0.0022))),
    cut: merge(cuts.map((c) => c.geometry)),
    gap: cuts[0].gap,
  };
}));

/** 늘 같은 자리인 배선 — 4핀·DCPLC·접지·주회로·제어선 */
const fixedGeometry = once(() => ({
  // ID1 → 전력량계 노란 4핀
  pin: wire([
    vec(MODULE_SLOTS[0].x + 0.025, PCB_TOP, -0.063),
    vec(-0.012, 1.326, WIRE_Z),
    vec(0.03, 1.344, WIRE_Z),
    vec(METER.x - 0.03, METER.y - METER.height / 2 - 0.005, -0.055),
  ], 0.0026),
  // ID2·ID3 → 함 아래 글랜드로 빠지는 초록 DCPLC
  dcplc: merge([
    wire([
      vec(MODULE_SLOTS[1].x, MODULE_BOTTOM, -0.062),
      vec(MODULE_SLOTS[1].x - 0.01, 1.17, WIRE_Z),
      vec(GLAND_X[1] + 0.002, 1.06, WIRE_Z),
      vec(GLAND_X[1], 1, -0.04),
      vec(GLAND_X[1], 0.93, -0.012),
    ], 0.003),
    wire([
      vec(MODULE_SLOTS[2].x, MODULE_BOTTOM, -0.062),
      vec(MODULE_SLOTS[2].x + 0.02, 1.16, WIRE_Z),
      vec(0.17, 1.07, WIRE_Z),
      vec(GLAND_X[2] + 0.005, 1.01, -0.045),
      vec(GLAND_X[2], 0.93, -0.012),
    ], 0.003),
  ]),
  earthYellow: wire([
    vec(-0.03, 1.098, -0.072),
    vec(0.016, 1.07, -0.068),
    vec(-0.022, 1.04, -0.064),
    vec(GLAND_X[0] + 0.004, 1.004, -0.05),
    vec(GLAND_X[0] - 0.006, 0.94, -0.016),
  ], 0.0032),
  earthGreen: wire([
    vec(-0.108, 1.098, -0.072),
    vec(-0.152, 1.06, -0.068),
    vec(-0.12, 1.022, -0.062),
    vec(GLAND_X[0] - 0.002, 1, -0.05),
    vec(GLAND_X[0] + 0.006, 0.944, -0.016),
  ], 0.0032),
  // 차단기 아래 단자에서 오른쪽을 돌아 함 밖으로 빠지는 굵은 검정 케이블
  mains: wire([
    vec(-0.06, 1.388, -0.036),
    vec(0.02, 1.356, -0.05),
    vec(0.186, 1.3, -0.058),
    vec(0.2, 1.15, -0.06),
    vec(0.176, 1.04, -0.055),
    vec(GLAND_X[2] + 0.006, 1, -0.046),
    vec(GLAND_X[2] + 0.014, 0.92, -0.006),
  ], 0.009, 48),
  // 차단기 위 단자 ↔ 전력량계 위 단자 회색 배선 다발
  control: merge([0, 1, 2].map((k) => wire([
    vec(-0.136 + k * 0.03, 1.514, -0.03),
    vec(-0.132 + k * 0.03, 1.572, -0.058),
    vec(-0.01, 1.592 - k * 0.005, -0.065),
    vec(METER.x - 0.03 + k * 0.022, 1.57, -0.058),
    vec(METER.x - 0.03 + k * 0.022, METER.y + METER.height / 2 - 0.004, -0.045),
  ], 0.0024))),
}));

interface WiringProps {
  devices: RtuDevice[] | null;
}

/** 함 안 배선 한 벌 — 통신단절 장비의 RS485 는 회색으로 바뀌고 중간이 끊긴다 */
export function Wiring({ devices }: WiringProps) {
  const theme = useResolvedTheme();
  const power = powerGeometry();
  const rs485 = rs485Geometry();
  const fixed = fixedGeometry();
  const lostColor = STATUS_COLORS[theme].commLost;
  const faultColor = STATUS_COLORS[theme].fault;

  return (
    <group raycast={NO_RAYCAST}>
      <mesh geometry={power.plus} raycast={NO_RAYCAST}>
        <meshStandardMaterial color={WIRE_COLORS.plus} roughness={0.45} />
      </mesh>
      <mesh geometry={power.gnd} raycast={NO_RAYCAST}>
        <meshStandardMaterial color={WIRE_COLORS.gnd} roughness={0.45} />
      </mesh>
      {MODULE_SLOTS.map((slot, index) => {
        const lost = devices?.find((d) => d.deviceId === slot.deviceId)?.status === 'lost';
        const strand = rs485[index];

        return (
          <group key={slot.deviceId}>
            <mesh geometry={lost ? strand.cut : strand.whole} raycast={NO_RAYCAST}>
              <meshStandardMaterial color={lost ? lostColor : WIRE_COLORS.rs485} roughness={0.45} />
            </mesh>
            {lost ? (
              <mesh
                geometry={UNIT_SPHERE()}
                position={strand.gap}
                scale={0.006}
                raycast={NO_RAYCAST}
              >
                <meshStandardMaterial color={faultColor} emissive={faultColor} emissiveIntensity={0.6} roughness={0.35} />
              </mesh>
            ) : null}
          </group>
        );
      })}
      <mesh geometry={fixed.pin} raycast={NO_RAYCAST}>
        <meshStandardMaterial color={WIRE_COLORS.pin} roughness={0.45} />
      </mesh>
      <mesh geometry={fixed.dcplc} raycast={NO_RAYCAST}>
        <meshStandardMaterial color={WIRE_COLORS.dcplc} roughness={0.45} />
      </mesh>
      <mesh geometry={fixed.earthYellow} raycast={NO_RAYCAST}>
        <meshStandardMaterial color={WIRE_COLORS.earthYellow} roughness={0.45} />
      </mesh>
      <mesh geometry={fixed.earthGreen} raycast={NO_RAYCAST}>
        <meshStandardMaterial color={WIRE_COLORS.earthGreen} roughness={0.45} />
      </mesh>
      <mesh geometry={fixed.mains} raycast={NO_RAYCAST} castShadow>
        <meshStandardMaterial color={WIRE_COLORS.mains} roughness={0.55} />
      </mesh>
      <mesh geometry={fixed.control} raycast={NO_RAYCAST}>
        <meshStandardMaterial color={WIRE_COLORS.control} roughness={0.5} />
      </mesh>
    </group>
  );
}
