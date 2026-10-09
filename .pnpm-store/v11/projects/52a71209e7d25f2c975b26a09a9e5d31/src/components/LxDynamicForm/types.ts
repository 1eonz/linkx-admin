import type { FormInstance, FormItemRule } from 'element-plus'

/** 动态表单支持的内置字段类型。 */
export type LxDynamicFormFieldType =
  | 'input'
  | 'password'
  | 'textarea'
  | 'number'
  | 'select'
  | 'remote-select'
  | 'tree-select'
  | 'date'
  | 'daterange'
  | 'switch'
  | 'radio'
  | 'checkbox'
  | 'upload'
  | 'slot'

export interface LxDynamicFormOption {
  label: string
  value: unknown
  disabled?: boolean
}

/**
 * 字段级辅助反馈。用于把远程候选、宿主校验或其他可恢复状态贴近对应字段展示。
 * retry 只负责触发宿主已有的重试流程；请求、loading 和错误处理仍由宿主维护。
 */
export interface LxDynamicFormFieldFeedback {
  status?: 'info' | 'success' | 'warning' | 'error' | 'loading'
  message: string
  retry?: () => void
  retryLabel?: string
}

export interface LxDynamicFormField<
  Model extends Record<string, unknown> = Record<string, unknown>,
> {
  key: string
  label: string
  type: LxDynamicFormFieldType
  /** 在字段前显示通栏语义分组标题；标题不参与字段值、校验和提交。 */
  sectionTitleBefore?: string
  required?: boolean
  span?: 1 | 2 | 3 | 4 | 6 | 8 | 12 | 24
  visible?: boolean | ((model: Model) => boolean)
  disabled?: boolean | ((model: Model) => boolean)
  defaultValue?: unknown
  props?: Record<string, unknown>
  options?: LxDynamicFormOption[]
  /** 可选的字段级状态文案和恢复动作，避免错误提示脱离字段。 */
  feedback?: LxDynamicFormFieldFeedback
  rules?: FormItemRule[]
  slot?: string
}

export interface LxDynamicFormProps<
  Model extends Record<string, unknown> = Record<string, unknown>,
> {
  /** Vue 兼容受控值；与 value 二选一，value 优先。 */
  modelValue?: Model
  /** 受控值契约；配合 change(nextValue)，Vue 模板和 TSX 均可使用。 */
  value?: Model
  fields: LxDynamicFormField<Model>[]
  labelWidth?: string | number
  labelPosition?: 'top' | 'left' | 'right'
  disabled?: boolean
  columns?: 1 | 2 | 3 | 4
  /** 默认 true：按容器宽度在 3/2/1 列之间自适应；false 时使用 columns 固定列数。 */
  adaptive?: boolean
  /** 网格行间距，默认 12px；列间距由 LxForm 统一使用 16px。 */
  rowGap?: number
}

/** 动态表单自定义字段插槽参数。 */
export interface LxDynamicFormSlotProps {
  field: LxDynamicFormField
  value: unknown
  disabled: boolean
  /** 字段反馈说明 ID；自定义控件可将其绑定到 `aria-describedby`。 */
  ariaDescribedBy?: string
  update(value: unknown): void
}

export type LxDynamicFormInstance = Pick<
  FormInstance,
  | 'validate'
  | 'validateField'
  | 'resetFields'
  | 'clearValidate'
  | 'scrollToField'
>
