export interface LxVirtualTreeNode {
  id: string | number;
  label: string;
  children?: LxVirtualTreeNode[];
  disabled?: boolean;
  isLeaf?: boolean;
  [key: string]: unknown;
}

export interface LxVirtualTreeProps {
  data?: LxVirtualTreeNode[];
  height?: number;
  itemSize?: number;
  indent?: number;
  nodeKey?: string;
  showCheckbox?: boolean;
  checkStrictly?: boolean;
  filterable?: boolean;
  defaultExpandedKeys?: (string | number)[];
  scrollbarWidth?: number;
  modelValue?: (string | number)[];
}

/** 虚拟树通过模板引用公开的方法。 */
export interface LxVirtualTreeExpose {
  getCheckedKeys(): (string | number)[];
  setCheckedKeys(keys: (string | number)[]): void;
  expandAll(expand?: boolean): void;
  filter(value: string): void;
  scrollToKey(key: string | number): void;
}
