import type { LxVirtualTreeNode } from '../LxVirtualTree/types';

export interface LxTransferPanelProps {
  treeData?: LxVirtualTreeNode[];
  modelValue?: (string | number)[];
  titles?: [string, string];
  panelHeight?: number;
  maxCount?: number;
  inheritChild?: boolean;
}
