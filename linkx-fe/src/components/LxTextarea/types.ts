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
  /** 禁用态：灰底 + 禁用手势 */
  disabled?: boolean
  /** 只读态 */
  readonly?: boolean
  /** 行数，默认 3（标本 08 三行基准约 74px） */
  rows?: number
  /** 自适应高度：true 随内容撑开，或指定 { minRows, maxRows } 区间 */
  autosize?: boolean | { minRows?: number; maxRows?: number }
  /** 最大输入长度；与 showWordLimit 联动出现计数器 */
  maxlength?: number
  /** 超限处理：truncate 原生硬截断；validate 保留内容并显示超限错误，默认 truncate */
  maxlengthMode?: 'truncate' | 'validate'
  /**
   * 显示字数统计。EP 2.14.6 契约：必须配合 maxlength 才渲染计数器
   * （无 maxlength 时计数器不显示，旧版"域外开口计数"行为已移除；
   * 计数器位置由 attrs 透传 word-limit-position="outside" 切换）
   */
  showWordLimit?: boolean
  /** 原生 resize 行为，默认 vertical（标本 08 resize-y 契约） */
  resize?: 'none' | 'both' | 'horizontal' | 'vertical'
  /** 原生 name 属性 */
  name?: string
}
