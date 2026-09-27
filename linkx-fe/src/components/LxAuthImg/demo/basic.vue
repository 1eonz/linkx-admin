<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import LxAuthImg from '../index.vue'

type MockMode = 'success' | 'slow' | 'failure' | 'failure-fallback' | 'empty'

const mode = ref<MockMode>('success')
const sourceVersion = ref(1)
const requestCount = ref(0)
const cancelledCount = ref(0)
const loadCount = ref(0)
const errorCount = ref(0)
const hudTheme = ref(false)
const requestSrc = computed(() =>
  mode.value === 'empty' ? '' : `mock://avatar/${sourceVersion.value}`,
)
const fallbackSrc = computed(() =>
  mode.value === 'failure-fallback' ? '/auth-img-sample.png' : undefined,
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
}

function changeSource() {
  sourceVersion.value += 1
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
        if (
          requestedMode === 'failure' ||
          requestedMode === 'failure-fallback'
        ) {
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

function recordLoad() {
  loadCount.value += 1
}

function recordError() {
  errorCount.value += 1
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
        HUD 深色
      </label>
    </header>

    <div class="lx-auth-img-demo__preview">
      <LxAuthImg
        :src="requestSrc"
        :request="requestImage"
        :fallback="fallbackSrc"
        alt="LinkX 通信服务标识"
        :width="72"
        :height="72"
        fit="contain"
        data-testid="auth-img-preview"
        @load="recordLoad"
        @error="recordError"
      />
      <p>LinkX 通信服务标识</p>
    </div>

    <fieldset class="lx-auth-img-demo__modes">
      <legend>Mock 状态</legend>
      <button
        type="button"
        :aria-pressed="mode === 'success'"
        @click="setMode('success')"
      >
        正常载入
      </button>
      <button
        type="button"
        :aria-pressed="mode === 'slow'"
        @click="setMode('slow')"
      >
        延迟载入
      </button>
      <button
        type="button"
        :aria-pressed="mode === 'failure'"
        @click="setMode('failure')"
      >
        请求失败
      </button>
      <button
        type="button"
        :aria-pressed="mode === 'failure-fallback'"
        @click="setMode('failure-fallback')"
      >
        失败后显示回退图
      </button>
      <button
        type="button"
        :aria-pressed="mode === 'empty'"
        @click="setMode('empty')"
      >
        空地址
      </button>
      <button type="button" @click="changeSource">切换资源并取消旧请求</button>
    </fieldset>

    <dl class="lx-auth-img-demo__stats" aria-live="polite">
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
  </section>
</template>

<style scoped>
.lx-auth-img-demo {
  display: grid;
  max-width: 760px;
  min-width: 0;
  gap: 16px;
  padding: 16px;
  border: 1px solid var(--lx-border-light);
  border-radius: var(--lx-radius-md);
  background: var(--lx-bg-card);
  color: var(--lx-text-primary);
}

.lx-auth-img-demo__header,
.lx-auth-img-demo__theme,
.lx-auth-img-demo__modes,
.lx-auth-img-demo__preview {
  display: flex;
  align-items: center;
  gap: 12px;
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
  color: var(--lx-text-regular);
  font-size: 12px;
  line-height: 18px;
}

.lx-auth-img-demo__theme,
.lx-auth-img-demo__modes {
  color: var(--lx-text-regular);
  font-size: 13px;
}

.lx-auth-img-demo__theme input {
  accent-color: var(--lx-color-primary);
}

.lx-auth-img-demo__modes {
  flex-wrap: wrap;
  margin: 0;
  padding: 0;
  border: 0;
}

.lx-auth-img-demo__modes legend {
  width: 100%;
  padding: 0;
  margin-bottom: 4px;
  color: var(--lx-text-secondary);
  font-size: 12px;
}

.lx-auth-img-demo__modes button {
  min-height: 44px;
  padding: 0 12px;
  border: 1px solid var(--lx-border);
  border-radius: var(--lx-radius-md);
  background: var(--lx-bg-card);
  color: var(--lx-text-primary);
  cursor: pointer;
  font: inherit;
}

.lx-auth-img-demo__modes button[aria-pressed='true'] {
  border-color: var(--lx-color-primary);
  background: var(--lx-color-primary-light);
  color: var(--lx-color-primary);
}

.lx-auth-img-demo__modes button:focus-visible,
.lx-auth-img-demo__theme input:focus-visible {
  outline: 2px solid var(--lx-color-primary);
  outline-offset: 2px;
}

.lx-auth-img-demo__preview {
  align-items: center;
  min-width: 0;
}

.lx-auth-img-demo__preview > :deep(.lx-auth-img),
.lx-auth-img-demo__preview > :deep(.lx-auth-img__placeholder) {
  flex: 0 0 72px;
  border: 1px solid var(--lx-border-light);
}

.lx-auth-img-demo__preview p {
  min-width: 0;
  margin: 0;
  color: var(--lx-text-regular);
  overflow-wrap: anywhere;
}

.lx-auth-img-demo__stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin: 0;
  padding-top: 12px;
  border-top: 1px solid var(--lx-border-light);
  color: var(--lx-text-secondary);
  font-size: 12px;
}

.lx-auth-img-demo__stats > div {
  min-width: 0;
}

.lx-auth-img-demo__stats dt {
  margin-bottom: 4px;
}

.lx-auth-img-demo__stats dd {
  margin: 0;
  color: var(--lx-text-primary);
  font-variant-numeric: tabular-nums;
}

@media (max-width: 540px) {
  .lx-auth-img-demo__header {
    align-items: flex-start;
    flex-direction: column;
  }

  .lx-auth-img-demo__stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
