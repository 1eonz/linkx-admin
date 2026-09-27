<script setup lang="ts">
import { ref } from 'vue'

import LxBreadcrumb from '../index.vue'
import type { LxBreadcrumbItem } from '../types'

const items: LxBreadcrumbItem[] = [
  { title: '首页', to: 'https://example.test/' },
  { title: '基础数据', to: 'https://example.test/baseData' },
  { title: '地图配置' },
]
const lastSelection = ref('当前页面：地图配置')

function handleSelect(item: LxBreadcrumbItem, event: MouseEvent) {
  event.preventDefault()
  lastSelection.value = `已选择：${item.title}（由宿主处理路由）`
}
</script>

<template>
  <section class="breadcrumb-demo">
    <LxBreadcrumb :items="items" separator="›" @select="handleSelect">
      <span class="breadcrumb-demo__environment">本地预览</span>
    </LxBreadcrumb>
    <p
      class="breadcrumb-demo__status"
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
  gap: 16px;
  padding: 16px;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  background: var(--el-bg-color);
}

.breadcrumb-demo__environment,
.breadcrumb-demo__status {
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.breadcrumb-demo__environment {
  padding-inline-start: 8px;
}

.breadcrumb-demo__status {
  min-height: 20px;
  margin: 0;
  line-height: 1.5;
}
</style>
