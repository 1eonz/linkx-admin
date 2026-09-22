<script setup lang="ts">
// demo：LxProTable + LxPagination + 行内操作（fixed 列 / 排序 / 跨页选择）
import { computed, ref } from 'vue';
import { LxProTable, LxPagination, LxActionButtons, LxStatusDot, type LxTableColumn, type LxActionItem } from '../../../index';

interface Row { id: number; name: string; code: string; status: 'online' | 'busy' | 'error'; latency: string; sla: string }
const ALL: Row[] = Array.from({ length: 43 }, (_, i) => ({
  id: i + 1, name: `滨江网关-${String(i + 1).padStart(2, '0')}`, code: `GW-3301${String(i + 1).padStart(4, '0')}`,
  status: (['online', 'online', 'busy', 'error'] as const)[i % 4],
  latency: `${8 + (i % 40)}ms`, sla: `${(97 + (i % 30) / 10).toFixed(1)}%`,
}));
const page = ref(1), pageSize = ref(10), selectedKeys = ref<(string | number)[]>([]);
const rows = computed(() => ALL.slice((page.value - 1) * pageSize.value, page.value * pageSize.value));

const columns: LxTableColumn[] = [
  { prop: 'name', label: '节点名称', minWidth: 140, sortable: true, fixed: 'left' },
  { prop: 'code', label: '节点编号', width: 130, mono: true },
  { prop: 'status', label: '状态', width: 130 },
  { prop: 'latency', label: '时延', width: 90, mono: true, sortable: true },
  { prop: 'sla', label: 'SLA', width: 90, mono: true },
  { prop: 'actions', label: '操作', width: 170, fixed: 'right' },
];
function actionsOf(r: Row): LxActionItem[] {
  return [{ label: '编辑' }, { label: '授权' }, { label: '停用', type: 'danger', hidden: r.status === 'error' }, { label: '删除', type: 'danger' }];
}
</script>

<template>
  <div style="display:flex;flex-direction:column;gap:12px">
    <LxProTable :columns="columns" :data="rows" row-key="id" selectable v-model:selected-keys="selectedKeys" stripe>
      <template #cell-status="{ value }"><LxStatusDot :status="value" show-text /></template>
      <template #cell-actions="{ row }"><LxActionButtons :actions="actionsOf(row as Row)" @click="() => {}" /></template>
    </LxProTable>
    <LxPagination v-model:page="page" v-model:page-size="pageSize" :total="ALL.length" />
    <p style="font-size:12px;color:var(--lx-text-secondary)">已选 {{ selectedKeys.length }} 项（跨页保留）· 拖动横向滚动查看 fixed 左右列</p>
  </div>
</template>
