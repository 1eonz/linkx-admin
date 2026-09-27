<script setup lang="ts">
/**
 * LxSidebar — 侧边栏容器（双形态：expanded 252px / rail 64px）
 * 视觉源：doc/stitch_侧边栏/stitch_/（_1 rail + _2 expanded，唯一设计源）
 * 文档：doc/lx-ui/demo/LXSIDEBAR.md
 */
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  provide,
  reactive,
  ref,
  watch,
} from 'vue'
import type { LxSidebarMode } from '../../tokens'
import type { LxMenuItem, LxSidebarProps, LxRailTip } from './types'
import { LX_SIDEBAR_KEY, type LxSidebarContext } from './context'
import LxIcon from '../LxIcon/index.vue'
import LxSidebarBrand from './LxSidebarBrand.vue'
import LxSidebarItem from './LxSidebarItem.vue'
import LxSidebarGroup from './LxSidebarGroup.vue'
import LxSidebarFooter from './LxSidebarFooter.vue'

const props = withDefaults(defineProps<LxSidebarProps>(), {
  mode: 'expanded',
  items: () => [],
  activeKey: '',
  title: '警务业务协同平台',
  subtitle: '',
  mobile: false,
  showFooter: true,
  slaValue: 99.9,
  nodeLabel: 'NODE-01',
  nodeStatus: 'online',
})

const emit = defineEmits<{
  'update:mode': [mode: LxSidebarProps['mode']]
  'update:mobile': [visible: boolean]
  select: [item: LxMenuItem]
  'expand-change': [keys: string[]]
}>()

const isRail = computed(() => props.mode === 'rail')
const sidebarElement = ref<HTMLElement | null>(null)
const closeButtonElement = ref<HTMLButtonElement | null>(null)
const railPopperElement = ref<HTMLElement | null>(null)
let mobileReturnFocus: HTMLElement | null = null
let railTipTrigger: HTMLElement | null = null

/* —— 二级组展开状态（受控 + 非受控兜底） —— */
const innerExpandedKeys = ref<string[]>([])
const openKeys = computed(() => {
  const keys = props.items.filter((i) => i.children?.length).map((i) => i.key)
  // 非受控：默认含激活子项的组展开
  const withActive = keys.filter((k) => {
    const g = props.items.find((i) => i.key === k)
    return g?.children?.some((c) => c.key === props.activeKey)
  })
  return Array.from(new Set([...withActive, ...innerExpandedKeys.value]))
})

function toggleGroup(key: string) {
  const next = openKeys.value.includes(key)
    ? openKeys.value.filter((k) => k !== key)
    : [...openKeys.value, key]
  innerExpandedKeys.value = next
  emit('expand-change', next)
}

function onSelectItem(item: LxMenuItem) {
  emit('select', item)
  if (props.mobile) emit('update:mobile', false)
}

function onModeToggle() {
  emit('update:mode', isRail.value ? 'expanded' : 'rail')
}

/* —— rail 浮层（tooltip / popper，Teleport 到 body，容器统一管理） —— */
const railTip = reactive<LxRailTip>({ visible: false, x: 0, y: 0, content: '' })
let hideTimer: ReturnType<typeof setTimeout> | null = null

function showRailTip(
  e: MouseEvent | FocusEvent,
  tip: Omit<LxRailTip, 'visible'>,
) {
  if (hideTimer) clearTimeout(hideTimer)
  const el = e.currentTarget
  if (!(el instanceof HTMLElement)) return
  const rect = el.getBoundingClientRect()
  railTipTrigger = el
  railTip.visible = true
  railTip.x = rect.right + 10
  railTip.y = tip.subItems ? rect.top - 4 : rect.top + rect.height / 2 - 13
  railTip.content = tip.content
  railTip.subItems = tip.subItems
  railTip.activeKey = tip.activeKey
}

function hideRailTip() {
  hideTimer = setTimeout(() => {
    railTip.visible = false
    railTipTrigger = null
  }, 150)
}

function keepRailTip() {
  if (hideTimer) clearTimeout(hideTimer)
}

function focusRailTipFirstItem() {
  void nextTick(() => {
    railPopperElement.value
      ?.querySelector<HTMLElement>(
        '.lx-sidebar-popper__item:not([aria-disabled="true"])',
      )
      ?.focus({ preventScroll: true })
  })
}

function onPopperSelect(item: LxMenuItem) {
  if (item.disabled) return
  railTip.visible = false
  railTipTrigger = null
  emit('select', item)
  if (props.mobile) emit('update:mobile', false)
}

provide(LX_SIDEBAR_KEY, {
  showRailTip,
  hideRailTip,
  keepRailTip,
  focusRailTipFirstItem,
  isRailTipOpen: (key: string) => railTip.visible && railTip.activeKey === key,
  get activeKey() {
    return props.activeKey
  },
} as LxSidebarContext)

function focusableDrawerItems() {
  const selector =
    'a[href], button:not(:disabled), [tabindex]:not([tabindex="-1"])'
  return Array.from(
    sidebarElement.value?.querySelectorAll<HTMLElement>(selector) ?? [],
  ).filter(
    (element) =>
      element.getAttribute('aria-hidden') !== 'true' &&
      element.getClientRects().length > 0 &&
      getComputedStyle(element).visibility !== 'hidden',
  )
}

function onKeydown(e: KeyboardEvent) {
  if (props.mobile) {
    if (e.key === 'Escape') {
      e.preventDefault()
      emit('update:mobile', false)
      return
    }

    if (e.key !== 'Tab') return
    const focusableItems = focusableDrawerItems()
    if (focusableItems.length === 0) {
      e.preventDefault()
      sidebarElement.value?.focus({ preventScroll: true })
      return
    }

    const first = focusableItems[0]
    const last = focusableItems[focusableItems.length - 1]
    const activeIndex = focusableItems.indexOf(
      document.activeElement as HTMLElement,
    )
    if (e.shiftKey && activeIndex <= 0) {
      e.preventDefault()
      last.focus({ preventScroll: true })
    } else if (
      !e.shiftKey &&
      (activeIndex === -1 || activeIndex === focusableItems.length - 1)
    ) {
      e.preventDefault()
      first.focus({ preventScroll: true })
    }
    return
  }

  if (e.key === 'Escape' && railTip.visible && railTip.subItems?.length) {
    e.preventDefault()
    if (hideTimer) clearTimeout(hideTimer)
    railTip.visible = false
    const trigger = railTipTrigger
    railTipTrigger = null
    if (
      railPopperElement.value?.contains(document.activeElement) &&
      trigger?.isConnected
    ) {
      trigger.focus({ preventScroll: true })
    }
  }
}

async function syncMobileDrawerFocus(isOpen: boolean) {
  if (isOpen) {
    if (!mobileReturnFocus) {
      mobileReturnFocus =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null
    }
    await nextTick()
    closeButtonElement.value?.focus({ preventScroll: true })
    return
  }

  const target = mobileReturnFocus
  mobileReturnFocus = null
  await nextTick()
  if (target?.isConnected && !target.matches(':disabled'))
    target.focus({ preventScroll: true })
}

watch(
  () => props.mobile,
  (isOpen) => {
    void syncMobileDrawerFocus(isOpen)
  },
  { flush: 'post' },
)

onMounted(() => document.addEventListener('keydown', onKeydown))
onMounted(() => {
  if (props.mobile) void syncMobileDrawerFocus(true)
})
onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
  if (hideTimer) clearTimeout(hideTimer)
  if (props.mobile && mobileReturnFocus?.isConnected) {
    mobileReturnFocus.focus({ preventScroll: true })
  }
})

watch(
  () => props.mode,
  () => (railTip.visible = false),
)
</script>

<template>
  <!-- mobile 遮罩 -->
  <Teleport to="body">
    <div
      v-if="mobile"
      class="lx-sidebar__mask"
      aria-hidden="true"
      @click="emit('update:mobile', false)"
    />
  </Teleport>

  <aside
    ref="sidebarElement"
    class="lx-sidebar"
    :class="[`lx-sidebar--${mode}`, { 'lx-sidebar--mobile': mobile }]"
    :role="mobile ? 'dialog' : undefined"
    :aria-label="mobile ? '移动端主导航' : undefined"
    :aria-modal="mobile ? 'true' : undefined"
    :tabindex="mobile ? -1 : undefined"
  >
    <button
      v-if="mobile"
      ref="closeButtonElement"
      class="lx-sidebar__mobile-close"
      type="button"
      aria-label="关闭导航"
      @click="emit('update:mobile', false)"
    >
      <LxIcon name="close" :size="18" />
    </button>
    <slot name="brand">
      <LxSidebarBrand :title="title" :subtitle="subtitle" :mode="mode" />
    </slot>

    <nav class="lx-sidebar__nav" aria-label="主导航">
      <template v-for="item in items" :key="item.key">
        <LxSidebarGroup
          v-if="item.children?.length"
          :item="item"
          :mode="mode"
          :expanded="openKeys.includes(item.key)"
          @toggle="toggleGroup"
          @select="onSelectItem"
        />
        <LxSidebarItem
          v-else
          :item="item"
          :mode="mode"
          :active="activeKey === item.key"
          @select="onSelectItem"
        />
      </template>
      <slot name="append" />
    </nav>

    <div v-if="showFooter" class="lx-sidebar__footer">
      <slot name="footer">
        <LxSidebarFooter
          :mode="mode"
          :sla-value="slaValue"
          :node-label="nodeLabel"
          :node-status="nodeStatus"
          @toggle="onModeToggle"
        />
      </slot>
    </div>
  </aside>

  <!-- rail 浮层：tooltip（直达项）/ popper（分组二级） -->
  <Teleport to="body">
    <div
      v-if="railTip.visible && railTip.subItems"
      ref="railPopperElement"
      class="lx-sidebar-popper"
      role="group"
      :aria-label="railTip.content"
      :style="{ left: railTip.x + 'px', top: railTip.y + 'px' }"
      @mouseenter="keepRailTip"
      @mouseleave="hideRailTip"
      @focusin="keepRailTip"
    >
      <div class="lx-sidebar-popper__title">{{ railTip.content }}</div>
      <component
        :is="child.path ? 'a' : 'button'"
        v-for="child in railTip.subItems"
        :key="child.key"
        class="lx-sidebar-popper__item"
        :class="{
          'is-active': activeKey === child.key,
          'is-disabled': child.disabled,
        }"
        :aria-current="
          child.path && activeKey === child.key ? 'page' : undefined
        "
        :aria-disabled="child.disabled ? 'true' : undefined"
        :disabled="!child.path && child.disabled"
        :tabindex="child.disabled ? -1 : undefined"
        v-bind="child.path ? { href: child.path } : { type: 'button' }"
        @click.prevent="onPopperSelect(child)"
      >
        <span class="lx-sidebar-popper__label">
          <span
            class="lx-sidebar-popper__dot"
            :class="{ 'is-active': activeKey === child.key }"
          />
          <span>{{ child.title }}</span>
        </span>
        <span v-if="child.badge != null" class="lx-sidebar-popper__badge">{{
          child.badge
        }}</span>
        <!-- 激活项右端 check（_1 规格） -->
        <LxIcon
          v-if="activeKey === child.key"
          name="check"
          :size="14"
          class="lx-sidebar-popper__check"
        />
      </component>
    </div>
    <div
      v-else-if="railTip.visible"
      class="lx-sidebar-tooltip"
      :style="{ left: railTip.x + 'px', top: railTip.y + 'px' }"
    >
      {{ railTip.content }}
    </div>
  </Teleport>
</template>

<style scoped>
.lx-sidebar {
  position: relative;
  display: flex;
  flex-direction: column;
  width: var(--lx-sidebar-width);
  height: 100%;
  background: var(--lx-sidebar-bg);
  border-right: 1px solid var(--lx-sidebar-border);
  box-shadow: var(--lx-shadow-card);
  transition:
    width var(--lx-transition),
    background-color var(--lx-transition);
  flex-shrink: 0;
  overflow: hidden;
}

.lx-sidebar__mobile-close {
  display: none;
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 1;
  width: 44px;
  height: 44px;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 1px solid transparent;
  border-radius: var(--lx-radius-sm);
  background: transparent;
  color: var(--lx-sidebar-text);
  cursor: pointer;
}

.lx-sidebar__mobile-close:hover {
  background: var(--lx-sidebar-hover-bg);
  color: var(--lx-text-on-dark);
}

.lx-sidebar__mobile-close:focus-visible {
  outline: 2px solid var(--lx-sidebar-active-glow);
  outline-offset: 2px;
}

/* —— 展开态：右侧投影强调层次（stitch _2） —— */
.lx-sidebar--expanded {
  box-shadow: 4px 0 24px rgba(0, 0, 0, 0.5);
}

/* —— rail 态 —— */
.lx-sidebar--rail {
  width: var(--lx-sidebar-rail-width);
  background: var(--lx-sidebar-bg-rail);
}

/* —— mobile 抽屉 —— */
.lx-sidebar--mobile {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 2001;
}

.lx-sidebar--mobile .lx-sidebar__mobile-close {
  display: inline-flex;
}

.lx-sidebar--mobile :deep(.lx-sidebar-brand) {
  padding-right: 56px;
}

.lx-sidebar--mobile :deep(.lx-sidebar-brand__text) {
  max-width: calc(100% - 48px);
}

.lx-sidebar--mobile :deep(.lx-sidebar-brand__title),
.lx-sidebar--mobile :deep(.lx-sidebar-brand__subtitle) {
  overflow: hidden;
  text-overflow: ellipsis;
}

.lx-sidebar__mask {
  position: fixed;
  inset: 0;
  z-index: 2000;
  background: rgba(0, 0, 0, 0.5);
}

.lx-sidebar__nav {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: var(--lx-space-sm) 0;
  scrollbar-width: thin;
  scrollbar-color: var(--lx-sidebar-guide) transparent;
}

.lx-sidebar__nav::-webkit-scrollbar {
  width: 4px;
}

.lx-sidebar__nav::-webkit-scrollbar-thumb {
  border-radius: 2px;
  background: var(--lx-sidebar-guide);
}

.lx-sidebar__footer {
  flex-shrink: 0;
}

/* —— rail 浮层（_1: tooltip left-16+ml-1 / popper w-48） —— */
.lx-sidebar-tooltip {
  position: fixed;
  padding: 6px 12px; /* px-3 py-1.5（_1） */
  border-radius: var(--lx-radius-md);
  background: var(--lx-sidebar-bg-popper);
  border: 1px solid var(--lx-sidebar-border);
  box-shadow: var(--lx-shadow-pop);
  color: var(--lx-sidebar-text);
  font-size: 12px;
  white-space: nowrap;
  pointer-events: none;
  z-index: 2100;
}

.lx-sidebar-popper {
  position: fixed;
  width: 192px; /* w-48（_1） */
  padding: var(--lx-space-xs) 0;
  border-radius: var(--lx-radius-md);
  background: var(--lx-sidebar-bg-popper);
  border: 1px solid #263445; /* _1 定值 */
  box-shadow: var(--lx-shadow-pop);
  z-index: 2100;
}

/* popper 标题（_1: px-4 py-2 + 前缀圆点 + 下分隔线） */
.lx-sidebar-popper__title {
  display: flex;
  align-items: center;
  gap: var(--lx-space-sm);
  padding: var(--lx-space-sm) 16px;
  border-bottom: 1px solid var(--lx-sidebar-border);
  font-size: 12px;
  font-weight: 500;
  color: var(--lx-sidebar-text);
  margin-bottom: var(--lx-space-xs);
}

.lx-sidebar-popper__title::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--lx-sidebar-active-glow);
  flex-shrink: 0;
}

.lx-sidebar-popper__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--lx-space-md);
  padding: 10px 16px; /* px-4 py-2.5（_1） */
  color: var(--lx-sidebar-text);
  font-size: 12px;
  text-decoration: none;
  cursor: pointer;
  border: 0;
  background: transparent;
  font: inherit;
  text-align: left;
  transition:
    background-color var(--lx-transition),
    color var(--lx-transition);
}

.lx-sidebar-popper__item:focus-visible {
  outline: 2px solid var(--lx-sidebar-active-glow);
  outline-offset: -2px;
}

.lx-sidebar-popper__item:hover:not(.is-disabled) {
  background: var(--lx-sidebar-hover-bg);
  color: var(--lx-text-on-dark);
}

.lx-sidebar-popper__item.is-active {
  color: var(--lx-sidebar-active-glow);
  background: rgba(8, 47, 73, 0.4); /* sky-950/40（_1） */
  font-weight: 500;
}

.lx-sidebar-popper__item.is-disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.lx-sidebar-popper__label {
  display: inline-flex;
  align-items: center;
  gap: var(--lx-space-sm);
  flex: 1;
  min-width: 0;
}

/* 前缀圆点（_1: w-1.5，激活 sky-400） */
.lx-sidebar-popper__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: transparent;
  flex-shrink: 0;
}

.lx-sidebar-popper__dot.is-active {
  background: var(--lx-sidebar-active-glow);
}

.lx-sidebar-popper__check {
  color: var(--lx-sidebar-active-glow);
  flex-shrink: 0;
}

.lx-sidebar-popper__badge {
  font-size: 11px;
  color: var(--lx-color-error);
  font-variant-numeric: tabular-nums;
}

@media (prefers-reduced-motion: reduce) {
  .lx-sidebar,
  .lx-sidebar-popper__item {
    transition: none;
  }
}
</style>
