import type { LxStatus } from '../../tokens'

export interface LxDescriptionItem {
  key: string
  label: string
  value?: unknown
  span?: number
  labelWidth?: string | number
  copyable?: boolean
  statusDot?: LxStatus
  /** 字段权限脱敏；传字符串时作为无权限占位符。 */
  mask?: boolean | string
}

export interface LxDescriptionsProps {
  items?: LxDescriptionItem[]
  columns?: 1 | 2 | 3
  layout?: 'two-ends' | 'grid' | 'compact'
  rowHeight?: number
  dividerColor?: string
  labelWidth?: string | number
  bordered?: boolean
  size?: 'small' | 'default'
}
