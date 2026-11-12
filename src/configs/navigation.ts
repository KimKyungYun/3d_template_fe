import { PATH } from '@/routes/routes';
import type { IconName } from '@/components/common/Icon';

export interface NavItem {
  key: 'home' | 'statistics' | 'diagnosis';
  label: string;
  path: string;
  icon: IconName;
}

export const NAV_ITEMS: NavItem[] = [
  { key: 'home', label: '대시보드', path: PATH.HOME, icon: 'radar' },
  { key: 'statistics', label: '발전통계', path: PATH.STATISTICS, icon: 'chart' },
  { key: 'diagnosis', label: '고장진단', path: PATH.DIAGNOSIS, icon: 'pulse' },
];

/** 지금 주소가 속한 메뉴 — 뎁스 경로도 맨 앞 마디로 가른다 */
export const navItemOf = (pathname: string) =>
  NAV_ITEMS.find((item) => item.path !== PATH.HOME && pathname.startsWith(item.path)) ??
  (pathname === PATH.HOME ? NAV_ITEMS[0] : undefined);
