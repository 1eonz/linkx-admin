<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  useId,
  watch,
} from 'vue'

import type { LxSplitLayoutProps } from './types'
import LxIcon from '../LxIcon/index.vue'

defineOptions({ name: 'LxSplitLayout' })

const props = withDefaults(defineProps<LxSplitLayoutProps>(), {
  asideWidth: 280,
  resizable: false,
  collapsed: false,
})

const emit = defineEmits<{
  'update:collapsed': [value: boolean]
  resize: [width: number]
}>()

const layoutRef = ref<HTMLElement>()
const toggleRef = ref<HTMLButtonElement>()
const asideId = `lx-split-layout-aside-${useId()}`
const stacked = ref(false)
const width = ref(
  typeof props.asideWidth === 'number'
    ? props.asideWidth
    : Number.parseInt(props.asideWidth, 10) || 280,
)
const hasResized = ref(false)
const containerWidth = ref(1000)
const layoutChromeWidth = ref(84)
const maxAsideWidth = computed(() =>
  Math.max(
    200,
    Math.min(480, containerWidth.value - 320 - layoutChromeWidth.value),
  ),
)
let stopResize: (() => void) | undefined
let resizeObserver: ResizeObserver | undefined
let stackedMedia: MediaQueryList | undefined

function returnFocusIfLost(previous: Element | null) {
  void nextTick(() => {
    const current = document.activeElement
    // 宿主可能在post watcher中主动聚焦主区，不能用迟到的回收覆盖其有效选择。
    if (
      current !== previous &&
      current !== document.body &&
      current !== document.documentElement
    )
      return
    toggleRef.value?.focus()
  })
}

const asideStyle = computed(() => ({
  width: props.collapsed
    ? '0px'
    : !hasResized.value && typeof props.asideWidth === 'string'
      ? props.asideWidth
      : `${width.value}px`,
}))

// 字符串宽度可为百分比或 CSS 长度；键盘与拖拽事件统一回传实测像素。
function measuredWidth(): number {
  const measured = layoutRef.value
    ?.querySelector('aside')
    ?.getBoundingClientRect().width
  return measured && measured > 0 ? measured : width.value
}

function constrainedWidth(value: number): number {
  return Math.max(200, Math.min(maxAsideWidth.value, value))
}

function setWidth(value: number) {
  width.value = constrainedWidth(value)
  hasResized.value = true
  emit('resize', width.value)
}

function toggle() {
  emit('update:collapsed', !props.collapsed)
}

function syncLayoutWidth() {
  const layout = layoutRef.value
  if (!layout) return
  const wasStacked = stacked.value

  if (layout.clientWidth > 0) {
    const layoutStyle = getComputedStyle(layout)
    const horizontalPadding =
      (Number.parseFloat(layoutStyle.paddingLeft) || 0) +
      (Number.parseFloat(layoutStyle.paddingRight) || 0)
    containerWidth.value = layout.clientWidth - horizontalPadding
    // 侧栏最少200px、主区保留320px，另为控制按钮与间隔预留空间。
    const nextStacked =
      containerWidth.value < 600 || Boolean(stackedMedia?.matches)
    if (nextStacked && !stacked.value) {
      const focusedResizer =
        layout.querySelector('.lx-split-layout__resizer') ===
        document.activeElement
      stopResize?.()
      if (focusedResizer) returnFocusIfLost(document.activeElement)
    }
    stacked.value = nextStacked
  }

  const aside = layout.querySelector('aside')
  const main = layout.querySelector('.lx-split-layout__main')
  const visibleItems = Array.from(layout.children).filter(
    (item): item is HTMLElement =>
      item instanceof HTMLElement && getComputedStyle(item).display !== 'none',
  )
  const chromeItems = visibleItems.filter(
    (item) => item !== aside && item !== main,
  )
  const gap = Number.parseFloat(getComputedStyle(layout).columnGap) || 0
  const measuredChromeWidth = chromeItems.reduce((total, item) => {
    const style = getComputedStyle(item)
    const margins =
      (Number.parseFloat(style.marginLeft) || 0) +
      (Number.parseFloat(style.marginRight) || 0)
    return total + Math.max(0, item.getBoundingClientRect().width + margins)
  }, 0)
  layoutChromeWidth.value =
    measuredChromeWidth + gap * Math.max(visibleItems.length - 1, 0)

  const resizer = layout.querySelector<HTMLElement>('.lx-split-layout__resizer')
  const isStacked = resizer
    ? getComputedStyle(resizer).display === 'none'
    : false
  if (props.collapsed || stacked.value) return
  // 从堆叠恢复时本轮DOM仍可能是全宽侧栏，等桌面样式落地再测量，避免覆盖保存宽度。
  if (wasStacked) {
    void nextTick(syncLayoutWidth)
    return
  }
  if (isStacked) return

  // 数字和交互宽度以模型为准，避免微过渡中的旧几何把父级刚回传的值覆盖。
  // 只有尚未调整的CSS字符串宽度需要从布局换算成像素。
  const currentWidth =
    hasResized.value || typeof props.asideWidth === 'number'
      ? width.value
      : measuredWidth()
  if (currentWidth <= 0) return

  if (props.resizable) {
    const nextWidth = constrainedWidth(currentWidth)
    if (nextWidth !== currentWidth) {
      width.value = nextWidth
      hasResized.value = true
      emit('resize', nextWidth)
    } else if (!hasResized.value) {
      width.value = currentWidth
    }
    return
  }

  width.value = currentWidth
  hasResized.value = false
}

function beginResize(event: PointerEvent) {
  if (
    !props.resizable ||
    props.collapsed ||
    stacked.value ||
    event.button !== 0 ||
    event.isPrimary === false
  )
    return
  if (!(event.currentTarget instanceof HTMLElement)) return
  if (stopResize) return
  event.preventDefault()
  const target = event.currentTarget
  target.focus({ preventScroll: true })
  const pointerId = event.pointerId
  const startX = event.clientX
  const startWidth = measuredWidth()
  target.setPointerCapture?.(pointerId)

  const move = (moveEvent: PointerEvent) => {
    if (moveEvent.pointerId !== pointerId) return
    if (
      !props.resizable ||
      props.collapsed ||
      stacked.value ||
      stackedMedia?.matches
    ) {
      stopResize?.()
      return
    }
    setWidth(startWidth + moveEvent.clientX - startX)
  }
  const end = (endEvent?: PointerEvent) => {
    if (endEvent && endEvent.pointerId !== pointerId) return
    window.removeEventListener('pointermove', move)
    window.removeEventListener('pointerup', end)
    window.removeEventListener('pointercancel', end)
    target.removeEventListener('lostpointercapture', end)
    stopResize = undefined
    if (target.hasPointerCapture?.(pointerId))
      target.releasePointerCapture?.(pointerId)
  }
  stopResize = () => end()
  window.addEventListener('pointermove', move)
  window.addEventListener('pointerup', end)
  window.addEventListener('pointercancel', end)
  target.addEventListener('lostpointercapture', end)
}

function resizeBy(amount: number) {
  if (!props.resizable || props.collapsed || stacked.value) return
  setWidth(measuredWidth() + amount)
}

function resizeTo(value: number) {
  if (!props.resizable || props.collapsed || stacked.value) return
  setWidth(value)
}

watch(
  () => props.asideWidth,
  (value) => {
    const requestedWidth =
      typeof value === 'number'
        ? value
        : Number.parseFloat(value) || width.value
    width.value = requestedWidth
    hasResized.value = false
    if (props.resizable && !props.collapsed) nextTick(syncLayoutWidth)
  },
  // 父级回传resize结果时先更新宽度，再渲染；post会先把旧宽度写回DOM并被重测覆盖。
  { flush: 'pre' },
)

watch(
  () => [props.resizable, props.collapsed],
  () => {
    const layout = layoutRef.value
    const focus = document.activeElement
    const hidesFocusedAside =
      props.collapsed &&
      focus &&
      layout?.querySelector('aside')?.contains(focus)
    const hidesFocusedResizer =
      (!props.resizable || props.collapsed) &&
      layout?.querySelector('.lx-split-layout__resizer') === focus
    if (!props.resizable || props.collapsed) stopResize?.()
    if (hidesFocusedAside || hidesFocusedResizer) returnFocusIfLost(focus)
    void nextTick(syncLayoutWidth)
  },
  { flush: 'pre' },
)

onMounted(() => {
  if (typeof window.matchMedia === 'function') {
    stackedMedia = window.matchMedia('(max-width: 767px)')
    stackedMedia.addEventListener?.('change', syncLayoutWidth)
  }
  syncLayoutWidth()
  if (layoutRef.value && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(syncLayoutWidth)
    resizeObserver.observe(layoutRef.value)
  }
})
onBeforeUnmount(() => {
  stopResize?.()
  resizeObserver?.disconnect()
  stackedMedia?.removeEventListener?.('change', syncLayoutWidth)
})
</script>

<template>
  <section
    ref="layoutRef"
    class="lx-split-layout"
    :class="{
      'is-collapsed': collapsed,
      'is-resizable': resizable && !collapsed,
      'is-stacked': stacked,
    }"
  >
    <aside :id="asideId" class="lx-split-layout__aside" :style="asideStyle">
      <div class="lx-split-layout__aside-content">
        <slot name="aside" />
      </div>
    </aside>
    <div
      v-if="resizable && !collapsed"
      class="lx-split-layout__resizer"
      role="separator"
      aria-label="调整侧栏宽度"
      aria-orientation="vertical"
      :aria-valuenow="Math.round(width)"
      aria-valuemin="200"
      :aria-valuemax="maxAsideWidth"
      :aria-valuetext="`${Math.round(width)} 像素`"
      tabindex="0"
      @pointerdown="beginResize"
      @keydown.left.prevent="resizeBy(-8)"
      @keydown.right.prevent="resizeBy(8)"
      @keydown.home.prevent="resizeTo(200)"
      @keydown.end.prevent="resizeTo(maxAsideWidth)"
    />
    <button
      ref="toggleRef"
      class="lx-split-layout__toggle"
      type="button"
      :aria-label="collapsed ? '展开侧栏' : '收起侧栏'"
      :aria-controls="asideId"
      :aria-expanded="!collapsed"
      @click="toggle"
    >
      <LxIcon :name="collapsed ? 'chevron-right' : 'chevron-left'" :size="16" />
    </button>
    <div class="lx-split-layout__main">
      <slot />
    </div>
  </section>
</template>

<style scoped>
.lx-split-layout {
  display: grid;
  grid-template-columns: auto auto minmax(0, 1fr);
  min-width: 0;
  gap: var(--lx-space-lg);
}

.lx-split-layout.is-resizable {
  grid-template-columns: auto auto auto minmax(0, 1fr);
}

.lx-split-layout.is-collapsed {
  grid-template-columns: auto minmax(0, 1fr);
}

.lx-split-layout__aside {
  min-width: 0;
  overflow: hidden;
  /* 调宽需即时跟手，也避免全局减少动效的微时长激活默认all过渡影响尺寸测量。 */
  transition-property: none;
}

.lx-split-layout.is-collapsed .lx-split-layout__aside {
  display: none;
}

.lx-split-layout__aside-content {
  min-width: 200px;
}

.lx-split-layout__resizer {
  position: relative;
  display: grid;
  width: 24px;
  margin-inline: -10px;
  align-self: stretch;
  place-items: center;
  background: transparent;
  cursor: col-resize;
  touch-action: none;
  user-select: none;
}

.lx-split-layout__resizer::before {
  width: 4px;
  height: 100%;
  border-radius: var(--lx-radius-sm);
  background: var(--lx-border-light);
  content: '';
}

.lx-split-layout__resizer:hover,
.lx-split-layout__resizer:focus-visible {
  outline: 2px solid var(--lx-color-primary);
  outline-offset: -2px;
}

.lx-split-layout__resizer:hover::before,
.lx-split-layout__resizer:focus-visible::before {
  background: var(--lx-color-primary);
}

.lx-split-layout__toggle {
  display: inline-flex;
  width: var(--lx-control-height);
  height: var(--lx-control-height);
  align-self: start;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 1px solid var(--lx-border);
  border-radius: var(--lx-radius-md);
  background: var(--lx-bg-card);
  color: var(--lx-text-regular);
  cursor: pointer;
}

.lx-split-layout__toggle:hover {
  border-color: var(--lx-color-primary);
  color: var(--lx-color-primary);
}

.lx-split-layout__toggle:focus-visible {
  outline: 2px solid var(--lx-color-primary);
  outline-offset: 2px;
}

.lx-split-layout__main {
  min-width: 0;
}

.lx-split-layout.is-stacked,
.lx-split-layout.is-stacked.is-collapsed {
  grid-template-columns: minmax(0, 1fr);
}

.lx-split-layout.is-stacked .lx-split-layout__aside {
  width: auto !important;
}

.lx-split-layout.is-stacked .lx-split-layout__aside-content {
  min-width: 0;
}

.lx-split-layout.is-stacked .lx-split-layout__resizer {
  display: none;
}

.lx-split-layout.is-stacked .lx-split-layout__toggle {
  width: 44px;
  height: 44px;
}

@media (max-width: 767px) {
  .lx-split-layout,
  .lx-split-layout.is-resizable,
  .lx-split-layout.is-collapsed {
    grid-template-columns: minmax(0, 1fr);
  }

  .lx-split-layout__aside {
    width: auto !important;
  }

  .lx-split-layout__resizer {
    display: none;
  }

  .lx-split-layout__toggle {
    width: 44px;
    height: 44px;
  }
}
</style>
