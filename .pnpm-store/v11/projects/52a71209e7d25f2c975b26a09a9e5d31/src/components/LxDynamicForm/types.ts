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

export interface LxDynamicFormField<
  Model extends Record<string, unknown> = Record<string, unknown>,
> {
  key: string
  label: string
  type: LxDynamicFormFieldType
  required?: boolean
  span?: 1 | 2 | 3 | 4 | 6 | 8 | 12 | 24
  visible?: boolean | ((model: Model) => boolean)
  disabled?: boolean | ((model: Model) => boolean)
  defaultValue?: unknown
  props?: Record<string, unknown>
  options?: LxDynamicFormOption[]
  rules?: FormItemRule[]
  slot?: string
}

export interface LxDynamicFormProps<
  Model extends Record<string, unknown> = Record<string, unknown>,
> {
  modelValue: Model
  fields: LxDynamicFormField<Model>[]
  labelWidth?: string | number
  labelPosition?: 'top' | 'left' | 'right'
  disabled?: boolean
  columns?: 1 | 2 | 3 | 4
  rowGap?: number
}

/** 动态表单自定义字段插槽参数。 */
export interface LxDynamicFormSlotProps {
  field: LxDynamicFormField
  value: unknown
  disabled: boolean
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
