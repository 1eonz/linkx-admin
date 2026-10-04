import type { Language } from 'element-plus/es/locale'

/** LxTreeSelect 的树下拉值；保持 Element Plus 的原始值形态，不做字符串化。 */
export type LxTreeSelectPrimitive = string | number | boolean

export type LxTreeSelectValue =
  | null
  | LxTreeSelectPrimitive
  | Record<string, unknown>
  | LxTreeSelectPrimitive[]
  | Record<string, unknown>[]

export type LxTreeSelectSize = 'sm' | 'md' | 'lg'

export interface LxTreeSelectProps {
  /** 选中值（v-model；多选模式下由 footer 确认后才提交） */
  modelValue?: LxTreeSelectValue
  data?: Record<string, unknown>[]
  placeholder?: string
  disabled?: boolean
  clearable?: boolean
  filterable?: boolean
  multiple?: boolean
  collapseTags?: boolean
  collapseTagsTooltip?: boolean
  loading?: boolean
  /** 加载失败状态；传入字符串时直接作为错误文案展示。 */
  error?: boolean | string
  /** 错误状态文案；error 为字符串时优先使用 error。 */
  errorText?: string
  /** 错误状态是否展示重试按钮。 */
  retryable?: boolean
  /** 重试按钮文案。 */
  retryText?: string
  /** 组件局部 Element Plus 语言包；未传时继承宿主配置，缺少宿主配置时默认中文。 */
  locale?: Language
  /** 空目录文案；同时作为 noDataText 的兜底。 */
  emptyText?: string
  /** 没有数据时的下拉文案。 */
  noDataText?: string
  /** 筛选无匹配时的下拉文案。 */
  noMatchText?: string
  /** 加载中的下拉文案。 */
  loadingText?: string
  /** 多选 footer 文案；selectedText 支持 `{count}` 占位符。 */
  selectedText?: string
  unselectedText?: string
  cancelText?: string
  confirmText?: string
  size?: LxTreeSelectSize
}
