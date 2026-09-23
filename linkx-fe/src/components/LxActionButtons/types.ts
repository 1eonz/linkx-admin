import type { LxIconName } from '../LxIcon/icons';

/** 表格行内操作按钮项 */
export interface LxActionItem {
  /** 显示文字 */
  label: string;
  /** 可选图标（默认纯文字；传入时显示在文字左侧 16px，对齐 V3 ActionButtons 惯用法） */
  icon?: LxIconName;
  /** 语义：default 链接蓝 / danger 删除红 */
  type?: 'default' | 'danger';
  /** 权限/条件隐藏（业务侧过滤后传入） */
  hidden?: boolean;
  /** 业务透传 */
  meta?: Record<string, unknown>;
}

/** LxActionButtons Props（表格行内操作，纯文字 + 溢出折叠） */
export interface LxActionButtonsProps {
  /** 操作列表 */
  actions?: LxActionItem[];
  /** 直接显示的数量，超出折叠进"更多" */
  max?: number;
  /** 折叠菜单触发文字 */
  moreText?: string;
}
