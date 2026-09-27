<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElConfigProvider } from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import { LxPagination } from '../../../index'

const page = ref(4)
const pageSize = ref(10)
const total = 365
const layoutMode = ref<'default' | 'compact'>('default')
const background = ref(false)
const autoReset = ref(true)
const autoScroll = ref(false)
const feedback = ref('请选择页码或每页条数')

const layout = computed(() =>
  layoutMode.value === 'compact'
    ? 'total, prev, pager, next, jumper'
    : undefined,
)

function onChange(currentPage: number, currentPageSize: number) {
  feedback.value = `已切换到第 ${currentPage} 页，每页 ${currentPageSize} 条`
}
</script>

<template>
  <ElConfigProvider :locale="zhCn">
    <div class="lx-pagination-demo">
      <div class="lx-pagination-demo__controls">
        <label>
          布局
          <select v-model="layoutMode" aria-label="分页布局">
            <option value="default">默认布局</option>
            <option value="compact">自定义布局（含跳页）</option>
          </select>
        </label>
        <label>
          <input v-model="background" type="checkbox" />
          背景样式
        </label>
        <label>
          <input v-model="autoReset" type="checkbox" />
          切换条数时回到第一页
        </label>
        <label>
          <input v-model="autoScroll" type="checkbox" />
          切换后滚动到页面顶部
        </label>
      </div>

      <div
        class="lx-pagination-demo__region"
        role="region"
        tabindex="0"
        aria-label="分页控件，可横向滚动查看全部选项"
      >
        <LxPagination
          v-model:page="page"
          v-model:page-size="pageSize"
          :total="total"
          :layout="layout"
          :background="background"
          :auto-reset="autoReset"
          :auto-scroll="autoScroll"
          @change="onChange"
        />
      </div>

      <p class="lx-pagination-demo__feedback" role="status" aria-live="polite">
        第 {{ page }} 页，每页 {{ pageSize }} 条；{{ feedback }}
      </p>
    </div>
  </ElConfigProvider>
</template>

<style scoped>
.lx-pagination-demo {
  display: grid;
  gap: 12px;
  color: var(--lx-text-regular);
}

.lx-pagination-demo__controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 16px;
  font-size: 13px;
}

.lx-pagination-demo__controls label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 32px;
}

.lx-pagination-demo__controls select {
  min-height: 32px;
  max-width: 100%;
  padding: 0 8px;
  border: 1px solid var(--lx-border);
  border-radius: 4px;
  background: var(--lx-bg-card);
  color: var(--lx-text-regular);
}

.lx-pagination-demo__controls input {
  width: 16px;
  height: 16px;
  accent-color: var(--lx-color-primary);
}

.lx-pagination-demo__region {
  min-width: 0;
  max-width: 100%;
  overflow-x: auto;
  padding: 4px 2px;
  overscroll-behavior-inline: contain;
}

.lx-pagination-demo__region:focus-visible {
  outline: 2px solid var(--lx-color-primary);
  outline-offset: 2px;
}

.lx-pagination-demo__region :deep(.lx-pagination) {
  width: max-content;
  min-width: 100%;
}

.lx-pagination-demo__feedback {
  margin: 0;
  color: var(--lx-text-secondary);
  font-size: 12px;
}

@media (prefers-reduced-motion: reduce) {
  .lx-pagination-demo__region {
    scroll-behavior: auto;
  }
}
</style>
