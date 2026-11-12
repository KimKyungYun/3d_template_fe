import { Icon } from '@/components/common/Icon';
import { useSceneApi } from '../SceneContext';
import styles from './ViewReset.module.scss';

/**
 * 시점 초기화 — 카메라를 처음 구도(지금 뷰의 전체 보기)로 되돌린다.
 * 고른 인버터·주소는 그대로 두고, 열린 부품 카드와 현장 시점만 닫는다
 */
export function ViewReset() {
  const api = useSceneApi();

  const reset = () => {
    const state = api.getState();

    state.selectPart(null);
    state.setView(state.view);
  };

  return (
    <button type="button" className={styles.reset} onClick={reset} title="시점 초기화">
      <Icon name="home" size={15} />
      <span>시점 초기화</span>
    </button>
  );
}
