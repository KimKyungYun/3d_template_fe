import { Link } from 'react-router-dom';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { PATH } from '@/routes/routes';
import styles from './NotFound.module.scss';

export default function NotFoundPage() {
  return (
    <div className={styles.notFound}>
      <EmptyState
        icon="compass"
        title="화면을 찾을 수 없습니다"
        description="주소가 바뀌었거나 삭제된 화면입니다."
        action={(
          <Link to={PATH.HOME}>
            <Button variant="secondary" size="sm">대시보드로 돌아가기</Button>
          </Link>
        )}
      />
    </div>
  );
}
