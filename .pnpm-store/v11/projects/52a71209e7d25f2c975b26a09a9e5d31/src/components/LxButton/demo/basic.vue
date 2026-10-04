<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'

import LxButton from '../index.vue'
import type { LxButtonSize } from '../types'

const size = ref<LxButtonSize>('md')
const hudTheme = ref(false)

/** loading 生命周期：点击后 2.5s 内 spinner + 文案切换（标本"下发指令中..."场景） */
const submitting = ref(false)
/** 无文案切换的 loading：独立状态，避免与上面的文案切换示例互相锁定 */
const plainLoading = ref(false)
const lastAction = ref('点击按钮观察交互状态；演示数据仅存在于页面内存。')
const pendingTimers = new Set<ReturnType<typeof window.setTimeout>>()

function scheduleCompletion(complete: () => void) {
  const timer = window.setTimeout(() => {
    pendingTimers.delete(timer)
    complete()
  }, 2500)
  pendingTimers.add(timer)
}

onBeforeUnmount(() => {
  pendingTimers.forEach((timer) => window.clearTimeout(timer))
  pendingTimers.clear()
})

function handleSubmit() {
  if (submitting.value) return
  submitting.value = true
  lastAction.value = '指令下发中……（loading 期间点击被拦截）'
  scheduleCompletion(() => {
    submitting.value = false
    lastAction.value = '指令已下发：DEMO-2024-0917（模拟成功，未请求后端）'
  })
}

function handlePlainSubmit() {
  if (plainLoading.value) return
  plainLoading.value = true
  scheduleCompletion(() => {
    plainLoading.value = false
    lastAction.value = '无文案切换完成：spinner 原位旋转，文字全程保留'
  })
}
</script>

<template>
  <div class="lx-button-demo" :class="{ 'lx-theme-hud': hudTheme }">
    <div class="lx-button-demo__toolbar">
      <label>
        尺寸档
        <select v-model="size" aria-label="按钮尺寸档">
          <option value="sm">sm 28px</option>
          <option value="md">md 32px</option>
          <option value="lg">lg 40px</option>
        </select>
      </label>
      <label>
        <input v-model="hudTheme" type="checkbox" />
        HUD 深色主题
      </label>
    </div>

    <section class="lx-button-demo__panel" data-testid="matrix">
      <h4>推荐用法</h4>
      <div class="lx-button-demo__row">
        <LxButton :size="size" type="primary">主操作按钮</LxButton>
        <LxButton :size="size" type="default">次级线框按钮</LxButton>
        <LxButton :size="size" type="text">查看详情</LxButton>
      </div>
      <p class="lx-button-demo__tip">
        业务页面同屏最多展示一个主操作；行内查看操作使用文字形态。
      </p>
      <details class="lx-button-demo__variants">
        <summary>查看完整按钮类型矩阵</summary>
        <div class="lx-button-demo__row">
          <LxButton :size="size" type="danger">批量删除警情</LxButton>
          <LxButton :size="size" type="success">审批核准</LxButton>
          <LxButton :size="size" type="warning">告警待决</LxButton>
        </div>
      </details>
    </section>

    <section class="lx-button-demo__panel" data-testid="states">
      <h4>生命周期态</h4>
      <div class="lx-button-demo__row">
        <LxButton :size="size" type="primary" disabled>不可操作态</LxButton>
        <LxButton :size="size" type="default" disabled>次按钮禁用</LxButton>
        <LxButton :size="size" type="danger" disabled>不可操作态</LxButton>
        <LxButton :size="size" type="text" disabled>无权审批</LxButton>
      </div>
      <div class="lx-button-demo__row">
        <LxButton
          :size="size"
          type="primary"
          :loading="submitting"
          loading-text="下发指令中..."
          @click="handleSubmit"
        >
          确认下发指令
        </LxButton>
        <LxButton
          :size="size"
          type="default"
          :loading="plainLoading"
          @click="handlePlainSubmit"
        >
          指令下发
        </LxButton>
      </div>
    </section>

    <section class="lx-button-demo__panel" data-testid="icons">
      <h4>图标与块级</h4>
      <div class="lx-button-demo__row">
        <LxButton
          :size="size"
          type="primary"
          icon="plus"
          @click="lastAction = '新增警务服务'"
        >
          新增警务服务
        </LxButton>
        <LxButton :size="size" type="default" icon="download">
          导出涉案清单
        </LxButton>
        <LxButton :size="size" type="danger" icon="delete">批量删除</LxButton>
        <LxButton
          :size="size"
          type="default"
          icon="chevron-right"
          icon-position="right"
        >
          下一步
        </LxButton>
      </div>
      <LxButton :size="size" type="primary" block
        >块级主操作（撑满容器）</LxButton
      >
    </section>

    <section class="lx-button-demo__panel" data-testid="text-icons">
      <h4>文字形态 · 图标组合</h4>
      <div class="lx-button-demo__row">
        <LxButton :size="size" type="text" icon="search"> 检索详情 </LxButton>
        <LxButton
          :size="size"
          type="text"
          icon="chevron-right"
          icon-position="right"
        >
          进入档案
        </LxButton>
        <!-- 纯图标形态：必须提供 aria-label 作为可访问名称 -->
        <LxButton
          :size="size"
          type="text"
          icon="refresh"
          aria-label="刷新数据"
        />
        <LxButton :size="size" type="text" icon="close" aria-label="关闭筛选" />
      </div>
      <p class="lx-button-demo__tip">
        纯图标形态必须提供 aria-label（读屏可访问名称，悬停时同步以 tooltip
        展示给视觉用户）； 文字与图标组合时图标跟随文字色。
      </p>
      <div class="lx-button-demo__row">
        <!-- 危险文字形态：type="danger" + text 即标本"移出布控"行内高危操作 -->
        <LxButton :size="size" type="danger" text>移出布控</LxButton>
        <LxButton
          :size="size"
          type="danger"
          text
          icon="delete"
          aria-label="移出布控"
        />
        <LxButton :size="size" type="danger" text disabled>无权限移出</LxButton>
      </div>
      <div class="lx-button-demo__row">
        <!-- 文字形态语义色：success/warning 与 primary/danger 同构，行内轻量操作全语义覆盖 -->
        <LxButton :size="size" type="success" text>核准归档</LxButton>
        <LxButton :size="size" type="warning" text>催办预警</LxButton>
        <!-- 自定义文字色：仅文字形态生效，hover 浅底自动派生 -->
        <LxButton :size="size" type="text" text-color="#7c3aed"
          >自定义色链接</LxButton
        >
      </div>
      <p class="lx-button-demo__tip">
        危险行内操作用 type="danger" + text 组合：红字无底色，hover 浅红底；
        文字形态支持 primary/success/warning/danger 四种语义色与 textColor
        自定义色。
      </p>
    </section>

    <p class="lx-button-demo__status" aria-live="polite">{{ lastAction }}</p>
    <p class="lx-button-demo__note">
      拍板 #11 铁律：表格行内一律使用文字形态；同一屏主按钮（primary）上限 1
      个。
    </p>
  </div>
</template>

<style scoped>
.lx-button-demo {
  display: grid;
  gap: 16px;
  padding: 16px;
  background: var(--lx-bg-page);
  color: var(--lx-text-primary);
}

.lx-button-demo__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 20px;
  font-size: 13px;
}

.lx-button-demo__toolbar label {
  display: inline-flex;
  min-height: 32px;
  align-items: center;
  gap: 8px;
}

.lx-button-demo__toolbar select {
  min-height: 32px;
  border: 1px solid var(--lx-border);
  border-radius: var(--lx-radius-sm);
  background: var(--lx-bg-card);
  color: var(--lx-text-primary);
}

.lx-button-demo__panel {
  display: grid;
  min-width: 0;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--lx-border);
  border-radius: var(--lx-radius-sm);
  background: var(--lx-bg-card);
}

.lx-button-demo__panel h4 {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--lx-text-regular);
}

.lx-button-demo__variants {
  display: grid;
  gap: 12px;
}

.lx-button-demo__variants summary {
  display: flex;
  min-height: 32px;
  align-items: center;
  color: var(--lx-color-primary);
  cursor: pointer;
}

.lx-button-demo__variants summary:focus-visible {
  outline: 2px solid var(--lx-color-primary);
  outline-offset: 2px;
}

.lx-button-demo__row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.lx-button-demo__status,
.lx-button-demo__note,
.lx-button-demo__tip {
  margin: 0;
  font-size: 12px;
  color: var(--lx-text-secondary-strong);
}

.lx-button-demo__note {
  color: var(--lx-color-warning-strong);
}
</style>
