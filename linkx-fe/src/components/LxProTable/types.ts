/** 表格列配置（data 为行数据，prop 为字段名） */
export interface LxTableColumn {
  /** 字段名 */
  prop: string;
  /** 表头文字 */
  label: string;
  /** 列宽（px；不设自动分配） */
  width?: number;
  /** 最小宽度 */
  minWidth?: number;
  /** 固定列（通过 sticky 实现） */
  fixed?: 'left' | 'right';
  /** 文本对齐 */
  align?: 'left' | 'center' | 'right';
  /** 单行省略（默认 true，whitespace-nowrap 杜绝单字断行） */
  ellipsis?: boolean;
  /** 等宽字体列（编号/警号/车牌，P4） */
  mono?: boolean;
  /** 可排序（EP 排序透传，业务监听 sort-change） */
  sortable?: boolean;
}

/** LxProTable Props（纯受控表格：数据由业务传入，P7 数据无关） */
export interface LxProTableProps {
  /** 列配置 */
  columns?: LxTableColumn[];
  /** 行数据（宽松约束：接受任意接口/对象字面量） */
  data?: Record<string, any>[];
  /** 行 key 字段 */
  rowKey?: string;
  /** 加载态 */
  loading?: boolean;
  /** 空态文案 */
  emptyText?: string;
  /** 紧凑密度（行高 36px，默认 44px） */
  compact?: boolean;
  /** 斑马纹 */
  stripe?: boolean;
  /** 显示表格外边框 */
  bordered?: boolean;
  /** 复选列字段（受控选择） */
  selectable?: boolean;
  /** 已选行 keys（配合 selectable） */
  selectedKeys?: (string | number)[];
}

export type LxTableSortChange = { prop: string; order: 'asc' | 'desc' | null };
