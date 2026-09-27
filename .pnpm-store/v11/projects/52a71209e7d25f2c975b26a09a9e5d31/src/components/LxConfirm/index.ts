/**
 * LxConfirm — 确认提示框（Element Plus ElMessageBox 二次封装）
 * 视觉源：stitch Modals & Feedback · ConfirmDialog
 *   危险形态：红色 warning 图标 + 深红标题 + 后果说明 + 红底主按钮
 *   标准形态：警告图标 + 常规确认
 * 返回 Promise<boolean>，确认 true / 取消 false（业务无需 try/catch reject）
 */
import { ElMessageBox } from 'element-plus';
import type { LxConfirmOptions } from './types';
import './style.css';
import 'element-plus/es/components/message-box/style/css';

export async function lxConfirm(options: LxConfirmOptions = {}): Promise<boolean> {
  const {
    title,
    message = '',
    confirmText = '确认',
    cancelText = '取消',
    danger = false,
  } = options;

  try {
    await ElMessageBox.confirm(message, title ?? (danger ? '确认执行该操作？' : '确认'), {
      confirmButtonText: confirmText,
      cancelButtonText: cancelText,
      type: danger ? 'error' : 'warning',
      // 设计稿确认框居中图标形态
      center: true,
      customClass: danger ? 'lx-confirm lx-confirm--danger' : 'lx-confirm',
      confirmButtonClass: danger ? 'lx-confirm__btn-danger' : '',
      // 纯确认语义不允许点遮罩误触（危险操作尤其）
      closeOnClickModal: false,
      closeOnPressEscape: true,
      // 取消按钮走 EP 默认 plain 风格（灰底描边）
      distinguishCancelAndClose: false,
    });
    return true;
  } catch {
    return false;
  }
}

export type { LxConfirmOptions };
