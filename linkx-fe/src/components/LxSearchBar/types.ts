import type { LxSize } from '../../tokens'
import type {
  LxCascaderOption,
  LxCascaderOptionValue,
} from '../LxCascader/types'

export type {
  LxCascaderOption,
  LxCascaderOptionValue,
} from '../LxCascader/types'

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
  /** 未提供 meta 插槽时显示的默认状态；传空字符串可隐藏默认状态行。 */
  statusText?: string
  /** 是否将文本输入框的 Escape 解释为重置全部条件；默认关闭以遵循控件原生退出语义。 */
  escapeReset?: boolean
  size?: LxSize
}
