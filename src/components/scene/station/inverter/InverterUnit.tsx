import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { NO_RAYCAST } from '@/hooks/useInstances';
import { useResolvedTheme } from '@/hooks/useResolvedTheme';
import { ACCENT_COLORS, STATUS_COLORS } from '@/configs/status';
import type { InverterDiagnosis } from '@/interface/diagnosis';
import { Part } from '../Part';
import { inverterBodyStatus, inverterPart } from '../partInfo';
import {
  dcCableGeometry,
  dcConnectorGeometry,
  displayGeometry,
  FACE,
  finGeometry,
  INVERTER,
  inverterFaceGeometry,
  ledGeometry,
} from './geometry';
import { buildDisplayTexture, inverterFaceTexture } from './textures';
import type { MeshStandardMaterial } from 'three';

/** 꺼진 LED 색 */
const LED_OFF = '#4a545e';

interface InverterUnitProps {
  unitId: string;
  no: number;
  diag: InverterDiagnosis | null;
}

/**
 * 앞면(+z) 인버터 — 흰 본체에 'DASS 25' 앞판, 가운데 표시창과 LED 세 알, 옆면 방열판 핀,
 * 아래쪽 DC 커넥터와 트레이로 빠지는 케이블. 표시창과 LED 는 운전 상태를 따라갑니다
 */
export function InverterUnit({ unitId, no, diag }: InverterUnitProps) {
  const theme = useResolvedTheme();
  const faultLed = useRef<MeshStandardMaterial>(null);
  const invalidate = useThree((s) => s.invalidate);
  // 표시창·LED 는 본체 상태를 따른다 — 스트링 일부 이상이면 STOP 이 아니라 RUN!(주의)
  const status = inverterBodyStatus(diag);

  const display = useMemo(
    () => buildDisplayTexture({ status, outputKw: diag?.outputKw ?? null, faultCode: diag?.faultCode ?? null }),
    [status, diag?.outputKw, diag?.faultCode],
  );

  useEffect(() => () => display.dispose(), [display]);

  const accent = ACCENT_COLORS[theme];
  const fault = status === 'fault';
  const running = status === 'running' || status === 'degraded';
  const powerOn = status !== null && status !== 'commLost';
  const runColor = status === 'degraded' ? STATUS_COLORS[theme].degraded : accent;

  // 고장 LED 는 맥박친다 — frameloop="demand" 라 바뀔 때마다 다시 그리게 한다
  useFrame(({ clock }) => {
    const m = faultLed.current;

    if (!m || !fault) return;

    m.emissiveIntensity = 0.6 + 0.9 * (0.5 + 0.5 * Math.sin(clock.elapsedTime * 5));
    invalidate();
  });

  return (
    <>
      <Part info={inverterPart(unitId, no, diag)}>
        <mesh position={[0, INVERTER.y, INVERTER.z]} castShadow receiveShadow>
          <boxGeometry args={[INVERTER.w, INVERTER.h, INVERTER.d]} />
          <meshStandardMaterial color="#e9edf0" roughness={0.6} metalness={0.05} />
        </mesh>
        <mesh geometry={inverterFaceGeometry()} position={[0, INVERTER.y, FACE.z + 0.001]} raycast={NO_RAYCAST}>
          <meshStandardMaterial map={inverterFaceTexture()} roughness={0.55} />
        </mesh>
        <mesh geometry={displayGeometry()} position={[0, INVERTER.y + FACE.displayY, FACE.z + 0.003]} raycast={NO_RAYCAST}>
          <meshStandardMaterial map={display} roughness={0.3} emissiveMap={display} emissive="#ffffff" emissiveIntensity={0.55} />
        </mesh>
        <mesh geometry={ledGeometry()} position={[-FACE.ledX, INVERTER.y + FACE.ledY, FACE.z + 0.003]} raycast={NO_RAYCAST}>
          <meshStandardMaterial
            color={powerOn ? '#dfe9f2' : LED_OFF}
            emissive={powerOn ? '#dfe9f2' : '#000000'}
            emissiveIntensity={powerOn ? 0.9 : 0}
          />
        </mesh>
        <mesh geometry={ledGeometry()} position={[0, INVERTER.y + FACE.ledY, FACE.z + 0.003]} raycast={NO_RAYCAST}>
          <meshStandardMaterial
            color={running ? runColor : LED_OFF}
            emissive={running ? runColor : '#000000'}
            emissiveIntensity={running ? 1 : 0}
          />
        </mesh>
        <mesh geometry={ledGeometry()} position={[FACE.ledX, INVERTER.y + FACE.ledY, FACE.z + 0.003]} raycast={NO_RAYCAST}>
          <meshStandardMaterial
            ref={faultLed}
            color={fault ? STATUS_COLORS[theme].fault : status === 'commLost' ? STATUS_COLORS[theme].commLost : LED_OFF}
            emissive={fault ? STATUS_COLORS[theme].fault : '#000000'}
            emissiveIntensity={fault ? 1 : 0}
          />
        </mesh>
      </Part>
      <mesh geometry={finGeometry()} raycast={NO_RAYCAST}>
        <meshStandardMaterial color="#d2d8dd" metalness={0.5} roughness={0.45} />
      </mesh>
      <mesh geometry={dcConnectorGeometry()} raycast={NO_RAYCAST}>
        <meshStandardMaterial color="#2a2f35" roughness={0.7} />
      </mesh>
      <mesh geometry={dcCableGeometry()} raycast={NO_RAYCAST}>
        <meshStandardMaterial color="#20262c" roughness={0.85} />
      </mesh>
    </>
  );
}
