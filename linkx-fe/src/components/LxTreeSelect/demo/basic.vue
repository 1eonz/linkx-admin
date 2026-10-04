<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import en from 'element-plus/es/locale/lang/en'

import { LxTreeSelect, type LxTreeSelectValue } from '../../../index'

const sourceTree = [
  {
    id: 'hz',
    name: '杭州市公安局',
    children: [
      {
        id: 'bj',
        name: '滨江分局',
        children: [{ id: 'bj-1', name: '长河派出所' }],
      },
      {
        id: 'gx',
        name: '高新园区分局',
        children: [{ id: 'gx-1', name: '科技城派出所' }],
      },
      { id: 'locked', name: '离线专网（禁用）', disabled: true },
    ],
  },
]

const selected = ref<LxTreeSelectValue | undefined>('bj')
const multiple = ref(false)
const empty = ref(false)
const loading = ref(false)
const failed = ref(false)
const retryCount = ref(0)
const hud = ref(false)
const englishFooter = ref(false)
let loadTimer: number | undefined
const root =
  typeof document === 'undefined' ? undefined : document.documentElement
const originalDark = root?.classList.contains('dark') ?? false
const originalHud = root?.classList.contains('lx-theme-hud') ?? false

const tree = computed(() => (empty.value ? [] : sourceTree))

function setHud(enabled: boolean): void {
  if (!root) return
  root.classList.toggle('dark', enabled || originalDark)
  root.classList.toggle('lx-theme-hud', enabled)
}

watch(hud, setHud)

function toggleMultiple(): void {
  multiple.value = !multiple.value
  selected.value = multiple.value ? ['bj-1'] : 'bj-1'
}

function toggleLoading(): void {
  failed.value = false
  loading.value = true
  window.clearTimeout(loadTimer)
  loadTimer = window.setTimeout(() => (loading.value = false), 1400)
}

function toggleFailure(): void {
  failed.value = !failed.value
}

function retryTreeLoad(): void {
  retryCount.value += 1
  failed.value = false
  toggleLoading()
}

onBeforeUnmount(() => {
  window.clearTimeout(loadTimer)
  root?.classList.toggle('dark', originalDark)
  root?.classList.toggle('lx-theme-hud', originalHud)
})
</script>

<template>
  <section class="lx-tree-select-demo">
    <div class="lx-tree-select-demo__field">
      <label for="tree-select-demo-organization">组织机构</label>
      <LxTreeSelect
        id="tree-select-demo-organization"
        v-model="selected"
        :data="tree"
        node-key="id"
        value-key="id"
        :props="{ label: 'name', children: 'children', disabled: 'disabled' }"
        :default-expanded-keys="['hz']"
        filterable
        clearable
        :multiple="multiple"
        :locale="englishFooter ? en : undefined"
        collapse-tags
        :loading="loading"
        :error="failed ? '组织目录加载失败，请重试。' : false"
        retryable
        placeholder="选择组织节点"
        @retry="retryTreeLoad"
      />
    </div>
    <details class="lx-tree-select-demo__settings">
      <summary>演示状态</summary>
      <div class="lx-tree-select-demo__toolbar">
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
          <button type="button" @click="empty = !empty">
            {{ empty ? '返回组织目录' : '查看空目录' }}
          </button>
          <button type="button" @click="toggleLoading">模拟加载</button>
          <button type="button" @click="toggleFailure">
            {{ failed ? '清除加载失败' : '模拟加载失败' }}
          </button>
        </div>
        <div role="group" aria-label="外观设置">
          <label><input v-model="hud" type="checkbox" /> HUD 深色</label>
          <label
            ><input v-model="englishFooter" type="checkbox" /> English
            locale</label
          >
        </div>
      </div>
    </details>
    <output class="lx-tree-select-demo__value" aria-live="polite">
      当前值：{{ JSON.stringify(selected) }}
    </output>
    <output class="lx-tree-select-demo__retry-count" aria-live="polite">
      重试次数：{{ retryCount }}
    </output>
  </section>
</template>

<style scoped>
.lx-tree-select-demo {
  box-sizing: border-box;
  display: grid;
  gap: var(--lx-space-md);
  width: 100%;
  max-width: 520px;
  min-width: 0;
  padding: var(--lx-space-lg);
  border: 1px solid var(--lx-border);
  border-radius: var(--lx-radius-md);
  background: var(--lx-bg-card);
  color: var(--lx-text-regular);
}

.lx-tree-select-demo__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--lx-space-sm);
}

.lx-tree-select-demo__toolbar [role='group'] {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--lx-space-sm);
}

.lx-tree-select-demo__settings {
  color: var(--lx-text-secondary-strong);
  font-size: 12px;
}

.lx-tree-select-demo__settings summary {
  width: fit-content;
  cursor: pointer;
}

.lx-tree-select-demo__toolbar button {
  min-height: 32px;
  padding-inline: 10px;
  border: 1px solid var(--lx-border);
  border-radius: var(--lx-radius-sm);
  background: var(--lx-bg-card);
  color: var(--lx-text-regular);
  cursor: pointer;
  font: inherit;
}

.lx-tree-select-demo__toolbar button[aria-pressed='true'],
.lx-tree-select-demo__toolbar button:hover {
  border-color: var(--lx-color-primary);
  color: var(--lx-color-primary);
}

.lx-tree-select-demo__toolbar label {
  display: inline-flex;
  align-items: center;
  gap: var(--lx-space-xs);
}

.lx-tree-select-demo__field {
  display: grid;
  min-width: 0;
  gap: var(--lx-space-sm);
}

.lx-tree-select-demo__field > label {
  color: var(--lx-text-label);
  font-size: 12px;
  font-weight: 500;
}

.lx-tree-select-demo__toolbar button:focus-visible,
.lx-tree-select-demo__toolbar input:focus-visible {
  outline: 2px solid var(--lx-color-primary);
  outline-offset: 2px;
}

@media (hover: none), (max-width: 640px) {
  .lx-tree-select-demo__toolbar button {
    min-height: 44px;
  }
}

.lx-tree-select-demo__value {
  color: var(--lx-text-secondary-strong);
  font-size: 12px;
}

.lx-tree-select-demo__retry-count {
  color: var(--lx-text-secondary-strong);
  font-size: 12px;
}
</style>
