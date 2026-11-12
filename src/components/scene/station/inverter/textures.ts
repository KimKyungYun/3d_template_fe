/*
  인버터 앞판·표시창·경고 스티커 그림. 모두 CanvasTexture 로 그립니다.
  앞판과 스티커는 모든 랙이 같으므로 한 번 만들어 나눠 쓰고, 표시창만 운전 상태에 따라 새로 그립니다.
*/
import { CanvasTexture, SRGBColorSpace } from 'three';
import type { OperationStatus } from '@/configs/status';

function makeCanvas(w: number, h: number) {
  const c = document.createElement('canvas');

  c.width = w;
  c.height = h;

  return { c, ctx: c.getContext('2d')! };
}

function finish(c: HTMLCanvasElement) {
  const tex = new CanvasTexture(c);

  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = 4;

  return tex;
}

/** 인버터 앞판 — 'DASS 25' 로고와 통풍구, 아래쪽 명판 */
function buildFace() {
  const w = 256;
  const h = 320;
  const { c, ctx } = makeCanvas(w, h);

  ctx.fillStyle = '#eef1f4';
  ctx.fillRect(0, 0, w, h);

  // 위쪽 로고 띠
  ctx.fillStyle = '#e3e7ea';
  ctx.fillRect(0, 0, w, 64);
  ctx.fillStyle = '#2b3440';
  ctx.font = 'bold 30px sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillText('DASS 25', 18, 34);
  ctx.fillStyle = '#7b8694';
  ctx.font = '11px sans-serif';
  ctx.fillText('SOLAR INVERTER', 20, 54);

  // 가운데 표시창 자리 테두리 (실제 화면은 따로 붙인다)
  ctx.fillStyle = '#9aa4b0';
  ctx.fillRect(82, 112, 92, 62);

  // 표시창 아래 LED 자리 (실제 점등은 따로 붙인다)
  ctx.fillStyle = '#b8c0c8';
  for (const x of [98, 128, 158]) {
    ctx.beginPath();
    ctx.arc(x, 192, 9, 0, Math.PI * 2);
    ctx.fill();
  }

  // 아래쪽 통풍구
  ctx.fillStyle = '#cfd5db';
  for (let i = 0; i < 8; i += 1) {
    ctx.fillRect(26, 222 + i * 10, w - 52, 5);
  }

  // 명판
  ctx.fillStyle = '#dfe4e8';
  ctx.fillRect(26, 300, 110, 14);
  ctx.fillStyle = '#8a95a2';
  ctx.font = '9px sans-serif';
  ctx.fillText('AC 380V 3P 25kW', 30, 307);

  return finish(c);
}

/** 경고 스티커 — 노란 삼각형에 번개 */
function buildWarning() {
  const size = 64;
  const { c, ctx } = makeCanvas(size, size);

  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = '#f2c310';
  ctx.beginPath();
  ctx.moveTo(32, 6);
  ctx.lineTo(60, 56);
  ctx.lineTo(4, 56);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#1a1a1a';
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.moveTo(36, 20);
  ctx.lineTo(24, 40);
  ctx.lineTo(32, 40);
  ctx.lineTo(27, 52);
  ctx.lineTo(41, 34);
  ctx.lineTo(33, 34);
  ctx.closePath();
  ctx.fill();

  return finish(c);
}

let faceCache: CanvasTexture | null = null;
let warningCache: CanvasTexture | null = null;

/** 인버터 앞판 그림 — 처음 쓸 때 한 번만 만든다 */
export function inverterFaceTexture(): CanvasTexture {
  faceCache ??= buildFace();

  return faceCache;
}

/** 경고 스티커 그림 — 처음 쓸 때 한 번만 만든다 */
export function warningTexture(): CanvasTexture {
  warningCache ??= buildWarning();

  return warningCache;
}

export interface DisplayState {
  status: OperationStatus | null;
  outputKw: number | null;
  faultCode: number | null;
}

/**
 * 인버터 표시창 — 정상이면 「RUN」과 현재 출력, 고장이면 「E07 STOP」처럼 고장코드,
 * 통신단절이면 「COMM ERR」. 정상 글자에는 초록을 쓰지 않습니다
 */
export function buildDisplayTexture({ status, outputKw, faultCode }: DisplayState): CanvasTexture {
  const w = 256;
  const h = 160;
  const { c, ctx } = makeCanvas(w, h);

  ctx.fillStyle = '#0a0f14';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#243040';
  ctx.lineWidth = 6;
  ctx.strokeRect(3, 3, w - 6, h - 6);
  ctx.textBaseline = 'middle';

  if (status === null) {
    ctx.fillStyle = '#5d6b7a';
    ctx.font = 'bold 44px monospace';
    ctx.fillText('- - - -', 56, 80);

    return finish(c);
  }

  if (status === 'commLost') {
    ctx.fillStyle = '#ff9d2e';
    ctx.font = 'bold 36px monospace';
    ctx.fillText('COMM', 24, 58);
    ctx.fillText('ERR', 24, 102);
    ctx.fillStyle = '#7a8699';
    ctx.font = '18px monospace';
    ctx.fillText('NO LINK', 136, 102);

    return finish(c);
  }

  if (status === 'fault') {
    ctx.fillStyle = '#ff4d5e';
    ctx.font = 'bold 44px monospace';
    ctx.fillText(`E${String(faultCode ?? 7).padStart(2, '0')}`, 22, 58);
    ctx.font = 'bold 38px monospace';
    ctx.fillText('STOP', 118, 58);
    ctx.fillStyle = '#c04a56';
    ctx.font = '18px monospace';
    ctx.fillText('OUTPUT 0.0 kW', 22, 112);

    return finish(c);
  }

  const kw = outputKw === null ? '--.-' : outputKw.toFixed(1);

  ctx.fillStyle = status === 'degraded' ? '#ff9d2e' : '#9fe8ff';
  ctx.font = 'bold 32px monospace';
  ctx.fillText(status === 'degraded' ? 'RUN!' : 'RUN', 22, 44);
  ctx.fillStyle = '#eef6ff';
  ctx.font = 'bold 50px monospace';
  ctx.fillText(kw, 22, 104);
  ctx.fillStyle = '#9fb2c6';
  ctx.font = '22px monospace';
  ctx.fillText('kW', 180, 114);

  return finish(c);
}
