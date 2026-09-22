/** LxConfirm 类型（stitch Modals & Feedback · ConfirmDialog） */
export interface LxConfirmOptions {
  /** 标题。危险模式默认「确认执行该操作？」 */
  title?: string;
  /** 正文说明（说明后果，设计稿要求不可逆操作必须写明影响范围） */
  message?: string;
  /** 确认按钮文案，默认「确认」；危险模式建议具体动作如「强制解除警戒」 */
  confirmText?: string;
  /** 取消按钮文案，默认「取消」 */
  cancelText?: string;
  /**
   * 危险模式（stitch ConfirmDialog · DANGER 徽标）：
   * 红色警告图标 + 深红标题 + 红底确认按钮
   */
  danger?: boolean;
}
