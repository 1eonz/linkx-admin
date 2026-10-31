import type { LxIconName } from '../LxIcon/icons'

export type LxSectionTitleVariant = 'border' | 'dashed' | 'plain'
export type LxSectionTitleSize = 'small' | 'default' | 'large'
export type LxSectionTitleTagType = 'primary' | 'success' | 'warning' | 'info'
export type LxSectionTitleHeadingLevel = 1 | 2 | 3 | 4 | 5 | 6

export interface LxSectionTitleProps {
  /** 标题文本；空白且无默认插槽时不输出标题语义，仍保留其他区域。 */
  title?: string
  subtitle?: string
  /** 标题语义层级；只改变 HTML 标题标签，不改变视觉字号。 */
  headingLevel?: LxSectionTitleHeadingLevel
  variant?: LxSectionTitleVariant
  size?: LxSectionTitleSize
  icon?: LxIconName
  iconColor?: string
  tag?: string | number
  tagType?: LxSectionTitleTagType
}
