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

export interface LxSearchField {
  key: string
  label: string
  type: LxSearchFieldType
  options?: LxSearchOption[]
  placeholder?: string
  defaultValue?: unknown
  span?: number
  clearable?: boolean
  disabled?: boolean
}

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
