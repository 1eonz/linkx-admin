<script setup lang="ts">
import { computed, ref } from 'vue'

import LxTabsBar from '../index.vue'
import type { LxTabItem } from '../types'

const tabs = ref<LxTabItem[]>([
  { key: 'overview', title: '系统总览' },
  { key: 'tags', title: '群组标签', closable: true },
  { key: 'archive', title: '活动归档', closable: true },
  {
    key: 'long-name',
    title: '过长的页签标题会在固定宽度内截断',
    closable: true,
  },
])
const activeKey = ref('overview')
const lastAction = ref('当前显示：系统总览')
const activeTitle = computed(
  () =>
    tabs.value.find((tab) => tab.key === activeKey.value)?.title ??
    '无打开页面',
)
let nextTab = 1

function selectTab(key: string) {
  activeKey.value = key
  lastAction.value = `当前显示：${activeTitle.value}`
}

function closeTab(key: string) {
  const index = tabs.value.findIndex((tab) => tab.key === key)
  if (index < 0) return
  tabs.value.splice(index, 1)
  if (activeKey.value === key) {
    const next = tabs.value[Math.min(index, tabs.value.length - 1)]
    activeKey.value = next?.key ?? ''
  }
  lastAction.value = `已关闭：${key}`
}

function addTab() {
  const key = `preview-${nextTab++}`
  tabs.value.push({ key, title: `预览页面 ${nextTab - 1}`, closable: true })
  selectTab(key)
}
</script>

<template>
  <section class="tabs-demo">
    <LxTabsBar
      v-model="activeKey"
      :tabs="tabs"
      @update:model-value="selectTab"
      @close="closeTab"
      @context-menu="
        lastAction = `右键：${$event.key}（${Math.round($event.x)}, ${Math.round($event.y)}）`
      "
    >
      <template #extra>
        <button class="tabs-demo__add" type="button" @click="addTab">
          新建页签
        </button>
      </template>
    </LxTabsBar>

    <div class="tabs-demo__content">
      <strong>{{ activeTitle }}</strong>
      <p
        class="tabs-demo__status"
        role="status"
        aria-live="polite"
        data-testid="last-action"
      >
        {{ lastAction }}
      </p>
    </div>
  </section>
</template>

<style scoped>
.tabs-demo {
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--lx-border);
  border-radius: 4px;
  background: var(--lx-bg-card);
}

.tabs-demo__add {
  min-height: 32px;
  padding: 0 10px;
  border: 1px solid var(--lx-border);
  border-radius: var(--lx-radius-sm);
  background: transparent;
  color: var(--lx-text-regular);
  cursor: pointer;
  white-space: nowrap;
}

.tabs-demo__add:focus-visible {
  outline: 2px solid var(--lx-color-primary);
  outline-offset: 2px;
}

.tabs-demo__content {
  display: grid;
  min-height: 112px;
  align-content: center;
  gap: 8px;
  padding: var(--lx-space-lg);
  color: var(--lx-text-primary);
}

.tabs-demo__status {
  min-height: 20px;
  margin: 0;
  color: var(--lx-text-secondary);
  font-size: 13px;
}
</style>
