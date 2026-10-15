<script setup lang="ts">
/**
 * 鉴权逻辑由业务侧注入 Blob 请求函数，组件本身不持有 token 或接口依赖。
 * 未传 request 时按普通图片处理，兼容公开静态资源。
 */
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import LxIcon from '../LxIcon/index.vue'
import type { LxAuthImgProps, LxAuthImgSlots } from './types'

defineOptions({ name: 'LxAuthImg', inheritAttrs: false })
defineSlots<LxAuthImgSlots>()

type FallbackReason = 'empty-source' | 'request-error' | 'image-error'

const props = withDefaults(defineProps<LxAuthImgProps>(), {
  alt: '',
  fallback: '',
  width: undefined,
  height: undefined,
  fit: 'cover',
  request: undefined,
})

const emit = defineEmits<{
  load: [src: string]
  error: [error: unknown]
}>()

const displaySrc = ref('')
const loadedSrc = ref('')
const activeImage = ref<HTMLImageElement | null>(null)
const actionContainer = ref<HTMLElement | null>(null)
const statusElement = ref<HTMLElement | null>(null)
const failed = ref(false)
const loading = ref(false)
const fallbackReason = ref<FallbackReason>()
const emptySource = computed(() => !props.src && !props.fallback)
const liveStatus = computed(() => {
  if (loading.value) {
    if (fallbackReason.value === 'empty-source')
      return '主图地址为空，正在载入回退图片'
    if (fallbackReason.value) return '主图加载失败，正在载入回退图片'
    return '图片加载中'
  }
  if (emptySource.value) return '暂无图片'
  if (failed.value) {
    if (fallbackReason.value === 'empty-source') return '回退图片加载失败'
    if (fallbackReason.value && props.fallback)
      return '主图和回退图片均加载失败'
    return '图片加载失败'
  }
  if (fallbackReason.value === 'empty-source')
    return '主图地址为空，已显示回退图片'
  if (fallbackReason.value) return '主图加载失败，已显示回退图片'
  return displaySrc.value ? '图片加载完成' : ''
})
const placeholderIcon = computed(() =>
  loading.value ? 'loading' : emptySource.value ? 'image' : 'circle-alert',
)
const retrying = ref(false)
const retryAvailable = computed(
  () =>
    (failed.value ||
      retrying.value ||
      (['request-error', 'image-error'].includes(fallbackReason.value ?? '') &&
        Boolean(props.fallback))) &&
    Boolean(props.src),
)
let objectUrl = ''
let controller: AbortController | undefined
let requestId = 0
let retryFocusRequested = false
let retryFocusElement: HTMLElement | null = null

const sizeStyle = computed(() => ({
  width: typeof props.width === 'number' ? `${props.width}px` : props.width,
  height: typeof props.height === 'number' ? `${props.height}px` : props.height,
}))
const style = computed(() => ({
  ...sizeStyle.value,
  objectFit: props.fit,
}))
const frameStyle = computed(() => ({
  ...sizeStyle.value,
  minWidth: props.width == null ? 'var(--lx-control-height)' : undefined,
  minHeight: props.height == null ? 'var(--lx-control-height)' : undefined,
}))

function revokeObjectUrl() {
  if (objectUrl) URL.revokeObjectURL(objectUrl)
  objectUrl = ''
}

function emitCachedLoad(src: string, id: number) {
  if (loadedSrc.value !== src) return
  queueMicrotask(() => {
    if (
      id === requestId &&
      displaySrc.value === src &&
      !loading.value &&
      !failed.value
    ) {
      emit('load', src)
    }
  })
}

function load(isRetry = false) {
  const id = ++requestId
  controller?.abort()
  controller = undefined
  revokeObjectUrl()
  failed.value = false
  if (!isRetry) {
    retrying.value = false
    retryFocusRequested = false
  }
  loading.value = false
  fallbackReason.value = undefined
  displaySrc.value = ''

  if (!props.src) {
    if (props.fallback) {
      fallbackReason.value = 'empty-source'
      displaySrc.value = props.fallback
      loading.value = loadedSrc.value !== props.fallback
      emitCachedLoad(props.fallback, id)
    } else failed.value = true
    return
  }

  loading.value = true
  const src = props.src
  const request = props.request
  if (!request) {
    displaySrc.value = src
    loading.value = loadedSrc.value !== src
    emitCachedLoad(src, id)
    return
  }

  const activeController = new AbortController()
  controller = activeController
  // 同时检查请求序号和取消状态，防止不响应 AbortSignal 的适配器回写旧图片。
  void Promise.resolve()
    .then(() => request(src, activeController.signal))
    .then((blob) => {
      if (id !== requestId || activeController.signal.aborted) return
      objectUrl = URL.createObjectURL(blob)
      displaySrc.value = objectUrl
    })
    .catch((error: unknown) => {
      if (id !== requestId || activeController.signal.aborted) return
      emit('error', error)
      fallbackReason.value = 'request-error'
      if (props.fallback) {
        const wasRetrying = retrying.value
        retrying.value = false
        displaySrc.value = props.fallback
        loading.value = loadedSrc.value !== props.fallback
        emitCachedLoad(props.fallback, id)
        if (wasRetrying) restoreRetryFocus('action')
      } else {
        retrying.value = false
        failed.value = true
        loading.value = false
        restoreRetryFocus('action')
      }
    })
    .finally(() => {
      if (controller === activeController) controller = undefined
    })
}

/** 重新执行当前宿主请求；空地址和加载中的状态不提供重试入口。 */
function retry() {
  if (!retryAvailable.value || loading.value) return
  retryFocusElement =
    typeof document !== 'undefined' &&
    document.activeElement instanceof HTMLElement &&
    document.activeElement !== document.body
      ? document.activeElement
      : (actionContainer.value?.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ) ?? null)
  retryFocusRequested = Boolean(retryFocusElement)
  retrying.value = true
  load(true)
}

function restoreRetryFocus(target: 'status' | 'action') {
  if (!retryFocusRequested) return
  retryFocusRequested = false
  if (target === 'status') {
    const status =
      statusElement.value ??
      (typeof document !== 'undefined'
        ? document.querySelector<HTMLElement>('.lx-auth-img__status')
        : null)
    status?.focus()
    retryFocusElement = null
    return
  }
  void nextTick().then(() => {
    if (retryFocusElement?.isConnected) {
      retryFocusElement.focus()
      retryFocusElement = null
      return
    }
    actionContainer.value
      ?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      )
      ?.focus()
    retryFocusElement = null
  })
}

function onLoad(event: Event) {
  if (
    event.currentTarget !== activeImage.value ||
    (event.currentTarget as HTMLImageElement).getAttribute('src') !==
      displaySrc.value
  )
    return
  const wasRetrying = retrying.value
  loading.value = false
  retrying.value = false
  loadedSrc.value = displaySrc.value
  emit('load', displaySrc.value)
  if (wasRetrying) {
    retryFocusRequested = false
    retryFocusElement = null
    const status =
      statusElement.value ??
      (typeof document !== 'undefined'
        ? document.querySelector<HTMLElement>('.lx-auth-img__status')
        : null)
    status?.focus()
  }
}

function onError(error: Event) {
  if (
    error.currentTarget !== activeImage.value ||
    (error.currentTarget as HTMLImageElement).getAttribute('src') !==
      displaySrc.value
  )
    return
  if (props.fallback && displaySrc.value !== props.fallback) {
    const wasRetrying = retrying.value
    emit('error', error)
    revokeObjectUrl()
    fallbackReason.value = 'image-error'
    failed.value = false
    retrying.value = false
    loading.value = loadedSrc.value !== props.fallback
    displaySrc.value = props.fallback
    emitCachedLoad(props.fallback, requestId)
    if (wasRetrying) restoreRetryFocus('action')
    return
  }
  if (!props.fallback) fallbackReason.value = 'image-error'
  const wasRetrying = retrying.value
  failed.value = true
  retrying.value = false
  loading.value = false
  emit('error', error)
  if (wasRetrying) restoreRetryFocus('action')
}

watch(
  () => [props.src, props.request] as const,
  () => load(),
  { immediate: true },
)

// 回退配置变化只更新空态、失败态或当前回退图，不打断已成功的主图。
watch(
  () => props.fallback,
  (fallback, previousFallback) => {
    const showingPreviousFallback =
      Boolean(previousFallback) &&
      displaySrc.value === previousFallback &&
      previousFallback !== props.src

    if (showingPreviousFallback) {
      displaySrc.value = fallback
      loading.value = Boolean(fallback) && loadedSrc.value !== fallback
      failed.value = !fallback
      if (fallback) emitCachedLoad(fallback, requestId)
      return
    }

    if (!failed.value || !fallback) return

    if (!props.src) fallbackReason.value = 'empty-source'
    displaySrc.value = fallback
    failed.value = false
    loading.value = loadedSrc.value !== fallback
    emitCachedLoad(fallback, requestId)
  },
)

onBeforeUnmount(() => {
  ++requestId
  controller?.abort()
  revokeObjectUrl()
})
</script>

<template>
  <span
    v-if="displaySrc && !failed"
    class="lx-auth-img__frame"
    :class="{ 'is-loading': loading }"
    :style="frameStyle"
  >
    <img
      v-bind="$attrs"
      :key="displaySrc"
      ref="activeImage"
      class="lx-auth-img"
      :src="displaySrc"
      :alt="alt"
      :style="style"
      :aria-busy="loading"
      @load="onLoad"
      @error="onError"
    />
    <span
      v-if="loading"
      class="lx-auth-img__loading-indicator"
      aria-hidden="true"
    >
      <LxIcon name="loading" :size="20" :spin="loading" />
    </span>
  </span>
  <span
    v-else
    v-bind="$attrs"
    class="lx-auth-img__placeholder"
    :class="{ 'is-loading': loading }"
    :style="style"
    :role="alt ? 'img' : undefined"
    :aria-label="alt || undefined"
    :aria-hidden="alt ? undefined : 'true'"
    :aria-busy="loading"
  >
    <LxIcon
      :name="placeholderIcon"
      :size="20"
      :spin="loading"
      aria-hidden="true"
    />
  </span>
  <span
    v-if="retryAvailable && $slots['error-actions']"
    ref="actionContainer"
    class="lx-auth-img__error-actions"
  >
    <slot name="error-actions" :retry="retry" :loading="loading" />
  </span>
  <span
    ref="statusElement"
    class="lx-auth-img__status"
    role="status"
    tabindex="-1"
    aria-live="polite"
    aria-atomic="true"
  >
    {{ liveStatus }}
  </span>
</template>

<style scoped>
.lx-auth-img,
.lx-auth-img__placeholder {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  max-width: 100%;
  overflow: hidden;
  color: var(--lx-text-secondary);
  background: var(--lx-color-info-light);
  border-radius: var(--lx-radius-md);
}

.lx-auth-img__frame {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  max-width: 100%;
  overflow: hidden;
  background: var(--lx-color-info-light);
  border-radius: var(--lx-radius-md);
}

.lx-auth-img {
  display: block;
  max-width: 100%;
  object-position: center;
  border-radius: inherit;
}

.lx-auth-img__loading-indicator {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--lx-color-primary);
  pointer-events: none;
  background: var(--lx-color-info-light);
  border-radius: inherit;
}

.lx-auth-img__placeholder {
  min-width: var(--lx-control-height);
  min-height: var(--lx-control-height);
}

.lx-auth-img__placeholder.is-loading {
  color: var(--lx-color-primary);
}

.lx-auth-img__error-actions {
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
  margin-inline-start: 8px;
  vertical-align: middle;
}

.lx-auth-img__status {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}
</style>
