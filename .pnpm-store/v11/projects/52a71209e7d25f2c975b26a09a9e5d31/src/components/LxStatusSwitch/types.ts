export interface LxStatusSwitchProps {
  /** 当前状态；数字模式沿用 0=开启、1=关闭。 */
  modelValue?: boolean | number
  /** 正在保存时阻止重复切换并显示加载状态。 */
  loading?: boolean
  /** 只读显示当前状态，不渲染可操作开关。 */
  disabled?: boolean
  /** 关闭操作前的确认说明；开启操作不弹确认框。 */
  confirm?: string | false
  /** 开启状态文案。 */
  onText?: string
  /** 关闭状态文案。 */
  offText?: string
}
