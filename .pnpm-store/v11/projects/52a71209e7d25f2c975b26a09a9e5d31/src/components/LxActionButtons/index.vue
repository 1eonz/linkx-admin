<script setup lang="ts">
/**
 * LxActionButtons — 表格行内操作（默认纯文字链接 + 溢出折叠；icon 可选左置，兼容 V3 带图标惯用法）
 * 视觉源：stitch 行内操作 a.text-primary hover:underline text-xs
 */
import {
  computed,
  getCurrentInstance,
  onBeforeUnmount,
  onMounted,
  ref,
} from 'vue'

import type { LxActionButtonsProps, LxActionItem } from './types'
import { hasPermission } from '../../permissions'
import LxIcon from '../LxIcon/index.vue'

const props = withDefaults(defineProps<LxActionButtonsProps>(), {
  actions: () => [],
  max: 3,
  moreText: '更多',
})

const emit = defineEmits<{ click: [action: LxActionItem] }>()

const visible = computed(() =>
  props.actions.filter((a) => !a.hidden && (!a.auth || hasPermission(a.auth))),
)
const shown = computed(() => visible.value.slice(0, props.max))
const overflow = computed(() => visible.value.slice(props.max))
const moreGroupLabel = computed(() =>
  props.moreText.endsWith('操作') ? props.moreText : `${props.moreText}操作`,
)
const moreOpen = ref(false)
const rootRef = ref<HTMLElement | null>(null)
const moreButtonRef = ref<HTMLButtonElement | null>(null)
const menuId = `lx-actions-menu-${getCurrentInstance()?.uid ?? 0}`

function onClick(action: LxActionItem) {
  if (action.disabled) return
  emit('click', action)
  closeMore()
}

function closeMore(restoreFocus = false) {
  if (!moreOpen.value) return
  moreOpen.value = false
  if (restoreFocus) moreButtonRef.value?.focus()
}

function onDocumentPointerDown(event: PointerEvent) {
  if (event.target instanceof Node && !rootRef.value?.contains(event.target)) {
    closeMore()
  }
}

function onFocusout(event: FocusEvent) {
  if (
    !(event.relatedTarget instanceof Node) ||
    !rootRef.value?.contains(event.relatedTarget)
  ) {
    closeMore()
  }
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && moreOpen.value) {
    event.preventDefault()
    closeMore(true)
  }
}

onMounted(() => {
  document.addEventListener('pointerdown', onDocumentPointerDown)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocumentPointerDown)
})
</script>

<template>
  <div
    v-if="visible.length"
    ref="rootRef"
    class="lx-actions"
    role="group"
    aria-label="行内操作"
    @focusout="onFocusout"
    @keydown="onKeydown"
  >
    <template
      v-for="(action, index) in shown"
      :key="action.key ?? `${action.label}-${index}`"
    >
      <button
        type="button"
        class="lx-actions__btn"
        :class="`lx-actions__btn--${action.type || 'default'}`"
        :disabled="action.disabled"
        @click="onClick(action)"
      >
        <LxIcon
          v-if="action.icon"
          :name="action.icon"
          :size="16"
          class="lx-actions__icon"
        />
        {{ action.label }}
      </button>
    </template>

    <div v-if="overflow.length" class="lx-actions__more-wrap">
      <button
        ref="moreButtonRef"
        type="button"
        class="lx-actions__btn"
        :aria-expanded="moreOpen"
        :aria-controls="menuId"
        @click="moreOpen = !moreOpen"
      >
        {{ moreText }}
      </button>
      <div
        v-show="moreOpen"
        :id="menuId"
        class="lx-actions__menu"
        role="group"
        :aria-label="moreGroupLabel"
      >
        <button
          v-for="(action, index) in overflow"
          :key="action.key ?? `${action.label}-${index + shown.length}`"
          type="button"
          class="lx-actions__menu-item"
          :class="`lx-actions__btn--${action.type || 'default'}`"
          :disabled="action.disabled"
          @click="onClick(action)"
        >
          <LxIcon
            v-if="action.icon"
            :name="action.icon"
            :size="16"
            class="lx-actions__icon"
          />
          {{ action.label }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.lx-actions {
  display: inline-flex;
  max-width: 100%;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--lx-space-md);
}

.lx-actions__btn {
  display: inline-flex;
  min-width: 24px;
  min-height: 24px;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--lx-color-primary);
  font: inherit;
  font-size: 12px;
  cursor: pointer;
  text-decoration: none;
  transition: opacity var(--lx-transition);
}

.lx-actions__btn:hover {
  text-decoration: underline;
  opacity: 0.85;
}

.lx-actions__btn:focus-visible {
  border-radius: var(--lx-radius-sm);
  outline: 2px solid var(--lx-color-primary);
  outline-offset: 2px;
}

.lx-actions__btn:disabled {
  cursor: not-allowed;
  opacity: 0.55;
  text-decoration: none;
}

.lx-actions__btn:disabled:hover {
  opacity: 0.55;
}

/* 可选图标：文字左侧 16px，2px 间距（V3 ActionButtons 规范） */
.lx-actions__icon {
  flex: 0 0 auto;
  margin-right: 2px;
}

.lx-actions__btn--danger {
  color: var(--lx-color-error);
}

.lx-actions__more-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.lx-actions__menu {
  position: absolute;
  inset-block-start: calc(100% + 4px);
  inset-inline-end: 0;
  z-index: 2000;
  min-width: 96px;
  max-width: min(16rem, calc(100vw - 32px));
  padding: var(--lx-space-xs);
  box-sizing: border-box;
  background: var(--lx-bg-card);
  border: 1px solid var(--lx-border);
  border-radius: var(--lx-radius-md);
  box-shadow: var(--lx-shadow-pop);
}

.lx-actions__menu-item {
  display: flex;
  width: 100%;
  min-height: 32px;
  align-items: center;
  justify-content: flex-start;
  padding: 6px var(--lx-space-sm);
  border: 0;
  border-radius: var(--lx-radius-sm);
  background: transparent;
  font-family: inherit;
  font-size: 12px;
  text-align: start;
  color: var(--lx-text-regular);
  cursor: pointer;
  overflow-wrap: anywhere;
  transition:
    background-color var(--lx-transition),
    color var(--lx-transition);
}

.lx-actions__menu-item:hover {
  background: var(--lx-color-primary-light);
  color: var(--lx-color-primary);
}

.lx-actions__menu-item:focus-visible {
  outline: 2px solid var(--lx-color-primary);
  outline-offset: -2px;
}

.lx-actions__menu-item:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

@media (max-width: 600px) {
  .lx-actions__btn {
    min-width: 44px;
    min-height: 44px;
    padding-inline: 2px;
  }

  .lx-actions__menu-item {
    min-height: 44px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .lx-actions__btn,
  .lx-actions__menu-item {
    transition: none;
  }
}
</style>
