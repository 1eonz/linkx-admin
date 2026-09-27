<script setup lang="ts">
import { ref } from 'vue';
import LxIcon from '../LxIcon/index.vue';
import { lxMessage } from '../LxMessage';
import type { LxCodeSlotProps } from './types';

defineOptions({ name: 'LxCodeSlot' });

const props = withDefaults(defineProps<LxCodeSlotProps>(), {
  copyable: true,
  ellipsis: false,
});

const emit = defineEmits<{ copy: [value: string] }>();
const contentRef = ref<HTMLElement>();

async function copy() {
  if (!props.copyable) return;
  const value = contentRef.value?.textContent?.trim() ?? '';
  if (!value) return;

  try {
    if (!navigator.clipboard) throw new Error('Clipboard API is unavailable');
    await navigator.clipboard.writeText(value);
    emit('copy', value);
    lxMessage.success('已复制');
  } catch {
    lxMessage.error('复制失败，请手动复制');
  }
}
</script>

<template>
  <button
    v-if="copyable"
    class="lx-code-slot lx-code-slot--copyable"
    :class="{ 'is-ellipsis': ellipsis }"
    type="button"
    title="点击复制"
    @click="copy"
  >
    <span ref="contentRef" class="lx-code-slot__content"><slot /></span>
    <LxIcon name="copy" :size="14" class="lx-code-slot__icon" />
  </button>
  <span v-else ref="contentRef" class="lx-code-slot" :class="{ 'is-ellipsis': ellipsis }"><slot /></span>
</template>

<style scoped>
.lx-code-slot {
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  gap: var(--lx-space-xs);
  padding: 2px 6px;
  border: 1px solid var(--lx-border);
  border-radius: var(--lx-radius-sm);
  background: var(--lx-color-info-light);
  color: var(--lx-text-regular);
  font-family: var(--lx-font-mono);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  line-height: 18px;
}

.lx-code-slot--copyable {
  cursor: pointer;
  transition: color var(--lx-transition), border-color var(--lx-transition), background-color var(--lx-transition);
}

.lx-code-slot--copyable:hover {
  border-color: var(--lx-color-primary);
  background: var(--lx-color-primary-light);
  color: var(--lx-color-primary);
}

.lx-code-slot--copyable:focus-visible {
  outline: 2px solid var(--lx-color-primary);
  outline-offset: 2px;
}

.lx-code-slot__content {
  min-width: 0;
}

.lx-code-slot.is-ellipsis .lx-code-slot__content {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.lx-code-slot__icon {
  flex-shrink: 0;
  opacity: 0.72;
}
</style>
