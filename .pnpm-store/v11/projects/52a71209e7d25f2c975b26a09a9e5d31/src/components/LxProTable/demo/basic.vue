<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import {
  LxActionButtons,
  LxEmpty,
  LxPagination,
  LxProTable,
  LxStatusDot,
  type LxActionItem,
  type LxProTableExpose,
  type LxTableColumn,
  type LxTableSortChange,
} from '../../../index'

interface Row {
  id: number
  name: string
  code: string
  status: 'online' | 'busy' | 'error'
  latency: string
  sla: string
}

type DemoState = 'success' | 'loading' | 'empty' | 'error'

const states: { value: DemoState; label: string }[] = [
  { value: 'success', label: '成功' },
  { value: 'loading', label: '加载中' },
  { value: 'empty', label: '空结果' },
  { value: 'error', label: '请求失败' },
]

const ALL: Row[] = Array.from({ length: 43 }, (_, i) => ({
  id: i + 1,
  name: `滨江网关-${String(i + 1).padStart(2, '0')}`,
  code: `GW-3301${String(i + 1).padStart(4, '0')}`,
  status: (['online', 'online', 'busy', 'error'] as const)[i % 4],
  latency: `${8 + (i % 40)}ms`,
  sla: `${(97 + (i % 30) / 10).toFixed(1)}%`,
}))

const page = ref(1)
const pageSize = ref(10)
const selectedKeys = ref<(string | number)[]>([])
const state = ref<DemoState>('success')
const feedback = ref('点击表格行或排序表头查看交互结果')
const tableRef = ref<LxProTableExpose>()
const hud = ref(false)
let initialTheme: { dark: boolean; hud: boolean } | undefined
const rows = computed(() =>
  ALL.slice((page.value - 1) * pageSize.value, page.value * pageSize.value),
)
const visibleRows = computed(() =>
  state.value === 'success' || state.value === 'loading' ? rows.value : [],
)
const total = computed(() =>
  state.value === 'success' || state.value === 'loading' ? ALL.length : 0,
)

const columns: LxTableColumn[] = [
  {
    prop: 'name',
    label: '节点名称',
    minWidth: 140,
    sortable: true,
    fixed: 'left',
  },
  { prop: 'code', label: '节点编号', width: 130, mono: true },
  { prop: 'status', label: '状态', width: 130 },
  { prop: 'latency', label: '时延', width: 90, mono: true, sortable: true },
  { prop: 'sla', label: 'SLA', width: 90, mono: true },
  { prop: 'actions', label: '操作', width: 170, fixed: 'right' },
]

function actionsOf(row: Row): LxActionItem[] {
  return [
    { label: '编辑' },
    { label: '授权' },
    { label: '停用', type: 'danger', hidden: row.status === 'error' },
    { label: '删除', type: 'danger' },
  ]
}

function onAction(action: LxActionItem) {
  feedback.value = `操作：${action.label}`
}

function onRowClick(row: Record<string, unknown>, index: number) {
  feedback.value = `已选择查看第 ${index + 1} 行：${String(row.name ?? '当前行')}`
}

function onSortChange(payload: LxTableSortChange) {
  feedback.value = `排序：${payload.prop} ${payload.order ?? '已清除'}`
}

function retry() {
  state.value = 'success'
}

function toggleHud(value: boolean) {
  const root = document.documentElement
  initialTheme ??= {
    dark: root.classList.contains('dark'),
    hud: root.classList.contains('lx-theme-hud'),
  }
  hud.value = value
  root.classList.toggle('dark', value)
  root.classList.toggle('lx-theme-hud', value)
}

onBeforeUnmount(() => {
  if (!initialTheme) return
  document.documentElement.classList.toggle('dark', initialTheme.dark)
  document.documentElement.classList.toggle('lx-theme-hud', initialTheme.hud)
})
</script>

<template>
  <div class="lx-pro-table-demo">
    <div class="lx-pro-table-demo__toolbar">
      <div
        class="lx-pro-table-demo__states"
        role="group"
        aria-label="表格数据状态"
      >
        <span>数据状态</span>
        <button
          v-for="option in states"
          :key="option.value"
          type="button"
          :aria-pressed="state === option.value"
          @click="state = option.value"
        >
          {{ option.label }}
        </button>
      </div>
      <div class="lx-pro-table-demo__selection">
        <span>已选 {{ selectedKeys.length }} 项</span>
        <button
          type="button"
          :disabled="selectedKeys.length === 0"
          @click="tableRef?.clearSelection()"
        >
          清空选择
        </button>
        <label class="lx-pro-table-demo__theme">
          <input
            type="checkbox"
            :checked="hud"
            aria-label="HUD 深色主题"
            @change="toggleHud(($event.target as HTMLInputElement).checked)"
          />
          HUD 深色
        </label>
      </div>
    </div>

    <LxProTable
      ref="tableRef"
      :columns="columns"
      :data="visibleRows"
      :loading="state === 'loading'"
      row-key="id"
      selectable
      stripe
      v-model:selected-keys="selectedKeys"
      @row-click="onRowClick"
      @sort-change="onSortChange"
    >
      <template #cell-status="{ value }">
        <LxStatusDot :status="value" show-text />
      </template>
      <template #cell-actions="{ row }">
        <LxActionButtons :actions="actionsOf(row as Row)" @click="onAction" />
      </template>
      <template #empty>
        <div
          v-if="state === 'error'"
          class="lx-pro-table-demo__error"
          role="alert"
        >
          <span>设备列表暂时无法加载</span>
          <button type="button" @click="retry">重试</button>
        </div>
        <LxEmpty v-else description="当前没有匹配的数据" size="compact" />
      </template>
    </LxProTable>

    <LxPagination
      v-model:page="page"
      v-model:page-size="pageSize"
      :total="total"
    />
    <p class="lx-pro-table-demo__feedback" role="status" aria-live="polite">
      {{ feedback }}
    </p>
  </div>
</template>

<style scoped>
.lx-pro-table-demo {
  display: flex;
  flex-direction: column;
  gap: 12px;
  color: var(--lx-text-regular);
}

.lx-pro-table-demo__toolbar,
.lx-pro-table-demo__states,
.lx-pro-table-demo__selection {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.lx-pro-table-demo__toolbar {
  justify-content: space-between;
  font-size: 13px;
}

.lx-pro-table-demo__states button,
.lx-pro-table-demo__selection button,
.lx-pro-table-demo__error button {
  min-height: 32px;
  padding: 0 10px;
  border: 1px solid var(--lx-border);
  border-radius: var(--lx-radius-sm);
  background: var(--lx-bg-card);
  color: var(--lx-text-regular);
  cursor: pointer;
}

.lx-pro-table-demo__states button[aria-pressed='true'] {
  border-color: var(--lx-color-primary);
  color: var(--lx-color-primary);
}

.lx-pro-table-demo__selection button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.lx-pro-table-demo__theme {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.lx-pro-table-demo__states button:focus-visible,
.lx-pro-table-demo__selection button:focus-visible,
.lx-pro-table-demo__error button:focus-visible {
  outline: 2px solid var(--lx-color-primary);
  outline-offset: 2px;
}

.lx-pro-table-demo__error {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px;
  color: var(--lx-text-regular);
}

.lx-pro-table-demo__feedback {
  margin: 0;
  color: var(--lx-text-secondary);
  font-size: 12px;
}
</style>
