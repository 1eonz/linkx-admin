import type { LxStatus } from '../../tokens';

/** LxStatusDot Props（文档：doc/lx-ui/demo/LXSTATUSDOT.md） */
export interface LxStatusDotProps {
  /** 状态语义，见 DESIGN-SPEC §2.1 */
  status?: LxStatus;
  /** @deprecated 数字状态（0-7）兼容层，传入时优先于 status，迁移期后移除 */
  code?: number;
  /** 圆点直径 px：侧边栏徽章 6 / 常规 8 / 强调 10 */
  size?: number;
  /** online 呼吸动画；同屏大量状态点（>20）时建议关闭 */
  pulse?: boolean;
  /** 状态文本 */
  statusDesc?: string;
  /** 是否显示状态文本 */
  showText?: boolean;
}
