<script setup lang="ts">
/**
 * LxStatusDot — 业务状态指示圆点（全库状态表达第一公民，设计原则 P1）
 * 语义色映射：DESIGN-SPEC §2.1（全库契约，禁止使用方自行换色）
 */
import { computed } from 'vue'

import type { LxStatusDotProps } from './types'
import {
  LX_STATUS_COLOR,
  LX_LEGACY_CODE_STATUS,
  type LxStatus,
} from '../../tokens'

const props = withDefaults(defineProps<LxStatusDotProps>(), {
  status: 'offline',
  size: 8,
  pulse: true,
  statusDesc: '',
  showText: false,
})

// code 兼容层优先（@deprecated）
const currentStatus = computed<LxStatus>(() => {
  if (props.code != null) return LX_LEGACY_CODE_STATUS[props.code] ?? 'offline'
  return props.status
})

const dotColor = computed(() => LX_STATUS_COLOR[currentStatus.value])
// 保留任意合法正数尺寸；无效输入回退默认值，避免圆点消失或产生非法 CSS。
const dotSize = computed(() =>
  Number.isFinite(props.size) && props.size > 0 ? props.size : 8,
)
const statusLabel = computed(() => {
  if (props.statusDesc) return props.statusDesc

  const labels: Record<LxStatus, string> = {
    online: '在线',
    processing: '处理中',
    busy: '忙碌',
    error: '错误',
    offline: '离线',
  }

  return labels[currentStatus.value]
})
const isBreathing = computed(
  () => props.pulse && currentStatus.value === 'online',
)
</script>

<template>
  <span
    class="lx-status-dot"
    :class="`lx-status-dot--${currentStatus}`"
    :aria-label="statusLabel"
    role="img"
  >
    <span
      class="lx-status-dot__wrap"
      :style="{ width: dotSize + 'px', height: dotSize + 'px' }"
    >
      <!-- 直接让实心圆点呼吸，避免常亮底层抵消透明度变化。 -->
      <span
        class="lx-status-dot__dot"
        :class="{ 'lx-status-dot__ping': isBreathing }"
        :style="{ background: dotColor }"
      />
    </span>
    <span v-if="showText" class="lx-status-dot__text">{{ statusLabel }}</span>
  </span>
</template>

<style scoped>
.lx-status-dot {
  display: inline-flex;
  min-width: 0;
  max-width: 100%;
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
  animation: lx-hud-pulse 3.5s ease-in-out infinite;
}

.lx-status-dot__text {
  min-width: 0;
  color: var(--lx-text-regular);
  white-space: normal;
  overflow-wrap: anywhere;
}

/* 状态文字保持正文对比度；语义色由圆点单独承载。 */

@media (prefers-reduced-motion: reduce) {
  .lx-status-dot__ping {
    animation: none;
  }
}
</style>
