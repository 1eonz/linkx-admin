/** LxMessage 类型（stitch Modals & Feedback · ToastNotification） */
export type LxMessageType = 'success' | 'error' | 'warning' | 'info';

export interface LxMessageOptions {
  /** 提示文案 */
  message: string;
  /** 自动消失时长（ms），传 0 不自动消失。默认 1600（设计稿标注 1.6s） */
  duration?: number;
}

/** 轻量反馈：深色胶囊全局提示，不阻断操作 */
export interface LxMessageApi {
  success: (options: LxMessageOptions | string) => void;
  error: (options: LxMessageOptions | string) => void;
  warning: (options: LxMessageOptions | string) => void;
  info: (options: LxMessageOptions | string) => void;
}
