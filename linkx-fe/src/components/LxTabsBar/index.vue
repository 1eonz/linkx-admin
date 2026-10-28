<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'

import type { LxTabItem, LxTabsBarProps } from './types'
import LxIcon from '../LxIcon/index.vue'

defineOptions({ name: 'LxTabsBar' })

const props = withDefaults(defineProps<LxTabsBarProps>(), {
  tabs: () => [],
  modelValue: '',
})

const navigation = ref<HTMLElement | null>(null)
const scrollRegion = ref<HTMLDivElement | null>(null)

/** 只滚动页签容器，避免后台切页将宿主页面一起滚动或抢走焦点。 */
function revealPage(button: HTMLButtonElement) {
  const region = scrollRegion.value
  if (!region) return
  const bounds = region.getBoundingClientRect()
  const target = button.getBoundingClientRect()
  if (target.left < bounds.left) region.scrollLeft += target.left - bounds.left
  else if (target.right > bounds.right)
    region.scrollLeft += target.right - bounds.right
}

watch(
  () => [props.modelValue, props.tabs.map((tab) => tab.key)],
  () => {
    const index = props.tabs.findIndex((tab) => tab.key === props.modelValue)
    const button = scrollRegion.value?.querySelectorAll<HTMLButtonElement>(
      '.lx-tabs-bar__trigger',
    )[index]
    if (button) revealPage(button)
  },
  { flush: 'post' },
)

function focusPage(index: number) {
  const buttons = scrollRegion.value?.querySelectorAll<HTMLButtonElement>(
    '.lx-tabs-bar__trigger',
  )
  const button = buttons?.[index]
  if (button) {
    button.focus({ preventScroll: true })
    revealPage(button)
  } else {
    navigation.value?.focus()
  }
}

/** 路由导航保持 Enter/Space 激活；方向键只移动焦点，不提前切换页面。 */
function moveFocus(event: KeyboardEvent, index: number) {
  const count = props.tabs.length
  if (!count) return
  let target: number
  switch (event.key) {
    case 'ArrowRight':
      target = (index + 1) % count
      break
    case 'ArrowLeft':
      target = (index + count - 1) % count
      break
    case 'Home':
      target = 0
      break
    case 'End':
      target = count - 1
      break
    default:
      return
  }
  event.preventDefault()
  focusPage(target)
}

/** 中键仅请求关闭可关闭页签；是否丢弃未保存内容由宿主确认。 */
function closeWithMiddleButton(event: MouseEvent, tab: LxTabItem) {
  if (event.button !== 1) return
  event.preventDefault()
  if (tab.closable) emit('close', tab.key)
}

// 在宿主移除含焦点的页签前记录位置，更新后只回收该失效焦点。
watch(
  () => props.tabs.map((tab) => tab.key),
  (keys, previousKeys) => {
    const focused = navigation.value?.ownerDocument.activeElement
    if (
      !(focused instanceof HTMLElement) ||
      !scrollRegion.value?.contains(focused)
    )
      return
    const row = focused.closest<HTMLElement>('.lx-tabs-bar__tab')
    const key = row?.dataset.key
    if (key === undefined || keys.includes(key)) return
    const index = previousKeys.indexOf(key)
    void nextTick(() => {
      const document = navigation.value?.ownerDocument
      if (!document) return
      const current = document.activeElement
      // 宿主在渲染后主动安排了有效焦点时，尊重其路由/弹窗焦点策略。
      if (
        current &&
        current !== document.body &&
        current !== document.documentElement &&
        current !== focused
      )
        return
      focusPage(Math.min(index, keys.length - 1))
    })
  },
)

const emit = defineEmits<{
  'update:modelValue': [key: string]
  close: [key: string]
  'context-menu': [event: { key: string; x: number; y: number }]
}>()

function select(tab: LxTabItem) {
  emit('update:modelValue', tab.key)
}

function openContext(event: MouseEvent, tab: LxTabItem) {
  event.preventDefault()
  emit('context-menu', { key: tab.key, x: event.clientX, y: event.clientY })
}
</script>

<template>
  <nav
    ref="navigation"
    class="lx-tabs-bar"
    aria-label="已打开页面"
    tabindex="-1"
  >
    <div ref="scrollRegion" class="lx-tabs-bar__scroll">
      <div
        v-for="(tab, index) in tabs"
        :key="tab.key"
        class="lx-tabs-bar__tab"
        :class="{ 'is-active': tab.key === modelValue }"
        :data-key="tab.key"
        @contextmenu="openContext($event, tab)"
        @mousedown.middle.prevent
        @auxclick="closeWithMiddleButton($event, tab)"
      >
        <button
          class="lx-tabs-bar__trigger"
          type="button"
          :aria-current="tab.key === modelValue ? 'page' : undefined"
          :title="tab.title"
          @keydown="moveFocus($event, index)"
          @click="select(tab)"
        >
          <span class="lx-tabs-bar__title">{{ tab.title }}</span>
        </button>
        <button
          v-if="tab.closable"
          class="lx-tabs-bar__close"
          type="button"
          :aria-label="`关闭 ${tab.title}`"
          @click.stop="emit('close', tab.key)"
        >
          <LxIcon name="x" :size="14" />
        </button>
      </div>
    </div>
    <slot name="extra" />
  </nav>
</template>

<style scoped>
.lx-tabs-bar {
  display: flex;
  min-height: var(--lx-tabsbar-height);
  align-items: flex-end;
  gap: var(--lx-space-sm);
  padding-inline: var(--lx-space-md);
  border-bottom: 1px solid var(--lx-border);
  background: var(--lx-bg-tabsbar);
}

.lx-tabs-bar__scroll {
  display: flex;
  min-width: 0;
  flex: 1;
  align-items: flex-end;
  overflow-x: auto;
  scrollbar-width: none;
}

.lx-tabs-bar__scroll::-webkit-scrollbar {
  display: none;
}

.lx-tabs-bar__tab {
  display: inline-flex;
  min-width: 104px;
  max-width: 220px;
  min-height: var(--lx-tabsbar-height);
  align-items: center;
  border: 1px solid transparent;
  border-bottom: 0;
  border-radius: var(--lx-radius-md) var(--lx-radius-md) 0 0;
}

.lx-tabs-bar__trigger {
  display: inline-flex;
  min-width: 0;
  height: 100%;
  flex: 1;
  align-items: center;
  padding: 0 var(--lx-space-sm);
  border: 0;
  background: transparent;
  color: var(--lx-text-regular);
  cursor: pointer;
  font: inherit;
  font-size: 12px;
  text-align: start;
}

.lx-tabs-bar__trigger:hover {
  color: var(--lx-color-primary);
}

.lx-tabs-bar__tab.is-active {
  border-color: var(--lx-border);
  background: var(--lx-bg-card);
  box-shadow: inset 0 2px 0 var(--lx-color-primary);
}

.lx-tabs-bar__tab.is-active .lx-tabs-bar__trigger {
  color: var(--lx-color-primary);
  font-weight: 500;
}

.lx-tabs-bar:focus-visible,
.lx-tabs-bar__trigger:focus-visible,
.lx-tabs-bar__close:focus-visible {
  outline: 2px solid var(--lx-color-primary);
  outline-offset: -2px;
}

.lx-tabs-bar__title {
  overflow: hidden;
  flex: 1;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.lx-tabs-bar__close {
  display: inline-flex;
  width: 24px;
  height: 24px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  border-radius: var(--lx-radius-sm);
  background: transparent;
  color: var(--lx-text-regular);
  cursor: pointer;
}

.lx-tabs-bar__close:hover {
  background: var(--lx-color-info-light);
}

@media (max-width: 640px), (pointer: coarse) {
  .lx-tabs-bar__tab {
    min-width: 160px;
  }

  .lx-tabs-bar__trigger,
  .lx-tabs-bar__close {
    min-width: 44px;
    min-height: 44px;
  }
}
</style>
