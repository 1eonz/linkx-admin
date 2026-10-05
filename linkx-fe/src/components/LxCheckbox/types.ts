/**
 * LxCheckbox 类型契约
 *
 * 视觉源：design/表单控件八件套/code.html 04（复选组）
 * 选中主色填充白勾、半选横杠（EP 原生契约已对齐标本），
 * hover 时描边与文字同步转主色为 Lx 增量规格。
 * 组容器类型见 LxCheckboxGroup/types.ts。
 */

/** 复选项单值类型；独立复选框支持 boolean，组内选项值另限 string 或 number */
export type LxCheckboxValue = string | number | boolean

export interface LxCheckboxProps {
  /** v-model（独立使用时为 boolean，组内由 Group 接管） */
  modelValue?: LxCheckboxValue
  /** 组内该项的选中值（配合 LxCheckboxGroup，仅支持 string 或 number） */
  value?: string | number
  /** 无插槽时的文字回退内容；未传 value 时按 EP 旧契约兼作选中值 */
  label?: string
  /**
   * 禁用态：浅色主题文字使用 --lx-color-info（#909399），HUD 下跟随 HUD 次级文字色。
   * 灰底状态对照标本 04“需支队审批”行。
   * 默认未设置（undefined）：不阻断 EP 内核 useFormDisabled 的 ?? 继承链，
   * CheckboxGroup / ElForm 的禁用态可正常传导；显式传 true/false 才覆盖继承
   */
  disabled?: boolean
  /** 半选态：主色填充 + 白色横杠（标本 04 Indeterminate，仅视觉不改值） */
  indeterminate?: boolean
  /** 原生 name 属性；组内缺省由 LxCheckboxGroup 注入（EP 内核契约） */
  name?: string
}
