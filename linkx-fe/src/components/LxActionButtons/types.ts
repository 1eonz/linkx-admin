import type { LxIconName } from '../LxIcon/icons'

/** 表格行内操作按钮项 */
export interface LxActionItem {
  /** 可选稳定键，未传入时由显示名称和列表顺序生成。 */
  key?: string
  /** 显示文字 */
  label: string
  /** 可选图标（默认纯文字；传入时显示在文字左侧，尺寸跟 LxButton 文字形态图标档） */
  icon?: LxIconName
  /**
   * 语义色档（2026-09-29 两项目 192 例全量调研拍板的映射规律）：
   * 编辑/详情/常规操作 = primary（蓝）；删除/禁用/解绑 = danger（红）；
   * 启用/恢复/拒绝 = warning（橙）；激活/正向授权 = success（绿）。
   * default 兼容旧值，渲染与 primary 同为蓝色文字形态
   */
  type?: 'primary' | 'success' | 'warning' | 'danger' | 'default'
  /**
   * 自定义文字色（语义色之外的场景，如品牌强调色）；hover 浅底按该色自动派生
   */
  textColor?: string
  /** 权限/条件隐藏（业务侧过滤后传入） */
  hidden?: boolean
  /** 权限码；未传入时保持兼容行为。 */
  auth?: string | string[]
  /** 禁用该项并阻止点击事件。 */
  disabled?: boolean
  /**
   * 点击回调（可选）：与统一 click 事件并存，派发顺序为先事件后回调。
   * 不关心统一事件的场景直接在项上绑定，省去父级按 key 分发
   */
  onClick?: (action: LxActionItem) => void
  /** 业务透传 */
  meta?: Record<string, unknown>
}

/** LxActionButtons Props（表格行内操作，LxButton 文字形态 + 溢出折叠） */
export interface LxActionButtonsProps {
  /** 操作列表 */
  actions?: LxActionItem[]
  /** 直接显示的数量，超出折叠进"更多"；随权限过滤/条件显隐动态变化时自动增减 */
  max?: number
  /** 折叠菜单触发文字 */
  moreText?: string
}
