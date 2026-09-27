import type { LxIconName } from '../LxIcon/icons';

/** LxDialog Props（stitch Modals & Feedback · FormModal 三段式） */
export interface LxDialogProps {
  /** 显隐（v-model） */
  modelValue?: boolean;
  /** 标题（14px 加粗） */
  title?: string;
  /** 标题左侧图标（可选；危险模式下固定 warning 图标） */
  icon?: LxIconName;
  /** 宽度（px；默认 672 = 设计稿表单弹窗 max-w-2xl） */
  width?: number | string;
  /**
   * 危险模式：图标与标题转深红、确认按钮红底
   * （常规确认走 lxConfirm，此模式用于带表单的危险操作弹窗）
   */
  danger?: boolean;
  /** 确认按钮文案，默认「确认」 */
  confirmText?: string;
  /** 取消按钮文案，默认「取消」 */
  cancelText?: string;
  /** 确认按钮加载态（提交中禁点） */
  loading?: boolean;
  /** 点击遮罩关闭（表单填写中建议 false 防误触） */
  closeOnClickModal?: boolean;
  /** 按 ESC 关闭（默认 true；脏数据敏感场景可关闭，设计拍板 #9） */
  closeOnPressEsc?: boolean;
  /** 头部可拖拽移动弹窗位置（默认 true，设计拍板 #9） */
  draggable?: boolean;
  /** 隐藏底部按钮栏（纯展示型弹窗用 #footer 自定义时设 true 亦可） */
  hideFooter?: boolean;
}
