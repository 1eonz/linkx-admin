<script setup lang="ts">
import { ref } from 'vue'

import LxPageCard from '../index.vue'

const loading = ref(false)
const bordered = ref(true)
const bodyPadding = ref(true)
const hudTheme = ref(false)
const lastAction = ref('页面状态由宿主持有；示例不会请求后端。')
</script>

<template>
  <section class="page-card-demo" :class="{ 'lx-theme-hud': hudTheme }">
    <div class="page-card-demo__controls">
      <label><input v-model="loading" type="checkbox" />加载遮罩</label>
      <label><input v-model="bordered" type="checkbox" />显示边框</label>
      <label><input v-model="bodyPadding" type="checkbox" />内容内边距</label>
      <label><input v-model="hudTheme" type="checkbox" />HUD 深色主题</label>
    </div>

    <LxPageCard
      title="接口运行概况"
      subtitle="最近一次状态采集：09:30"
      :loading="loading"
      :bordered="bordered"
      :body-padding="bodyPadding"
    >
      <template #header-extra>
        <button
          class="page-card-demo__refresh"
          type="button"
          @click="lastAction = '概况已刷新（内存示例）'"
        >
          刷新概况
        </button>
      </template>

      <div class="page-card-demo__body">
        <div><span>在线节点</span><strong>18 / 20</strong></div>
        <div><span>待处理告警</span><strong>3 项</strong></div>
      </div>

      <template #footer>
        <span>数据来源：本地示例</span>
        <button
          class="page-card-demo__refresh"
          type="button"
          @click="lastAction = '已打开节点列表（本地示例）'"
        >
          查看节点
        </button>
      </template>
    </LxPageCard>

    <p
      class="page-card-demo__status"
      role="status"
      aria-live="polite"
      data-testid="last-action"
    >
      {{ lastAction }}
    </p>
  </section>
</template>

<style scoped>
.page-card-demo {
  display: grid;
  min-width: 0;
  gap: 14px;
  padding: 16px;
  border: 1px solid var(--lx-border);
  border-radius: 4px;
  background: var(--lx-bg-card);
  color: var(--lx-text-regular);
}

.page-card-demo__controls {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
}

.page-card-demo__controls label {
  display: inline-flex;
  min-height: 32px;
  align-items: center;
  gap: 8px;
  color: var(--lx-text-secondary);
  font-size: 13px;
}

.page-card-demo__controls input {
  accent-color: var(--lx-color-primary);
}

.page-card-demo__refresh {
  min-height: 36px;
  padding: 0 10px;
  border: 1px solid var(--lx-border);
  border-radius: var(--lx-radius-sm);
  background: transparent;
  color: var(--lx-color-primary);
  cursor: pointer;
}

.page-card-demo__refresh:focus-visible {
  outline: 2px solid var(--lx-color-primary);
  outline-offset: 2px;
}

.page-card-demo__body {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.page-card-demo__body div {
  display: grid;
  gap: 6px;
}

.page-card-demo__body span,
.page-card-demo__status,
.page-card-demo :deep(.lx-page-card__footer) {
  color: var(--lx-text-secondary);
  font-size: 13px;
}

.page-card-demo__body strong {
  color: var(--lx-text-primary);
  font-size: 18px;
}

.page-card-demo__status {
  min-height: 20px;
  margin: 0;
}

@media (max-width: 480px) {
  .page-card-demo {
    padding: 12px;
  }

  .page-card-demo__body {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
