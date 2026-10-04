import type { CascaderOption, CascaderProps } from 'element-plus'
import type { Language } from 'element-plus/es/locale'

/** Cascader 节点值；保留 Element Plus 的记录对象引用语义。 */
export type LxCascaderOptionValue = string | number | Record<string, unknown>

export type LxCascaderPathValue = LxCascaderOptionValue[]

export interface LxCascaderOption extends Omit<
  CascaderOption,
  'children' | 'value'
> {
  value?: LxCascaderOptionValue
  children?: LxCascaderOption[]
}

export type LxCascaderModelValue =
  | LxCascaderOptionValue
  | LxCascaderPathValue
  | (LxCascaderOptionValue | LxCascaderPathValue)[]
  | null
  | undefined

export type LxCascaderSize = 'sm' | 'md' | 'lg'

export interface LxCascaderProps {
  modelValue?: LxCascaderModelValue
  options?: LxCascaderOption[]
  /** Element Plus 选项字段映射，支持自定义 label/value/children 字段名。 */
  props?: CascaderProps
  id?: string
  name?: string
  autocomplete?: string
  ariaLabel?: string
  ariaLabelledby?: string
  placeholder?: string
  disabled?: boolean
  clearable?: boolean
  filterable?: boolean
  multiple?: boolean
  collapseTags?: boolean
  collapseTagsTooltip?: boolean
  checkStrictly?: boolean
  showAllLevels?: boolean
  emitPath?: boolean
  /** 宿主请求级联数据时的加载态；会暂停选择、清空和已选标签移除。 */
  loading?: boolean
  /** 数据加载失败时显示错误反馈，并允许通过 retry 事件恢复。 */
  error?: boolean
  /** 组件局部语言；未传时继承宿主配置，没有宿主配置时使用简体中文。 */
  locale?: Language
  emptyText?: string
  loadingText?: string
  errorText?: string
  retryText?: string
  size?: LxCascaderSize
}
