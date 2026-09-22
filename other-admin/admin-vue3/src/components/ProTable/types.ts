/**
 * ProTable 列配置
 */
export interface ITableColumn {
  /** 字段名 */
  prop: string;
  /** 列标题 */
  label: string;
  /** 列宽 */
  width?: number | string;
  /** 最小列宽 */
  minWidth?: number | string;
  /** 固定列 */
  fixed?: 'left' | 'right' | boolean;
  /** 是否可排序 */
  sortable?: boolean;
  /** 是否超出隐藏（默认 true） */
  showOverflowTooltip?: boolean;
  /** 对齐方式 */
  align?: 'left' | 'center' | 'right';
  /** 表头对齐方式 */
  headerAlign?: 'left' | 'center' | 'right';
  /** 具名插槽名（自定义列内容） */
  slotName?: string;
  /** 表头具名插槽名 */
  headerSlotName?: string;
  /** 格式化函数 */
  formatter?: (row: any, column: any, cellValue: any, index: number) => string;
  /** 是否隐藏 */
  hide?: boolean;
  /** 列的 class 名称（透传给 el-table-column 的 class-name） */
  className?: string;
  /** 表头列的 class 名称（透传给 el-table-column 的 header-class-name） */
  headerClassName?: string;
}
