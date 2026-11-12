import { useMemo, useRef } from 'react';
import { Sky, Stars } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { BackSide, Color, type Group, type Mesh } from 'three';
import { useResolvedTheme } from '@/hooks/useResolvedTheme';
import { SCENERY_COLORS } from '@/plants/builders/colors';
import { SUN_DIR } from '@/plants/builders/scene';
import { NO_RAYCAST } from '@/hooks/useInstances';

const SKY_RADIUS = 9000;
const SUN_POSITION: [number, number, number] = [SUN_DIR[0] * 1000, SUN_DIR[1] * 1000, SUN_DIR[2] * 1000];

const DOME_VERTEX = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const NIGHT_FRAGMENT = /* glsl */ `
  uniform vec3 zenith;
  uniform vec3 horizon;
  varying vec3 vDir;
  void main() {
    float h = clamp(vDir.y, 0.0, 1.0);
    gl_FragColor = vec4(mix(horizon, zenith, pow(h, 0.55)), 1.0);
    #include <colorspace_fragment>
  }
`;

// 지평선 아래 반구 — 하늘과 이어지도록 지평선 바로 밑에서 투명하게 번지고, 아래로 갈수록 nadir 색이 된다
const NADIR_FRAGMENT = /* glsl */ `
  uniform vec3 nadir;
  uniform vec3 horizon;
  varying vec3 vDir;
  void main() {
    float h = clamp(-vDir.y, 0.0, 1.0);
    gl_FragColor = vec4(mix(horizon, nadir, smoothstep(0.0, 0.35, h)), smoothstep(0.0, 0.08, h));
    #include <colorspace_fragment>
  }
`;

/** 하늘 메시는 가장 먼저 그리고(뒤에 무엇이든 덮이게) 클릭 대상에서 뺀다 */
const markBackdrop = (mesh: Mesh | null) => {
  if (!mesh) return;
  mesh.renderOrder = -1;
  mesh.raycast = NO_RAYCAST;
};

/** 낮: 물리 기반 하늘 / 밤: 그라데이션 하늘 + 별 + 달. 카메라를 따라다녀 끝에 닿지 않는다 */
export default function SkyDome() {
  const theme = useResolvedTheme();
  const colors = SCENERY_COLORS[theme];
  const group = useRef<Group>(null);

  useFrame(({ camera }) => {
    group.current?.position.copy(camera.position);
  });

  const nightUniforms = useMemo(
    () => ({ zenith: { value: new Color(colors.skyZenith) }, horizon: { value: new Color(colors.skyHorizon) } }),
    [colors.skyZenith, colors.skyHorizon],
  );
  const nadirUniforms = useMemo(
    () => ({ nadir: { value: new Color(colors.skyNadir) }, horizon: { value: new Color(colors.skyHorizon) } }),
    [colors.skyNadir, colors.skyHorizon],
  );

  return (
    <group ref={group}>
      {/* 낮 하늘(Sky)의 지평선 아래는 거의 흰색이라, 내려다볼 때 보이는 빈 배경을 이 반구로 덮는다 */}
      <mesh renderOrder={-1} raycast={NO_RAYCAST}>
        <sphereGeometry args={[SKY_RADIUS / 2.4, 32, 16]} />
        <shaderMaterial
          side={BackSide}
          transparent
          depthWrite={false}
          uniforms={nadirUniforms}
          vertexShader={DOME_VERTEX}
          fragmentShader={NADIR_FRAGMENT}
        />
      </mesh>
      {theme === 'light' ? (
        <Sky
          distance={SKY_RADIUS}
          sunPosition={SUN_POSITION}
          turbidity={4.5}
          rayleigh={1.1}
          mieCoefficient={0.004}
          mieDirectionalG={0.85}
          ref={markBackdrop}
        />
      ) : (
        <>
          <mesh renderOrder={-1} raycast={NO_RAYCAST}>
            <sphereGeometry args={[SKY_RADIUS / 2, 32, 16]} />
            <shaderMaterial
              side={BackSide}
              depthWrite={false}
              uniforms={nightUniforms}
              vertexShader={DOME_VERTEX}
              fragmentShader={NIGHT_FRAGMENT}
            />
          </mesh>
          <Stars radius={3600} depth={600} count={3500} factor={70} saturation={0} fade speed={0} />
          <mesh position={[SUN_DIR[0] * 4000, SUN_DIR[1] * 4000, SUN_DIR[2] * 4000]} raycast={NO_RAYCAST}>
            <sphereGeometry args={[70, 24, 12]} />
            <meshBasicMaterial color="#e9eefb" fog={false} />
          </mesh>
        </>
      )}
    </group>
  );
}
