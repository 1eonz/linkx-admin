import type { LxStatus } from '../../tokens'

/** LxStatusDot Props（文档：doc/lx-ui/demo/LXSTATUSDOT.md） */
export interface LxStatusDotProps {
  /** 状态语义，见 DESIGN-SPEC §2.1 */
  status?: LxStatus
  /** @deprecated 数字状态（0-7）兼容层，传入时优先于 status；0 映射为 offline，未知值也以 offline 兜底，业务旧映射由宿主适配。 */
  code?: number
  /** 圆点直径 px：允许任意有限正数；非有限值或不大于 0 时回退 8。侧边栏徽章 6 / 常规 8 / 强调 10。 */
  size?: number
  /** online 呼吸动画；同屏大量状态点（>20）时建议关闭 */
  pulse?: boolean
  /** 状态描述，优先用于可访问名称及可见文本；未提供时使用五态中文名称。 */
  statusDesc?: string
  /** 是否显示状态文本 */
  showText?: boolean
}
