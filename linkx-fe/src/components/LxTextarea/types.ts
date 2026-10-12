/**
 * LxTextarea 类型契约
 *
 * 视觉源：design/表单控件八件套/code.html 08（文本域）
 * maxlength 默认沿用原生硬截断；validate 模式保留超限输入并显示设计稿错误反馈。
 */
export interface LxTextareaProps {
  /** 输入值（v-model） */
  modelValue?: string
  /** 占位文案 */
  placeholder?: string
  /** 原生 id 属性；未设置时生成实例唯一标识 */
  id?: string
  /** 禁用态：灰底 + 禁用手势 */
  disabled?: boolean
  /** 只读态 */
  readonly?: boolean
  /** 行数，默认 3（标本 08 三行基准约 74px） */
  rows?: number
  /** 自适应高度：true 随内容撑开，或指定 { minRows, maxRows } 区间 */
  autosize?: boolean | { minRows?: number; maxRows?: number }
  /** 最大输入长度；遵循原生 textarea 的 UTF-16 代码单元规则，默认显示计数器，可通过 showWordLimit 关闭 */
  maxlength?: number
  /** 超限处理：truncate 原生硬截断；validate 保留内容并显示超限错误，默认 truncate */
  maxlengthMode?: 'truncate' | 'validate'
  /**
   * 显示内容长度计数，默认开启；需配合非负 maxlength，且仅在字段可编辑、非只读、未禁用时显示。
   * 计数变化不逐字播报；状态从未到限转为到限或超限时各播报一次。
   * 初始值已到限或超限时不主动播报，用户聚焦字段后可读取当前长度和状态。
   */
  showWordLimit?: boolean
  /** 截断模式的计数位置，默认在文本域下方；inside 会为计数预留底部内边距，校验模式始终显示在下方 */
  wordLimitPosition?: 'inside' | 'outside'
  /** 原生 resize 行为，默认 vertical（标本 08 resize-y 契约） */
  resize?: 'none' | 'both' | 'horizontal' | 'vertical'
  /** 原生 name 属性 */
  name?: string
}
