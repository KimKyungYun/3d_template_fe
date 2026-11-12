import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Provider from '@/layouts/Provider';
import { applyTheme, getTheme } from '@/stores/themeStore';
import { watchInputMode } from '@/utils/inputMode';
import App from './App';
// 글꼴은 빌드 결과물에 넣는다 — 시연·운영망에서 CDN 을 못 부르면 시간 초과까지 화면이 멈춘다.
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import '@fontsource/jetbrains-mono/600.css';
import './index.scss';

// 첫 페인트 전에 저장된 테마를 반영해 색이 튀지 않게 한다.
applyTheme(getTheme());

// 포커스 링을 키보드로 다닐 때만 보이게 하려고 입력 수단을 지켜본다.
watchInputMode();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider>
      <App />
    </Provider>
  </StrictMode>,
);
