import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import checker from 'vite-plugin-checker';
import svgr from 'vite-plugin-svgr';

export default defineConfig({
  plugins: [
    react(),
    svgr({ include: '**/*.svg' }),
    checker({
      typescript: true,
      overlay: {
        badgeStyle: 'width:fit-content;font-size:14px;',
      },
    }),
  ],
  resolve: {
    alias: [{ find: '@', replacement: path.resolve(import.meta.dirname, 'src') }],
  },
  build: {
    // 3D(three) 덩어리가 커서 경고 기준을 올린다. 로그인부터 3D 를 그리므로 어차피 첫 화면에 다 필요하다.
    chunkSizeWarningLimit: 3000,
    rolldownOptions: {
      output: {
        /*
          화면 조각(청크)으로 쪼개지 않고 한 벌로 묶는다 (chungnam_edu 와 같은 결정).
          쪼개면 배포마다 옛 조각이 지워져, 열려 있던 탭이 처음 들어가는 화면에서 지워진 조각을 불러 실패한다.
        */
        codeSplitting: false,
      },
    },
  },
  server: {
    host: true,
    port: 13020,
  },
});
