import { useEffect, useMemo } from 'react';
import { DoubleSide } from 'three';
import { STRING_WIRING_FAULT } from '@/configs/faultCodes';
import { NO_RAYCAST } from '@/hooks/useInstances';
import { useResolvedTheme } from '@/hooks/useResolvedTheme';
import { STATUS_COLORS } from '@/configs/status';
import type { FuseSlot } from '@/interface/equipment';
import { Door } from '../Door';
import { Part } from '../Part';
import { fusePart } from '../partInfo';
import {
  blueBaseGeometry,
  BOARD,
  breakGeometry,
  CABINET,
  cabinetShellGeometry,
  doorFrameGeometry,
  doorHandleGeometry,
  doorWindowGeometry,
  ductGeometry,
  fuseHolderGeometry,
  fuseTerminalGeometry,
  glandGeometry,
  mccbGeometry,
  mergedCables,
  mergedTerminals,
  monitorPcbGeometry,
  mountPlateGeometry,
  powerCableGeometry,
  railGeometry,
  rowSubstrateGeometry,
  SLOTS_PER_BOARD,
  slotX,
  smpsGeometry,
  spdGeometry,
  stickerGeometry,
  stringCable,
  terminalBlockGeometry,
} from './geometry';
import { glandPart, loadingFusePart, mccbPart, monitorPart, smpsPart, spdPart, terminalBlockPart } from './parts';
import { warningTexture } from './textures';
import type { ReactNode } from 'react';

/** 실제 색 — 정상 부품은 상태색을 입히지 않는다 */
const HOLDER_WHITE = '#f3f5f7';
const TERMINAL_ORANGE = '#e0761c';
const CABLE_BLUE = '#2d6fd0';
const STAINLESS = '#c6ccd2';

const POLES: ('+' | '-')[] = ['+', '-'];

interface CombinerCabinetProps {
  unitId: string;
  no: number;
  /** 접속반 번호 (1부터) */
  board: number;
  /** 이 함의 퓨즈 칸 — 데이터가 아직 없으면 빈 배열 */
  fuses: FuseSlot[];
  /** 랙 바닥에서 함 가운데까지 높이 */
  y: number;
  /** 인버터가 통신단절이면 감시 기판도 함께 끊긴 것으로 본다 */
  lost: boolean;
}

/** 퓨즈 줄 기준선 — 극에 따라 홀더·단자 높이가 다르다 */
const rowY = (pole: '+' | '-') =>
  pole === '+'
    ? { holder: BOARD.plusY, terminal: BOARD.plusTerminalY }
    : { holder: BOARD.minusY, terminal: BOARD.minusTerminalY };

/**
 * 뒷면(−z) 스테인리스 접속반 함 — 창 달린 문을 열면 (+)·(−) 입력 퓨즈 10칸씩,
 * 흰 케이블 덕트, 가운데 칸의 단자대·감시 기판·SMPS·MCCB·SPD, 바닥 글랜드와 스트링 케이블이 보입니다.
 * 이상 스트링은 퓨즈 홀더·단자·케이블이 상태색으로 바뀌고, 결선 불량은 케이블이 끊겨 보입니다
 */
export function CombinerCabinet({ unitId, no, board, fuses, y, lost }: CombinerCabinetProps) {
  const theme = useResolvedTheme();
  const bySlot = useMemo(() => new Map(fuses.map((f) => [f.slot, f])), [fuses]);

  // 정상 칸의 주황 단자와 스트링 케이블은 한 덩이로 합치고, 이상 칸만 따로 그려 상태색을 입힌다
  const decoration = useMemo(() => {
    // 스트링 하나가 (+)·(−) 한 쌍이라 두 줄의 정상 칸은 같다
    const normal = Array.from({ length: SLOTS_PER_BOARD }, (_, slot) => slot)
      .filter((slot) => (bySlot.get(slot)?.status ?? 'running') === 'running');

    return {
      terminals: mergedTerminals(normal, [BOARD.plusTerminalY, BOARD.minusTerminalY], BOARD.terminalZ),
      cables: mergedCables(normal),
    };
  }, [bySlot]);

  useEffect(() => () => {
    decoration.terminals?.dispose();
    decoration.cables?.dispose();
  }, [decoration]);

  // 이상 스트링의 케이블 — 결선 불량(고장코드 8)이면 가운데가 끊긴 채로 그린다
  const brokenCables = useMemo(
    () =>
      fuses
        .filter((f) => f.status !== 'running')
        .map((f) => ({
          slot: f.slot,
          color: STATUS_COLORS[theme][f.status],
          cut: f.faultCode === STRING_WIRING_FAULT,
          geometry: stringCable(f.slot, f.faultCode === STRING_WIRING_FAULT),
        })),
    [fuses, theme],
  );

  useEffect(() => () => brokenCables.forEach((c) => c.geometry.dispose()), [brokenCables]);

  const slots: ReactNode[] = [];

  for (const pole of POLES) {
    const { holder, terminal } = rowY(pole);

    for (let slot = 0; slot < SLOTS_PER_BOARD; slot += 1) {
      const fuse = bySlot.get(slot) ?? null;
      const abnormal = fuse !== null && fuse.status !== 'running';
      const color = abnormal ? STATUS_COLORS[theme][fuse.status] : HOLDER_WHITE;

      slots.push(
        <Part
          key={`${pole}${slot}`}
          info={fuse ? fusePart(unitId, no, fuse, pole) : loadingFusePart(unitId, no, board, slot, pole)}
        >
          <mesh geometry={fuseHolderGeometry()} position={[slotX(slot), holder, BOARD.holderZ]}>
            <meshStandardMaterial
              color={color}
              roughness={0.6}
              emissive={abnormal ? color : '#000000'}
              emissiveIntensity={abnormal ? 0.45 : 0}
            />
          </mesh>
          {abnormal ? (
            <mesh geometry={fuseTerminalGeometry()} position={[slotX(slot), terminal, BOARD.terminalZ]}>
              <meshStandardMaterial color={color} roughness={0.5} emissive={color} emissiveIntensity={0.45} />
            </mesh>
          ) : null}
        </Part>,
      );
    }
  }

  return (
    <group position={[0, y, CABINET.z]}>
      <mesh geometry={cabinetShellGeometry()} raycast={NO_RAYCAST} castShadow receiveShadow>
        <meshStandardMaterial color={STAINLESS} metalness={0.8} roughness={0.35} />
      </mesh>
      <mesh geometry={mountPlateGeometry()} raycast={NO_RAYCAST}>
        <meshStandardMaterial color="#dde2e6" roughness={0.65} metalness={0.2} />
      </mesh>

      {/* 흰 케이블 덕트·DIN 레일·녹색 기판 띠·파란 받침 — 누를 일 없는 장식 */}
      <mesh geometry={ductGeometry()} raycast={NO_RAYCAST}>
        <meshStandardMaterial color="#eef1f3" roughness={0.6} />
      </mesh>
      <mesh geometry={rowSubstrateGeometry()} raycast={NO_RAYCAST}>
        <meshStandardMaterial color="#1f7048" roughness={0.75} />
      </mesh>
      <mesh geometry={blueBaseGeometry()} raycast={NO_RAYCAST}>
        <meshStandardMaterial color="#2b62b8" roughness={0.6} />
      </mesh>
      <mesh geometry={railGeometry()} raycast={NO_RAYCAST}>
        <meshStandardMaterial color="#b9c0c6" metalness={0.65} roughness={0.45} />
      </mesh>
      <mesh geometry={powerCableGeometry()} raycast={NO_RAYCAST}>
        <meshStandardMaterial color="#8c1f24" roughness={0.85} />
      </mesh>
      <mesh geometry={stickerGeometry()} raycast={NO_RAYCAST}>
        <meshStandardMaterial map={warningTexture()} transparent alphaTest={0.5} side={DoubleSide} roughness={0.7} />
      </mesh>

      {decoration.terminals ? (
        <mesh geometry={decoration.terminals} raycast={NO_RAYCAST}>
          <meshStandardMaterial color={TERMINAL_ORANGE} roughness={0.5} />
        </mesh>
      ) : null}
      {decoration.cables ? (
        <mesh geometry={decoration.cables} raycast={NO_RAYCAST}>
          <meshStandardMaterial color={CABLE_BLUE} roughness={0.8} />
        </mesh>
      ) : null}
      {brokenCables.map((cable) => (
        <group key={cable.slot}>
          <mesh geometry={cable.geometry} raycast={NO_RAYCAST}>
            <meshStandardMaterial color={cable.color} roughness={0.7} emissive={cable.color} emissiveIntensity={0.4} />
          </mesh>
          {cable.cut ? (
            <mesh
              geometry={breakGeometry()}
              position={[slotX(cable.slot), (BOARD.minusTerminalY + BOARD.glandY) / 2, (BOARD.terminalZ - 0.014 + 0.02) / 2]}
              raycast={NO_RAYCAST}
            >
              <meshStandardMaterial color={STATUS_COLORS[theme].fault} emissive={STATUS_COLORS[theme].fault} emissiveIntensity={1.1} />
            </mesh>
          ) : null}
        </group>
      ))}

      {slots}

      <Part info={terminalBlockPart(unitId, no, board)}>
        <mesh geometry={terminalBlockGeometry()}>
          <meshStandardMaterial color="#23272c" roughness={0.7} />
        </mesh>
      </Part>
      <Part info={monitorPart(unitId, no, board, lost)}>
        <mesh geometry={monitorPcbGeometry()}>
          <meshStandardMaterial
            color={lost ? STATUS_COLORS[theme].commLost : '#1f7048'}
            roughness={0.7}
            emissive={lost ? STATUS_COLORS[theme].commLost : '#000000'}
            emissiveIntensity={lost ? 0.4 : 0}
          />
        </mesh>
      </Part>
      <Part info={smpsPart(unitId, no, board)}>
        <mesh geometry={smpsGeometry()}>
          <meshStandardMaterial color="#d8dde1" roughness={0.6} />
        </mesh>
      </Part>
      <Part info={mccbPart(unitId, no, board)}>
        <mesh geometry={mccbGeometry()} castShadow>
          <meshStandardMaterial color="#e2e6e9" roughness={0.55} />
        </mesh>
      </Part>
      <Part info={spdPart(unitId, no, board)}>
        <mesh geometry={spdGeometry()}>
          <meshStandardMaterial color="#d9dde1" roughness={0.6} />
        </mesh>
      </Part>
      <Part info={glandPart(unitId, no, board, SLOTS_PER_BOARD)}>
        <mesh geometry={glandGeometry()}>
          <meshStandardMaterial color="#1c1f22" roughness={0.9} />
        </mesh>
      </Part>

      <Door id={`${unitId}:${no}:combiner${board}`} hinge={[-CABINET.w / 2, 0, -CABINET.d / 2 - 0.008]} openAngle={2.1}>
        <mesh geometry={doorFrameGeometry()} castShadow>
          <meshStandardMaterial color={STAINLESS} metalness={0.8} roughness={0.35} side={DoubleSide} />
        </mesh>
        <mesh geometry={doorWindowGeometry()}>
          <meshStandardMaterial color="#cfe0ea" metalness={0.1} roughness={0.08} transparent opacity={0.28} side={DoubleSide} />
        </mesh>
        <mesh geometry={doorHandleGeometry()}>
          <meshStandardMaterial color="#9aa2a9" metalness={0.75} roughness={0.4} />
        </mesh>
      </Door>
    </group>
  );
}
