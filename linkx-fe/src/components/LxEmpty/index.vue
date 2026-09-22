<script setup lang="ts">
/**
 * LxEmpty — 空态兜底（极简战术风格：虚线六边形 + 文案）
 */
import type { LxEmptyProps } from './types';

withDefaults(defineProps<LxEmptyProps>(), {
  description: '暂无数据',
  size: 'default',
});
</script>

<template>
  <div class="lx-empty" :class="`lx-empty--${size}`" role="status">
    <svg class="lx-empty__icon" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path
        d="M14 8h20l8 8v24a4 4 0 01-4 4H14a4 4 0 01-4-4V12a4 4 0 014-4z"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-dasharray="3 3"
      />
      <path d="M34 8v8h8" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3 3" />
      <path d="M19 26h10M19 32h6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
    </svg>
    <p class="lx-empty__desc">{{ description }}</p>
    <slot />
  </div>
</template>

<style scoped>
.lx-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--lx-space-md);
  padding: var(--lx-space-xl) 0;
  color: var(--lx-text-secondary);
}

.lx-empty--compact {
  padding: var(--lx-space-lg) 0;
}

.lx-empty__icon {
  width: 48px;
  height: 48px;
  color: var(--lx-border);
}

.lx-empty--compact .lx-empty__icon {
  width: 36px;
  height: 36px;
}

.lx-empty__desc {
  margin: 0;
  font-size: 12px;
}
</style>
