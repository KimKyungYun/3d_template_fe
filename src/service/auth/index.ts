import { DEMO_ACCOUNT, DEMO_USER } from '@/mocks/accounts';
import { delay } from '@/service/delay';
import type { AuthUser, Session } from '@/interface/account';

export interface SignInRequest {
  loginId: string;
  password: string;
}

export interface SignInResponse {
  session: Session;
  user: AuthUser;
}

export class SignInError extends Error {}

/** 로그인 — 지금은 목 계정과 대조한다. API 가 붙으면 이 안쪽만 바꾼다 */
export async function signIn({ loginId, password }: SignInRequest): Promise<SignInResponse> {
  await delay(520);

  if (loginId !== DEMO_ACCOUNT.loginId || password !== DEMO_ACCOUNT.password) {
    throw new SignInError('아이디 또는 비밀번호가 맞지 않습니다.');
  }

  return { session: { accessToken: `demo-${Date.now()}` }, user: DEMO_USER };
}
