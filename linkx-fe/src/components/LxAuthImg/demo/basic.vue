<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import LxAuthImg from '../index.vue'

const mockModes = [
  { value: 'success', label: '正常载入' },
  { value: 'slow', label: '延迟载入' },
  { value: 'failure', label: '请求失败' },
  { value: 'empty', label: '空地址' },
] as const

const fallbackChoices = [
  { value: 'none', label: '不使用回退图', src: '' },
  { value: 'service', label: '服务标识图片', src: '/auth-img-sample.png' },
  { value: 'shield', label: '站点盾牌图标', src: '/favicon.svg' },
] as const

type MockMode = (typeof mockModes)[number]['value']
type FallbackChoice = (typeof fallbackChoices)[number]['value']

const mode = ref<MockMode>('success')
const fallbackChoice = ref<FallbackChoice>('none')
const sourceVersion = ref(1)
const requestCount = ref(0)
const cancelledCount = ref(0)
const loadCount = ref(0)
const errorCount = ref(0)
const hudTheme = ref(false)
const previewStatus = ref('等待图片载入')
const mainRequestFailed = ref(false)
const requestSrc = computed(() =>
  mode.value === 'empty' ? '' : `mock://avatar/${sourceVersion.value}`,
)
const fallbackSrc = computed(
  () =>
    fallbackChoices.find((option) => option.value === fallbackChoice.value)
      ?.src ?? '',
)

let originalDark = false
let originalHud = false

function setTheme(enabled: boolean) {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('dark', enabled || originalDark)
  document.documentElement.classList.toggle(
    'lx-theme-hud',
    enabled || originalHud,
  )
}

function setMode(nextMode: MockMode) {
  mode.value = nextMode
  sourceVersion.value += 1
  mainRequestFailed.value = false
  if (nextMode === 'empty') {
    previewStatus.value = fallbackSrc.value
      ? '主图地址为空，正在载入回退图片'
      : '主图地址为空，显示空态'
  } else {
    previewStatus.value = '正在载入主图'
  }
}

function isMockMode(value: string): value is MockMode {
  return mockModes.some((option) => option.value === value)
}

function handleModeChange(event: Event) {
  const target = event.currentTarget
  if (!(target instanceof HTMLSelectElement) || !isMockMode(target.value))
    return
  setMode(target.value)
}

function isFallbackChoice(value: string): value is FallbackChoice {
  return fallbackChoices.some((option) => option.value === value)
}

function handleFallbackChange(event: Event) {
  const target = event.currentTarget
  if (!(target instanceof HTMLSelectElement) || !isFallbackChoice(target.value))
    return
  fallbackChoice.value = target.value

  if (mode.value === 'empty') {
    previewStatus.value = fallbackSrc.value
      ? '主图地址为空，正在载入回退图片'
      : '主图地址为空，显示空态'
  } else if (mode.value === 'failure') {
    if (mainRequestFailed.value) {
      previewStatus.value = fallbackSrc.value
        ? '主图载入失败，正在尝试回退图片'
        : '主图载入失败，显示错误占位'
    } else {
      previewStatus.value = '正在载入主图'
    }
  } else {
    previewStatus.value = '回退图片设置已更新，当前主图请求不变'
  }
}

function changeSource() {
  sourceVersion.value += 1
  mainRequestFailed.value = false
  previewStatus.value = '正在重新载入主图'
}

function retryImage(retry: () => void) {
  if (mode.value === 'failure') {
    mode.value = 'success'
    mainRequestFailed.value = false
    previewStatus.value = '正在重新载入主图'
    retry()
    return
  }
  retry()
  previewStatus.value = '正在重新载入图片'
}

function requestImage(src: string, signal?: AbortSignal): Promise<Blob> {
  const requestedMode = mode.value
  requestCount.value += 1

  return new Promise((resolve, reject) => {
    let timer: number | undefined
    const cleanup = () => {
      if (timer !== undefined) window.clearTimeout(timer)
      signal?.removeEventListener('abort', onAbort)
    }
    const onAbort = () => {
      cleanup()
      cancelledCount.value += 1
      reject(new DOMException(`${src} 请求已取消`, 'AbortError'))
    }

    if (signal?.aborted) {
      onAbort()
      return
    }
    signal?.addEventListener('abort', onAbort, { once: true })

    timer = window.setTimeout(
      () => {
        timer = undefined
        if (requestedMode === 'failure') {
          cleanup()
          reject(new Error('本地 Mock 图片请求失败'))
          return
        }

        fetch('/auth-img-sample.png', { signal })
          .then((response) => {
            if (!response.ok) throw new Error('本地示例图片读取失败')
            return response.blob()
          })
          .then((blob) => {
            cleanup()
            resolve(blob)
          })
          .catch((error: unknown) => {
            cleanup()
            reject(error)
          })
      },
      requestedMode === 'slow' ? 1600 : 180,
    )
  })
}

function recordLoad(src: string) {
  loadCount.value += 1
  if (fallbackSrc.value && src === fallbackSrc.value) {
    previewStatus.value = requestSrc.value
      ? '主图异常，已显示回退图片'
      : '主图地址为空，已显示回退图片'
    return
  }
  mainRequestFailed.value = false
  previewStatus.value = '主图载入完成'
}

function recordError(error: unknown) {
  errorCount.value += 1
  const target =
    typeof Event !== 'undefined' && error instanceof Event ? error.target : null
  const fallbackFailed =
    typeof HTMLImageElement !== 'undefined' &&
    target instanceof HTMLImageElement &&
    target.getAttribute('src') === fallbackSrc.value

  if (fallbackFailed) {
    previewStatus.value = '回退图片载入失败，请选择其他图片'
  } else {
    mainRequestFailed.value = true
    previewStatus.value = fallbackSrc.value
      ? '主图载入失败，正在尝试回退图片'
      : '主图载入失败，显示错误占位'
  }
}

watch(hudTheme, setTheme)

onMounted(() => {
  originalDark = document.documentElement.classList.contains('dark')
  originalHud = document.documentElement.classList.contains('lx-theme-hud')
  setTheme(hudTheme.value)
})

onBeforeUnmount(() => {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('dark', originalDark)
  document.documentElement.classList.toggle('lx-theme-hud', originalHud)
})
</script>

<template>
  <section class="lx-auth-img-demo" aria-labelledby="lx-auth-img-demo-title">
    <header class="lx-auth-img-demo__header">
      <div>
        <h2 id="lx-auth-img-demo-title">受保护资源预览</h2>
        <p>组件只接收宿主提供的 Blob 请求；示例图片来自文档站本地资源。</p>
      </div>
      <label class="lx-auth-img-demo__theme">
        <input v-model="hudTheme" type="checkbox" />
        深色主题
      </label>
    </header>

    <div class="lx-auth-img-demo__preview">
      <LxAuthImg
        :src="requestSrc"
        :request="requestImage"
        :fallback="fallbackSrc"
        alt="LinkX 通信服务标识"
        aria-describedby="lx-auth-img-demo-preview-status"
        :width="72"
        :height="72"
        fit="contain"
        data-testid="auth-img-preview"
        @load="recordLoad"
        @error="recordError"
      >
        <template #error-actions="{ retry, loading }">
          <button
            class="lx-auth-img-demo__retry"
            data-testid="auth-img-retry"
            type="button"
            :disabled="loading"
            :aria-disabled="loading"
            :aria-busy="loading"
            @click="retryImage(retry)"
          >
            重新加载
          </button>
        </template>
      </LxAuthImg>
      <p class="lx-auth-img-demo__preview-copy">
        <span>受保护图片预览</span>
        <span
          id="lx-auth-img-demo-preview-status"
          class="lx-auth-img-demo__preview-status"
        >
          {{ previewStatus }}
        </span>
      </p>
    </div>

    <fieldset class="lx-auth-img-demo__modes">
      <legend>Mock 控制</legend>
      <p class="lx-auth-img-demo__hint">
        以下控件仅用于宿主侧 Mock 验收，不代表组件会自行发起业务请求。
      </p>
      <label class="lx-auth-img-demo__mode">
        <span>Mock 状态</span>
        <select :value="mode" @change="handleModeChange">
          <option
            v-for="option in mockModes"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>
      </label>
      <label class="lx-auth-img-demo__mode">
        <span>回退图片</span>
        <select :value="fallbackChoice" @change="handleFallbackChange">
          <option
            v-for="option in fallbackChoices"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>
      </label>
      <button type="button" @click="changeSource">切换资源并取消旧请求</button>
    </fieldset>

    <details class="lx-auth-img-demo__debug">
      <summary>调试信息</summary>
      <dl class="lx-auth-img-demo__stats">
        <div>
          <dt>Mock 请求</dt>
          <dd data-testid="auth-img-request-count">{{ requestCount }}</dd>
        </div>
        <div>
          <dt>取消请求</dt>
          <dd data-testid="auth-img-cancel-count">{{ cancelledCount }}</dd>
        </div>
        <div>
          <dt>图片载入事件</dt>
          <dd data-testid="auth-img-load-count">{{ loadCount }}</dd>
        </div>
        <div>
          <dt>错误事件</dt>
          <dd data-testid="auth-img-error-count">{{ errorCount }}</dd>
        </div>
      </dl>
    </details>
  </section>
</template>

<style scoped>
.lx-auth-img-demo {
  display: grid;
  gap: 16px;
  min-width: 0;
  max-width: 760px;
  padding: 16px;
  color: var(--lx-text-primary);
  background: var(--lx-bg-card);
  border: 1px solid var(--lx-border-light);
  border-radius: var(--lx-radius-md);
}

.lx-auth-img-demo__header,
.lx-auth-img-demo__theme,
.lx-auth-img-demo__modes,
.lx-auth-img-demo__preview {
  display: flex;
  gap: 12px;
  align-items: center;
}

.lx-auth-img-demo__header {
  justify-content: space-between;
}

.lx-auth-img-demo__header h2 {
  margin: 0;
  font-size: 16px;
  line-height: 24px;
}

.lx-auth-img-demo__header p {
  margin: 4px 0 0;
  font-size: 12px;
  line-height: 18px;
  color: var(--lx-text-regular);
}

.lx-auth-img-demo__theme,
.lx-auth-img-demo__modes {
  font-size: 13px;
  color: var(--lx-text-regular);
}

.lx-auth-img-demo__hint {
  flex-basis: 100%;
  margin: 0;
  color: var(--lx-text-secondary);
  font-size: 12px;
  line-height: 18px;
}

.lx-auth-img-demo__retry {
  flex: 0 0 auto;
  min-height: 44px;
  min-width: 80px;
  padding: 0 12px;
  white-space: nowrap;
  color: var(--lx-color-primary);
  cursor: pointer;
  background: var(--lx-bg-card);
  border: 1px solid var(--lx-color-primary);
  border-radius: var(--lx-radius-md);
}

.lx-auth-img-demo__retry:focus-visible,
.lx-auth-img-demo__debug > summary:focus-visible {
  outline: 2px solid var(--lx-color-primary);
  outline-offset: 2px;
}

.lx-auth-img-demo__retry[aria-disabled='true'] {
  cursor: wait;
  opacity: 0.65;
}

.lx-auth-img-demo__debug {
  color: var(--lx-text-secondary);
  font-size: 12px;
}

.lx-auth-img-demo__debug > summary {
  min-height: 32px;
  padding: 6px 0;
  cursor: pointer;
}

.lx-auth-img-demo__theme {
  min-height: 44px;
}

.lx-auth-img-demo__theme input {
  accent-color: var(--lx-color-primary);
}

.lx-auth-img-demo__modes {
  flex-wrap: wrap;
  padding: 0;
  margin: 0;
  border: 0;
}

.lx-auth-img-demo__mode {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  min-height: 44px;
  font-size: 13px;
  color: var(--lx-text-regular);
}

.lx-auth-img-demo__mode select {
  box-sizing: border-box;
  min-width: 176px;
  min-height: 44px;
  padding: 0 10px;
  font: inherit;
  color: var(--lx-text-primary);
  cursor: pointer;
  background: var(--lx-bg-card);
  border: 1px solid var(--lx-border);
  border-radius: var(--lx-radius-md);
}

.lx-auth-img-demo__modes legend {
  width: 100%;
  padding: 0;
  margin-bottom: 4px;
  font-size: 12px;
  color: var(--lx-text-secondary);
}

.lx-auth-img-demo__modes button {
  min-height: 44px;
  padding: 0 12px;
  font: inherit;
  color: var(--lx-text-primary);
  cursor: pointer;
  background: var(--lx-bg-card);
  border: 1px solid var(--lx-border);
  border-radius: var(--lx-radius-md);
}

.lx-auth-img-demo__modes button[aria-pressed='true'] {
  color: var(--lx-color-primary);
  background: var(--lx-color-primary-light);
  border-color: var(--lx-color-primary);
}

.lx-auth-img-demo__modes button:focus-visible,
.lx-auth-img-demo__mode select:focus-visible,
.lx-auth-img-demo__theme input:focus-visible {
  outline: 2px solid var(--lx-color-primary);
  outline-offset: 2px;
}

.lx-auth-img-demo__preview {
  align-items: center;
  min-width: 0;
}

.lx-auth-img-demo__preview > :deep(.lx-auth-img__frame),
.lx-auth-img-demo__preview > :deep(.lx-auth-img__placeholder) {
  flex: 0 0 72px;
  border: 1px solid var(--lx-border-light);
}

.lx-auth-img-demo__preview-copy {
  display: grid;
  gap: 4px;
  min-width: 0;
  margin: 0;
  color: var(--lx-text-regular);
  overflow-wrap: anywhere;
}

.lx-auth-img-demo__preview-status {
  font-size: 12px;
  line-height: 18px;
  color: var(--lx-text-secondary);
}

.lx-auth-img-demo__stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  padding-top: 12px;
  margin: 0;
  font-size: 12px;
  color: var(--lx-text-secondary);
  border-top: 1px solid var(--lx-border-light);
}

.lx-auth-img-demo__stats > div {
  min-width: 0;
}

.lx-auth-img-demo__stats dt {
  margin-bottom: 4px;
}

.lx-auth-img-demo__stats dd {
  margin: 0;
  font-variant-numeric: tabular-nums;
  color: var(--lx-text-primary);
}

@media (max-width: 540px) {
  .lx-auth-img-demo__header {
    flex-direction: column;
    align-items: flex-start;
  }

  .lx-auth-img-demo__stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 360px) {
  .lx-auth-img-demo__mode {
    flex-direction: column;
    gap: 4px;
    align-items: flex-start;
    width: 100%;
  }

  .lx-auth-img-demo__mode select {
    width: 100%;
    min-width: 0;
  }
}
</style>
