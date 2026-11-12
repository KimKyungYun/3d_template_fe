/*
  마지막으로 쓴 입력 수단을 문서에 적어 둔다.

  포커스 링은 키보드로 옮겨 다닐 때만 있으면 된다. `:focus-visible` 이 대부분을 걸러 주지만,
  모달을 닫고 트리거로 포커스를 되돌리는 것처럼 코드가 직접 `focus()` 를 부르는 자리에서는
  마우스로 눌렀는데도 링이 남는다. 그래서 입력 수단을 표식으로 남기고,
  포인터로 만졌을 때는 전역 링을 끈다(`styles/base/_global.scss`).
*/

/** 포커스 이동에 쓰는 키 — 이 키를 눌렀다면 키보드로 다니는 중이다. */
const NAV_KEYS = new Set(['Tab', 'Escape', 'Enter', ' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End']);

export function watchInputMode() {
  const set = (mode: 'pointer' | 'keyboard') => {
    document.documentElement.dataset.input = mode;
  };

  set('pointer');

  // 캡처 단계에서 받아 둔다 — 중간에서 이벤트를 멈추는 컴포넌트가 있어도 표식은 남아야 한다.
  document.addEventListener('pointerdown', () => set('pointer'), true);
  document.addEventListener('keydown', (event) => {
    if (NAV_KEYS.has(event.key)) set('keyboard');
  }, true);
}
