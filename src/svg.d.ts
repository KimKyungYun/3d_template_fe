declare module '*.svg' {
  import type { FunctionComponent, SVGProps } from 'react';

  /*
    `vite.config.ts` 의 svgr 이 모든 .svg 를 리액트 컴포넌트로 바꾼다.
    그래서 기본 내보내기가 URL 문자열이 아니라 컴포넌트다 — 문자열로 적어 두면
    `<img src={...}>` 처럼 쓰다가 화면에서야 어긋난 것을 알게 된다.
  */
  const Component: FunctionComponent<SVGProps<SVGSVGElement> & { title?: string }>;

  export default Component;
}
