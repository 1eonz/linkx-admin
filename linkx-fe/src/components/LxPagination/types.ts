import type { LxSize } from '../../tokens';

/** LxPagination Props（纯受控分页器） */
export interface LxPaginationProps {
  /** 当前页（1 起） */
  page?: number;
  /** 每页条数 */
  pageSize?: number;
  /** 总条数 */
  total?: number;
  /** 每页条数可选项 */
  pageSizes?: number[];
  /** 是否显示每页条数选择器 */
  showSize?: boolean;
  /** 是否显示总条数 */
  showTotal?: boolean;
  /** 是否显示跳页输入 */
  showJumper?: boolean;
  /** 切换每页条数时自动回到第 1 页（默认 true，两代工程一致行为，设计拍板 #5） */
  autoReset?: boolean;
  /** 切页后窗口滚动回顶（默认 true，长列表翻页不迷失位置，设计拍板 #5） */
  autoScroll?: boolean;
  /** 尺寸 */
  size?: LxSize;
}
