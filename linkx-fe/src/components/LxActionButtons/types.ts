/** 表格行内操作按钮项 */
export interface LxActionItem {
  /** 显示文字（纯文字，P2 铁律） */
  label: string;
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
