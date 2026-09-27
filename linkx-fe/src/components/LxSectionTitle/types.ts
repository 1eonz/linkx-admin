import type { LxIconName } from '../LxIcon/icons'

export type LxSectionTitleVariant = 'border' | 'dashed' | 'plain'
export type LxSectionTitleSize = 'small' | 'default' | 'large'
export type LxSectionTitleTagType = 'primary' | 'success' | 'warning' | 'info'

export interface LxSectionTitleProps {
  title?: string
  subtitle?: string
  variant?: LxSectionTitleVariant
  size?: LxSectionTitleSize
  icon?: LxIconName
  iconColor?: string
  tag?: string | number
  tagType?: LxSectionTitleTagType
}
