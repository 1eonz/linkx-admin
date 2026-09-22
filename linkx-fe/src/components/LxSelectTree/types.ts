import type { LxStatus } from '../../tokens';

/** 树节点（组织部门/协同岗通用结构） */
export interface LxTreeNode {
  /** 唯一标识 */
  key: string | number;
  /** 显示标题 */
  title: string;
  /** 子节点（为空即叶子；懒加载时可不传，通过 hasChildren 声明） */
  children?: LxTreeNode[];
  /** 声明有子节点（懒加载场景渲染展开箭头） */
  hasChildren?: boolean;
  /** 节点状态（显示右侧小圆点，可选） */
  status?: LxStatus;
  /** 业务透传 */
  meta?: Record<string, unknown>;
}

/** 懒加载子节点签名（请求由业务注入，P7） */
export type LxTreeLazyLoad = (node: LxTreeNode) => Promise<LxTreeNode[]>;

/** LxSelectTree Props */
export interface LxSelectTreeProps {
  /** 树数据 */
  data?: LxTreeNode[];
  /** 选中节点 keys（复选） */
  checkedKeys?: (string | number)[];
  /** 复选模式：叶子可选 / 父子联动 */
  checkStrictly?: boolean;
  /** 显示搜索框 */
  filterable?: boolean;
  /** 搜索占位符 */
  placeholder?: string;
  /** 懒加载（请求由业务注入） */
  lazy?: LxTreeLazyLoad;
  /** 默认展开的层级 keys */
  expandedKeys?: (string | number)[];
  /** 高度（px，超出滚动） */
  height?: number;
}
