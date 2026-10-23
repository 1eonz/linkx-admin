<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'

import { useDemoHudTheme } from '../../../../docs/.vitepress/composables/useDemoHudTheme'

import {
  LxDescriptions,
  LxEmpty,
  LxIcon,
  LxSelect,
  type LxDescriptionItem,
  type LxSelectModelValue,
  type LxSelectOption,
} from '../../../index'

type PreviewState = 'ready' | 'loading' | 'empty' | 'error'

const previewStates: LxSelectOption[] = [
  { value: 'ready', label: '详情' },
  { value: 'loading', label: '读取中' },
  { value: 'empty', label: '空结果' },
  { value: 'error', label: '错误' },
] as const
const layout = ref<'two-ends' | 'grid'>('two-ends')
const bordered = ref(false)
const hudTheme = ref(false)
const previewState = ref<PreviewState>('ready')
let retryTimeout: number | undefined

useDemoHudTheme(hudTheme)

const items: LxDescriptionItem[] = [
  { key: 'name', label: '姓名', value: '孙志国' },
  {
    key: 'policeId',
    label: '警号',
    value: '005882',
    copyable: true,
    span: 2,
  },
  {
    key: 'organization',
    label: '所属组织',
    value: '市局指挥中心 / 联合情报研判战队',
    span: 2,
  },
  { key: 'phone', label: '联系电话', value: '138-0010-8921' },
  { key: 'role', label: '角色分配', value: '一级协同 / 系统副管理员' },
  {
    key: 'status',
    label: '运行状态',
    value: '在线（在岗备勤），当前负责跨辖区视频联动与加密调度',
    statusDot: 'online',
  },
  {
    key: 'connection',
    label: '连接状态',
    value: '在线',
    statusDot: 'online',
  },
  { key: 'createdAt', label: '创建时间', value: '2026-09-22 14:35:10' },
  {
    key: 'deviceCode',
    label: '设备标识',
    value: 'GB28181-P2P-EDGE-NODE-20261007-00000001-REGION-OPS',
    copyable: true,
    span: 2,
  },
  {
    key: 'remarks',
    label: '业务备注',
    value: '重点高架合流区视频快反联动专员，具有跨网段加密调度二级权限。',
    span: 2,
  },
]

const drawerItems = items.slice(0, 6)

const previewStateLabel = computed(
  () =>
    previewStates.find((state) => state.value === previewState.value)?.label,
)

function isPreviewState(value: LxSelectModelValue): value is PreviewState {
  return (
    typeof value === 'string' &&
    previewStates.some((state) => state.value === value)
  )
}

function updatePreviewState(value: LxSelectModelValue) {
  if (!isPreviewState(value)) return
  if (retryTimeout !== undefined) window.clearTimeout(retryTimeout)
  retryTimeout = undefined
  previewState.value = value
}

function retryPreview() {
  if (retryTimeout !== undefined) window.clearTimeout(retryTimeout)
  previewState.value = 'loading'
  retryTimeout = window.setTimeout(() => {
    previewState.value = 'ready'
    retryTimeout = undefined
  }, 500)
}

onBeforeUnmount(() => {
  if (retryTimeout !== undefined) window.clearTimeout(retryTimeout)
})
</script>

<template>
  <section class="lx-descriptions-demo" aria-label="详情描述示例">
    <div class="lx-descriptions-demo__controls">
      <div class="lx-descriptions-demo__control-group">
        <span
          id="lx-descriptions-demo-layout-label"
          class="lx-descriptions-demo__control-label"
        >
          布局
        </span>
        <div
          class="lx-descriptions-demo__segmented"
          role="group"
          aria-labelledby="lx-descriptions-demo-layout-label"
        >
          <button
            type="button"
            :aria-pressed="layout === 'two-ends'"
            @click="layout = 'two-ends'"
          >
            单列
          </button>
          <button
            type="button"
            :aria-pressed="layout === 'grid'"
            @click="layout = 'grid'"
          >
            双列
          </button>
        </div>
      </div>
      <div class="lx-descriptions-demo__control-group">
        <label
          class="lx-descriptions-demo__control-label"
          for="lx-descriptions-demo-state"
        >
          数据状态
        </label>
        <LxSelect
          id="lx-descriptions-demo-state"
          class="lx-descriptions-demo__state-select"
          :model-value="previewState"
          :options="previewStates"
          @update:model-value="updatePreviewState"
        />
      </div>
      <p class="lx-descriptions-demo__state-summary" aria-live="polite">
        当前预览：{{ previewStateLabel }}
      </p>
      <details class="lx-descriptions-demo__advanced">
        <summary>更多预览设置</summary>
        <div class="lx-descriptions-demo__advanced-content">
          <label class="lx-descriptions-demo__toggle">
            <input v-model="bordered" type="checkbox" />
            网格边框
          </label>
          <label class="lx-descriptions-demo__toggle">
            <input v-model="hudTheme" type="checkbox" />
            HUD 深色主题（整页）
          </label>
          <span class="lx-descriptions-demo__advanced-hint">
            仅影响当前文档示例，离开页面会恢复原主题。
          </span>
        </div>
      </details>
    </div>

    <div v-if="previewState === 'ready'" class="lx-descriptions-demo__main">
      <LxDescriptions
        :items="items"
        :columns="2"
        :layout="layout"
        :bordered="bordered"
        :label-width="layout === 'grid' ? 'min(96px, 30%)' : undefined"
      >
        <template #item-role="{ value }">
          <span class="lx-descriptions-demo__role-value">{{ value }}</span>
        </template>
      </LxDescriptions>
    </div>
    <p
      v-else-if="previewState === 'loading'"
      class="lx-descriptions-demo__state"
      role="status"
      aria-busy="true"
    >
      <LxIcon name="loading" :size="18" aria-hidden="true" />
      <span class="lx-descriptions-demo__state-title">正在读取详情…</span>
    </p>
    <LxEmpty
      v-else-if="previewState === 'empty'"
      class="lx-descriptions-demo__empty"
      description="暂无可展示的人员详情。"
    />
    <div
      v-else
      class="lx-descriptions-demo__state lx-descriptions-demo__error"
      role="alert"
    >
      <span>人员档案暂时无法读取。</span>
      <button type="button" @click="retryPreview">重新读取详情</button>
    </div>

    <details
      v-if="previewState === 'ready'"
      class="lx-descriptions-demo__drawer"
    >
      <summary>480 像素详情抽屉组合示例</summary>
      <section aria-label="480 像素详情抽屉">
        <h3>人员档案</h3>
        <LxDescriptions
          :items="drawerItems"
          layout="two-ends"
          :label-width="88"
        />
      </section>
    </details>
  </section>
</template>

<style scoped>
.lx-descriptions-demo {
  display: grid;
  width: 100%;
  max-width: 820px;
  min-width: 0;
  grid-template-columns: minmax(0, 1fr);
  gap: 20px;
  color: var(--lx-text-primary);
}

.lx-descriptions-demo__controls {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: start;
  gap: 8px 16px;
}

.lx-descriptions-demo__control-group {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  gap: 8px;
}

.lx-descriptions-demo__control-label {
  color: var(--lx-text-secondary);
  font-size: 13px;
  white-space: nowrap;
}

.lx-descriptions-demo__state-select {
  width: 136px;
}

.lx-descriptions-demo__state-summary {
  grid-column: 1 / -1;
  margin: 0;
  color: var(--lx-text-secondary);
  font-size: 12px;
  line-height: 18px;
}

.lx-descriptions-demo__advanced {
  grid-column: 1 / -1;
  min-width: 0;
  border: 1px solid var(--lx-border-light);
  border-radius: var(--lx-radius-sm);
  background: var(--lx-bg-card);
}

.lx-descriptions-demo__advanced summary,
.lx-descriptions-demo__drawer summary {
  min-height: 44px;
  box-sizing: border-box;
  padding: 0 10px;
  color: var(--lx-text-regular);
  cursor: pointer;
  font-size: 13px;
  line-height: 44px;
}

.lx-descriptions-demo__advanced summary:focus-visible,
.lx-descriptions-demo__drawer summary:focus-visible {
  outline: 2px solid var(--lx-color-primary);
  outline-offset: 2px;
}

.lx-descriptions-demo__advanced-content {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
  padding: 0 10px 8px;
}

.lx-descriptions-demo__advanced-hint {
  color: var(--lx-text-secondary);
  font-size: 12px;
}

.lx-descriptions-demo__segmented {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 3px;
  border: 1px solid var(--lx-border);
  border-radius: var(--lx-radius-sm);
  background: var(--lx-bg-card);
}

.lx-descriptions-demo__segmented button {
  min-height: 44px;
  padding: 0 10px;
  border: 0;
  border-radius: var(--lx-radius-sm);
  background: transparent;
  color: var(--lx-text-regular);
  cursor: pointer;
  font: inherit;
}

.lx-descriptions-demo__segmented button[aria-pressed='true'] {
  background: var(--lx-color-primary-light);
  color: var(--lx-color-primary);
}

.lx-descriptions-demo__toggle {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  gap: 8px;
  color: var(--lx-text-regular);
  font-size: 13px;
}

.lx-descriptions-demo__toggle input {
  accent-color: var(--lx-color-primary);
}

.lx-descriptions-demo__main {
  min-width: 0;
}

.lx-descriptions-demo__state {
  display: flex;
  flex-wrap: wrap;
  min-height: 64px;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin: 0;
  border-block: 1px solid var(--lx-border-light);
  color: var(--lx-text-secondary);
}

.lx-descriptions-demo__error {
  color: var(--lx-color-error-strong);
}

.lx-descriptions-demo__state-title {
  font-weight: 500;
}

.lx-descriptions-demo__error button {
  min-height: 44px;
  padding: 0 10px;
  border: 1px solid var(--lx-border);
  border-radius: var(--lx-radius-sm);
  background: var(--lx-bg-card);
  color: var(--lx-text-primary);
  cursor: pointer;
}

.lx-descriptions-demo__drawer {
  display: block;
  width: min(480px, 100%);
  max-width: 100%;
  box-sizing: border-box;
  min-width: 0;
  justify-self: end;
  padding: 0;
  border: 1px solid var(--lx-border-light);
  background: var(--lx-bg-card);
}

.lx-descriptions-demo__drawer section {
  padding: 16px;
}

.lx-descriptions-demo__drawer h3 {
  margin: 0 0 12px;
  font-size: 14px;
  line-height: 20px;
}

.lx-descriptions-demo__role-value {
  display: inline-flex;
  max-width: 100%;
  align-items: center;
  min-width: 0;
  overflow: hidden;
  padding: 0 6px;
  border: 1px solid var(--lx-color-primary-light);
  border-radius: var(--lx-radius-sm);
  background: var(--lx-color-primary-light);
  color: var(--lx-color-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.lx-descriptions-demo__segmented button:focus-visible,
.lx-descriptions-demo__error button:focus-visible,
.lx-descriptions-demo__toggle input:focus-visible {
  outline: 2px solid var(--lx-color-primary);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .lx-descriptions-demo__segmented button,
  .lx-descriptions-demo__error button {
    transition: none;
  }
}

@media (max-width: 600px) {
  .lx-descriptions-demo__controls {
    grid-template-columns: minmax(0, 1fr);
  }

  .lx-descriptions-demo__drawer {
    justify-self: stretch;
  }

  .lx-descriptions-demo__drawer section {
    padding: 12px;
  }

  .lx-descriptions-demo__state-summary {
    grid-column: auto;
  }

  .lx-descriptions-demo__advanced {
    grid-column: auto;
  }
}
</style>
