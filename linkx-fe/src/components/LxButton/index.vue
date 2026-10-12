<script setup lang="ts">
/**
 * LxButton — 按钮组件（Element Plus el-button 内核二次封装）
 * 视觉规范：design/按钮体系/DESIGN.md
 *   三档工程高度 28/32/40px；primary 实底白字，语义实底使用达标的深色文字，success 仅用于启用类动作；
 *   default 白底线框，text 无底色；
 *   loading 态 spinner + 文案切换（"下发指令中..."）+ 点击拦截 + aria-busy。
 * 表格行内一律用 type="text"；同一业务区域最多展示一个 primary。
 * 图标统一走 LxIcon（currentColor 跟随文字色），不使用 EP 图标链路。
 */
import { ElButton, ElTooltip } from 'element-plus'
import {
  computed,
  onBeforeUnmount,
  onUpdated,
  ref,
  useAttrs,
  useSlots,
  watch,
} from 'vue'

import { createIconTooltipController } from './icon-tooltip-coordinator'
import type { LxButtonProps, LxButtonSize } from './types'
import LxIcon from '../LxIcon/index.vue'
import 'element-plus/es/components/button/style/css'
import 'element-plus/es/components/tooltip/style/css'
import './style.css'

defineOptions({ name: 'LxButton', inheritAttrs: false })

const props = withDefaults(defineProps<LxButtonProps>(), {
  type: 'default',
  text: false,
  textColor: '',
  size: 'md',
  loading: false,
  loadingText: '',
  disabled: false,
  icon: undefined,
  iconPosition: 'left',
  block: false,
  nativeType: 'button',
})

const emit = defineEmits<{ click: [event: MouseEvent] }>()

/** attrs 显式接管后透传给 ElButton（aria-label / data-* 等调用方属性） */
const attrs = useAttrs()
const slots = useSlots()

/** ElButton 组件实例引用：纯图标 tooltip 虚拟触发需要根 DOM 元素 */
const buttonRef = ref<InstanceType<typeof ElButton>>()

/** tooltip 虚拟触发目标：ElButton 根 DOM（EP 实例 $el 为 any，此处收窄为元素类型；
 * 未挂载时为 undefined，tooltip 随之不触发） */
const tooltipTrigger = computed<HTMLElement | undefined>(
  () => (buttonRef.value?.$el as HTMLElement | undefined) ?? undefined,
)

/** tooltip 浮层跟随触发按钮所属文档，避免 iframe 场景传送到主文档 body。 */
const tooltipAppendTo = computed<HTMLElement | undefined>(
  () => tooltipTrigger.value?.ownerDocument.body ?? undefined,
)

/** 档位映射：Lx 工程档名 → EP 内核档（高度/字号差值在 style.css 以 --lx-btn-* 收敛） */
const SIZE_MAP: Record<LxButtonSize, 'small' | 'default' | 'large'> = {
  sm: 'small',
  md: 'default',
  lg: 'large',
}

/** 文字形态判定：type="text" 或显式 text prop（后者支持 danger+text 等语义组合） */
const isText = computed(() => props.type === 'text' || props.text)

/** EP 内核 type：text 形态由 text 布尔 prop 承担，避免使用 EP 已废弃的 type="text" */
const epType = computed(() => (props.type === 'text' ? 'default' : props.type))
const epSize = computed(() => SIZE_MAP[props.size])

/** 图标尺寸跟档位走（标本尺寸行级差：13/14/16px） */
const iconSize = computed(() => ({ sm: 13, md: 14, lg: 16 })[props.size])

/** loading 且提供了 loadingText 时替换按钮文字（标本交互：spinner + 文案切换） */
const showLoadingText = computed(
  () => props.loading && props.loadingText !== '',
)

/** 纯图标状态保持正方形；有默认内容或加载文案时按普通按钮布局。 */
const iconOnly = computed(() =>
  Boolean(props.icon && !slots.default && !showLoadingText.value),
)

/** 自定义文字色（仅文字形态生效）：以 CSS 变量注入，样式层派生 hover 底色 */
const textColorStyle = computed(() =>
  props.textColor !== ''
    ? { '--lx-btn-text-color': props.textColor }
    : undefined,
)

/** 纯图标形态：无 default 插槽内容；此时把 aria-label 同时作为可见 tooltip 展示 */
const readIconOnlyLabel = () => {
  const label = attrs['aria-label']
  return typeof label === 'string' ? label : ''
}
const iconOnlyLabel = ref(readIconOnlyLabel())

// useAttrs 的值不具备响应性；组件更新后同步名称，保证 tooltip 与按钮可访问名称一致。
onUpdated(() => {
  iconOnlyLabel.value = readIconOnlyLabel()
})

/** 仅在可操作的纯图标状态挂载提示，禁用或加载时会清理已打开和延迟中的浮层。 */
const canShowIconTooltip = computed(
  () =>
    iconOnly.value &&
    iconOnlyLabel.value !== '' &&
    !props.disabled &&
    !props.loading,
)

const iconTooltipController = createIconTooltipController()
const iconTooltipHovered = ref(false)
const iconTooltipFocused = ref(false)
const iconTooltipHudTheme = ref(false)
const iconTooltipPopperClass = computed(() =>
  iconTooltipHudTheme.value
    ? 'lx-button-icon-tooltip lx-theme-hud'
    : 'lx-button-icon-tooltip',
)
let activePointerType: string | undefined
const iconTooltipVisible = computed(
  () => canShowIconTooltip.value && iconTooltipController.visible.value,
)
let iconTooltipThemeObserver: MutationObserver | undefined

function syncIconTooltipTheme() {
  const nextTheme = Boolean(tooltipTrigger.value?.closest('.lx-theme-hud'))
  if (iconTooltipHudTheme.value !== nextTheme)
    iconTooltipHudTheme.value = nextTheme
}

function disconnectIconTooltipThemeObserver() {
  iconTooltipThemeObserver?.disconnect()
  iconTooltipThemeObserver = undefined
}

function observeIconTooltipTheme(trigger?: HTMLElement) {
  disconnectIconTooltipThemeObserver()
  syncIconTooltipTheme()

  const Observer = trigger?.ownerDocument.defaultView?.MutationObserver
  if (!trigger || !Observer) return

  const observer = new Observer((mutations) => {
    const triggerMoved = mutations.some(
      (mutation) =>
        mutation.type === 'childList' &&
        [...mutation.addedNodes, ...mutation.removedNodes].some(
          (node) => node === trigger || node.contains(trigger),
        ),
    )
    if (triggerMoved) {
      observeIconTooltipTheme(trigger)
      return
    }

    if (mutations.some((mutation) => mutation.type === 'attributes'))
      syncIconTooltipTheme()
  })
  let ancestor: HTMLElement | null = trigger
  while (ancestor) {
    observer.observe(ancestor, {
      attributes: true,
      attributeFilter: ['class'],
      childList: true,
    })
    ancestor = ancestor.parentElement
  }
  iconTooltipThemeObserver = observer
}

function onIconTooltipPointerDown(event: PointerEvent) {
  activePointerType = event.pointerType
  if (event.pointerType === 'touch') {
    iconTooltipHovered.value = false
    iconTooltipFocused.value = false
    iconTooltipController.clear()
  }
}

function onIconTooltipPointerEnd(event: PointerEvent) {
  if (activePointerType === event.pointerType) activePointerType = undefined
}

function onIconTooltipPointerEnter(event: PointerEvent) {
  if (event.pointerType === 'touch') return
  syncIconTooltipTheme()
  iconTooltipHovered.value = true
  if (!canShowIconTooltip.value) return
  iconTooltipController.mouseEnter()
}

function onIconTooltipPointerLeave(event: PointerEvent) {
  if (event.pointerType === 'touch') return
  iconTooltipHovered.value = false
  iconTooltipController.mouseLeave()
}

type FocusVisibleTarget = EventTarget & Pick<Element, 'matches'>

function isFocusVisibleTarget(
  target: EventTarget | null,
): target is FocusVisibleTarget {
  return (
    target !== null &&
    typeof target === 'object' &&
    'matches' in target &&
    typeof target.matches === 'function'
  )
}

function onIconTooltipFocus(event: FocusEvent) {
  // iframe 元素属于各自的 Window realm，按 DOM API 形态检查以兼容跨文档焦点。
  syncIconTooltipTheme()
  const keyboardFocus =
    activePointerType !== 'touch' &&
    isFocusVisibleTarget(event.target) &&
    event.target.matches(':focus-visible')
  iconTooltipFocused.value = keyboardFocus
  if (!canShowIconTooltip.value) return
  if (keyboardFocus) iconTooltipController.focus()
  else iconTooltipController.blur()
}

function onIconTooltipBlur() {
  iconTooltipFocused.value = false
  iconTooltipController.blur()
}

function onIconTooltipKeydown(event: KeyboardEvent) {
  if (
    event.key !== 'Escape' ||
    !canShowIconTooltip.value ||
    (!iconTooltipHovered.value && !iconTooltipFocused.value)
  )
    return

  event.stopPropagation()
  iconTooltipHovered.value = false
  iconTooltipFocused.value = false
  iconTooltipController.clear()
}

watch(canShowIconTooltip, (canShow) => {
  if (!canShow) {
    disconnectIconTooltipThemeObserver()
    iconTooltipController.clear()
    return
  }

  const trigger = tooltipTrigger.value
  iconTooltipController.bindDocument(trigger?.ownerDocument)
  observeIconTooltipTheme(trigger)
  if (iconTooltipFocused.value) iconTooltipController.focus()
  if (iconTooltipHovered.value) iconTooltipController.mouseEnter()
})

// 虚拟触发目标挂载后再绑定所属文档，避免 iframe 中的按钮与主文档互相关闭提示。
watch(
  tooltipTrigger,
  (trigger) => {
    if (!canShowIconTooltip.value) {
      disconnectIconTooltipThemeObserver()
      return
    }

    iconTooltipController.bindDocument(trigger?.ownerDocument)
    observeIconTooltipTheme(trigger)
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  disconnectIconTooltipThemeObserver()
  iconTooltipController.clear()
})

function onClick(event: MouseEvent) {
  // EP 内核在 disabled/loading 时已不派发 click，此处双保险防止 attrs 绕行
  if (props.disabled || props.loading) return
  emit('click', event)
}
</script>

<template>
  <ElButton
    ref="buttonRef"
    class="lx-btn"
    :class="[
      `lx-btn--${type}`,
      `lx-btn--${size}`,
      {
        'lx-btn--block': block,
        'lx-btn--icon-only': iconOnly,
        'lx-btn--icon-right': iconPosition === 'right',
      },
    ]"
    :style="textColorStyle"
    :type="epType"
    :size="epSize"
    :text="isText"
    :native-type="nativeType"
    :loading="loading"
    :disabled="disabled"
    v-bind="attrs"
    :aria-busy="loading ? 'true' : attrs['aria-busy']"
    @pointerenter="onIconTooltipPointerEnter"
    @pointerleave="onIconTooltipPointerLeave"
    @pointerdown="onIconTooltipPointerDown"
    @pointerup="onIconTooltipPointerEnd"
    @pointercancel="onIconTooltipPointerEnd"
    @focus="onIconTooltipFocus"
    @blur="onIconTooltipBlur"
    @keydown="onIconTooltipKeydown"
    @click="onClick"
  >
    <!-- 前置图标：EP 内核 loading 时自动隐藏 icon 槽并显示 spinner -->
    <template v-if="icon && iconPosition === 'left'" #icon>
      <LxIcon :name="icon" :size="iconSize" />
    </template>
    <!-- 纯图标形态（无插槽内容）不渲染空 label，保持方形点击区 -->
    <span v-if="showLoadingText" class="lx-btn__label">{{ loadingText }}</span>
    <span v-else-if="$slots.default" class="lx-btn__label"><slot /></span>
    <!-- 后置图标：EP 无对应 API，由本组件在文字尾部补充渲染；
         loading 时保留占位避免 spinner 前插导致文字横向跳动 -->
    <LxIcon
      v-if="icon && iconPosition === 'right'"
      :name="icon"
      :size="iconSize"
      class="lx-btn__icon-right"
    />
    <!-- 纯图标 tooltip 由同文档协调器统一控制，避免焦点与悬停同时打开多个提示。 -->
    <ElTooltip
      v-if="canShowIconTooltip"
      virtual-triggering
      :virtual-ref="tooltipTrigger"
      :content="iconOnlyLabel"
      :append-to="tooltipAppendTo"
      :popper-class="iconTooltipPopperClass"
      :trigger="[]"
      :trigger-keys="[]"
      :visible="iconTooltipVisible"
      transition="lx-btn-tooltip-static"
      placement="top"
    />
  </ElButton>
</template>
