<script setup lang="ts">
/**
 * LxTag — 浅底深字标签（stitch 检索条件胶囊规格：px-2 py-0.5 text-xs rounded）
 * 使用边界：需携带文字信息且不能从行内推断时（P1 例外），状态优先 LxStatusDot
 */
import type { LxTagProps } from './types'

withDefaults(defineProps<LxTagProps>(), {
  type: 'info',
  closable: false,
  size: 'default',
  disabled: false,
})

const emit = defineEmits<{ close: [e: MouseEvent] }>()
</script>

<template>
  <span
    class="lx-tag"
    :class="[`lx-tag--${type}`, `lx-tag--${size}`, { 'is-disabled': disabled }]"
    :aria-disabled="disabled ? 'true' : undefined"
  >
    <span class="lx-tag__content"><slot /></span>
    <button
      v-if="closable && !disabled"
      class="lx-tag__close"
      type="button"
      aria-label="关闭"
      @click.stop="emit('close', $event)"
    >
      ×
    </button>
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
.lx-tag--primary {
  color: var(--lx-color-primary);
  background: var(--lx-color-primary-light);
  border-color: var(--lx-color-primary-light);
}
.lx-tag--success {
  /* 语义由浅底/边框及文字本身表达，标签字色维持正文对比度。 */
  color: var(--lx-text-regular);
  background: var(--lx-color-success-light);
  border-color: var(--lx-color-success-border);
}
.lx-tag--warning {
  /* 小字号浅色底场景使用正文色，避免警示色文字低于 AA 对比度。 */
  color: var(--lx-text-regular);
  background: var(--lx-color-warning-light);
  border-color: var(--lx-color-warning-border);
}
.lx-tag--error {
  color: var(--lx-color-error-strong);
  background: var(--lx-color-error-light);
  border-color: var(--lx-color-error-border);
}
.lx-tag--info {
  color: var(--lx-text-regular);
  background: var(--lx-color-info-light);
  border-color: var(--lx-color-info-border);
}

.lx-tag.is-disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.lx-tag__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  min-height: 24px;
  margin-block: -3px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: inherit;
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
  transition: background-color var(--lx-transition);
}

.lx-tag__close:hover {
  background: var(--lx-tag-close-hover-bg);
}

.lx-tag__close:focus-visible {
  outline: 2px solid var(--lx-color-primary);
  outline-offset: 1px;
}

@media (prefers-reduced-motion: reduce) {
  .lx-tag__close {
    transition: none;
  }
}
</style>
