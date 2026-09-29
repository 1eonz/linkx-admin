import type { LxIconName } from '../LxIcon/icons'

/**
 * LxButton 类型契约
 *
 * 视觉源：design/按钮体系/code.html（拍板 #11）
 * 档名用 sm/md/lg 区别于 EP 的 small/default/large，映射关系见组件内 SIZE_MAP。
 * 拍板 #11 铁律：表格行内禁止 primary 实底；同屏 primary 上限 1 个。
 */
export type LxButtonType =
  'primary' | 'success' | 'warning' | 'danger' | 'default' | 'text'

/** 三档工程尺寸：28 / 32 / 40px */
export type LxButtonSize = 'sm' | 'md' | 'lg'

export interface LxButtonProps {
  /** 按钮形态；text 为表格行内等轻量场景的无底色文字形态 */
  type?: LxButtonType
  /**
   * 无底色文字形态开关，与 type 组合使用（如 type="danger" + text 即标本"移出布控"行内高危操作）。
   * type="text" 等价于 type="default" + text，二者单独出现即可，同时出现时以 text 形态为准
   */
  text?: boolean
  /**
   * 自定义文字色（仅文字形态生效，如品牌强调色、链接继承色等语义外场景）；
   * 支持 CSS 色值，hover 浅色底由组件按该色 8% 透明度自动派生
   */
  textColor?: string
  /** 工程尺寸档：sm=28px / md=32px（基准）/ lg=40px */
  size?: LxButtonSize
  /** 加载态：spinner + 点击拦截 + aria-busy；文字切换由 loadingText 提供 */
  loading?: boolean
  /** 加载态文案（标本场景"下发指令中..."）；仅 loading 时生效，未提供时保留原文字 */
  loadingText?: string
  disabled?: boolean
  /** 前置/后置图标名，统一走 LxIcon（禁用 EP 图标链路） */
  icon?: LxIconName
  /** 图标位置，默认 left */
  iconPosition?: 'left' | 'right'
  /** 块级撑满容器宽 */
  block?: boolean
  /** 原生 type 属性，默认 button；submit/reset 交给外层表单 */
  nativeType?: 'button' | 'submit' | 'reset'
}
