/**
 * LxMessage — 全局提示（Element Plus ElMessage 二次封装）
 * 视觉源：stitch Modals & Feedback · ToastNotification
 *   深色反色底胶囊 + 类型图标，自动消失不阻断操作
 * 时长分级（设计拍板）：error 3s（需阅读原因）/ 其余 1.6s；均可 duration 覆盖
 */
import { ElMessage } from 'element-plus';
import type { LxMessageApi, LxMessageOptions, LxMessageType } from './types';
import './style.css';
import 'element-plus/es/components/message/style/css';

const ERROR_DURATION = 3000;
const DEFAULT_DURATION = 1600;

function show(type: LxMessageType, options: LxMessageOptions | string): void {
  const opts = typeof options === 'string' ? { message: options } : options;
  ElMessage({
    message: opts.message,
    type,
    duration: opts.duration ?? (type === 'error' ? ERROR_DURATION : DEFAULT_DURATION),
    customClass: 'lx-message',
  });
}

export const lxMessage: LxMessageApi = {
  success: (o) => show('success', o),
  error: (o) => show('error', o),
  warning: (o) => show('warning', o),
  info: (o) => show('info', o),
};

export type { LxMessageOptions, LxMessageType, LxMessageApi };
