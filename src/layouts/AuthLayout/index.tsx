import { Navigate, Outlet } from 'react-router-dom';
import { useAuthUser } from '@/stores/authStore';
import { PATH } from '@/routes/routes';
import styles from './AuthLayout.module.scss';

/** 로그인처럼 골격 없이 화면을 다 쓰는 자리. 이미 로그인했으면 대시보드로 보낸다 */
export default function AuthLayout() {
  const user = useAuthUser();

  if (user) return <Navigate to={PATH.HOME} replace />;

  return (
    <div className={styles.auth}>
      <Outlet />
    </div>
  );
}
