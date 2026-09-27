import type { LxStatus } from '../../tokens';

export interface LxNavbarUser {
  name: string;
  role?: string;
  avatar?: string;
}

export interface LxNavbarProps {
  searchPlaceholder?: string;
  notificationCount?: number;
  networkLabel?: string;
  networkStatus?: LxStatus;
  user?: LxNavbarUser;
  /** 是否显示全屏按钮，默认显示 */
  showFullscreen?: boolean;
}
