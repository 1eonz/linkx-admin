import type { LxStatus } from '../../tokens'

export type LxMetricCardStatus = 'normal' | 'success' | 'warning' | 'danger'
export type LxMetricCardValueType = 'default' | 'success' | 'warning' | 'danger'

export interface LxMetricCardProps {
  /** 指标标题；与旧版 label 同时传入时优先使用 title。 */
  title?: string
  /** 保留原有 lx-ui 属性，兼容旧版调用。 */
  label?: string
  value?: number | string
  unit?: string
  /** 指标数值和进度条的语义色；优先级高于兼容属性 valueType。 */
  status?: LxMetricCardStatus
  /** 兼容 Vue3 宿主旧组件的数值颜色属性。 */
  valueType?: LxMetricCardValueType
  /** 指标角标文案；与旧版 badge 同时传入时优先使用 badgeText。 */
  badgeText?: string
  badge?: string
  badgeStatus?: LxStatus
  trend?: string
  trendStatus?: LxStatus
  progress?: number
  /** 进度条左侧说明。 */
  progressLabel?: string
  /** 进度条右侧说明；用于展示格式化后的百分比或业务文案。 */
  progressValue?: string
  /** 兼容 Vue3 宿主旧组件的底部说明属性。 */
  footer?: string
  footerLabel?: string
  footerValue?: string
}
