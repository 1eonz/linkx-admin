export interface LxTabItem {
  /** 稳定的路由页签标识，列表内不可重复。 */
  key: string
  title: string
  /** 允许关闭按钮及中键请求关闭；实际删除和未保存确认由宿主负责。 */
  closable?: boolean
}

export interface LxTabsBarProps {
  tabs?: LxTabItem[]
  modelValue?: string
}
