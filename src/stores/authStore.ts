import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { AuthUser, Session } from '@/interface/account';

interface AuthState {
  session: Session | null;
  user: AuthUser | null;
  signIn: (session: Session, user: AuthUser) => void;
  clear: () => void;
}

const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session: null,
      user: null,
      signIn: (session, user) => set({ session, user }),
      clear: () => set({ session: null, user: null }),
    }),
    {
      name: 'solar3d-auth',
      storage: createJSONStorage(() => localStorage),
      version: 1,
      partialize: (state) => ({ session: state.session, user: state.user }),
    },
  ),
);

/* 인터셉터처럼 렌더 밖에서 부르는 자리 — 훅을 쓸 수 없어 getState 로 연다. */
export const getSession = () => useAuthStore.getState().session;

export const useAuthUser = () => useAuthStore((state) => state.user);

export const useSignIn = () => useAuthStore((state) => state.signIn);

export const useSignOut = () => useAuthStore((state) => state.clear);
