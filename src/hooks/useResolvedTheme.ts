import { useTheme } from '@/stores/themeStore';
import type { ResolvedTheme } from '@/configs/status';

/**
 * 3D 가 쓰는 테마 한 곳. 앱 테마 저장소(themeStore)가 이미 light·dark 로 정해 두므로 그대로 넘기고,
 * 3D 쪽 색 선택을 이 훅 하나로 모아 둔다 (시스템 설정 추적이 필요해지면 여기만 고친다)
 */
export function useResolvedTheme(): ResolvedTheme {
  return useTheme();
}
