/**
 * LxRadioGroup 类型契约
 *
 * 视觉源：design/表单控件八件套/code.html 03（单选组）
 * 选中态为"白底蓝心靶环"（非 EP 默认蓝底白心），样式在组件 style.css 固化。
 */

import type { LxRadioValue } from '../LxRadio/types'

export interface LxRadioGroupProps {
  /** 当前选中项的值（v-model） */
  modelValue?: LxRadioValue
  /**
   * 整组禁用（组内单项可单独叠加禁用）。
   * 默认未设置（undefined）：不阻断 EP 内核 useFormDisabled 的 ?? 继承链，
   * ElForm 禁用态可正常传导到整组；显式传 true/false 才覆盖继承
   */
  disabled?: boolean
  /** 垂直排布（标本 03 处置通道优先级行）；默认水平且 16px 间距 */
  vertical?: boolean
  /** 原生 name 属性，注入组内全部 LxRadio */
  name?: string
}
