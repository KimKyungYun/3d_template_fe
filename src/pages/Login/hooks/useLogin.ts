import { useMutation } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { signIn } from '@/service/auth';
import { useSignIn } from '@/stores/authStore';
import { PATH } from '@/routes/routes';
import type { SignInRequest } from '@/service/auth';

/** 로그인 — 성공하면 원래 가려던 곳(없으면 관제)으로 보낸다 */
export function useLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const store = useSignIn();
  const from = (location.state as { from?: string } | null)?.from ?? PATH.HOME;

  return useMutation({
    mutationFn: (request: SignInRequest) => signIn(request),
    onSuccess: ({ session, user }) => {
      store(session, user);
      navigate(from, { replace: true });
    },
  });
}
