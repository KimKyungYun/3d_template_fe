import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      // 관제 화면이라 어두운 쪽이 기본이다 — 3D 스캔 빛과 고장 점등이 어두운 바탕에서 잘 읽힌다.
      theme: 'dark',
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set({ theme: get().theme === 'dark' ? 'light' : 'dark' }),
    }),
    {
      name: 'solar3d-theme',
      storage: createJSONStorage(() => localStorage),
      version: 1,
      partialize: (state) => ({ theme: state.theme }),
    },
  ),
);

/** html[data-theme] 갱신 — 첫 페인트 전 부트스트랩과 Provider 의 효과가 쓴다. */
export function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme);
}

export const getTheme = () => useThemeStore.getState().theme;

export const useTheme = () => useThemeStore((state) => state.theme);

export const useToggleTheme = () => useThemeStore((state) => state.toggleTheme);

export default useThemeStore;
