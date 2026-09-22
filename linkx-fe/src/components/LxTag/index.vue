<script setup lang="ts">
/**
 * LxTag — 浅底深字标签（stitch 检索条件胶囊规格：px-2 py-0.5 text-xs rounded）
 * 使用边界：需携带文字信息且不能从行内推断时（P1 例外），状态优先 LxStatusDot
 */
import type { LxTagProps } from './types';

withDefaults(defineProps<LxTagProps>(), {
  type: 'info',
  closable: false,
  size: 'default',
  disabled: false,
});

const emit = defineEmits<{ close: [e: MouseEvent] }>();
</script>

<template>
  <span class="lx-tag" :class="[`lx-tag--${type}`, `lx-tag--${size}`, { 'is-disabled': disabled }]">
    <span class="lx-tag__content"><slot /></span>
    <span v-if="closable && !disabled" class="lx-tag__close" role="button" aria-label="关闭" @click="emit('close', $event)">×</span>
  </span>
</template>

<style scoped>
.lx-tag {
  display: inline-flex;
  align-items: center;
  gap: var(--lx-space-xs);
  padding: 1px var(--lx-space-sm);
  border-radius: var(--lx-radius-sm);
  font-size: 12px;
  font-weight: 500;
  line-height: 18px;
  white-space: nowrap;
  border: 1px solid transparent;
}

.lx-tag--small {
  font-size: 11px;
  line-height: 16px;
  padding: 0 6px;
}

/* 深浅成对（禁止交叉混搭，DESIGN-SPEC §3.2） */
.lx-tag--success {
  color: #529b2e;
  background: var(--lx-color-success-light);
  border-color: #e1f3d8;
}
.lx-tag--warning {
  color: var(--lx-color-warning-strong);
  background: var(--lx-color-warning-light);
  border-color: #f5dab1;
}
.lx-tag--error {
  color: #c45656;
  background: var(--lx-color-error-light);
  border-color: #fbc4c4;
}
.lx-tag--info {
  color: var(--lx-text-regular);
  background: var(--lx-color-info-light);
  border-color: #d3d4d6;
}

.lx-tag.is-disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.lx-tag__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  font-size: 12px;
  cursor: pointer;
  transition: background-color var(--lx-transition);
}

.lx-tag__close:hover {
  background: rgba(0, 0, 0, 0.15);
}
</style>
