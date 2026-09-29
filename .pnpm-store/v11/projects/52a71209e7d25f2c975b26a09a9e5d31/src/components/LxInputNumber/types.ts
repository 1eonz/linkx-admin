/**
 * LxInputNumber 类型契约
 *
 * 视觉源：design/表单控件八件套/code.html 05（数字输入器）
 * 尺寸档名 sm/md/lg 区别于 EP 的 small/default/large，映射关系见组件内 SIZE_MAP。
 * Lx 默认契约与 EP 原生差异：
 *  - controlsPosition 默认 'right'（标本 05 右侧垂直拆分步进钮为唯一契约；
 *    EP 原生默认 '' 两侧形态），宿主显式传 '' 恢复两侧形态
 *  - 默认宽 160px（标本 w-40；EP 原生 150px），sm/lg 档宽度随 EP 原生
 *  - 值文字左对齐（align 默认 'left'；EP 原生默认 'center'）
 * value-on-clear / autocomplete 等低频 props 经 $attrs 透传。
 */

export type LxInputNumberSize = 'sm' | 'md' | 'lg'

/** 值文字对齐：Lx 默认 left（标本 05 左对齐；EP 原生默认 center） */
export type LxInputNumberAlign = 'left' | 'right' | 'center'

export interface LxInputNumberProps {
  /** 选中值（v-model；清空后为 undefined） */
  modelValue?: number | undefined
  /** 最小值（达到后增加钮禁用；EP 原生默认 -Infinity） */
  min?: number
  /** 最大值（达到后减少钮禁用；EP 原生默认 Infinity） */
  max?: number
  /** 步长 */
  step?: number
  /** 只允许输入步进的倍数 */
  stepStrictly?: boolean
  /** 数值精度（小数位数） */
  precision?: number
  /**
   * 禁用态。默认未设置（undefined）：不阻断 EP 内核 useFormDisabled 的
   * ?? 继承链，ElForm/LxForm 禁用态可正常传导；显式传 true/false 才覆盖
   */
  disabled?: boolean
  /** 是否显示步进钮（false 时纯数字输入） */
  controls?: boolean
  /** 步进钮位置：Lx 默认 right（右侧垂直拆分）；'' 为 EP 两侧形态 */
  controlsPosition?: 'right' | ''
  /** 占位文案 */
  placeholder?: string
  /** 值文字对齐：Lx 默认 left（标本 05 左对齐；EP 原生默认 center） */
  align?: LxInputNumberAlign
  /** 工程尺寸档：sm=28px / md=32px（基准）/ lg=40px */
  size?: LxInputNumberSize
  /** 原生 name 属性（表单序列化 / 读屏关联） */
  name?: string
}
