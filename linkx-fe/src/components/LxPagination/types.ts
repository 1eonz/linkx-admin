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
  /** 尺寸 */
  size?: LxSize;
}
