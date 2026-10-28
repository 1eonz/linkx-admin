<script setup lang="ts">
import { nextTick, ref } from 'vue'

import LxButton from '../../LxButton/index.vue'
import LxBreadcrumb from '../index.vue'
import type { LxBreadcrumbItem } from '../types'

const initialItems: LxBreadcrumbItem[] = [
  { title: '首页', to: '#breadcrumb-home' },
  { title: '基础数据', to: '#breadcrumb-base-data' },
  { title: '地图配置' },
]
const items = ref<LxBreadcrumbItem[]>([...initialItems])
const lastSelection = ref('当前页面：地图配置')
const hudTheme = ref(false)
const statusElement = ref<HTMLParagraphElement>()

function resetPath() {
  items.value = [...initialItems]
  lastSelection.value = '当前页面：地图配置'
}

function showLongPath() {
  items.value = [
    ...initialItems.slice(0, 2),
    { title: '跨区域协同值班与长名称业务配置中心', to: '#breadcrumb-center' },
    { title: '当前地图配置与跨区域协同值班的完整页面名称' },
  ]
  lastSelection.value = '长路径示例：标题可通过悬停查看完整名称'
}

function clearPath() {
  items.value = []
  lastSelection.value = '暂无路径，可恢复默认路径'
}

function handleSelect(item: LxBreadcrumbItem, event: MouseEvent) {
  // 仅接管普通同页导航，保留修饰键和浏览器原生新标签语义。
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  )
    return
  event.preventDefault()
  const index = items.value.indexOf(item)
  if (index < 0) return
  items.value = items.value.slice(0, index + 1)
  lastSelection.value = `当前页面：${item.title}（示例宿主已更新路径）`
  // 被激活的链接会变成当前位置文本，由示例宿主将焦点移到结果，避免落回页面根部。
  void nextTick(() => statusElement.value?.focus())
}
</script>

<template>
  <section class="breadcrumb-demo" :class="{ 'lx-theme-hud': hudTheme }">
    <div class="breadcrumb-demo__controls" aria-label="面包屑示例设置">
      <LxButton
        size="sm"
        :aria-pressed="hudTheme"
        @click="hudTheme = !hudTheme"
        >{{ hudTheme ? '浅色' : 'HUD 深色' }}</LxButton
      >
      <LxButton size="sm" @click="showLongPath">长路径</LxButton>
      <LxButton size="sm" :disabled="!items.length" @click="clearPath"
        >清空路径</LxButton
      >
      <LxButton size="sm" @click="resetPath">恢复默认路径</LxButton>
    </div>
    <!-- 避免文档站在捕获阶段接管演示链接；实际 SPA 宿主使用自身 Router。 -->
    <LxBreadcrumb
      class="vp-raw"
      :items="items"
      separator="›"
      @select="handleSelect"
    >
      <span class="breadcrumb-demo__environment">{{
        items.length ? '本地预览' : '尚未定位页面'
      }}</span>
    </LxBreadcrumb>
    <p
      ref="statusElement"
      class="breadcrumb-demo__status"
      tabindex="-1"
      role="status"
      aria-live="polite"
      data-testid="last-selection"
    >
      {{ lastSelection }}
    </p>
  </section>
</template>

<style scoped>
.breadcrumb-demo {
  display: grid;
  min-width: 0;
  gap: var(--lx-space-md);
  padding: var(--lx-space-md);
  border: 1px solid var(--lx-border);
  border-radius: 4px;
  background: var(--lx-bg-card);
  color: var(--lx-text-regular);
}

.breadcrumb-demo__controls {
  display: flex;
  flex-wrap: wrap;
  gap: var(--lx-space-sm);
}

.breadcrumb-demo__environment,
.breadcrumb-demo__status {
  color: var(--lx-text-secondary);
  font-size: 13px;
}

.breadcrumb-demo__status {
  min-height: 20px;
  margin: 0;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.breadcrumb-demo__status:focus-visible {
  outline: 2px solid var(--lx-color-primary);
  outline-offset: 2px;
}
</style>
