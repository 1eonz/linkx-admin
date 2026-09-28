<script setup lang="ts">
/**
 * AuthImg - 鉴权图片组件
 *
 * 功能特性：
 * - 通过可取消的请求拉取鉴权图片，Token 仅放在 Authorization 请求头
 * - 将响应转为 Blob 并通过 ObjectURL 渲染，避免 base64 性能损耗
 * - 支持 /static 前缀自动拼接 /api 网关路径
 * - 支持 props.authSrc 变化时自动重新加载
 * - 加载失败显示可重试占位；切换资源和卸载时取消请求并释放 ObjectURL
 *
 * @example 基础用法
 * ```vue
 * <AuthImg auth-src="/static/avatar.png" />
 * ```
 *
 * Props：
 * - authSrc: string，鉴权图片地址（相对路径，如 /static/xxx.png），必填
 * - alt: string，可选图片说明；留空时图片和状态占位均按装饰内容处理
 *
 * Events：无
 *
 * Slots：无
 *
 * Methods：无
 */
import { Loading, Picture, RefreshRight } from '@element-plus/icons-vue';
import { computed, onBeforeUnmount, ref, watch } from 'vue';

import { getAuthImageBlob } from '@/api/authImage';

defineOptions({ name: 'AuthImg' });

const props = withDefaults(
  defineProps<{
    /** 鉴权图片地址（相对路径，如 /static/xxx.png） */
    authSrc: string;
    /** 图片替代文本；留空时图片按装饰内容处理 */
    alt?: string;
  }>(),
  {
    alt: '',
  },
);

const displaySrc = ref('');
const loading = ref(false);
const failed = ref(false);
let objectUrl = '';
let requestController: AbortController | undefined;
let requestVersion = 0;
const retryAvailable = computed(() => failed.value && Boolean(props.authSrc));
const retryLabel = computed(() => `图片加载失败，重新加载${props.alt ? ` ${props.alt}` : ''}`);

function revokeObjectUrl(): void {
  if (!objectUrl) return;
  URL.revokeObjectURL(objectUrl);
  objectUrl = '';
}

function loadImg(): void {
  const currentVersion = ++requestVersion;
  requestController?.abort();
  requestController = undefined;
  revokeObjectUrl();
  displaySrc.value = '';
  loading.value = false;
  failed.value = false;

  if (!props.authSrc) {
    failed.value = true;
    return;
  }

  const controller = new AbortController();
  requestController = controller;
  loading.value = true;

  void getAuthImageBlob(props.authSrc, controller.signal)
    .then((blob) => {
      if (currentVersion !== requestVersion || controller.signal.aborted) return;
      objectUrl = URL.createObjectURL(blob);
      displaySrc.value = objectUrl;
    })
    .catch(() => {
      if (currentVersion !== requestVersion || controller.signal.aborted) return;
      failed.value = true;
      loading.value = false;
    })
    .finally(() => {
      if (requestController === controller) requestController = undefined;
    });
}

function handleImageLoad(event: Event): void {
  const image = event.target;
  if (!(image instanceof HTMLImageElement) || image.getAttribute('src') !== displaySrc.value) return;
  loading.value = false;
}

function handleImageError(event: Event): void {
  const image = event.target;
  if (!(image instanceof HTMLImageElement) || image.getAttribute('src') !== displaySrc.value) return;
  displaySrc.value = '';
  loading.value = false;
  failed.value = true;
  revokeObjectUrl();
}

watch(() => props.authSrc, loadImg, { immediate: true });

onBeforeUnmount(() => {
  requestVersion += 1;
  requestController?.abort();
  requestController = undefined;
  revokeObjectUrl();
});
</script>

<template>
  <img
    v-if="displaySrc"
    :key="displaySrc"
    :src="displaySrc"
    :alt="alt"
    :aria-busy="loading"
    @load="handleImageLoad"
    @error="handleImageError"
  />
  <span
    v-else
    class="auth-img-placeholder"
    :class="{ 'is-loading': loading, 'has-retry': retryAvailable }"
    :role="alt && !retryAvailable ? 'img' : undefined"
    :aria-label="alt && !retryAvailable ? `${alt}，${loading ? '图片加载中' : '图片加载失败'}` : undefined"
    :aria-hidden="alt || retryAvailable ? undefined : 'true'"
    :aria-busy="loading"
  >
    <Loading v-if="loading" class="auth-img-placeholder__icon is-loading" aria-hidden="true" />
    <button
      v-else-if="retryAvailable"
      type="button"
      class="auth-img-placeholder__retry"
      :aria-label="retryLabel"
      :title="retryLabel"
      @click.stop="loadImg"
    >
      <RefreshRight class="auth-img-placeholder__icon" aria-hidden="true" />
      <span class="auth-img-placeholder__retry-text">重试</span>
    </button>
    <Picture v-else class="auth-img-placeholder__icon" aria-hidden="true" />
  </span>
</template>

<style scoped>
.auth-img-placeholder {
  display: inline-flex;
  min-width: 1em;
  min-height: 1em;
  container-type: inline-size;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  vertical-align: middle;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
}

.auth-img-placeholder.is-loading {
  color: var(--el-color-primary);
}

.auth-img-placeholder__icon {
  width: 1em;
  height: 1em;
}

.auth-img-placeholder__retry {
  display: inline-flex;
  width: 36px;
  height: 36px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-border-radius-small, 2px);
  background: var(--el-bg-color);
  color: var(--el-color-primary);
  cursor: pointer;
  font: inherit;
}

.auth-img-placeholder__retry:focus-visible {
  outline: 2px solid var(--el-color-primary);
  outline-offset: -2px;
}

.auth-img-placeholder__retry:hover {
  background: var(--el-fill-color);
}

.auth-img-placeholder__retry-text {
  display: none;
}

@container (min-width: 96px) {
  .auth-img-placeholder__retry {
    width: auto;
    height: auto;
    gap: 6px;
    padding: 6px 10px;
  }

  .auth-img-placeholder__retry-text {
    display: inline;
  }
}

.auth-img-placeholder__icon.is-loading {
  animation: auth-img-spin 1s linear infinite;
}

@keyframes auth-img-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .auth-img-placeholder__icon.is-loading {
    animation: none;
  }
}
</style>
