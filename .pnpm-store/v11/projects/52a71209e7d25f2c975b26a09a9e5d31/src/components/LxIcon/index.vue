<script setup lang="ts">
/**
 * LxIcon — 内置 SVG 图标（stroke 风格，currentColor 继承文字色）
 * 尺寸规范：16/18/20px 三档（DESIGN-SPEC §6）
 */
import { computed, useAttrs } from 'vue'
import {
  getLxIconPaths,
  LX_ICON_MOTION_NAMES,
  resolveLxIconName,
  type LxIconName,
} from './icons'

const props = withDefaults(
  defineProps<{
    /** 图标名（支持标准键和兼容别名） */
    name: LxIconName
    /** 尺寸 px，默认 18 */
    size?: number
    /** 为图标提供可访问名称；传入后不再作为装饰图标隐藏 */
    label?: string
    /** 加载图标的旋转状态（也可供其他图标使用） */
    spin?: boolean
  }>(),
  { size: 18, label: '', spin: false },
)

defineOptions({ inheritAttrs: false, name: 'LxIcon' })

const attrs = useAttrs()
const resolvedName = computed(() => resolveLxIconName(props.name))
const paths = computed<readonly string[]>(
  () => getLxIconPaths(resolvedName.value ?? 'circle-question') ?? [],
)
const motionNames = new Set<string>(LX_ICON_MOTION_NAMES)
const motionName = computed(() =>
  motionNames.has(props.name) ? resolvedName.value : undefined,
)
const isSpinning = computed(() => props.spin || props.name === 'loading')
const accessibleLabel = computed(
  () => props.label || (resolvedName.value ? '' : `未知图标：${props.name}`),
)
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
    :class="{ 'is-spinning': isSpinning }"
    :data-icon-name="name"
    :data-lx-motion="motionName"
    :aria-hidden="accessibleLabel ? undefined : 'true'"
    :aria-label="accessibleLabel || undefined"
    :role="accessibleLabel ? 'img' : undefined"
    :data-icon-invalid="resolvedName ? undefined : 'true'"
    v-bind="attrs"
  >
    <title v-if="accessibleLabel">{{ accessibleLabel }}</title>
    <path v-for="(d, i) in paths" :key="i" :d="d" />
  </svg>
</template>

<style scoped>
.lx-icon {
  display: inline-flex;
  flex-shrink: 0;
  vertical-align: middle;
}

.lx-icon[data-lx-motion] {
  transform-origin: center;
  transition:
    transform 0.25s cubic-bezier(0.16, 1, 0.3, 1),
    filter 0.25s ease;
  --lx-icon-hover-transform: scale(1.18);
  --lx-icon-hover-filter: drop-shadow(0 2px 6px rgb(0 96 169 / 28%));
}

.lx-icon[data-lx-motion='delete'] {
  --lx-icon-hover-animation: lx-icon-delete-shake 0.35s ease-in-out;
  --lx-icon-hover-transform: scale(1.15);
}

.lx-icon[data-lx-motion='edit'] {
  --lx-icon-hover-transform: scale(1.18) translate(1px, -1px) rotate(-5deg);
}

.lx-icon[data-lx-motion='plus'] {
  --lx-icon-hover-transform: scale(1.18) rotate(90deg);
}

.lx-icon[data-lx-motion='refresh'] {
  --lx-icon-hover-transform: scale(1.15) rotate(180deg);
}

.lx-icon[data-lx-motion='undo'] {
  --lx-icon-hover-transform: scale(1.15) rotate(-30deg) translateX(-1px);
}

.lx-icon[data-lx-motion='download'] {
  --lx-icon-hover-transform: scale(1.15) translateY(2px);
}

.lx-icon[data-lx-motion='upload'] {
  --lx-icon-hover-transform: scale(1.15) translateY(-2px);
}

.lx-icon[data-lx-motion='eye'] {
  --lx-icon-hover-transform: scale(1.22);
}

.lx-icon[data-lx-motion='loading'] {
  --lx-icon-hover-animation: lx-icon-loading-hover 0.9s linear infinite;
  --lx-icon-hover-transform: scale(1.15);
}

.lx-icon[data-lx-motion='more'] {
  --lx-icon-hover-transform: scale(1.2) translateY(-1px);
}

.lx-icon[data-lx-motion='folder'] {
  --lx-icon-hover-transform: scale(1.15) skewX(-2deg);
}

.lx-icon[data-lx-motion='folder-open'] {
  --lx-icon-hover-transform: scale(1.16) translateY(-1px);
}

.lx-icon[data-lx-motion='warning'] {
  --lx-icon-hover-animation: lx-icon-warning-nudge 0.4s
    cubic-bezier(0.16, 1, 0.3, 1);
}

.lx-icon[data-lx-motion='arrow-up'] {
  --lx-icon-hover-transform: translateY(-3px);
}

.lx-icon[data-lx-motion='arrow-down'] {
  --lx-icon-hover-transform: translateY(3px);
}

.lx-icon[data-lx-motion='arrow-left'] {
  --lx-icon-hover-transform: translateX(-3px);
}

.lx-icon[data-lx-motion='arrow-right'] {
  --lx-icon-hover-transform: translateX(3px);
}

.lx-icon[data-lx-motion='caret-down'] {
  --lx-icon-hover-transform: translateY(2px) scale(1.1);
}

.lx-icon[data-lx-motion='calendar'] {
  --lx-icon-hover-transform: scale(1.12) translateY(-1px);
}

.lx-icon[data-lx-motion='clock'] {
  --lx-icon-hover-transform: rotate(45deg);
}

.lx-icon[data-lx-motion='phone'] {
  --lx-icon-hover-animation: lx-icon-phone-ring 0.6s ease-in-out;
}

.lx-icon[data-lx-motion='email'] {
  --lx-icon-hover-animation: lx-icon-email-lift 0.45s
    cubic-bezier(0.16, 1, 0.3, 1);
}

.lx-icon[data-lx-motion='share'] {
  --lx-icon-hover-transform: scale(1.12) rotate(12deg);
}

.lx-icon[data-lx-motion='copy'] {
  --lx-icon-hover-transform: translate(1px, -1px) scale(1.08);
}

.lx-icon[data-lx-motion='lock'] {
  --lx-icon-hover-animation: lx-icon-lock 0.4s ease-out;
}

.lx-icon[data-lx-motion='unlock'] {
  --lx-icon-hover-animation: lx-icon-unlock 0.45s ease-out;
}

.lx-icon[data-lx-motion='power'] {
  --lx-icon-hover-transform: scale(1.15);
  --lx-icon-hover-filter: drop-shadow(0 0 3px rgb(0 96 169 / 40%));
}

.lx-icon[data-lx-motion='switch'] {
  --lx-icon-hover-transform: scale(1.1);
}

.lx-icon[data-lx-motion='close'] {
  --lx-icon-hover-transform: rotate(90deg);
}

.lx-icon[data-lx-motion='star'] {
  --lx-icon-hover-transform: scale(1.18) rotate(10deg);
}

.lx-icon[data-lx-motion='grid'] {
  --lx-icon-hover-transform: scale(1.1);
}

.lx-icon[data-lx-motion='list'] {
  --lx-icon-hover-transform: translateX(2px);
}

.lx-icon[data-lx-motion]:is(:hover, :focus-visible),
:global(
  :is(button, a, [role='button']):is(:hover, :focus-visible, :active)
    .lx-icon[data-lx-motion]
) {
  animation: var(--lx-icon-hover-animation, none);
  filter: var(--lx-icon-hover-filter, none);
  transform: var(--lx-icon-hover-transform, scale(1.15));
}

@keyframes lx-icon-delete-shake {
  0%,
  100% {
    transform: scale(1.15) rotate(0deg);
  }
  25% {
    transform: scale(1.15) rotate(-6deg);
  }
  75% {
    transform: scale(1.15) rotate(6deg);
  }
}

@keyframes lx-icon-loading-hover {
  from {
    transform: scale(1.15) rotate(0deg);
  }
  to {
    transform: scale(1.15) rotate(360deg);
  }
}

@keyframes lx-icon-warning-nudge {
  0%,
  100% {
    transform: scale(1.15) translateY(0);
  }
  50% {
    transform: scale(1.18) translateY(-3px);
  }
}

@keyframes lx-icon-phone-ring {
  0%,
  100% {
    transform: rotate(0deg);
  }
  20% {
    transform: rotate(-8deg);
  }
  40% {
    transform: rotate(8deg);
  }
  60% {
    transform: rotate(-4deg);
  }
  80% {
    transform: rotate(4deg);
  }
}

@keyframes lx-icon-email-lift {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-3px) scale(1.05);
  }
}

@keyframes lx-icon-lock {
  0%,
  100% {
    transform: scale(1);
  }
  40% {
    transform: scale(0.92);
  }
  70% {
    transform: scale(1.08);
  }
}

@keyframes lx-icon-unlock {
  0% {
    transform: scale(1);
  }
  50% {
    transform: translateY(-2px) rotate(-6deg);
  }
  100% {
    transform: translateY(-1px) rotate(0deg);
  }
}

.lx-icon.is-spinning {
  animation: lx-icon-spin 0.8s linear infinite;
}

@keyframes lx-icon-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .lx-icon[data-lx-motion],
  .lx-icon.is-spinning {
    animation: none !important;
    transition: none !important;
    transform: none !important;
  }
}
</style>
