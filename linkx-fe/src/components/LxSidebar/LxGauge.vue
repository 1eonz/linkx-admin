<script setup lang="ts">
/**
 * LxGauge — SVG 圆环仪表（侧边栏底部 SLA 指示，源自 stitch_侧边栏 _1 规格）
 */
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    /** 数值 0-100 */
    value?: number;
    /** 直径 px */
    size?: number;
    /** 环宽 px */
    stroke?: number;
    /** 中心数值文本 */
    label?: string;
    /** 环填充色（CSS 变量或色值） */
    color?: string;
  }>(),
  { value: 99.9, size: 40, stroke: 3, label: '', color: 'var(--lx-color-success)' }
);

const radius = computed(() => (props.size - props.stroke) / 2);
const circumference = computed(() => 2 * Math.PI * radius.value);
const dashOffset = computed(() => circumference.value * (1 - Math.min(props.value, 100) / 100));
</script>

<template>
  <span class="lx-gauge" :style="{ width: size + 'px', height: size + 'px' }">
    <svg :width="size" :height="size" :viewBox="`0 0 ${size} ${size}`">
      <!-- 轨道 -->
      <circle
        class="lx-gauge__track"
        :cx="size / 2"
        :cy="size / 2"
        :r="radius"
        :stroke-width="stroke"
        fill="none"
      />
      <!-- 数值弧（起点 12 点钟方向，顺时针） -->
      <circle
        class="lx-gauge__arc"
        :cx="size / 2"
        :cy="size / 2"
        :r="radius"
        :stroke-width="stroke"
        :stroke="color"
        fill="none"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="dashOffset"
      />
    </svg>
    <span class="lx-gauge__value" :style="{ color }">{{ label || value }}</span>
  </span>
</template>

<style scoped>
.lx-gauge {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.lx-gauge svg {
  transform: rotate(-90deg);
}

.lx-gauge__track {
  stroke: var(--lx-sidebar-guide);
}

.lx-gauge__arc {
  transition: stroke-dashoffset 0.6s cubic-bezier(0.645, 0.045, 0.355, 1);
}

.lx-gauge__value {
  position: absolute;
  font-size: 11px;
  font-weight: 500;
  font-family: var(--lx-font-mono);
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.2px;
}
</style>
