/**
 * LxUI 共享类型 — 全库唯一类型源（DESIGN-SPEC §2 状态语义系统）
 */

/** 业务状态语义（状态指示专用；动作反馈见下方别名） */
export type LxStatus =
  | 'online'     // 正常/在线/在岗/已连接（绿）
  | 'processing' // 进行中/流转中（亮蓝）
  | 'busy'       // 忙碌/临时离岗/降级/待处理（黄）
  | 'error'      // 错误/断开/紧急/高危（红）
  | 'offline';   // 离线/停用/归档/只读（灰）

/** 动作反馈语义（Toast/Confirm 专用，≠ 状态指示） */
export type LxFeedback = 'success' | 'warning' | 'error' | 'info';

/** 侧边栏形态 */
export type LxSidebarMode = 'rail' | 'expanded';

/** 组件通用尺寸三档 */
export type LxSize = 'small' | 'default' | 'large';

/**
 * 状态 → CSS 变量映射（供组件内联样式/工具消费）
 * 备注：HUD 主题下自动生效（变量被 .lx-theme-hud 覆盖）
 */
export const LX_STATUS_COLOR: Record<LxStatus, string> = {
  online: 'var(--lx-color-success)',
  processing: 'var(--lx-color-primary-container)',
  busy: 'var(--lx-color-warning)',
  error: 'var(--lx-color-error)',
  offline: 'var(--lx-color-info)',
};

/**
 * admin-vue3 旧数字状态（0-7）→ LxStatus 兼容映射
 * @deprecated 迁移期兼容层：业务侧应自建显式映射表（DESIGN-SPEC §2.2）
 */
export const LX_LEGACY_CODE_STATUS: Record<number, LxStatus> = {
  0: 'offline',
  1: 'processing',
  2: 'processing',
  3: 'error',
  4: 'online',
  5: 'busy',
  6: 'error',
  7: 'processing',
};
