export type Role = 'admin' | 'operator';

export interface AuthUser {
  loginId: string;
  name: string;
  role: Role;
  orgName: string;
}

export interface Session {
  accessToken: string;
}
