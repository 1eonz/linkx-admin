export interface LxStatusSwitchConfirmOptions {
  /** 危险操作弹窗标题。 */
  title?: string
  /** 关闭后的影响说明。 */
  message?: string
  /** 可选的确认对象名称，例如节点名称与编号。 */
  targetEntity?: string
  /** 可选的影响范围摘要，展示在确认层正文中。 */
  impact?: string
  /** 可选的审计提示，展示在确认层正文中。 */
  audit?: string
  /** 确认按钮文案。 */
  confirmText?: string
  /** 取消按钮文案。 */
  cancelText?: string
  /** 追加到传送确认框根节点的类名，用于同步局部主题令牌。 */
  customClass?: string
  /** 确认层类型；danger 使用危险按钮，warning 使用普通确认按钮。 */
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
