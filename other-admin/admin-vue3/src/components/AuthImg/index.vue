<script setup lang="ts">
/**
 * AuthImg - 鉴权图片组件
 *
 * 功能特性：
 * - 通过 XHR 拉取需要鉴权的图片资源，避免在 URL 中暴露 Token
 * - 自动携带 Authorization 请求头（读取本地 Token）
 * - 将响应转为 Blob 并通过 ObjectURL 渲染，避免 base64 性能损耗
 * - 支持 /static 前缀自动拼接 /api 网关路径
 * - 支持 props.authSrc 变化时自动重新加载
 * - 组件卸载时由浏览器自动回收 ObjectURL（旧 URL 在重载前主动释放）
 *
 * @example 基础用法
 * ```vue
 * <AuthImg auth-src="/static/avatar.png" />
 * ```
 *
 * Props：
 * - authSrc: string，鉴权图片地址（相对路径，如 /static/xxx.png），必填
 *
 * Events：无
 *
 * Slots：无
 *
 * Methods：无
 */
import { ref, watch, onMounted } from 'vue';

import { getToken } from '@/utils/auth';

defineOptions({ name: 'AuthImg' });

const props = defineProps<{
  /** 鉴权图片地址（相对路径，如 /static/xxx.png） */
  authSrc: string;
}>();

const imgRef = ref<HTMLImageElement>();
const objectUrl = ref<string>('');

// XHR 拉取 blob 后赋值 img.src
// URL 拼接规则：/static 开头走 /api 前缀，否则直接拼接 VITE_BASE_API
function buildUrl(authSrc: string): string {
  const baseUrl = (import.meta.env.VITE_BASE_API as string) ?? '';
  return authSrc.startsWith('/static') ? `${baseUrl}/api${authSrc}` : `${baseUrl}${authSrc}`;
}

function loadImg(): void {
  if (!props.authSrc) return;
  const token = getToken();
  const url = buildUrl(props.authSrc);
  const xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);
  xhr.responseType = 'blob';
  xhr.setRequestHeader('Authorization', `token ${token}`);
  xhr.onload = () => {
    if (xhr.status === 200 && imgRef.value) {
      // 释放旧的 objectUrl
      if (objectUrl.value) {
        URL.revokeObjectURL(objectUrl.value);
      }
      const blob = new Blob([xhr.response]);
      objectUrl.value = URL.createObjectURL(blob);
      imgRef.value.src = objectUrl.value;
    }
  };
  xhr.send();
}

watch(
  () => props.authSrc,
  () => loadImg(),
);

onMounted(loadImg);
</script>

<template>
  <img ref="imgRef" />
</template>
