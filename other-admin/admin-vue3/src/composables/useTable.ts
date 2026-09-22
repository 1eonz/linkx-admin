/**
 * useTable - 表格专用 hooks（独立于 ProTable 组件可用）
 *
 * 设计目标：
 * - 封装表格分页 / 搜索 / 刷新 / 选择通用逻辑
 * - 基于 useFetch 实现，复用 AbortController 竞态取消
 * - 内置 defaultTableFormatter 兼容项目 4 种响应结构
 * - 适用于不用 ProTable 的场景（如自定义 el-table 或其他 UI 库）
 *
 * 与 ProTable 远程模式的关系：
 * - ProTable 远程模式内部已封装数据获取，业务方通常无需使用 useTable
 * - useTable 适用于"不用 ProTable 但仍需表格逻辑"的场景
 * - API 设计与 ProTable expose 方法对齐，便于迁移
 *
 * 使用示例：
 * ```ts
 * const {
 *   data, loading, total, page, limit, pageSizes,
 *   search, refresh, changePage,
 *   selectedRows, selectedIds, onSelectionChange, clearSelection,
 * } = useTable({
 *   fetchApi: getCollaborationPage,
 *   query: reactive({ postName: '', orgId: '' }),
 *   transformItem: (item) => ({ ...item, ticketNames: item.types.map(t => t.name).join(',') }),
 * });
 * ```
 *
 * @packageDocumentation
 */

import { computed, reactive, ref, watch, type ComputedRef, type Ref } from 'vue';

import { useFetch } from './useFetch';
import { defaultTableFormatter } from '@/components/ProTable/formatter';

// ===== 类型定义 =====

/** 分页参数（内部合并到 query 后发起请求） */
export interface PaginationParams {
  pageNum: number;
  pageSize: number;
}

/**
 * useTable 配置项
 * @interface UseTableOptions
 * @template TItem 列表项类型
 * @template TQuery 查询参数类型
 */
export interface UseTableOptions<TItem, TQuery extends Record<string, any> = Record<string, any>> {
  /**
   * 列表请求 API（必填）。
   * 接收合并后的参数（query + 分页字段），返回后端响应。
   * 内部用 defaultTableFormatter 提取 records 和 total。
   */
  fetchApi: (params: TQuery & PaginationParams) => Promise<any>;

  /**
   * 查询参数对象（必填，建议传入 reactive 对象）。
   * 业务方持有此对象，修改后调用 search() / refresh() 触发请求。
   * useTable 内部不深度监听 query 变化（避免输入触发），只在 search/refresh 时取最新值。
   */
  query: TQuery;

  /**
   * 初始页码（默认 1）。
   */
  defaultPage?: number;

  /**
   * 初始每页条数（默认 10）。
   */
  defaultPageSize?: number;

  /**
   * 可选每页条数（默认 [10, 20, 50, 100]），绑定到分页器。
   */
  pageSizes?: number[];

  /**
   * 分页参数字段名 - 页码（默认 'pageNum'）。
   * 兼容后端 current/size 命名（部分接口用 current/size）。
   */
  pageNumField?: string;

  /**
   * 分页参数字段名 - 每页条数（默认 'pageSize'）。
   */
  pageSizeField?: string;

  /**
   * 从响应提取 records（默认使用 defaultTableFormatter.getRecords）。
   * 仅在响应结构特殊时覆盖。
   */
  formatResult?: (response: any) => any[];

  /**
   * 从响应提取 total（默认使用 defaultTableFormatter.getTotal）。
   * 仅在响应结构特殊时覆盖。
   */
  formatTotal?: (response: any) => number;

  /**
   * 单条数据转换函数。
   * 在 records 提取后对每条记录做字段映射（如 policeTicketTypes → ticketTypeNames）。
   * 同步函数，不支持异步（异步场景请在 onSuccess 中处理）。
   */
  transformItem?: (item: any) => TItem;

  /**
   * 初始数据（默认 []，避免 undefined 导致渲染问题）。
   */
  initialData?: TItem[];

  /**
   * 是否立即加载（默认 true）。
   * onMounted 时自动调用 init。
   */
  immediate?: boolean;

  /**
   * 搜索时是否重置页码到 1（默认 true）。
   * 大部分场景应保持 true，避免在第 3 页修改搜索条件后仍停留在第 3 页（可能无数据）。
   */
  resetPageOnSearch?: boolean;

  /**
   * 数据加载成功回调。
   * @param data 列表数据（已应用 transformItem）
   * @param total 总数
   */
  onSuccess?: (data: TItem[], total: number) => void;

  /**
   * 数据加载失败回调。
   * 注意：http.ts 默认不抛错，fetchApi 内部需自行判断 code 并 throw 才会触发。
   * @param error 错误对象
   */
  onError?: (error: Error) => void;

  /**
   * 自动取消上一次未完成请求（默认 true）。
   * 防止快速切换页码时旧请求覆盖新结果。
   */
  abortPrevious?: boolean;

  /**
   * 失败重试次数（默认 0）。
   */
  retryCount?: number;
}

/**
 * useTable 返回值
 * @interface UseTableReturn
 */
export interface UseTableReturn<TItem, TQuery> {
  /** 列表数据 */
  data: Ref<TItem[]>;
  /** 加载中 */
  loading: Ref<boolean>;
  /** 总数 */
  total: Ref<number>;
  /** 当前页码 */
  page: Ref<number>;
  /** 每页条数 */
  limit: Ref<number>;
  /** 可选每页条数（绑定到分页器） */
  pageSizes: number[];

  /**
   * 触发搜索：重置页码到 1（若 resetPageOnSearch=true）并使用当前 query 请求。
   * 业务方修改 query 后调用此方法。
   */
  search: () => Promise<void>;

  /**
   * 刷新：保持当前页码和参数重新请求。
   * 适合删除/编辑后刷新当前页。
   */
  refresh: () => Promise<void>;

  /**
   * 重置：清空 query 为初始值 + 回到第 1 页 + 请求。
   * @param newQuery 可选，覆盖部分 query 字段（与初始 query 合并）
   */
  reset: (newQuery?: Partial<TQuery>) => Promise<void>;

  /**
   * 分页变化处理函数，绑定到分页器 @pagination 事件。
   * @param page 新页码
   * @param limit 新每页条数
   */
  changePage: (page: number, limit: number) => void;

  /**
   * 修改 query 中某些字段（响应式触发，不自动请求）。
   * 适合外部联动场景（如选择组织后设置 orgId，再手动调用 search）。
   * @param patch 需要合并的字段
   */
  setQuery: (patch: Partial<TQuery>) => void;

  /** 已选中的行数据 */
  selectedRows: Ref<TItem[]>;
  /** 已选中的 rowKey 数组（用于批量操作） */
  selectedIds: ComputedRef<Array<string | number>>;
  /**
   * 选择变化回调，绑定到表格 @selection-change 事件。
   * @param rows 选中的行数据
   */
  onSelectionChange: (rows: TItem[]) => void;
  /** 清空选择 */
  clearSelection: () => void;

  /** 取消当前请求 */
  cancel: () => void;
  /**
   * 乐观更新：直接修改 data，不发起请求。
   * 适合增删改后立即更新 UI。
   */
  mutate: (newData: TItem[] | ((prev: TItem[]) => TItem[])) => void;

  /** query 的只读副本（用于业务方读取当前查询条件） */
  readonlyQuery: Readonly<TQuery>;

  /** 最近一次请求参数（含分页字段） */
  lastParams: ComputedRef<TQuery & PaginationParams>;
}

// ===== useTable 实现 =====

/**
 * 创建表格数据管理 hooks
 * @param options 配置项
 * @returns UseTableReturn
 */
export function useTable<TItem, TQuery extends Record<string, any> = Record<string, any>>(
  options: UseTableOptions<TItem, TQuery>,
): UseTableReturn<TItem, TQuery> {
  const {
    fetchApi,
    query,
    defaultPage = 1,
    defaultPageSize = 10,
    pageSizes = [10, 20, 50, 100],
    pageNumField = 'pageNum',
    pageSizeField = 'pageSize',
    formatResult = defaultTableFormatter.getRecords,
    formatTotal = defaultTableFormatter.getTotal,
    transformItem,
    initialData = [],
    immediate = true,
    resetPageOnSearch = true,
    onSuccess,
    onError,
    abortPrevious = true,
    retryCount = 0,
  } = options;

  // ===== 状态 =====
  const data = ref<TItem[]>(initialData) as Ref<TItem[]>;
  const loading = ref(false);
  const total = ref(0);
  const page = ref(defaultPage);
  const limit = ref(defaultPageSize);
  const selectedRows = ref<TItem[]>([]) as Ref<TItem[]>;

  // 保存 query 初始快照（用于 reset 还原）
  const initialQuerySnapshot = JSON.parse(JSON.stringify(query));

  // ===== 内部 fetch 函数（适配 useFetch） =====
  /**
   * 包装 fetchApi，处理响应数据提取和转换
   */
  async function wrappedFetch(params: TQuery & PaginationParams): Promise<TItem[]> {
    const res = await fetchApi(params);
    const records = formatResult(res);
    const totalNum = formatTotal(res);

    const list = transformItem ? records.map(transformItem) : records;
    data.value = list;
    total.value = totalNum;
    onSuccess?.(list, totalNum);
    return list;
  }

  // 使用 useFetch 管理请求状态
  const {
    loading: fetchLoading,
    error: fetchError,
    fetch,
    refresh: fetchRefresh,
    cancel: fetchCancel,
    mutate: fetchMutate,
  } = useFetch<TItem[], [TQuery & PaginationParams]>({
    fetchFn: wrappedFetch,
    immediate: false, // 由 useTable 自行控制 immediate
    abortPrevious,
    retryCount,
    onError: (err) => {
      onError?.(err);
    },
  });

  // 同步 loading 状态
  loading.value = fetchLoading.value;
  watch(fetchLoading, (v) => {
    loading.value = v;
  });

  // ===== 构建请求参数 =====
  /**
   * 合并 query + 分页字段，生成最终请求参数
   */
  function buildParams(overridePage?: number, overrideLimit?: number): TQuery & PaginationParams {
    const p = overridePage ?? page.value;
    const s = overrideLimit ?? limit.value;
    return {
      ...query,
      [pageNumField]: p,
      [pageSizeField]: s,
    } as TQuery & PaginationParams;
  }

  // ===== 操作方法 =====
  /**
   * 搜索：重置页码（可选）并请求
   */
  async function search(): Promise<void> {
    if (resetPageOnSearch) {
      page.value = 1;
    }
    await fetch(buildParams());
  }

  /**
   * 刷新：保持当前页码和参数
   */
  async function refresh(): Promise<void> {
    await fetchRefresh();
  }

  /**
   * 重置：还原 query + 回到第 1 页 + 请求
   */
  async function reset(newQuery?: Partial<TQuery>): Promise<void> {
    // 还原到初始 query 快照
    Object.keys(initialQuerySnapshot).forEach((key) => {
      (query as Record<string, any>)[key] = initialQuerySnapshot[key];
    });
    // 合并新传入的字段
    if (newQuery) {
      Object.assign(query, newQuery);
    }
    page.value = defaultPage;
    limit.value = defaultPageSize;
    await fetch(buildParams());
  }

  /**
   * 分页变化：更新 page/limit 并自动请求
   */
  function changePage(newPage: number, newLimit: number): void {
    // 每页条数变化时回到第 1 页
    if (newLimit !== limit.value) {
      page.value = 1;
    } else {
      page.value = newPage;
    }
    limit.value = newLimit;
    // 自动触发请求
    fetch(buildParams());
  }

  /**
   * 修改 query 字段（不触发请求）
   */
  function setQuery(patch: Partial<TQuery>): void {
    Object.assign(query, patch);
  }

  /**
   * 选择变化处理
   */
  function onSelectionChange(rows: TItem[]): void {
    selectedRows.value = rows;
  }

  /**
   * 清空选择
   */
  function clearSelection(): void {
    selectedRows.value = [];
  }

  /**
   * 取消请求
   */
  function cancel(): void {
    fetchCancel();
  }

  /**
   * 乐观更新
   */
  function mutate(newData: TItem[] | ((prev: TItem[]) => TItem[])): void {
    fetchMutate(newData as any);
  }

  // ===== 计算属性 =====
  /**
   * 选中行的 ID 数组
   * 默认取每行的 id 字段，业务方可根据需要自行处理 selectedRows
   */
  const selectedIds = computed<Array<string | number>>(() => {
    return selectedRows.value.map((row: any) => row?.id).filter((id): id is string | number => id != null);
  });

  /**
   * 最近一次请求参数（含分页）
   */
  const lastParams = computed<TQuery & PaginationParams>(() => buildParams());

  /** query 只读副本 */
  const readonlyQuery = query as Readonly<TQuery>;

  // ===== immediate 处理 =====
  if (immediate) {
    // onMounted 钩子由 useFetch 内部处理，但 useFetch immediate=false
    // 这里需要手动触发首次请求
    fetch(buildParams(defaultPage, defaultPageSize));
  }

  return {
    data,
    loading,
    total,
    page,
    limit,
    pageSizes,
    search,
    refresh,
    reset,
    changePage,
    setQuery,
    selectedRows,
    selectedIds,
    onSelectionChange,
    clearSelection,
    cancel,
    mutate,
    readonlyQuery,
    lastParams,
  };
}

export default useTable;
