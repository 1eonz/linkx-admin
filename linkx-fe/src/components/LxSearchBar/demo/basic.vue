<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  LxSearchBar,
  type LxSearchField,
  type LxSearchBarProps,
} from '../../../index'

type Mode = 'success' | 'empty' | 'error'

const fields: NonNullable<LxSearchBarProps['fields']> = [
  {
    key: 'keyword',
    label: '关键词',
    type: 'input',
    span: 8,
    placeholder: '姓名 / 警号',
  },
  {
    key: 'department',
    label: '责任部门',
    type: 'select',
    span: 8,
    options: [
      { label: '指挥中心', value: 'command' },
      { label: '巡防大队', value: 'patrol' },
    ],
  },
  {
    key: 'region',
    label: '组织节点',
    type: 'tree-select',
    span: 8,
    options: [
      {
        label: '城东片区',
        value: 'east',
        children: [{ label: '一中队', value: 'east-1' }],
      },
      { label: '城西片区', value: 'west' },
    ],
  },
  { key: 'date', label: '日期范围', type: 'daterange', span: 8 },
  {
    key: 'level',
    label: '告警等级',
    type: 'select',
    span: 8,
    options: [
      { label: '高', value: 'high' },
      { label: '中', value: 'middle' },
    ],
  },
  { key: 'count', label: '最少数量', type: 'number', span: 8, defaultValue: 0 },
  {
    key: 'source',
    label: '来源路径',
    type: 'cascader',
    span: 8,
    options: [
      {
        label: '平台',
        value: 100,
        children: [{ label: '北向', value: 101 }],
      },
    ],
  },
  {
    key: 'status',
    label: '状态',
    type: 'select',
    span: 8,
    options: [
      { label: '在线', value: 'online' },
      { label: '离线', value: 'offline' },
    ],
  },
  { key: 'owner', label: '负责人', type: 'input', span: 8 },
  {
    key: 'disabled',
    label: '只读条件',
    type: 'input',
    span: 8,
    defaultValue: '系统生成',
    disabled: true,
  },
]

const query = ref<Record<string, unknown>>({ count: 0, source: [100, 101] })
const loading = ref(false)
const mode = ref<Mode>('success')
const rows = ref<string[]>([])
const status = ref('等待查询')
const collapsed = ref(true)

function runSearch() {
  loading.value = true
  status.value = '查询中'
  const currentMode = mode.value
  new Promise<string[]>((resolve, reject) => {
    window.setTimeout(() => {
      if (currentMode === 'error') reject(new Error('查询服务暂不可用'))
      else
        resolve(currentMode === 'empty' ? [] : ['AL-2026-0001', 'AL-2026-0002'])
    }, 250)
  })
    .then((result) => {
      rows.value = result
      status.value = result.length
        ? `查询到 ${result.length} 条`
        : '暂无匹配结果'
    })
    .catch((error: unknown) => {
      rows.value = []
      status.value = error instanceof Error ? error.message : '查询失败'
    })
    .finally(() => {
      loading.value = false
    })
}

const resultText = computed(() =>
  rows.value.length ? rows.value.join('、') : '无结果',
)
</script>

<template>
  <section class="lx-search-demo" aria-label="检索面板示例">
    <div class="lx-search-demo__toolbar">
      <div class="lx-search-demo__modes" role="group" aria-label="查询结果模拟">
        <button
          v-for="item in ['success', 'empty', 'error'] as const"
          :key="item"
          type="button"
          :aria-pressed="mode === item"
          @click="mode = item"
        >
          {{
            item === 'success' ? '成功' : item === 'empty' ? '空结果' : '失败'
          }}
        </button>
      </div>
      <span role="status" aria-live="polite">{{ status }}</span>
    </div>
    <LxSearchBar
      v-model="query"
      :fields="fields"
      :loading="loading"
      :collapsed="collapsed"
      @update:collapsed="collapsed = $event"
      @search="runSearch"
      @reset="status = '已重置'"
    >
      <template #meta>
        <span
          class="lx-search-demo__meta-status"
          role="status"
          aria-live="polite"
        >
          <span class="lx-search-demo__meta-dot" aria-hidden="true" />
          {{ status
          }}<template v-if="rows.length"> · 共 {{ rows.length }} 条</template>
        </span>
        <span class="lx-search-demo__meta-hint">
          快捷键：<kbd>Enter</kbd> 查询 / <kbd>Esc</kbd> 重置
        </span>
      </template>
    </LxSearchBar>
    <p class="lx-search-demo__result">结果：{{ resultText }}</p>
  </section>
</template>

<style scoped>
.lx-search-demo {
  display: grid;
  gap: var(--lx-space-md);
  padding: var(--lx-space-lg);
  border: 1px solid var(--lx-border);
  border-radius: var(--lx-radius-md);
  background: var(--lx-bg-card);
  color: var(--lx-text-regular);
}
.lx-search-demo__toolbar,
.lx-search-demo__modes {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--lx-space-sm);
}
.lx-search-demo__toolbar {
  justify-content: space-between;
}
.lx-search-demo__modes button {
  min-height: var(--lx-control-height);
  padding: 0 var(--lx-space-sm);
  border: 1px solid var(--lx-border);
  border-radius: var(--lx-radius-sm);
  background: var(--lx-bg-card);
  color: var(--lx-text-regular);
  cursor: pointer;
  font: inherit;
}
.lx-search-demo__modes button[aria-pressed='true'],
.lx-search-demo__modes button:hover {
  border-color: var(--lx-color-primary);
  color: var(--lx-color-primary);
}
.lx-search-demo__modes button:focus-visible {
  outline: 2px solid var(--lx-color-primary);
  outline-offset: 2px;
}
.lx-search-demo__meta-status,
.lx-search-demo__meta-hint {
  display: inline-flex;
  min-width: 0;
  align-items: center;
  gap: var(--lx-space-xs);
}
.lx-search-demo__meta-dot {
  width: 6px;
  height: 6px;
  flex: 0 0 auto;
  border-radius: 50%;
  background: var(--lx-color-primary-container);
}
.lx-search-demo__meta-hint {
  color: var(--lx-text-secondary-strong);
  white-space: nowrap;
}
.lx-search-demo__meta-hint kbd {
  padding: 0 4px;
  border: 1px solid var(--lx-border);
  border-radius: var(--lx-radius-sm);
  background: var(--lx-bg-card-hover);
  color: var(--lx-text-regular);
  font-family: var(--lx-font-mono);
  font-size: 11px;
  line-height: 16px;
}
.lx-search-demo__result {
  margin: 0;
  color: var(--lx-text-secondary);
  font-size: 13px;
}
@media (max-width: 640px) {
  .lx-search-demo {
    padding: var(--lx-space-md);
  }
}
</style>
