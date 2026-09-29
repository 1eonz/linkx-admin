import type { LxSize } from '../../tokens'

export type LxSearchFieldType =
  | 'input'
  | 'select'
  | 'date'
  | 'daterange'
  | 'number'
  | 'tree-select'
  | 'cascader'

export interface LxSearchOption {
  label: string
  value: string | number | boolean
  disabled?: boolean
  children?: LxSearchOption[]
}

/** 与 Element Plus Cascader 节点值契约一致，记录对象按原类型传递。 */
export type LxCascaderOptionValue = string | number | Record<string, any>

export interface LxCascaderOption extends Record<string, any> {
  label: string
  value: LxCascaderOptionValue
  disabled?: boolean
  children?: LxCascaderOption[]
}

interface LxSearchFieldBase {
  key: string
  label: string
  placeholder?: string
  defaultValue?: unknown
  span?: number
  clearable?: boolean
  disabled?: boolean
}

export type LxSearchField =
  | (LxSearchFieldBase & {
      type: Exclude<LxSearchFieldType, 'cascader'>
      options?: LxSearchOption[]
    })
  | (LxSearchFieldBase & {
      type: 'cascader'
      options?: LxCascaderOption[]
    })

export interface LxSearchBarProps {
  fields?: LxSearchField[]
  modelValue?: Record<string, unknown>
  loading?: boolean
  collapsible?: boolean
  collapsed?: boolean
  searchText?: string
  resetText?: string
  size?: LxSize
}
