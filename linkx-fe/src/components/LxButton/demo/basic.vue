<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

import LxButton from '../index.vue'
import type { LxButtonSize } from '../types'

const size = ref<LxButtonSize>('md')
const hudTheme = ref(false)

/** loading 生命周期：点击后 2.5s 内 spinner + 文案切换（标本"下发指令中..."场景） */
const submitting = ref(false)
/** 无文案切换的 loading：独立状态，避免与上面的文案切换示例互相锁定 */
const plainLoading = ref(false)
const iconLoading = ref(false)
const recommendationStatus = ref('')
const lifecycleStatus = ref('')
const recoveryStatus = ref('')
const recoveryAvailable = ref(false)
const recoveryLoading = ref(false)
const iconSectionStatus = ref('')
const iconStatus = ref('')
const refreshCount = ref(0)
const blockExampleOpen = ref(false)
const pendingTimers = new Set<ReturnType<typeof window.setTimeout>>()
let anchorFocusFrame: number | undefined

function focusAnchorTarget(event: MouseEvent) {
  if (
    event.button !== 0 ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    event.shiftKey
  ) {
    return
  }

  const source = event.target
  if (!(source instanceof Element)) return

  const anchor = source.closest<HTMLAnchorElement>('a[href^="#"]')
  if (
    !anchor ||
    (anchor.target && anchor.target.toLowerCase() !== '_self') ||
    anchor.hasAttribute('download')
  ) {
    return
  }

  const href = anchor?.getAttribute('href')
  if (!href || href === '#') return

  const target = document.getElementById(decodeURIComponent(href.slice(1)))
  if (
    !target ||
    (target.id !== 'lx-button-demo-anchor' &&
      !target.classList.contains('lx-button-demo__anchor'))
  ) {
    return
  }

  if (anchorFocusFrame !== undefined)
    window.cancelAnimationFrame(anchorFocusFrame)
  anchorFocusFrame = window.requestAnimationFrame(() => {
    anchorFocusFrame = undefined
    // VitePress 的片段路由使用 window.scrollTo，不会读取目标的 scroll-margin。
    target.scrollIntoView({ block: 'start', behavior: 'auto' })
    target.focus({ preventScroll: true })
  })
}

function scheduleCompletion(complete: () => void, delay = 2500) {
  const timer = window.setTimeout(() => {
    pendingTimers.delete(timer)
    complete()
  }, delay)
  pendingTimers.add(timer)
}

onBeforeUnmount(() => {
  pendingTimers.forEach((timer) => window.clearTimeout(timer))
  pendingTimers.clear()
  document.removeEventListener('click', focusAnchorTarget, true)
  if (anchorFocusFrame !== undefined)
    window.cancelAnimationFrame(anchorFocusFrame)
})

onMounted(() => document.addEventListener('click', focusAnchorTarget, true))

function handleSubmit() {
  if (submitting.value) return
  submitting.value = true
  lifecycleStatus.value = '指令下发中……（loading 期间点击被拦截）'
  scheduleCompletion(() => {
    submitting.value = false
    lifecycleStatus.value = '指令已下发：DEMO-2024-0917（模拟成功，未请求后端）'
  })
}

function handlePlainSubmit() {
  if (plainLoading.value) return
  plainLoading.value = true
  lifecycleStatus.value = '指令正在下发……（按钮文字保持不变）'
  scheduleCompletion(() => {
    plainLoading.value = false
    lifecycleStatus.value = '无文案切换完成：spinner 原位旋转，文字全程保留'
  })
}

function handleFailureDemo() {
  if (recoveryLoading.value) return
  recoveryAvailable.value = true
  recoveryStatus.value = '模拟失败：网络不可用，指令记录已保留，可重试。'
}

function handleRetryDemo() {
  if (!recoveryAvailable.value || recoveryLoading.value) return
  recoveryLoading.value = true
  recoveryStatus.value = '正在重试指令……'
  scheduleCompletion(() => {
    recoveryLoading.value = false
    recoveryAvailable.value = false
    recoveryStatus.value = '重试成功：模拟指令已恢复，未请求后端。'
  }, 600)
}

function handleRefresh() {
  refreshCount.value += 1
  iconStatus.value = `已刷新数据（第 ${refreshCount.value} 次）`
}

function handleAddService() {
  iconSectionStatus.value = '已演示新增警务服务；仅更新本地状态，未请求后端。'
}

function handleIconRefresh() {
  if (iconLoading.value) return
  iconLoading.value = true
  iconStatus.value = '图标数据刷新中……（loading 期间提示浮层已关闭）'
  scheduleCompletion(() => {
    iconLoading.value = false
    iconStatus.value = '图标数据刷新完成（模拟成功，未请求后端）'
  })
}

function handleDangerExample() {
  recommendationStatus.value =
    '已演示“批量删除警情”点击反馈；仅更新本地状态，未执行删除。真实业务需由宿主先确认，失败时保留数据并允许重试。'
}

function handleBlockExampleToggle(event: Event) {
  blockExampleOpen.value = (event.currentTarget as HTMLDetailsElement).open
}
</script>

<template>
  <div class="lx-button-demo" :class="{ 'lx-theme-hud': hudTheme }">
    <h2
      id="lx-button-demo-anchor"
      class="lx-button-demo__title lx-button-demo__anchor"
      tabindex="-1"
    >
      完整交互演示
    </h2>
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
        组件示例深色预览（HUD）
      </label>
    </div>

    <section class="lx-button-demo__panel" data-testid="matrix">
      <h3>推荐用法</h3>
      <div class="lx-button-demo__row">
        <LxButton v-if="!blockExampleOpen" :size="size" type="primary">
          主操作按钮
        </LxButton>
        <span v-else class="lx-button-demo__alternative-note">
          块级主操作已展开，本区主操作暂隐藏。
        </span>
        <LxButton :size="size" type="default">次级线框按钮</LxButton>
        <LxButton :size="size" type="text">查看详情</LxButton>
      </div>
      <p class="lx-button-demo__tip">
        业务页面同屏最多展示一个主操作；行内查看操作使用文字形态。
      </p>
      <details class="lx-button-demo__variants">
        <summary>完整按钮类型矩阵：高危、启用与告警</summary>
        <p class="lx-button-demo__tip">
          删除等高危操作先由宿主确认，再调用请求；失败时保留数据并提示重试。本例仅更新本地说明，不执行删除。
        </p>
        <div class="lx-button-demo__row">
          <LxButton :size="size" type="danger" @click="handleDangerExample">
            批量删除警情
          </LxButton>
          <LxButton :size="size" type="success">启用区域监控</LxButton>
          <LxButton :size="size" type="warning">告警待决</LxButton>
        </div>
      </details>
      <p
        class="lx-button-demo__status"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {{ recommendationStatus }}
      </p>
    </section>

    <section class="lx-button-demo__panel" data-testid="states">
      <h3>生命周期态</h3>
      <div class="lx-button-demo__row">
        <LxButton :size="size" type="primary" disabled>主按钮禁用</LxButton>
        <LxButton :size="size" type="default" disabled>次按钮禁用</LxButton>
        <LxButton :size="size" type="danger" disabled>高危按钮禁用</LxButton>
        <LxButton
          :size="size"
          type="text"
          disabled
          aria-describedby="lx-button-demo-disabled-reason"
        >
          无权审批
        </LxButton>
      </div>
      <p id="lx-button-demo-disabled-reason" class="lx-button-demo__tip">
        禁用原因由宿主通过可见说明和 aria-describedby
        提供；本例表示当前账号没有审批权限。
      </p>
      <div class="lx-button-demo__row">
        <LxButton
          :size="size"
          type="default"
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
      <p
        class="lx-button-demo__status"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {{ lifecycleStatus }}
      </p>
      <div class="lx-button-demo__recovery" data-testid="failure-retry">
        <div class="lx-button-demo__row">
          <LxButton
            :size="size"
            type="default"
            :disabled="recoveryLoading"
            @click="handleFailureDemo"
          >
            模拟请求失败
          </LxButton>
          <LxButton
            :size="size"
            type="primary"
            :loading="recoveryLoading"
            :disabled="!recoveryAvailable || recoveryLoading"
            @click="handleRetryDemo"
          >
            重试下发
          </LxButton>
        </div>
        <p class="lx-button-demo__tip">
          失败与恢复仅更新本地状态，不请求后端。
        </p>
        <p
          class="lx-button-demo__status"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {{ recoveryStatus }}
        </p>
      </div>
    </section>

    <details class="lx-button-demo__advanced" data-testid="advanced-examples">
      <summary>更多示例：图标、权限反馈与行内操作</summary>
      <p class="lx-button-demo__tip">
        页面主操作使用实底形态；表格行内操作使用文字形态。高危操作由宿主先确认，再调用请求；失败时保留数据并提供重试。
      </p>

      <nav class="lx-button-demo__section-nav" aria-label="更多按钮示例目录">
        <a href="#lx-button-demo-icons">图标与块级</a>
        <a href="#lx-button-demo-icon-actions">纯图标操作</a>
        <a href="#lx-button-demo-permission-actions">权限反馈</a>
        <a href="#lx-button-demo-row-actions">行内操作</a>
      </nav>

      <section
        id="lx-button-demo-icons"
        class="lx-button-demo__panel lx-button-demo__anchor"
        data-testid="icons"
        tabindex="-1"
        aria-labelledby="lx-button-demo-icons-heading"
      >
        <h3 id="lx-button-demo-icons-heading">图标与块级</h3>
        <div class="lx-button-demo__row">
          <LxButton
            :size="size"
            type="default"
            icon="plus"
            @click="handleAddService"
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
        <p
          class="lx-button-demo__status"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {{ iconSectionStatus }}
        </p>
        <details
          class="lx-button-demo__variants"
          data-testid="block-primary-example"
          @toggle="handleBlockExampleToggle"
        >
          <summary>查看块级主操作示例（与上方主操作二选一）</summary>
          <p class="lx-button-demo__tip">
            块级主操作适用于独立的页面主操作区域，不与上方主操作同时展示。
          </p>
          <LxButton :size="size" type="primary" block>
            块级主操作（撑满容器）
          </LxButton>
        </details>
      </section>

      <section class="lx-button-demo__panel" data-testid="text-icons">
        <h3>文字形态 · 图标组合</h3>
        <div
          class="lx-button-demo__group"
          role="group"
          aria-labelledby="lx-button-demo-text-actions"
        >
          <p
            id="lx-button-demo-text-actions"
            class="lx-button-demo__group-title lx-button-demo__anchor"
          >
            带文字图标
          </p>
          <div class="lx-button-demo__row">
            <LxButton :size="size" type="text" icon="search">
              检索详情
            </LxButton>
            <LxButton
              :size="size"
              type="text"
              icon="chevron-right"
              icon-position="right"
            >
              进入档案
            </LxButton>
          </div>
        </div>
        <div
          class="lx-button-demo__group"
          role="group"
          aria-labelledby="lx-button-demo-icon-actions"
        >
          <p
            id="lx-button-demo-icon-actions"
            class="lx-button-demo__group-title lx-button-demo__anchor"
            tabindex="-1"
          >
            纯图标操作
          </p>
          <div class="lx-button-demo__row">
            <!-- 默认纯图标按钮按尺寸档保持正方形，必须提供可访问名称。 -->
            <span class="lx-button-demo__icon-action">
              <LxButton
                :size="size"
                type="default"
                icon="refresh"
                aria-label="刷新数据"
                @click="handleRefresh"
              />
              <span class="lx-button-demo__icon-action-label" aria-hidden="true"
                >刷新数据</span
              >
            </span>
            <!-- 文字纯图标用于行内轻量操作，仍需提供可访问名称。 -->
            <span class="lx-button-demo__icon-action">
              <LxButton
                :size="size"
                type="text"
                icon="refresh"
                aria-label="文字刷新"
              />
              <span class="lx-button-demo__icon-action-label" aria-hidden="true"
                >文字刷新</span
              >
            </span>
            <span class="lx-button-demo__icon-action">
              <LxButton
                :size="size"
                type="text"
                icon="close"
                aria-label="关闭筛选"
              />
              <span class="lx-button-demo__icon-action-label" aria-hidden="true"
                >关闭筛选</span
              >
            </span>
            <span class="lx-button-demo__icon-action">
              <LxButton
                :size="size"
                type="default"
                icon="refresh"
                aria-label="刷新图标数据"
                :loading="iconLoading"
                @click="handleIconRefresh"
              />
              <span class="lx-button-demo__icon-action-label" aria-hidden="true"
                >刷新图标数据</span
              >
            </span>
          </div>
        </div>
        <div
          class="lx-button-demo__group"
          role="group"
          aria-labelledby="lx-button-demo-permission-actions"
        >
          <p
            id="lx-button-demo-permission-actions"
            class="lx-button-demo__group-title lx-button-demo__anchor"
            tabindex="-1"
          >
            权限反馈
          </p>
          <div class="lx-button-demo__row">
            <span class="lx-button-demo__permission-example">
              <LxButton
                :size="size"
                type="default"
                icon="refresh"
                aria-label="无权限刷新图标"
                aria-describedby="lx-button-demo-permission-reason"
                disabled
              />
              <span id="lx-button-demo-permission-reason"
                >权限不足，暂不可刷新</span
              >
            </span>
          </div>
        </div>
        <p class="lx-button-demo__tip">
          纯图标按钮须提供
          aria-label；桌面可用悬停或键盘提示，窄屏需显示短标签。
        </p>
        <p
          class="lx-button-demo__status"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {{ iconStatus }}
        </p>
        <div
          id="lx-button-demo-row-actions"
          class="lx-button-demo__row lx-button-demo__anchor"
          role="group"
          aria-label="行内操作"
          tabindex="-1"
        >
          <!-- 危险文字形态：type="danger" + text 即标本"移出布控"行内高危操作 -->
          <LxButton :size="size" type="danger" text>移出布控</LxButton>
          <LxButton
            :size="size"
            type="danger"
            text
            icon="delete"
            aria-label="移出布控"
          />
          <LxButton :size="size" type="danger" text disabled
            >无权限移出</LxButton
          >
        </div>
        <div class="lx-button-demo__row">
          <!-- 绿色仅用于启用类动作；文字形态保持轻量外观。 -->
          <LxButton :size="size" type="success" text>启用区域监控</LxButton>
          <LxButton :size="size" type="warning" text>催办预警</LxButton>
          <!-- 自定义文字色：仅文字形态生效，hover 浅底自动派生 -->
          <LxButton
            :size="size"
            type="text"
            :text-color="hudTheme ? '#7dd3fc' : '#00508f'"
            >自定义色链接</LxButton
          >
        </div>
        <p class="lx-button-demo__tip">
          危险行内操作用 type="danger" + text；success 仅用于启用操作。
          确认和失败恢复由宿主负责。
        </p>
      </section>
    </details>

    <p class="lx-button-demo__note">
      表格行内操作使用文字形态；同一业务区域最多保留一个主操作按钮。
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
  min-height: 44px;
  align-items: center;
  gap: 8px;
}

.lx-button-demo__title {
  width: fit-content;
  max-width: 100%;
  margin: 0;
  padding: 0;
  border: 0;
  font-size: 16px;
  font-weight: 600;
  line-height: 24px;
}

.lx-button-demo__toolbar input[type='checkbox'] {
  width: 18px;
  height: 18px;
  margin: 0;
  accent-color: var(--lx-color-primary);
  cursor: pointer;
}

.lx-button-demo__toolbar input[type='checkbox']:focus-visible {
  outline: 2px solid var(--lx-color-primary);
  outline-offset: 2px;
}

.lx-button-demo__toolbar select {
  min-height: 32px;
  border: 1px solid var(--lx-border);
  border-radius: var(--lx-radius-sm);
  background: var(--lx-bg-card);
  color: var(--lx-text-primary);
}

.lx-button-demo__toolbar select:focus-visible {
  outline: 2px solid var(--lx-color-primary);
  outline-offset: 2px;
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

.lx-button-demo__panel h3 {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--lx-text-regular);
}

.lx-button-demo__variants {
  display: grid;
  gap: 12px;
}

.lx-button-demo__advanced {
  display: grid;
  gap: 12px;
}

.lx-button-demo__recovery {
  display: grid;
  min-width: 0;
  gap: 8px;
}

.lx-button-demo__variants summary {
  display: list-item;
  min-height: 32px;
  padding-block: 6px;
  color: var(--lx-color-primary);
  cursor: pointer;
}

.lx-button-demo__variants summary::marker,
.lx-button-demo__advanced > summary::marker {
  color: var(--lx-color-primary);
}

.lx-button-demo__variants summary:focus-visible {
  outline: 2px solid var(--lx-color-primary);
  outline-offset: 2px;
}

.lx-button-demo__group {
  display: grid;
  gap: 8px;
  min-width: 0;
}

.lx-button-demo__group-title {
  margin: 0;
  color: var(--lx-text-regular);
  font-size: 12px;
  font-weight: 600;
}

.lx-button-demo__row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.lx-button-demo__icon-action {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.lx-button-demo__icon-action-label {
  display: inline;
  color: var(--lx-text-secondary-strong);
  font-size: 12px;
}

.lx-button-demo__alternative-note {
  display: inline-flex;
  min-height: 32px;
  align-items: center;
  color: var(--lx-text-secondary-strong);
  font-size: 12px;
}

.lx-button-demo__permission-example {
  display: inline-flex;
  max-width: 100%;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 8px;
  color: var(--lx-text-secondary-strong);
  font-size: 12px;
}

.lx-button-demo__status,
.lx-button-demo__note,
.lx-button-demo__tip {
  margin: 0;
  font-size: 12px;
  color: var(--lx-text-secondary-strong);
}

.lx-button-demo__note {
  color: var(--lx-color-warning-text);
}

.lx-button-demo__advanced > summary {
  display: list-item;
  min-height: 36px;
  padding-block: 8px;
  color: var(--lx-color-primary);
  cursor: pointer;
}

.lx-button-demo__advanced > summary:focus-visible {
  outline: 2px solid var(--lx-color-primary);
  outline-offset: 2px;
}

.lx-button-demo__section-nav {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--lx-border);
}

.lx-button-demo__section-nav a {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  color: var(--lx-color-primary);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.lx-button-demo__section-nav a:focus-visible {
  outline: 2px solid var(--lx-color-primary);
  outline-offset: 2px;
}

.lx-button-demo__anchor {
  scroll-margin-block-start: calc(var(--vp-nav-height, 64px) + 16px);
}

.lx-button-demo__anchor:focus-visible {
  outline: 2px solid var(--lx-color-primary);
  outline-offset: 2px;
}

@media (min-width: 960px) and (max-width: 1279px) {
  .lx-button-demo__anchor {
    scroll-margin-block-start: calc(var(--vp-nav-height, 64px) + 48px + 16px);
  }
}

@media (max-width: 959px) {
  .lx-button-demo__anchor {
    scroll-margin-block-start: calc(48px + 16px);
  }
}

@media (hover: none), (max-width: 640px) {
  .lx-button-demo__advanced > summary,
  .lx-button-demo__variants summary {
    min-height: 44px;
  }
}
</style>
