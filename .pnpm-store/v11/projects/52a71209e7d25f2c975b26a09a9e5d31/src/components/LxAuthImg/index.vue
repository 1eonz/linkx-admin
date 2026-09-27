<script setup lang="ts">
/**
 * 鉴权逻辑由业务侧注入 Blob 请求函数，组件本身不持有 token 或接口依赖。
 * 未传 request 时按普通图片处理，兼容公开静态资源。
 */
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import LxIcon from '../LxIcon/index.vue'
import type { LxAuthImgProps } from './types'

defineOptions({ name: 'LxAuthImg' })

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
const failed = ref(false)
const loading = ref(false)
const placeholderLabel = computed(() => {
  const state = loading.value ? '图片加载中' : '图片加载失败'
  return props.alt ? `${props.alt}，${state}` : state
})
let objectUrl = ''
let controller: AbortController | undefined
let requestId = 0

const style = computed(() => ({
  width: typeof props.width === 'number' ? `${props.width}px` : props.width,
  height: typeof props.height === 'number' ? `${props.height}px` : props.height,
  objectFit: props.fit,
}))

function revokeObjectUrl() {
  if (objectUrl) URL.revokeObjectURL(objectUrl)
  objectUrl = ''
}

function load() {
  const id = ++requestId
  controller?.abort()
  controller = undefined
  revokeObjectUrl()
  failed.value = false
  loading.value = false
  displaySrc.value = ''

  if (!props.src) {
    if (props.fallback) {
      displaySrc.value = props.fallback
      loading.value = true
    } else failed.value = true
    return
  }

  loading.value = true
  const src = props.src
  const request = props.request
  if (!request) {
    displaySrc.value = src
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
      if (props.fallback) displaySrc.value = props.fallback
      else {
        failed.value = true
        loading.value = false
      }
    })
    .finally(() => {
      if (controller === activeController) controller = undefined
    })
}

function onLoad(event: Event) {
  if (
    (event.target as HTMLImageElement).getAttribute('src') !== displaySrc.value
  )
    return
  loading.value = false
  emit('load', displaySrc.value)
}

function onError(error: Event) {
  if (
    (error.target as HTMLImageElement).getAttribute('src') !== displaySrc.value
  )
    return
  if (props.fallback && displaySrc.value !== props.fallback) {
    emit('error', error)
    revokeObjectUrl()
    failed.value = false
    loading.value = true
    displaySrc.value = props.fallback
    return
  }
  failed.value = true
  loading.value = false
  emit('error', error)
}

watch(() => [props.src, props.request] as const, load, { immediate: true })

onBeforeUnmount(() => {
  ++requestId
  controller?.abort()
  revokeObjectUrl()
})
</script>

<template>
  <img
    v-if="displaySrc && !failed"
    class="lx-auth-img"
    :src="displaySrc"
    :alt="alt"
    :style="style"
    :aria-busy="loading"
    @load="onLoad"
    @error="onError"
  />
  <span
    v-else
    class="lx-auth-img__placeholder"
    :class="{ 'is-loading': loading }"
    :style="style"
    role="img"
    :aria-label="placeholderLabel"
    :aria-busy="loading"
  >
    <LxIcon :name="loading ? 'loading' : 'image'" :size="20" :spin="loading" />
  </span>
</template>

<style scoped>
.lx-auth-img,
.lx-auth-img__placeholder {
  display: inline-flex;
  overflow: hidden;
  max-width: 100%;
  align-items: center;
  justify-content: center;
  border-radius: var(--lx-radius-md);
  background: var(--lx-color-info-light);
  color: var(--lx-text-secondary);
}

.lx-auth-img {
  object-position: center;
}

.lx-auth-img__placeholder {
  min-width: var(--lx-control-height);
  min-height: var(--lx-control-height);
}

.lx-auth-img__placeholder.is-loading {
  color: var(--lx-color-primary);
}
</style>
