<script setup lang="ts">
/**
 * LxStatusDot — 业务状态指示圆点（全库状态表达第一公民，设计原则 P1）
 * 语义色映射：DESIGN-SPEC §2.1（全库契约，禁止使用方自行换色）
 */
import { computed } from 'vue';
import { LX_STATUS_COLOR, LX_LEGACY_CODE_STATUS, type LxStatus } from '../../tokens';
import type { LxStatusDotProps } from './types';

const props = withDefaults(defineProps<LxStatusDotProps>(), {
  status: 'offline',
  size: 8,
  pulse: true,
  statusDesc: '',
  showText: false,
});

// code 兼容层优先（@deprecated）
const currentStatus = computed<LxStatus>(() => {
  if (props.code != null) return LX_LEGACY_CODE_STATUS[props.code] ?? 'offline';
  return props.status;
});

const dotColor = computed(() => LX_STATUS_COLOR[currentStatus.value]);
const isBreathing = computed(() => props.pulse && currentStatus.value === 'online');
</script>

<template>
  <span class="lx-status-dot" :class="`lx-status-dot--${currentStatus}`">
    <span class="lx-status-dot__wrap" :style="{ width: size + 'px', height: size + 'px' }">
      <!-- 外扩呼吸层（在线态） -->
      <span v-if="isBreathing" class="lx-status-dot__ping" :style="{ background: dotColor }" />
      <!-- 实心圆点 -->
      <span class="lx-status-dot__dot" :style="{ background: dotColor }" />
    </span>
    <span v-if="showText" class="lx-status-dot__text">{{ statusDesc || currentStatus }}</span>
  </span>
</template>

<style scoped>
.lx-status-dot {
  display: inline-flex;
  align-items: center;
  gap: var(--lx-space-sm);
  font-size: 13px;
  line-height: 20px;
  color: var(--lx-text-regular);
}

.lx-status-dot__wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.lx-status-dot__dot {
  width: 100%;
  height: 100%;
  border-radius: 50%;
}

.lx-status-dot__ping {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  animation: lx-dot-ping 2.4s cubic-bezier(0, 0, 0.2, 1) infinite;
}

.lx-status-dot__text {
  color: var(--lx-text-regular);
  white-space: nowrap;
}

/* error 文本用语义深色（比 regular 更醒目但仍克制） */
.lx-status-dot--error .lx-status-dot__text {
  color: var(--lx-color-error);
}
.lx-status-dot--busy .lx-status-dot__text {
  color: var(--lx-color-warning-strong);
}
</style>
