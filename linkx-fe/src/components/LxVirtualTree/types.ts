export interface LxVirtualTreeNode {
  id: string | number
  label: string
  children?: LxVirtualTreeNode[]
  disabled?: boolean
  isLeaf?: boolean
  [key: string]: unknown
}

/**
 * 虚拟树节点的公开行布局。`responsive` 会在调用方传入 64px 行高时启用
 * 两行触控布局，保持行内容、虚拟占位和焦点恢复使用同一份几何契约。
 */
export type LxVirtualTreeRowLayout = 'single' | 'stacked' | 'responsive'

export interface LxVirtualTreeProps {
  data?: LxVirtualTreeNode[]
  /** 树容器的可访问名称。 */
  ariaLabel?: string
  /** 树容器的补充说明 ID，可关联键盘操作或选择范围提示。 */
  ariaDescribedby?: string
  height?: number
  /** 桌面固定行高（px）；非法值回退到 32px，触屏或窄屏下至少为 44px。 */
  itemSize?: number
  /** 行内附加信息的布局模式；`stacked` 最低使用 64px 行高，`responsive` 按实际行高切换。 */
  rowLayout?: LxVirtualTreeRowLayout
  /** 为节点展示插槽提供完整、可访问的摘要；摘要会挂到插槽包装层。 */
  nodeSummary?: (scope: LxVirtualTreeNodeSlotProps) => string | undefined
  indent?: number
  nodeKey?: string
  showCheckbox?: boolean
  checkStrictly?: boolean
  filterable?: boolean
  /** 自定义节点过滤规则。keyword 已去除首尾空白并转为小写；命中节点的祖先会保留。 */
  filterMethod?: (node: LxVirtualTreeNode, keyword: string) => boolean
  defaultExpandedKeys?: (string | number)[]
  scrollbarWidth?: number
  modelValue?: (string | number)[]
}

/**
 * 节点展示插槽的作用域；内容会放入固定行容器。
 * `single` 为单行，`stacked` 或满足条件的 `responsive` 会把附加信息放到第二行。
 * 插槽仅用于展示型元信息，不承载按钮、链接等交互控件。
 */
export interface LxVirtualTreeNodeSlotProps {
  node: LxVirtualTreeNode
  level: number
  checked: boolean
}

/** 虚拟树公开的节点展示插槽契约。 */
export interface LxVirtualTreeSlots {
  node?: (scope: LxVirtualTreeNodeSlotProps) => unknown
}

/** 虚拟树通过模板引用公开的方法。 */
export interface LxVirtualTreeExpose {
  getCheckedKeys(): (string | number)[]
  setCheckedKeys(keys: (string | number)[]): void
  expandAll(expand?: boolean): void
  filter(value: string): void
  scrollToKey(key: string | number): void
}
