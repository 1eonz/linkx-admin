<script setup lang="ts">
/**
 * LxProTable — 数据表格（Element Plus el-table 二次封装）
 * 能力透传：fixed 固定列 / sortable 排序 / reserve-selection 跨页选择 / ellipsis
 * 视觉：lx-tokens 桥接（表头 40px 灰底 / 行高 44px / 行线 #ebeef5 / nowrap）
 */
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ElTable, ElTableColumn } from 'element-plus'
import type { TableInstance } from 'element-plus'
import type { LxProTableProps, LxTableSortChange } from './types'
import LxEmpty from '../LxEmpty/index.vue'
import { maskValue } from '../../permissions'
import 'element-plus/es/components/table/style/css'

const props = withDefaults(defineProps<LxProTableProps>(), {
  columns: () => [],
  data: () => [],
  rowKey: 'id',
  loading: false,
  emptyText: '暂无数据',
  compact: false,
  stripe: false,
  bordered: true,
  selectable: false,
  selectedKeys: () => [],
  tableAttrs: () => ({}),
})

const emit = defineEmits<{
  'update:selected-keys': [keys: (string | number)[]]
  'select-change': [keys: (string | number)[], rows: Record<string, any>[]]
  'row-click': [row: Record<string, any>, index: number]
  'sort-change': [payload: LxTableSortChange]
}>()

const tableRef = ref<TableInstance>()
const tableWrapperRef = ref<HTMLDivElement>()
const hasHorizontalOverflow = ref(false)
const selectedRows = new Map<string | number, Record<string, any>>()
let syncing = false
let resizeObserver: ResizeObserver | undefined

function getTableScrollArea(): HTMLElement | undefined {
  return (
    tableWrapperRef.value?.querySelector<HTMLElement>(
      '.el-table__body-wrapper .el-scrollbar__wrap',
    ) ?? undefined
  )
}

function rememberSelectedRows(keys: (string | number)[]) {
  const selected = new Set(keys)
  props.data.forEach((row) => {
    const key = row[props.rowKey] as string | number | undefined
    if (key !== undefined && key !== null && selected.has(key)) {
      selectedRows.set(key, row)
    }
  })
  selectedRows.forEach((_, key) => {
    if (!selected.has(key)) selectedRows.delete(key)
  })
}

/** 受控选择同步（外部 selectedKeys 变化 → EP 内部 selection） */
function syncSelection(keys: (string | number)[]) {
  const table = tableRef.value
  rememberSelectedRows(keys)
  if (!table) return
  syncing = true
  table.clearSelection()
  keys.forEach((key) => {
    const row = selectedRows.get(key)
    if (row) table.toggleRowSelection(row, true)
  })
  nextTick(() => (syncing = false))
}

function updateHorizontalOverflow() {
  const scrollArea = getTableScrollArea()
  hasHorizontalOverflow.value =
    !!scrollArea && scrollArea.scrollWidth > scrollArea.clientWidth
}

function observeTableLayout() {
  if (!resizeObserver || !tableWrapperRef.value) return
  resizeObserver.disconnect()
  resizeObserver.observe(tableWrapperRef.value)
  const scrollArea = getTableScrollArea()
  if (scrollArea) resizeObserver.observe(scrollArea)
}

function syncRenderedTable() {
  void nextTick(() => {
    syncSelection(props.selectedKeys)
    updateHorizontalOverflow()
    observeTableLayout()
  })
}

watch(() => props.selectedKeys, syncSelection, { deep: true })
watch(() => [props.data, props.columns], syncRenderedTable)

function onTableKeydown(event: KeyboardEvent) {
  if (event.target !== event.currentTarget) return
  const scrollArea = getTableScrollArea()
  if (!scrollArea) return

  const step = Math.max(48, Math.round(scrollArea.clientWidth * 0.75))
  const positions: Record<string, number> = {
    ArrowLeft: scrollArea.scrollLeft - step,
    ArrowRight: scrollArea.scrollLeft + step,
    Home: 0,
    End: scrollArea.scrollWidth,
  }
  if (!(event.key in positions)) return

  scrollArea.scrollLeft = positions[event.key]
  event.preventDefault()
}

onMounted(() => {
  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(updateHorizontalOverflow)
  }
  syncRenderedTable()
})

onBeforeUnmount(() => resizeObserver?.disconnect())

function onSelectionChange(rows: Record<string, any>[]) {
  if (syncing) return
  const keys = rows.map((r) => r[props.rowKey] as string | number)
  rows.forEach((row, index) => selectedRows.set(keys[index], row))
  const selected = new Set(keys)
  selectedRows.forEach((_, key) => {
    if (!selected.has(key)) selectedRows.delete(key)
  })
  emit('update:selected-keys', keys)
  emit('select-change', keys, rows)
}

function onRowClick(row: Record<string, any>) {
  emit('row-click', row, props.data.indexOf(row))
}

function onSortChange({
  prop,
  order,
}: {
  prop: string | null
  order: 'ascending' | 'descending' | null
}) {
  emit('sort-change', {
    prop: prop ?? '',
    order:
      order === 'ascending' ? 'asc' : order === 'descending' ? 'desc' : null,
  })
}

function displayCell(
  value: unknown,
  mask: boolean | string | undefined,
  field: string,
): string {
  if (mask === undefined || mask === false) {
    if (value === null || value === undefined || value === '') return '-'
    return String(value)
  }
  return maskValue(value, field, typeof mask === 'string' ? mask : '***')
}

// 保留 Element Plus 表格实例能力，供已有业务表格逐步迁移。
defineExpose({
  getTableRef: () => tableRef.value,
  clearSelection: () => tableRef.value?.clearSelection(),
  toggleRowSelection: (row: Record<string, any>, selected?: boolean) =>
    tableRef.value?.toggleRowSelection(row, selected),
  getSelectionRows: () => tableRef.value?.getSelectionRows() ?? [],
})
</script>

<template>
  <div
    ref="tableWrapperRef"
    class="lx-table"
    :class="{ 'is-bordered': bordered }"
    :aria-busy="loading"
    :role="hasHorizontalOverflow ? 'region' : undefined"
    :aria-label="
      hasHorizontalOverflow ? '数据表格，可使用左右方向键水平滚动' : undefined
    "
    :tabindex="hasHorizontalOverflow ? 0 : undefined"
    @keydown="onTableKeydown"
  >
    <ElTable
      v-bind="tableAttrs"
      ref="tableRef"
      :data="data"
      :row-key="rowKey"
      :size="compact ? 'small' : 'default'"
      :stripe="stripe"
      style="width: 100%"
      @selection-change="onSelectionChange"
      @row-click="onRowClick"
      @sort-change="onSortChange"
    >
      <slot>
        <ElTableColumn
          v-if="selectable"
          type="selection"
          width="44"
          :reserve-selection="true"
        />
        <ElTableColumn
          v-for="col in columns"
          :key="col.prop"
          :prop="col.prop"
          :label="col.label"
          :width="col.width"
          :min-width="col.minWidth"
          :fixed="col.fixed"
          :align="col.align"
          :sortable="col.sortable"
          :show-overflow-tooltip="col.ellipsis !== false"
          :class-name="col.mono ? 'lx-td-mono' : ''"
        >
          <template #header>
            <slot :name="`header-${col.prop}`" :column="col">{{
              col.label
            }}</slot>
          </template>
          <template #default="{ row, $index }">
            <slot
              :name="`cell-${col.prop}`"
              :row="row"
              :index="$index"
              :value="row[col.prop]"
            >
              {{ displayCell(row[col.prop], col.mask, col.prop) }}
            </slot>
          </template>
        </ElTableColumn>
      </slot>
      <template #empty>
        <slot name="empty">
          <LxEmpty
            :description="emptyText"
            :size="compact ? 'compact' : 'default'"
          />
        </slot>
      </template>
    </ElTable>

    <div
      v-if="loading"
      class="lx-table__mask"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <span class="lx-table__spinner" aria-hidden="true" />
      <span>正在加载</span>
    </div>
  </div>
</template>

<style scoped>
.lx-table {
  position: relative;
  border-radius: var(--lx-radius-md);
  background: var(--lx-bg-card);
}

.lx-table.is-bordered {
  border: 1px solid var(--lx-border);
}

.lx-table:focus-visible {
  outline: 2px solid var(--lx-color-primary);
  outline-offset: 2px;
}

/* EP 表格 → LxUI 令牌 */
:deep(.el-table) {
  --el-table-header-bg-color: var(--lx-bg-table-header);
  --el-table-header-text-color: var(--lx-text-primary);
  --el-table-row-hover-bg-color: var(--lx-bg-card-hover);
  --el-table-border-color: var(--lx-border-light);
  --el-table-text-color: var(--lx-text-regular);
  background: transparent;
  font-size: 13px;
}

/* 表头 40px / 行高 44px（stitch 密度） */
:deep(.el-table th.el-table__cell) {
  padding: 10px 0;
  font-weight: 600;
}

:deep(.el-table--default .el-table__cell) {
  padding: 11px 0;
}

/* 紧凑密度：行高 36px */
:deep(.el-table--small .el-table__cell) {
  padding: 8px 0;
}

:deep(.el-table__empty-block) {
  background: transparent;
}

:deep(.el-table-column--selection.el-table__cell) {
  padding: 0;
}

:deep(.el-table-column--selection .cell) {
  display: flex;
  justify-content: center;
  padding: 0;
}

:deep(.el-table-column--selection .el-checkbox) {
  width: 44px;
  height: 44px;
  justify-content: center;
  margin: 0;
}

/* 加载遮罩 */
.lx-table__mask {
  position: absolute;
  inset: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: var(--lx-bg-card);
  color: var(--lx-text-regular);
  font-size: 13px;
}

.lx-table__spinner {
  width: 20px;
  height: 20px;
  flex: none;
  border: 2px solid var(--lx-border);
  border-top-color: var(--lx-color-primary);
  border-radius: 50%;
  animation: lx-table-rotate 0.8s linear infinite;
}

@media (prefers-reduced-motion: reduce) {
  .lx-table__spinner {
    animation: none;
    border-top-color: var(--lx-color-primary);
  }
}

@keyframes lx-table-rotate {
  to {
    transform: rotate(360deg);
  }
}
</style>

<!-- 全局：等宽字体列（mono） -->
<style>
.lx-td-mono .cell {
  font-family: var(--lx-font-mono);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0;
}
</style>
