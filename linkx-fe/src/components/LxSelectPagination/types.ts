export type LxSelectPaginationValue =
  string | number | (string | number)[] | undefined

export interface LxSelectPaginationItem {
  [key: string]: unknown
}

export interface LxSelectPaginationPage {
  records?: LxSelectPaginationItem[]
  list?: LxSelectPaginationItem[]
  total?: number
  hasMore?: boolean
}

export interface LxSelectPaginationResult extends LxSelectPaginationPage {
  data?: LxSelectPaginationPage
}

export interface LxSelectPaginationRequestParams {
  page: number
  pageSize: number
  keyword: string
  signal?: AbortSignal
  [key: string]: unknown
}

export interface LxSelectPaginationRemoteOptions {
  pageSize: number
  params: Record<string, unknown>
  signal: AbortSignal
}

export type LxSelectPaginationApi = (
  params: LxSelectPaginationRequestParams,
) => Promise<LxSelectPaginationResult>

export type LxSelectPaginationRemoteMethod = (
  keyword: string,
  page: number,
  options: LxSelectPaginationRemoteOptions,
) => Promise<LxSelectPaginationResult>

export interface LxSelectPaginationValueMapItem {
  label: string
  description?: string
  item?: LxSelectPaginationItem
}

export interface LxSelectPaginationProps {
  modelValue?: LxSelectPaginationValue
  api?: LxSelectPaginationApi
  remoteMethod?: LxSelectPaginationRemoteMethod
  params?: Record<string, unknown>
  multiple?: boolean
  placeholder?: string
  searchPlaceholder?: string
  pageSize?: number
  valueKey?: string
  labelKey?: string | ((item: LxSelectPaginationItem) => string)
  descriptionKey?: string
  targetMap?: Record<string, LxSelectPaginationItem>
  valueMap?: Record<string, LxSelectPaginationValueMapItem>
  debounce?: number
  maxCollapseTags?: number
  /** 禁用态；未显式设置时继承 Element Plus 的 ElForm/LxForm 禁用状态。 */
  disabled?: boolean
  clearable?: boolean
  max?: number
}
