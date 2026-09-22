<script setup lang="ts">
/**
 * LxIcon — 内置 SVG 图标（stroke 风格，currentColor 继承文字色）
 * 尺寸规范：16/18/20px 三档（DESIGN-SPEC §6）
 */
import { computed } from 'vue';
import { LX_ICONS } from './icons';

const props = withDefaults(
  defineProps<{
    /** 图标名（LX_ICONS 键） */
    name: string;
    /** 尺寸 px，默认 18 */
    size?: number;
  }>(),
  { size: 18 }
);

const paths = computed<string[]>(() => (LX_ICONS as Record<string, string[]>)[props.name] ?? []);
</script>

<template>
  <svg
    class="lx-icon"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path v-for="(d, i) in paths" :key="i" :d="d" />
  </svg>
</template>

<style scoped>
.lx-icon {
  display: inline-flex;
  flex-shrink: 0;
  vertical-align: middle;
}
</style>
