/**
 * LxInput 类型契约
 *
 * 视觉源：design/表单控件八件套/code.html 01（文本输入框）
 * 尺寸档名 sm/md/lg 区别于 EP 的 small/default/large，映射关系见组件内 SIZE_MAP；
 * 高度经全局令牌桥（--el-component-size*）收敛为 28/32/40px。
 * 文本域形态独立为 LxTextarea，本组件不接受 type="textarea"。
 */
export type LxInputSize = 'sm' | 'md' | 'lg'

export interface LxInputProps {
  /** 输入值（v-model） */
  modelValue?: string | number
  /** 原生 input type（text/password 等）；文本域请使用 LxTextarea */
  type?: string
  /** 占位文案 */
  placeholder?: string
  /**
   * 禁用态：灰底 #f5f7fa + 禁用手势（标本八件套 01 禁用行）。
   * 默认未设置（undefined）：不阻断 EP 内核 useFormDisabled 的 ?? 继承链，
   * ElForm 禁用态可正常传导到本控件；显式传 true/false 才覆盖继承
   */
  disabled?: boolean
  /** 只读态：可聚焦不可改值 */
  readonly?: boolean
  /** 可清空：值非空时右侧出现清除按钮（标本八件套 01 默认行 cancel 图标） */
  clearable?: boolean
  /** 密码可见切换（仅 type="password" 生效，EP 内核行为） */
  showPassword?: boolean
  /** 最大输入长度；与 showWordLimit 联动出现计数器 */
  maxlength?: number
  /** 最小输入长度（表单校验契约，不产生视觉反馈） */
  minlength?: number
  /** 显示字数统计（需配合 maxlength） */
  showWordLimit?: boolean
  /**
   * 值用等宽字体（标本八件套 01 聚焦行 font-mono 契约）：
   * 警号、证件号、编码等机器读数字段开启；普通文案字段保持默认字体
   */
  mono?: boolean
  /** 工程尺寸档：sm=28px / md=32px（基准）/ lg=40px */
  size?: LxInputSize
  /** 原生 name 属性（表单序列化 / 读屏关联） */
  name?: string
  /** 自动完成提示；涉密字段宿主应传 'off'（默认不走浏览器记忆） */
  autocomplete?: string
}
