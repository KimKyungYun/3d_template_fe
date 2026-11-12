import { useRouteError } from 'react-router-dom';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import styles from './RouteError.module.scss';

/** 라우트가 못 잡은 오류 — 라우터 기본 화면 대신 우리 안내로 받는다 */
export function RouteError() {
  const error = useRouteError();
  const message = error instanceof Error ? error.message : '알 수 없는 오류입니다.';

  return (
    <div className={styles.error}>
      <EmptyState
        icon="alert"
        title="화면 표시 오류"
        description={message}
        action={<Button variant="secondary" size="sm" onClick={() => window.location.reload()}>다시 불러오기</Button>}
      />
    </div>
  );
}
