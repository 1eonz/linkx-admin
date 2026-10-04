export interface LxStatusSwitchConfirmOptions {
  /** 危险操作弹窗标题。 */
  title?: string
  /** 关闭后的影响说明。 */
  message?: string
  /** 确认按钮文案。 */
  confirmText?: string
  /** 取消按钮文案。 */
  cancelText?: string
  /** 保留设计稿的危险语义；当前关闭操作固定按危险样式呈现。 */
  type?: 'warning' | 'danger'
}

export interface LxStatusSwitchProps {
  /** 当前状态；数字模式沿用 0=开启、1=关闭。 */
  modelValue?: boolean | number
  /** 正在保存时阻止重复切换并显示加载状态。 */
  loading?: boolean
  /** 只读显示当前状态，不渲染可操作开关。 */
  disabled?: boolean
  /** 宿主注入的权限码；传入后由 lx-ui 权限源判断是否可操作。 */
  permission?: string
  /** 无权限时是否降级为 LxTag，而不是渲染灰色死开关。 */
  fallbackTag?: boolean
  /** 关闭操作前的确认说明；开启时不弹确认框。 */
  confirm?: string | false | LxStatusSwitchConfirmOptions
  /** 开启状态文案。 */
  onText?: string
  /** 关闭状态文案。 */
  offText?: string
}
