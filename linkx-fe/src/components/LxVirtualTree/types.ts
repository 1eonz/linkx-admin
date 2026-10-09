export interface LxVirtualTreeNode {
  id: string | number
  label: string
  children?: LxVirtualTreeNode[]
  disabled?: boolean
  isLeaf?: boolean
  [key: string]: unknown
}

export interface LxVirtualTreeProps {
  data?: LxVirtualTreeNode[]
  /** 树容器的可访问名称。 */
  ariaLabel?: string
  /** 树容器的补充说明 ID，可关联键盘操作或选择范围提示。 */
  ariaDescribedby?: string
  height?: number
  /** 桌面固定行高（px）；非法值回退到 32px，触屏或窄屏下至少为 44px。 */
  itemSize?: number
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

/** 虚拟树通过模板引用公开的方法。 */
export interface LxVirtualTreeExpose {
  getCheckedKeys(): (string | number)[]
  setCheckedKeys(keys: (string | number)[]): void
  expandAll(expand?: boolean): void
  filter(value: string): void
  scrollToKey(key: string | number): void
}
