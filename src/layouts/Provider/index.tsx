import { useEffect } from 'react';
import { MotionConfig } from 'motion/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { applyTheme, useTheme } from '@/stores/themeStore';
import type { ReactNode } from 'react';

interface ProviderProps {
  children: ReactNode;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 모니터링 값은 수집 주기를 따라가므로 창을 다시 잡을 때마다 받지 않는다.
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 60 * 1000,
    },
  },
});

/** 서버 상태·전역 모션 정책·테마 부트스트랩을 맡는다 */
export default function Provider({ children }: ProviderProps) {
  const theme = useTheme();

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  return (
    <QueryClientProvider client={queryClient}>
      <MotionConfig reducedMotion="user" transition={{ ease: [0.22, 0.68, 0.32, 1] }}>
        {children}
      </MotionConfig>
    </QueryClientProvider>
  );
}
