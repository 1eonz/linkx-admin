<script setup lang="ts">
/**
 * LxFormErrorBanner — 表单校验阻断横幅（内联，非浮层）
 * 视觉源：stitch Modals & Feedback · FormErrorBanner
 *   浅红底 + 深红文字 + report 图标顶部对齐；用于表单提交前的批量校验失败提示
 */
import type { LxFormErrorBannerProps } from './types';
import LxIcon from '../LxIcon/index.vue';

defineProps<LxFormErrorBannerProps>();
</script>

<template>
  <div class="lx-error-banner" role="alert">
    <LxIcon name="report" :size="18" class="lx-error-banner__icon" />
    <div class="lx-error-banner__body">
      <p class="lx-error-banner__title">{{ title }}</p>
      <p v-if="description" class="lx-error-banner__desc">{{ description }}</p>
      <slot />
    </div>
  </div>
</template>

<style scoped>
.lx-error-banner {
  display: flex;
  align-items: flex-start; /* stitch：图标与文字顶部对齐 */
  gap: var(--lx-space-sm);
  padding: var(--lx-space-md);
  border-radius: var(--lx-radius-md);
  background: var(--lx-color-error-light);
  box-shadow: var(--lx-shadow-card);
}

.lx-error-banner__icon {
  color: var(--lx-color-error-strong);
  flex-shrink: 0;
  margin-top: 1px;
}

.lx-error-banner__body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.lx-error-banner__title {
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  color: var(--lx-color-error-strong);
}

.lx-error-banner__desc {
  margin: 0;
  font-size: 11px;
  line-height: 1.6;
  color: var(--lx-color-error-strong);
  opacity: 0.85;
}
</style>
