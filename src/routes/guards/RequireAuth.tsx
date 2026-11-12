import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthUser } from '@/stores/authStore';
import { PATH } from '@/routes/routes';

/** 로그인 게이트 — 스토어를 구독해 로그아웃이 곧바로 반영된다. 원래 가려던 곳을 실어 보낸다 */
export function RequireAuth() {
  const user = useAuthUser();
  const { pathname, search } = useLocation();

  if (!user) return <Navigate to={PATH.LOGIN} state={{ from: `${pathname}${search}` }} replace />;

  return <Outlet />;
}
