<script setup lang="ts">
import { computed, ref } from 'vue'
import LxCascader from '../index.vue'
import type {
  LxCascaderModelValue,
  LxCascaderOption,
  LxCascaderPathValue,
} from '../types'

type DemoState = 'ready' | 'loading' | 'error' | 'loading-error' | 'disabled'

const options: LxCascaderOption[] = [
  {
    label: '杭州市公安局',
    value: 'hangzhou',
    children: [
      {
        label: '西湖区分局',
        value: 'xihu',
        children: [
          { label: '情指中心', value: 'command' },
          { label: '巡防大队', value: 'patrol' },
        ],
      },
      { label: '滨江区分局', value: 'binjiang' },
      { label: '临时管控节点（禁用）', value: 'locked', disabled: true },
    ],
  },
]

const path = ref<LxCascaderModelValue>(['hangzhou', 'xihu', 'command'])
const multiple = ref(false)
const state = ref<DemoState>('ready')
const lastAction = ref('已回显组织路径')

const loading = computed(
  () => state.value === 'loading' || state.value === 'loading-error',
)
const error = computed(
  () => state.value === 'error' || state.value === 'loading-error',
)
const disabled = computed(() => state.value === 'disabled')

function formatPath(value: LxCascaderModelValue): string {
  if (!Array.isArray(value)) return value == null ? '未选择' : String(value)

  const values: LxCascaderPathValue[] =
    value.length > 0 && Array.isArray(value[0])
      ? (value as LxCascaderPathValue[])
      : [value as LxCascaderPathValue]
  return values
    .map((item) => item.map((part) => String(part)).join(' / '))
    .join('；')
}

function updatePath(value: LxCascaderModelValue): void {
  path.value = value
  lastAction.value =
    formatPath(value) === '未选择' ? '已清空组织路径' : '组织路径已更新'
}

function toggleMultiple(): void {
  multiple.value = !multiple.value
  path.value = multiple.value
    ? [
        ['hangzhou', 'xihu', 'command'],
        ['hangzhou', 'binjiang'],
      ]
    : ['hangzhou', 'xihu', 'command']
  lastAction.value = multiple.value
    ? '多选值已回显 2 条组织路径'
    : '已切换为单选路径'
}

function retry(): void {
  state.value = 'ready'
  lastAction.value = '数据已恢复，可以继续选择'
}
</script>

<template>
  <section class="cascader-demo">
    <div class="cascader-demo__field">
      <label id="cascader-demo-label" for="cascader-demo-path">组织路径</label>
      <LxCascader
        :key="multiple ? 'multiple' : 'single'"
        id="cascader-demo-path"
        :model-value="path"
        :options="options"
        :multiple="multiple"
        :loading="loading"
        :error="error"
        :disabled="disabled"
        clearable
        filterable
        collapse-tags
        placeholder="请选择组织路径"
        aria-labelledby="cascader-demo-label"
        @update:model-value="updatePath"
        @retry="retry"
      />
    </div>

    <details class="cascader-demo__settings">
      <summary>演示状态</summary>
      <div class="cascader-demo__toolbar">
        <div role="group" aria-label="选择模式">
          <button
            type="button"
            :aria-pressed="multiple"
            @click="toggleMultiple"
          >
            {{ multiple ? '单选模式' : '多选模式' }}
          </button>
        </div>
        <div role="group" aria-label="数据状态">
          <button
            v-for="item in [
              { value: 'loading', label: '加载中' },
              { value: 'error', label: '失败' },
              { value: 'loading-error', label: '加载中且失败' },
              { value: 'disabled', label: '禁用' },
            ]"
            :key="item.value"
            type="button"
            :aria-pressed="state === item.value"
            @click="state = item.value as DemoState"
          >
            {{ item.label }}
          </button>
        </div>
      </div>
    </details>

    <p class="cascader-demo__value">当前值：{{ formatPath(path) }}</p>
    <p class="cascader-demo__status" role="status" aria-live="polite">
      {{ lastAction }}
    </p>
  </section>
</template>

<style scoped>
.cascader-demo {
  box-sizing: border-box;
  display: grid;
  width: 100%;
  max-width: 520px;
  min-width: 0;
  gap: var(--lx-space-md);
  padding: var(--lx-space-lg);
  border: 1px solid var(--lx-border);
  border-radius: var(--lx-radius-md);
  background: var(--lx-bg-card);
  color: var(--lx-text-regular);
}

.cascader-demo__toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: var(--lx-space-sm);
}

.cascader-demo__toolbar [role='group'] {
  display: flex;
  flex-wrap: wrap;
  gap: var(--lx-space-sm);
}

.cascader-demo__settings {
  color: var(--lx-text-secondary-strong);
  font-size: 12px;
}

.cascader-demo__settings summary {
  width: fit-content;
  cursor: pointer;
}

.cascader-demo__toolbar button {
  min-height: 32px;
  padding-inline: 10px;
  border: 1px solid var(--lx-border);
  border-radius: var(--lx-radius-sm);
  background: var(--lx-bg-card);
  color: var(--lx-text-regular);
  cursor: pointer;
  font: inherit;
}

.cascader-demo__toolbar button[aria-pressed='true'],
.cascader-demo__toolbar button:hover {
  border-color: var(--lx-color-primary);
  color: var(--lx-color-primary);
}

.cascader-demo__toolbar button:focus-visible {
  outline: 2px solid var(--lx-color-primary);
  outline-offset: 2px;
}

@media (hover: none), (max-width: 640px) {
  .cascader-demo__toolbar button {
    min-height: 44px;
  }
}

.cascader-demo__field {
  display: grid;
  min-width: 0;
  gap: var(--lx-space-sm);
}

.cascader-demo__field label {
  color: var(--lx-text-label);
  font-size: 12px;
  font-weight: 500;
}

.cascader-demo__value,
.cascader-demo__status {
  margin: 0;
  color: var(--lx-text-secondary-strong);
  font-size: 12px;
  line-height: 18px;
  overflow-wrap: anywhere;
}
</style>
