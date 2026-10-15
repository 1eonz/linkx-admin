<script setup lang="ts">
/**
 * LxActionButtons — 表格行内操作（LxButton 文字形态内核 + 溢出折叠）
 * 视觉源：design/按钮体系 text 形态（拍板 #11：表格行内一律 text 形态）
 * 语义色档（2026-09-29 两项目 192 例全量调研拍板）：
 *   编辑/详情/常规=primary 蓝、删除/禁用=danger 红、启用/恢复=warning 橙、激活/授权=success 绿
 * 外显按钮走 LxButton（继承语义色/hover 浅底/触控 44px/focus-visible/reduced-motion）；
 * 「更多」为自绘 disclosure（role=group + Escape/焦点管理，见 closeMore 与 onFocusout），
 * 菜单项 hover 底按语义色派生，与 LxButton 文字形态同款
 */
import {
  computed,
  getCurrentInstance,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from 'vue'

import type { LxActionButtonsProps, LxActionItem } from './types'
import { hasPermission } from '../../permissions'
import LxButton from '../LxButton/index.vue'
import LxIcon from '../LxIcon/index.vue'
import type { LxButtonType } from '../LxButton/types'

const props = withDefaults(defineProps<LxActionButtonsProps>(), {
  actions: () => [],
  max: 3,
  moreText: '更多',
})

const emit = defineEmits<{ click: [action: LxActionItem] }>()

interface VisibleAction {
  action: LxActionItem
  index: number
}

function isActionAuthorized(action: LxActionItem) {
  if (action.auth === undefined) return true

  const permissions = Array.isArray(action.auth)
    ? action.auth.filter((permission) => permission.trim().length > 0)
    : action.auth.trim().length > 0
      ? [action.auth]
      : []

  // 显式空权限码属于无效授权配置，必须默认隐藏。
  return permissions.length > 0 && hasPermission(permissions)
}

const visible = computed(() =>
  props.actions.flatMap((action, index) =>
    !action.hidden && isActionAuthorized(action) ? [{ action, index }] : [],
  ),
)
const visibleLimit = computed(() =>
  Number.isFinite(props.max) ? Math.max(0, Math.floor(props.max)) : 0,
)
const shown = computed(() => visible.value.slice(0, visibleLimit.value))
const overflow = computed(() => visible.value.slice(visibleLimit.value))
const moreGroupLabel = computed(() =>
  props.moreText.endsWith('操作') ? props.moreText : `${props.moreText}操作`,
)
const moreOpen = ref(false)
const rootRef = ref<HTMLElement | null>(null)
const menuRef = ref<HTMLElement | null>(null)
const moreButtonRef = ref<InstanceType<typeof LxButton> | null>(null)
const menuPosition = ref({ left: '8px', top: '8px' })
const menuId = `lx-actions-menu-${getCurrentInstance()?.uid ?? 0}`

function actionKeyOf(item: VisibleAction) {
  return item.action.key ?? `${item.action.label}-${item.index}`
}

/** 语义色文字档：danger/success/warning 需要 type + text 组合激活（LxButton 契约） */
function isSemanticType(
  type: LxActionItem['type'],
): type is 'danger' | 'success' | 'warning' {
  return type === 'danger' || type === 'success' || type === 'warning'
}

/** 语义档 → LxButton type：default/primary 归一为 text 形态（默认蓝） */
function buttonTypeOf(type: LxActionItem['type']): LxButtonType {
  return isSemanticType(type) ? type : 'text'
}

function onClick(action: LxActionItem, fromMenu = false) {
  if (action.disabled) return
  emit('click', action)
  action.onClick?.(action)
  // 菜单项点击后自身被隐藏（v-show），焦点需归还「更多」触发按钮，与 Escape 路径同款
  closeMore(fromMenu)
}

function closeMore(restoreFocus = false) {
  if (!moreOpen.value) return
  moreOpen.value = false
  if (restoreFocus) {
    // LxButton 未暴露 focus 方法，经组件实例取根 button 元素恢复焦点（Escape 收起场景）
    ;(moreButtonRef.value?.$el as HTMLElement | undefined)?.focus()
  }
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

function updateMenuPosition() {
  const button = moreButtonRef.value?.$el as HTMLElement | undefined
  const menu = menuRef.value
  if (!button || !menu) return

  const buttonRect = button.getBoundingClientRect()
  const menuRect = menu.getBoundingClientRect()
  const margin = 8
  const gap = 4
  const maxTop = Math.max(margin, window.innerHeight - menuRect.height - margin)
  const left = Math.min(
    Math.max(buttonRect.right - menuRect.width, margin),
    Math.max(margin, window.innerWidth - menuRect.width - margin),
  )
  const below = buttonRect.bottom + gap
  const above = buttonRect.top - menuRect.height - gap
  const fitsBelow =
    below >= margin && below + menuRect.height <= window.innerHeight - margin
  const fitsAbove =
    above >= margin && above + menuRect.height <= window.innerHeight - margin
  const top = fitsBelow
    ? below
    : fitsAbove
      ? above
      : Math.min(Math.max(below, margin), maxTop)

  menuPosition.value = { left: `${left}px`, top: `${top}px` }
}

function onMenuViewportChange() {
  if (moreOpen.value) updateMenuPosition()
}

watch(moreOpen, (open) => {
  if (open) {
    void nextTick(updateMenuPosition)
    window.addEventListener('resize', onMenuViewportChange)
    document.addEventListener('scroll', onMenuViewportChange, true)
  } else {
    window.removeEventListener('resize', onMenuViewportChange)
    document.removeEventListener('scroll', onMenuViewportChange, true)
  }
})

watch(
  overflow,
  (actions) => {
    if (actions.length === 0 && moreOpen.value) {
      const menu = rootRef.value?.querySelector(`#${menuId}`)
      const restoreFocus = menu?.contains(document.activeElement) ?? false
      moreOpen.value = false
      if (restoreFocus) {
        void nextTick(() => {
          rootRef.value
            ?.querySelector<HTMLElement>(
              '.lx-actions__item:not([aria-controls]):not(:disabled)',
            )
            ?.focus()
        })
      }
    }
  },
  { flush: 'sync' },
)

// 权限过滤或 max 改变会重排触发按钮；在 DOM 更新后重新定位仍打开的菜单。
watch(
  [visible, overflow],
  () => {
    if (moreOpen.value) updateMenuPosition()
  },
  { flush: 'post' },
)

watch(
  [visible, overflow],
  () => {
    const focusedElement = document.activeElement
    const hadFocusWithinRoot = Boolean(
      focusedElement && rootRef.value?.contains(focusedElement),
    )
    const focusedActionKey = focusedElement?.getAttribute('data-action-key')
    void nextTick(() => {
      if (!hadFocusWithinRoot || focusedElement?.isConnected) return
      const matchingAction = focusedActionKey
        ? Array.from(
            rootRef.value?.querySelectorAll<HTMLElement>('[data-action-key]') ??
              [],
          ).find((element) => element.dataset.actionKey === focusedActionKey)
        : undefined
      const moreButton = moreButtonRef.value?.$el as HTMLElement | undefined
      const fallback =
        matchingAction ??
        (moreButton?.isConnected
          ? moreButton
          : rootRef.value?.querySelector<HTMLElement>(
              '.lx-actions__item:not(:disabled)',
            ))
      fallback?.focus()
    })
  },
  { flush: 'pre' },
)

onMounted(() => {
  document.addEventListener('pointerdown', onDocumentPointerDown)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocumentPointerDown)
  window.removeEventListener('resize', onMenuViewportChange)
  document.removeEventListener('scroll', onMenuViewportChange, true)
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
    <LxButton
      v-for="item in shown"
      :key="actionKeyOf(item)"
      :data-action-key="actionKeyOf(item)"
      class="lx-actions__item"
      size="sm"
      :type="buttonTypeOf(item.action.type)"
      :text="isSemanticType(item.action.type)"
      :icon="item.action.icon"
      :text-color="item.action.textColor"
      :disabled="item.action.disabled"
      @click="onClick(item.action)"
    >
      {{ item.action.label }}
    </LxButton>

    <div v-if="overflow.length" class="lx-actions__more-wrap">
      <LxButton
        ref="moreButtonRef"
        class="lx-actions__item"
        :class="{ 'lx-actions__more--open': moreOpen }"
        size="sm"
        type="text"
        :aria-expanded="moreOpen"
        :aria-controls="menuId"
        @click="moreOpen = !moreOpen"
      >
        {{ moreText }}
      </LxButton>
      <div
        ref="menuRef"
        v-show="moreOpen"
        :id="menuId"
        class="lx-actions__menu"
        :style="menuPosition"
        role="group"
        :aria-label="moreGroupLabel"
      >
        <button
          v-for="item in overflow"
          :key="actionKeyOf(item)"
          type="button"
          :data-action-key="actionKeyOf(item)"
          class="lx-actions__menu-item"
          :class="`lx-actions__btn--${item.action.type || 'default'}`"
          :style="
            item.action.textColor
              ? {
                  '--lx-actions-item-color': item.action.textColor,
                  '--lx-actions-item-bg': item.action.textColor,
                }
              : undefined
          "
          :disabled="item.action.disabled"
          @click="onClick(item.action, true)"
        >
          <LxIcon
            v-if="item.action.icon"
            :name="item.action.icon"
            :size="16"
            class="lx-actions__icon"
          />
          {{ item.action.label }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.lx-actions {
  display: inline-flex;
  flex-wrap: wrap;
  /* 外显按钮为 LxButton 文字形态（自带左右 8px padding），相邻文字间距 16px 与旧版一致 */
  gap: 0;
  row-gap: 4px;
  align-items: center;
  max-width: 100%;
}

.lx-actions__item.el-button {
  min-width: 0;
  max-width: 100%;
  height: auto;
  min-height: var(--lx-btn-height-sm);
}

.lx-actions__item.el-button :deep(.lx-btn__label) {
  min-width: 0;
  text-align: start;
  overflow-wrap: anywhere;
  white-space: normal;
}

.lx-actions__icon {
  flex: 0 0 auto;
  margin-inline-end: 2px;
}

/* 菜单项语义色（外显按钮由 LxButton 语义档接管；折叠后保持同色不因折叠变色）。
 * 派生机制与 LxButton text 形态同款：文字用 strong 档保对比度，hover 底用语义色 8% 派生，
 * hover 不再把语义色冲成蓝色（红字删除项 hover 保持红字 + 浅红底） */
.lx-actions__btn--default,
.lx-actions__btn--primary {
  --lx-actions-item-color: var(--lx-color-primary);
  --lx-actions-item-bg: var(--lx-color-primary);
}

.lx-actions__btn--danger {
  --lx-actions-item-color: var(--lx-color-error-strong);
  --lx-actions-item-bg: var(--lx-color-error);
}

.lx-actions__btn--success {
  --lx-actions-item-color: var(--lx-color-success-strong);
  --lx-actions-item-bg: var(--lx-color-success);
}

.lx-actions__btn--warning {
  --lx-actions-item-color: var(--lx-color-warning-text);
  --lx-actions-item-bg: var(--lx-color-warning);
}

/* 「更多」触发器打开态：浅底给视觉用户状态反馈（aria-expanded 之外的可见信号） */
.lx-actions__more--open.el-button {
  background: color-mix(in srgb, var(--lx-color-primary) 8%, transparent);
}

.lx-actions__more-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.lx-actions__menu {
  position: fixed;
  z-index: 2000;
  box-sizing: border-box;
  min-width: 96px;
  max-width: min(16rem, calc(100vw - 16px));
  max-height: calc(100vh - 16px);
  padding: var(--lx-space-xs);
  overflow-y: auto;
  overscroll-behavior: contain;
  background: var(--lx-bg-card);
  border: 1px solid var(--lx-border);
  border-radius: var(--lx-radius-md);
  box-shadow: var(--lx-shadow-pop);
}

.lx-actions__menu-item {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
  min-height: 32px;
  padding: 6px var(--lx-space-sm);
  font-family: inherit;
  font-size: 12px;
  /* 折叠项保持语义色（红字删除项折叠后仍为红字），变量由上方语义类注入 */
  color: var(--lx-actions-item-color, var(--lx-color-primary));
  text-align: start;
  overflow-wrap: anywhere;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: var(--lx-radius-sm);
  transition:
    background-color var(--lx-transition),
    color var(--lx-transition);
}

/* hover 保持语义色（变量未注入时回退中性蓝），底色按语义色 8% 派生，与外显按钮同款 */
.lx-actions__menu-item:hover {
  color: var(--lx-actions-item-color, var(--lx-color-primary));
  background: color-mix(
    in srgb,
    var(--lx-actions-item-bg, var(--lx-color-primary)) 8%,
    transparent
  );
}

.lx-actions__menu-item:focus-visible {
  outline: 2px solid var(--lx-color-primary);
  outline-offset: -2px;
}

/* 禁用改专用灰字而非透明度（透明度冲淡红字不可读，与 LxButton 禁用哲学一致） */
.lx-actions__menu-item:disabled {
  color: var(--lx-btn-disabled-text);
  cursor: not-allowed;
}

/* 窄屏或触屏：保持 LxButton 的 44px 最小点击目标，也适用于外层收窄标签宽度的场景。 */
@media (hover: none), (max-width: 640px) {
  .lx-actions__item.el-button {
    min-width: 44px;
    min-height: 44px;
  }

  .lx-actions__menu-item {
    min-height: 44px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .lx-actions__menu-item {
    transition: none;
  }
}
</style>
