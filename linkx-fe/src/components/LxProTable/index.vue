<script setup lang="ts">
/**
 * LxProTable — 数据表格（Element Plus el-table 二次封装）
 * 能力透传：fixed 固定列 / sortable 排序 / reserve-selection 跨页选择 / ellipsis
 * 视觉：lx-tokens 桥接（表头 40px 灰底 / 行高 44px / 行线 #ebeef5 / nowrap）
 */
import { nextTick, onMounted, ref, watch } from 'vue';
import { ElTable, ElTableColumn } from 'element-plus';
import type { TableInstance } from 'element-plus';
import type { LxProTableProps, LxTableSortChange } from './types';
import LxEmpty from '../LxEmpty/index.vue';
import 'element-plus/es/components/table/style/css';

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
});

const emit = defineEmits<{
  'update:selected-keys': [keys: (string | number)[]];
  'select-change': [keys: (string | number)[], rows: Record<string, any>[]];
  'row-click': [row: Record<string, any>, index: number];
  'sort-change': [payload: LxTableSortChange];
}>();

const tableRef = ref<TableInstance>();
let syncing = false;

/** 受控选择同步（外部 selectedKeys 变化 → EP 内部 selection） */
function syncSelection(keys: (string | number)[]) {
  const table = tableRef.value;
  if (!table) return;
  syncing = true;
  table.clearSelection();
  props.data
    .filter((r) => keys.includes(r[props.rowKey] as string | number))
    .forEach((r) => table.toggleRowSelection(r, true));
  nextTick(() => (syncing = false));
}

watch(() => props.selectedKeys, syncSelection);
onMounted(() => props.selectedKeys.length && syncSelection(props.selectedKeys));

function onSelectionChange(rows: Record<string, any>[]) {
  if (syncing) return;
  const keys = rows.map((r) => r[props.rowKey] as string | number);
  emit('update:selected-keys', keys);
  emit('select-change', keys, rows);
}

function onRowClick(row: Record<string, any>) {
  emit('row-click', row, props.data.indexOf(row));
}

function onSortChange({ prop, order }: { prop: string | null; order: 'ascending' | 'descending' | null }) {
  emit('sort-change', {
    prop: prop ?? '',
    order: order === 'ascending' ? 'asc' : order === 'descending' ? 'desc' : null,
  });
}
</script>

<template>
  <div class="lx-table" :class="{ 'is-bordered': bordered }">
    <ElTable
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
      <ElTableColumn v-if="selectable" type="selection" width="44" :reserve-selection="true" />
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
          <slot :name="`header-${col.prop}`" :column="col">{{ col.label }}</slot>
        </template>
        <template #default="{ row, $index }">
          <slot :name="`cell-${col.prop}`" :row="row" :index="$index" :value="row[col.prop]">
            {{ row[col.prop] }}
          </slot>
        </template>
      </ElTableColumn>
      <template #empty>
        <LxEmpty :description="emptyText" :size="compact ? 'compact' : 'default'" />
      </template>
    </ElTable>

    <div v-if="loading" class="lx-table__mask">
      <span class="lx-table__spinner" aria-label="加载中" />
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

/* 加载遮罩 */
.lx-table__mask {
  position: absolute;
  inset: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--lx-bg-card);
  opacity: 0.6;
}

.lx-table__spinner {
  width: 24px;
  height: 24px;
  border: 2px solid var(--lx-border);
  border-top-color: var(--lx-color-primary);
  border-radius: 50%;
  animation: lx-table-rotate 0.8s linear infinite;
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
  letter-spacing: -0.2px;
}
</style>
