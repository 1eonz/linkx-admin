/**
 * LxCheckboxGroup 类型契约
 *
 * 视觉源：design/表单控件八件套/code.html 04（复选组）
 * 选中主色填充白勾、半选横杠（EP 原生契约已对齐标本），
 * hover 时描边与文字同步转主色为 Lx 增量规格。
 */

export interface LxCheckboxGroupProps {
  /**
   * 当前选中值集合（v-model）
   * 类型对齐 EP 2.14.6 checkbox-group 契约（string | number 数组，不含 boolean）；
   * 单项独立使用的 boolean 值契约见 LxCheckboxProps.modelValue
   */
  modelValue?: (string | number)[]
  /**
   * 整组禁用（组内单项可单独叠加禁用）。
   * 默认未设置（undefined）：不阻断 EP 内核 useFormDisabled 的 ?? 继承链，
   * ElForm 禁用态可正常传导到整组；显式传 true/false 才覆盖继承
   */
  disabled?: boolean
  /** 垂直排布（标本 04 权限列表）；默认水平且 16px 间距 */
  vertical?: boolean
  /** 原生 name 属性，注入组内全部 LxCheckbox */
  name?: string
}
