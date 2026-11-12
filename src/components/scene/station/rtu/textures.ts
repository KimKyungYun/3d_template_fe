/*
  RTU 함이 쓰는 캔버스 질감 — 뒤판 타공 망 무늬와 전력량계 표시창.
  쓰는 쪽에서 useMemo 로 만들고 떼어 낼 때 dispose 한다.
*/
import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three';

function sheet(width: number, height: number, background: string) {
  const canvas = document.createElement('canvas');

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, height);

  return { canvas, ctx };
}

function finish(canvas: HTMLCanvasElement): CanvasTexture {
  const texture = new CanvasTexture(canvas);

  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;

  return texture;
}

/** 뒤판 타공 망 무늬 — 흰 판에 구멍 격자 한 칸을 그려 뒤판 전체에 늘려 쓴다 */
export function makeBackPanelTexture(): CanvasTexture {
  const { canvas, ctx } = sheet(64, 64, '#f4f6f7');

  ctx.fillStyle = '#ccd4da';

  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 4; col += 1) {
      ctx.beginPath();
      ctx.arc(col * 16 + 8, row * 16 + 8, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const texture = finish(canvas);

  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(11, 14);

  return texture;
}

/** 전력량계 표시창 — 둥근 창 안의 kWh 지침 (고정 더미 값) */
export function makeMeterDisplayTexture(reading: string): CanvasTexture {
  const { canvas, ctx } = sheet(256, 256, '#dfe4e7');

  ctx.strokeStyle = '#8e969d';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.arc(128, 128, 116, 0, Math.PI * 2);
  ctx.stroke();

  // 회전 원판 띠
  ctx.fillStyle = '#b8bfc4';
  ctx.fillRect(56, 56, 144, 22);
  ctx.fillStyle = '#c0392b';
  ctx.fillRect(104, 56, 18, 22);

  // 지침 창
  ctx.fillStyle = '#f8f5e9';
  ctx.fillRect(40, 100, 176, 54);
  ctx.strokeStyle = '#33383d';
  ctx.lineWidth = 5;
  ctx.strokeRect(40, 100, 176, 54);

  ctx.fillStyle = '#15181b';
  ctx.font = 'bold 42px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(reading, 128, 129);

  ctx.fillStyle = '#33383d';
  ctx.font = 'bold 28px sans-serif';
  ctx.fillText('kWh', 128, 186);

  return finish(canvas);
}
