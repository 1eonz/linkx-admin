<script setup lang="ts">
/**
 * ProTable - 配置式高级表格组件
 *
 * 功能特性：
 * 1. 配置式 columns，类似 antd Table
 * 2. 内置分页、loading、多选、序号列
 * 3. 三种数据模式：展示模式 / 纯远程模式 / 受控模式
 * 4. 远程模式内置 AbortController 竞态取消（新请求自动取消未完成的旧请求）
 * 5. 支持自定义列渲染（slot）
 * 6. 配套 defaultTableFormatter 兼容 4 种后端响应结构
 *
 * @example 基础用法（展示模式）
 * <ProTable :columns="columns" :data="list" :loading="loading" :total="total" />
 *
 * @example 纯远程模式（fetchApi 自治，ProTable 内部管理 data/total）
 * <ProTable :columns="columns" :fetch-api="getList" :search-params="params" />
 *
 * @example 受控模式（data + fetchApi，data 优先展示，@response 回调处理字段映射）
 * <ProTable
 *   ref="tableRef"
 *   :columns="columns"
 *   :fetch-api="getList"
 *   :data="list"
 *   :total="total"
 *   :search-params="searchParams"
 *   @response="handleResponse"
 * />
 * function handleResponse(res) {
 *   list.value = defaultTableFormatter.getRecords(res);
 *   total.value = defaultTableFormatter.getTotal(res);
 * }
 * function handleSearch() { tableRef.value?.init(); }
 * function handleRefresh() { tableRef.value?.refresh(); }
 *
 * @example 多选
 * <ProTable show-selection :row-key="'id'" @selection-change="onSelect" />
 *
 * @example 序号列
 * <ProTable show-index index-label="序号" :index-width="100" />
 *
 * Props:
 * - columns: ITableColumn[]，列配置（必填）
 * - data: any[]，静态数据（展示模式 / 受控模式优先展示），默认 []
 * - fetchApi: (params) => Promise<any>，远程接口（传入则启用远程模式）
 * - searchParams: Record<string, any>，搜索条件（init/refresh 时取最新值，不深度 watch）
 * - loading: boolean，父组件控制 loading（优先于内部维护的 loading）
 * - total: number，总数（展示模式 / 受控模式生效），默认 0
 * - page / limit: number，分页 v-model，默认 1 / 10
 * - pageSizes: number[]，可选每页条数，默认 [10, 20, 50, 100]
 * - layout: string，分页器布局，默认 'total, sizes, prev, pager, next, jumper'
 * - rowKey: string，行唯一标识字段名，默认 'id'
 * - showSelection: boolean，是否显示多选列，默认 false
 * - showIndex: boolean，是否显示序号列，默认 false
 * - indexLabel: string，序号列标题，默认 '#'
 * - indexWidth: number，序号列宽度，默认 60
 * - selectable: (row, index) => boolean，行是否可选（多选列）
 * - showSelectionBar: boolean，是否显示跨页选中栏，默认 false
 * - autoHeight: boolean，是否自动撑满高度，默认 false
 * - border: boolean，是否显示边框，默认 true
 * - stripe: boolean，是否斑马纹，默认 true
 * - highlightCurrentRow: boolean，是否高亮当前行，默认 false
 * - headerCellStyle: CSSProperties | (() => CSSProperties)，表头单元格样式
 * - showPagination: boolean，是否显示分页器，默认 true
 * - immediate: boolean，远程模式是否 onMounted 自动请求，默认 true
 * - autoFetchOnPagination: boolean，分页变化是否自动请求，默认 true
 * - pageNumField: string，分页参数字段名-页码，默认 'pageNum'
 * - pageSizeField: string，分页参数字段名-每页条数，默认 'pageSize'
 *
 * Column 配置:
 * - prop: string，字段名
 * - label: string，列标题
 * - width / minWidth: number，列宽
 * - fixed: 'left' | 'right'，固定列
 * - sortable: boolean，是否可排序
 * - align: 'left' | 'center' | 'right'，对齐方式，默认 'center'
 * - headerAlign: 'left' | 'center' | 'right'，表头对齐方式
 * - showOverflowTooltip: boolean，是否溢出 tooltip，默认 true
 * - slotName: string，自定义插槽名
 * - headerSlotName: string，表头自定义插槽名
 * - formatter: (row, column, value, index) => string，格式化函数
 *
 * Events:
 * - response: (response, params)，fetchApi 请求成功，抛出完整响应和请求参数
 * - response-error: (error, params)，fetchApi 请求失败
 * - pagination: ({ page, limit })，分页变化
 * - selection-change: (selection)，选中变化
 * - loading-change: (loading)，loading 状态变化
 * - update:page / update:limit，分页 v-model 同步
 * - row-click: (row, column, event)，行点击
 * - row-dblclick: (row, column, event)，行双击
 *
 * Slots:
 * - [column.slotName]: 列自定义渲染，作用域 { row, column, $index }
 * - [column.headerSlotName]: 表头自定义渲染，作用域 { column, $index }
 * - empty: 空数据自定义渲染
 *
 * Methods（defineExpose 暴露）:
 * - init(): 重置到第 1 页并请求（远程模式）
 * - refresh(): 保持当前页和参数重新请求（远程模式）
 * - fetchPage(page, limit): 手动触发指定页请求
 * - cancelFetch(): 取消当前未完成请求
 * - mutate(newData | (prev) => newData): 乐观更新内部数据（纯远程模式）
 * - getSelection(): 获取当前选中行数组
 * - clearSelection(): 清空选中
 * - toggleRowSelection(row, selected): 切换某行选中状态
 * - getTableRef(): 获取内部 el-table 实例
 */

import { FolderOpened } from '@element-plus/icons-vue';
import { computed, ref, watch, type ComputedRef, type CSSProperties } from 'vue';

import { defaultTableFormatter } from './formatter';
import type { ITableColumn } from './types';
import Pagination from '@/components/Pagination/index.vue';

defineOptions({ name: 'ProTable' });

// ===== Props =====
interface Props {
  // ===== 展示模式（既有） =====
  /** 列配置（必填） */
  columns: ITableColumn[];
  /**
   * 静态数据。
   * - 仅展示模式：传入则 ProTable 直接渲染
   * - 受控模式：与 fetchApi 同时传入时，data 优先展示，fetchApi 触发后通过 @response 回调
   */
  data?: any[];
  /**
   * 加载状态。
   * - 传入则优先使用父组件控制
   * - 未传入（undefined）则使用内部维护的 loading
   */
  loading?: boolean;
  /** 总数（展示模式） */
  total?: number;
  /** 当前页码 */
  page?: number;
  /** 每页条数 */
  limit?: number;
  /** 可选每页条数 */
  pageSizes?: number[];
  /** 分页器布局 */
  layout?: string;
  /** 行 key */
  rowKey?: string;
  /** 是否显示多选列 */
  showSelection?: boolean;
  /** 是否显示序号列 */
  showIndex?: boolean;
  /** 序号列标题（默认 '#'） */
  indexLabel?: string;
  /** 序号列宽度（默认 60） */
  indexWidth?: number;
  /** 行是否可选 */
  selectable?: (row: any, index: number) => boolean;
  /** 是否显示跨页选中栏 */
  showSelectionBar?: boolean;
  /**
   * 是否开启跨页保留选中（type=selection 列的 reserve-selection）。
   * 开启后翻页/搜索不会清空已选中，配合 row-key 生效。
   */
  reserveSelection?: boolean;
  /** 是否自动撑满高度 */
  autoHeight?: boolean;
  /** 是否显示边框 */
  border?: boolean;
  /** 是否高亮当前行 */
  highlightCurrentRow?: boolean;
  /** 表头单元格样式 */
  headerCellStyle?: CSSProperties | (() => CSSProperties);
  /** 是否显示分页器 */
  showPagination?: boolean;
  /** 是否斑马纹 */
  stripe?: boolean;

  // ===== 远程模式（新增） =====
  /**
   * 远程数据 API。
   * 传入则启用远程模式，ProTable 内部自动管理数据获取/分页/竞态取消。
   * 与 data 同时传入时，data 优先展示，fetchApi 仅触发请求并通过 @response 回调。
   */
  fetchApi?: (params: any) => Promise<any>;
  /**
   * 搜索参数（响应式对象）。
   * init/refresh 时使用最新值。ProTable 不深度 watch，避免输入触发。
   */
  searchParams?: Record<string, any>;
  /**
   * 是否在 onMounted 自动调用 init（默认 true，远程模式生效）。
   * 静态模式忽略此 prop。
   */
  immediate?: boolean;
  /**
   * 分页变化时是否自动请求（默认 true，远程模式生效）。
   * 设为 false 时仅 emit('pagination')，业务方自行决定是否请求。
   */
  autoFetchOnPagination?: boolean;
  /**
   * 分页参数字段名 - 页码（默认 'pageNum'）。
   * 兼容后端 current/size 命名。
   */
  pageNumField?: string;
  /**
   * 分页参数字段名 - 每页条数（默认 'pageSize'）。
   */
  pageSizeField?: string;
}

const props = withDefaults(defineProps<Props>(), {
  data: () => [],
  loading: undefined,
  total: 0,
  page: 1,
  limit: 10,
  pageSizes: () => [10, 20, 50, 100],
  layout: 'total, sizes, prev, pager, next, jumper',
  rowKey: 'id',
  showSelection: false,
  showIndex: false,
  indexLabel: '#',
  indexWidth: 60,
  selectable: undefined,
  showSelectionBar: false,
  reserveSelection: false,
  autoHeight: false,
  border: true,
  stripe: true,
  highlightCurrentRow: false,
  headerCellStyle: () =>
    ({
      background: 'var(--el-table-header-bg-color)',
      color: 'var(--el-table-header-text-color)',
      fontWeight: '600',
      fontSize: '14px',
    }) as CSSProperties,
  showPagination: true,
  // 远程模式默认值
  fetchApi: undefined,
  searchParams: undefined,
  immediate: true,
  autoFetchOnPagination: true,
  pageNumField: 'pageNum',
  pageSizeField: 'pageSize',
});

// ===== Emits =====
const emit = defineEmits<{
  // 展示模式既有
  (e: 'update:page', value: number): void;
  (e: 'update:limit', value: number): void;
  (e: 'pagination', value: { page: number; limit: number }): void;
  (e: 'selection-change', value: any[]): void;
  (e: 'row-click', row: any, column: unknown, event: Event): void;
  (e: 'row-dblclick', row: any, column: unknown, event: Event): void;
  // 远程模式新增
  /** fetchApi 请求成功，抛出完整响应和请求参数 */
  (e: 'response', response: any, params: any): void;
  /** fetchApi 请求失败 */
  (e: 'response-error', error: Error, params: any): void;
  /** loading 状态变化（远程模式下供父组件监听） */
  (e: 'loading-change', loading: boolean): void;
}>();

// ===== 模式判断 =====
/** 是否远程模式（传入了 fetchApi） */
const isRemoteMode = computed(() => typeof props.fetchApi === 'function');
/** 是否受控模式（同时传入了 data 和 fetchApi，data 优先展示） */
const isControlledMode = computed(() => isRemoteMode.value && props.data && props.data.length >= 0);
/** 是否纯远程模式（未传 data，ProTable 内部维护数据） */
const isPureRemoteMode = computed(() => isRemoteMode.value && !props.data?.length);

// ===== 内部状态（远程模式使用） =====
const innerData = ref<any[]>([]);
const innerLoading = ref(false);
const innerTotal = ref(0);
const innerPage = ref(props.page);
const innerLimit = ref(props.limit);

// 当前请求的 AbortController
let currentController: AbortController | undefined;
// 请求序号，用于判断请求是否过期
let requestSeq = 0;

// ===== 计算属性：根据模式决定最终使用的值 =====
/** 最终展示数据：
 * - 受控模式（fetchApi + data）：data 优先展示，fetchApi 触发后通过 @response 回调
 * - 纯远程模式（仅 fetchApi）：用内部数据 innerData
 * - 展示模式（仅 data，无 fetchApi）：直接用 props.data
 */
const displayData = computed(() => {
  // 纯远程模式：用内部数据
  if (isPureRemoteMode.value) return innerData.value;
  // 受控模式 / 展示模式：用 props.data
  return props.data;
});

/** 最终 loading：父组件传入优先，否则用内部 */
const displayLoading = computed(() => {
  if (props.loading !== undefined) return props.loading;
  return innerLoading.value;
});

/** 最终 total：父组件传入优先，否则用内部 */
const displayTotal = computed(() => {
  if (isControlledMode.value || !isRemoteMode.value) return props.total;
  return innerTotal.value;
});

/** 页码 v-model */
const currentPage = computed({
  get: () => (isRemoteMode.value ? innerPage.value : props.page),
  set: (v: number) => {
    if (isRemoteMode.value) {
      innerPage.value = v;
    }
    emit('update:page', v);
  },
});

/** 每页条数 v-model */
const currentLimit = computed({
  get: () => (isRemoteMode.value ? innerLimit.value : props.limit),
  set: (v: number) => {
    if (isRemoteMode.value) {
      innerLimit.value = v;
    }
    emit('update:limit', v);
  },
});

// ===== 远程模式：构建请求参数 =====
/**
 * 合并 searchParams + 分页字段
 */
function buildParams(overridePage?: number, overrideLimit?: number): Record<string, any> {
  const p = overridePage ?? innerPage.value;
  const s = overrideLimit ?? innerLimit.value;
  return {
    ...(props.searchParams ?? {}),
    [props.pageNumField]: p,
    [props.pageSizeField]: s,
  };
}

// ===== 远程模式：核心请求逻辑 =====
/**
 * 执行一次请求
 */
async function executeFetch(params: Record<string, any>): Promise<any> {
  if (!props.fetchApi) return undefined;

  // 取消上一次未完成请求
  if (currentController) {
    currentController.abort();
  }
  currentController = new AbortController();
  const seq = ++requestSeq;

  innerLoading.value = true;
  emit('loading-change', true);

  try {
    const res = await props.fetchApi(params);

    // 请求已过期（被新请求取消），丢弃结果
    if (seq !== requestSeq) return undefined;

    // 始终 emit response，让父组件拿到完整响应（受控模式下父组件决定是否更新 data）
    emit('response', res, params);

    // 纯远程模式下，用默认格式化器提取 records 和 total
    if (isPureRemoteMode.value) {
      innerData.value = defaultTableFormatter.getRecords(res);
      innerTotal.value = defaultTableFormatter.getTotal(res);
    }

    return res;
  } catch (err) {
    if (seq !== requestSeq) return undefined;

    const e = err instanceof Error ? err : new Error(String(err));
    emit('response-error', e, params);
    return undefined;
  } finally {
    if (seq === requestSeq) {
      innerLoading.value = false;
      emit('loading-change', false);
    }
  }
}

// ===== Expose 方法（远程模式） =====
/**
 * init：重置页码到 1 并请求（用最新 searchParams）
 */
async function init(): Promise<void> {
  if (!isRemoteMode.value) {
    console.warn('[ProTable] init 仅在远程模式（传入 fetchApi）下生效');
    return;
  }
  innerPage.value = 1;
  await executeFetch(buildParams(1, innerLimit.value));
}

/**
 * refresh：保持当前页码和参数重新请求
 */
async function refresh(): Promise<void> {
  if (!isRemoteMode.value) {
    console.warn('[ProTable] refresh 仅在远程模式（传入 fetchApi）下生效');
    return;
  }
  await executeFetch(buildParams());
}

/**
 * fetchPage：手动触发指定页码请求（autoFetchOnPagination=false 时使用）
 */
async function fetchPage(page: number, limit: number): Promise<void> {
  if (!isRemoteMode.value) return;

  // 每页条数变化时回到第 1 页
  if (limit !== innerLimit.value) {
    innerPage.value = 1;
  } else {
    innerPage.value = page;
  }
  innerLimit.value = limit;
  await executeFetch(buildParams());
}

/**
 * cancelFetch：取消当前未完成请求
 */
function cancelFetch(): void {
  if (currentController) {
    currentController.abort();
    currentController = undefined;
    innerLoading.value = false;
    emit('loading-change', false);
  }
}

/**
 * mutate：乐观更新内部数据（仅纯远程模式生效）
 */
function mutateData(newData: any[] | ((prev: any[]) => any[])): void {
  if (typeof newData === 'function') {
    innerData.value = (newData as (prev: any[]) => any[])(innerData.value);
  } else {
    innerData.value = newData;
  }
}

// ===== 既有方法 =====
const tableRef = ref();

function toggleRowSelection(row: any, selected?: boolean): void {
  tableRef.value?.toggleRowSelection(row, selected);
}

function clearSelection(): void {
  tableRef.value?.clearSelection();
}

/**
 * clearAllSelection：清空所有跨页选中。
 * Element Plus 的 clearSelection 在 reserve-selection=true 时同样会清空全部页选中。
 */
function clearAllSelection(): void {
  tableRef.value?.clearSelection();
}

function getSelection(): any[] {
  return tableRef.value?.getSelectionRows?.() ?? [];
}

/**
 * getMultipleSelection：获取所有跨页选中行。
 */
function getMultipleSelection(): any[] {
  return tableRef.value?.getSelectionRows?.() ?? [];
}

// ===== 分页事件处理 =====
function handlePagination(value: { page: number; limit: number }): void {
  emit('pagination', value);

  // 远程模式 + autoFetchOnPagination=true → 自动请求
  if (isRemoteMode.value && props.autoFetchOnPagination) {
    fetchPage(value.page, value.limit);
  }
}

function handleSelectionChange(value: any[]): void {
  emit('selection-change', value);
}

// ===== 暴露方法 =====
defineExpose({
  init,
  refresh,
  fetchPage,
  cancelFetch,
  mutate: mutateData,
  getSelection,
  clearSelection,
  clearAllSelection,
  getMultipleSelection,
  toggleRowSelection,
  getTableRef: () => tableRef.value,
});

// ===== immediate 处理 =====
// 远程模式 + immediate=true → onMounted 自动 init
if (isRemoteMode.value && props.immediate) {
  // 注意：setup 中直接调用相当于 onMounted 之前
  // 但 executeFetch 是异步的，不会阻塞渲染
  executeFetch(buildParams(props.page, props.limit));
}

// ===== watch immediate 变化（动态切换） =====
watch(
  () => props.immediate,
  (newVal) => {
    // 仅在远程模式 + immediate 由 false→true 时触发首次请求
    if (isRemoteMode.value && newVal && requestSeq === 0) {
      executeFetch(buildParams());
    }
  },
);
</script>

<template>
  <div class="pro-table">
    <el-table
      ref="tableRef"
      v-loading="displayLoading"
      :data="displayData"
      :border="border"
      :stripe="stripe"
      :highlight-current-row="highlightCurrentRow"
      :row-key="rowKey"
      :header-cell-style="headerCellStyle"
      style="width: 100%"
      class="pro-table__inner"
      @selection-change="handleSelectionChange"
      @row-click="(row, column, event) => emit('row-click', row, column, event)"
      @row-dblclick="(row, column, event) => emit('row-dblclick', row, column, event)"
    >
      <el-table-column
        v-if="showSelection"
        type="selection"
        :selectable="selectable"
        :reserve-selection="reserveSelection"
        width="50"
        align="center"
      />
      <el-table-column v-if="showIndex" type="index" :label="indexLabel" :width="indexWidth" align="center" />

      <template v-for="col in columns" :key="col.prop">
        <el-table-column
          :prop="col.prop"
          :label="col.label"
          :width="col.width"
          :min-width="col.minWidth"
          :fixed="col.fixed"
          :sortable="col.sortable"
          :show-overflow-tooltip="col.showOverflowTooltip ?? true"
          :align="col.align || 'center'"
          :header-align="col.headerAlign || 'center'"
          :class-name="col.className"
          :header-class-name="col.headerClassName"
        >
          <template #default="scope">
            <slot
              v-if="col.slotName"
              :name="col.slotName"
              :row="scope.row"
              :column="scope.column"
              :$index="scope.$index"
            />
            <span v-else-if="col.formatter">{{
              col.formatter(scope.row, scope.column, scope.row[col.prop], scope.$index)
            }}</span>
            <span v-else>{{ scope.row[col.prop] }}</span>
          </template>
          <template v-if="col.headerSlotName" #header="scope">
            <slot :name="col.headerSlotName" :column="scope.column" :$index="scope.$index" />
          </template>
        </el-table-column>
      </template>

      <!-- 空数据 -->
      <template #empty>
        <div class="pro-table__empty">
          <el-icon :size="40"><FolderOpened /></el-icon>
          <p>暂无数据</p>
        </div>
      </template>
    </el-table>

    <div v-if="showPagination" v-show="displayTotal > 0" class="pro-table__pagination">
      <Pagination
        v-model:page="currentPage"
        v-model:limit="currentLimit"
        :total="displayTotal"
        :page-sizes="pageSizes"
        :layout="layout"
        @pagination="handlePagination"
      />
    </div>
  </div>
</template>

<style lang="less" scoped>
.pro-table {
  position: relative;

  .pro-table__inner {
    :deep(.el-table__row) {
      transition: background-color @transition-duration ease;
    }

    // 表头底部加粗边框 + 主色淡化线点缀
    :deep(th) {
      border-bottom: 2px solid fade(@color-primary, 12%) !important;
    }
  }

  // 空状态：精致化，主色淡化背景 + 大间距
  .pro-table__empty {
    padding: @spacing-section 0;
    color: @color-text-secondary;
    font-size: @font-size-md;
    // flex 列布局居中，确保图标和文字水平对齐
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    .el-icon {
      margin-bottom: @spacing-md;
      color: @color-text-placeholder;
      font-size: 36px;
      opacity: 0.6;
    }

    p {
      margin: 0;
      color: @color-text-secondary;
      letter-spacing: 0.5px;
    }
  }

  // 分页容器：覆盖子组件 Pagination 的 padding，避免双层 wrapper 多余空白
  .pro-table__pagination {
    margin-top: @spacing-md;
    padding-top: @spacing-md;
    border-top: 1px solid @color-border-light;
    display: flex;
    justify-content: flex-end;

    // 子组件 Pagination 自带的 .pagination-wrapper 的 padding 抵消掉
    :deep(.pagination-wrapper) {
      padding: 0;
    }
  }
}
</style>
