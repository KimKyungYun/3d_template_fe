import { useEffect, useMemo } from 'react';
import { NO_RAYCAST } from '@/hooks/useInstances';
import type { RtuState } from '@/interface/equipment';
import { Part } from '../Part';
import { box, cylinder, merge, once } from './geometry';
import {
  BASE,
  BREAKER,
  CABINET,
  CABINET_MID_Y,
  CABINET_TOP,
  CABINET_Z,
  GLAND_X,
  HALF_D,
  HALF_W,
  MODULE,
  PANEL_Z,
  POST,
  RTU_BODY,
  RTU_COLORS,
} from './layout';
import { enclosurePart } from './parts';
import { makeBackPanelTexture } from './textures';

/** 함체 껍데기 — 위·아래·양옆·뒤벽과 네 모서리 기둥을 한 지오메트리로 */
const shellGeometry = once(() => merge([
  box([CABINET.width, CABINET.wall, CABINET.depth], [0, CABINET.bottom + CABINET.wall / 2, 0]),
  box([CABINET.width, CABINET.wall, CABINET.depth], [0, CABINET_TOP - CABINET.wall / 2, 0]),
  box([CABINET.wall, CABINET.height, CABINET.depth], [-HALF_W + CABINET.wall / 2, CABINET_MID_Y, 0]),
  box([CABINET.wall, CABINET.height, CABINET.depth], [HALF_W - CABINET.wall / 2, CABINET_MID_Y, 0]),
  box([CABINET.width, CABINET.height, CABINET.wall], [0, CABINET_MID_Y, -HALF_D + CABINET.wall / 2]),
  ...[-1, 1].flatMap((sx) => [-1, 1].map((sz) => (
    cylinder(0.018, CABINET.height, [sx * (HALF_W - 0.018), CABINET_MID_Y, sz * (HALF_D - 0.018)], 'y', 10)
  ))),
]));

/** 함 아래 글랜드 판 — 케이블이 빠져나가는 구멍 세 개 */
const glandGeometry = once(() => merge([
  box([0.32, 0.008, 0.13], [0, CABINET.bottom - 0.004, -0.01]),
  ...GLAND_X.map((x) => cylinder(0.011, 0.028, [x, CABINET.bottom - 0.021, -0.01])),
]));

/** 부품을 거는 DIN 레일 — 차단기 줄, 모듈 줄, RTU 본체 세로 줄 */
const railGeometry = once(() => merge([
  box([0.44, 0.012, 0.009], [0, BREAKER.y - BREAKER.height / 2 - 0.009, PANEL_Z + 0.005]),
  box([0.44, 0.012, 0.009], [0, MODULE.y - MODULE.height / 2 - 0.009, PANEL_Z + 0.005]),
  box([0.013, 0.2, 0.009], [RTU_BODY.x, RTU_BODY.y, PANEL_Z + 0.005]),
]));

/** 아연도금 각관 기둥 · 베이스 판 · 함을 매단 브래킷 (함 좌표가 아니라 기둥 바닥 기준) */
const postGeometry = once(() => merge([
  box([BASE.width, BASE.height, BASE.width], [0, BASE.height / 2, 0]),
  box([POST.size, POST.top, POST.size], [0, POST.top / 2, 0]),
  box([0.16, 0.028, 0.06], [0, CABINET.bottom + 0.07, CABINET_Z - HALF_D - 0.025]),
  box([0.16, 0.028, 0.06], [0, CABINET_TOP - 0.07, CABINET_Z - HALF_D - 0.025]),
]));

interface EnclosureProps {
  unitId: string;
  rtu: RtuState | null;
}

/** 함체·뒤판·레일·기둥 — 함 전체가 부품 하나(외함)로 잡힌다 */
export function Enclosure({ unitId, rtu }: EnclosureProps) {
  const backTexture = useMemo(() => makeBackPanelTexture(), []);

  useEffect(() => () => backTexture.dispose(), [backTexture]);

  return (
    <>
      <mesh geometry={postGeometry()} position={[0, 0, -CABINET_Z]} raycast={NO_RAYCAST} castShadow>
        <meshStandardMaterial color={RTU_COLORS.post} metalness={0.6} roughness={0.5} />
      </mesh>
      <Part info={enclosurePart(unitId, rtu)}>
        <mesh geometry={shellGeometry()} castShadow receiveShadow>
          <meshStandardMaterial color={RTU_COLORS.shell} roughness={0.55} metalness={0.05} />
        </mesh>
        <mesh geometry={glandGeometry()} raycast={NO_RAYCAST}>
          <meshStandardMaterial color={RTU_COLORS.frame} roughness={0.5} metalness={0.3} />
        </mesh>
        <mesh position={[0, CABINET_MID_Y, PANEL_Z - 0.005]} raycast={NO_RAYCAST}>
          <boxGeometry args={[0.46, 0.6, 0.006]} />
          <meshStandardMaterial map={backTexture} color={RTU_COLORS.back} roughness={0.6} />
        </mesh>
        <mesh geometry={railGeometry()} raycast={NO_RAYCAST}>
          <meshStandardMaterial color={RTU_COLORS.rail} metalness={0.55} roughness={0.45} />
        </mesh>
      </Part>
    </>
  );
}
