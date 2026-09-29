/**
 * LxRadio 类型契约
 *
 * 视觉源：design/表单控件八件套/code.html 03（单选组）
 * 选中态为"白底蓝心靶环"（非 EP 默认蓝底白心），样式在组件 style.css 固化。
 * 组容器类型见 LxRadioGroup/types.ts。
 */

/** 单选项的值类型（对齐 EP RadioGroup modelValue 契约） */
export type LxRadioValue = string | number | boolean

export interface LxRadioProps {
  /** 该项的选中值（配合 LxRadioGroup v-model） */
  value?: LxRadioValue
  /** 无插槽时的文字回退内容；未传 value 时按 EP 旧契约兼作选中值 */
  label?: string
  /**
   * 禁用态：灰底描边 + 灰字（标本 03 卫星链路直通行）。
   * 默认未设置（undefined）：不阻断 EP 内核 useFormDisabled 的 ?? 继承链，
   * RadioGroup / ElForm 的禁用态可正常传导；显式传 true/false 才覆盖继承
   */
  disabled?: boolean
  /** 原生 name 属性；组内缺省由 LxRadioGroup 注入（EP 内核契约） */
  name?: string
}
