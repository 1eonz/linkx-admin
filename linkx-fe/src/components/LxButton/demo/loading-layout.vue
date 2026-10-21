<script setup lang="ts">
import { ref } from 'vue'

import LxButton from '../index.vue'
import type { LxButtonSize } from '../types'

const loading = ref(false)
const initiallyLoading = ref(true)
const hud = ref(false)
const size = ref<LxButtonSize>('md')
</script>

<template>
  <section
    class="lx-loading-demo"
    :class="{ 'lx-theme-hud': hud }"
    aria-label="按钮加载布局示例"
  >
    <div class="lx-loading-demo__controls">
      <label><input v-model="loading" type="checkbox" />切换加载布局</label>
      <label
        ><input v-model="initiallyLoading" type="checkbox" />初始加载状态</label
      >
      <label><input v-model="hud" type="checkbox" />加载布局深色主题</label>
      <label
        >尺寸<select v-model="size" aria-label="加载布局尺寸档">
          <option value="sm">sm</option>
          <option value="md">md</option>
          <option value="lg">lg</option>
        </select></label
      >
    </div>
    <div class="lx-loading-demo__row">
      <LxButton :size="size" :loading="loading" data-testid="layout-plain"
        >提交配置</LxButton
      >
      <LxButton
        :size="size"
        :loading="loading"
        loading-text="正在提交配置"
        data-testid="layout-text"
        >确认提交</LxButton
      >
      <LxButton
        :size="size"
        :loading="loading"
        icon="download"
        data-testid="layout-leading"
        >导出数据</LxButton
      >
      <LxButton
        :size="size"
        :loading="loading"
        icon="chevron-right"
        icon-position="right"
        data-testid="layout-trailing"
        >继续处理</LxButton
      >
      <LxButton :size="size" data-testid="layout-neighbor">取消</LxButton>
    </div>
    <div class="lx-loading-demo__constrained">
      <LxButton
        :size="size"
        :loading="loading"
        loading-text="正在保存跨部门协同配置，请稍候"
        data-testid="layout-long"
        >保存</LxButton
      >
      <LxButton
        :size="size"
        :loading="loading"
        loading-text="处理中"
        block
        data-testid="layout-block"
        >提交全部配置</LxButton
      >
    </div>
    <div class="lx-loading-demo__row">
      <LxButton
        :size="size"
        :loading="initiallyLoading"
        loading-text="正在初始化"
        data-testid="layout-initial"
        >初始化</LxButton
      >
      <LxButton
        :size="size"
        :loading="loading"
        icon="refresh"
        aria-label="刷新加载示例"
        data-testid="layout-icon"
      />
    </div>
  </section>
</template>

<style scoped>
.lx-loading-demo {
  display: grid;
  gap: var(--lx-space-md);
  min-width: 0;
  padding: var(--lx-space-md);
  background: var(--lx-bg-card);
  color: var(--lx-text-primary);
}

.lx-loading-demo__controls,
.lx-loading-demo__row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--lx-space-sm);
}

.lx-loading-demo__controls label {
  display: inline-flex;
  align-items: center;
  gap: var(--lx-space-xs);
  min-height: 44px;
}

.lx-loading-demo__controls select {
  min-height: 44px;
  border: 1px solid var(--lx-border);
  background: var(--lx-bg-card);
  color: var(--lx-text-primary);
}

.lx-loading-demo__constrained {
  display: grid;
  justify-items: start;
  width: 220px;
  max-width: 100%;
  gap: var(--lx-space-sm);
}
</style>
