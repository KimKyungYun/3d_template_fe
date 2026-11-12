import type { AuthUser } from '@/interface/account';

/*
  목 계정 — 실제 인증 API 가 붙기 전까지 쓰는 데모 계정이다.
  로그인 화면이 이 값을 안내 문구로 보여 준다.
*/
export const DEMO_ACCOUNT = { loginId: 'admin', password: 'solar3d' } as const;

export const DEMO_USER: AuthUser = {
  loginId: DEMO_ACCOUNT.loginId,
  name: '관제 운영자',
  role: 'admin',
  orgName: '3D 태양광 관제센터',
};
