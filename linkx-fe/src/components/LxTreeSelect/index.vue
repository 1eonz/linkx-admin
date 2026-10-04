<script setup lang="ts">
/**
 * LxTreeSelect — 树形下拉选择器。
 *
 * 它是 DynamicForm 的树字段入口，保留 Element Plus 的树数据、懒加载、
 * 级联和远程筛选契约，但由 lx-ui 统一承载尺寸、焦点、弹层和减少动效样式。
 * 网络请求仍由宿主通过 load/remoteMethod 等属性注入。
 *
 * 多选模式遵循组织树设计约定：树内勾选只更新待提交值，点击 footer 的确认后
 * 才向宿主发出 update:modelValue/change；取消、Escape 或点击弹层外部会丢弃草稿。
 */
import {
  ElTreeSelect,
  provideGlobalConfig,
  useFormDisabled,
  useGlobalConfig,
} from 'element-plus'
import type { TreeSelectInstance } from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import {
  computed,
  getCurrentInstance,
  onBeforeUnmount,
  onMounted,
  onUpdated,
  ref,
  useAttrs,
  watch,
} from 'vue'

import type {
  LxTreeSelectProps,
  LxTreeSelectSize,
  LxTreeSelectValue,
} from './types'
import 'element-plus/es/components/tree-select/style/css'
import './style.css'

defineOptions({ name: 'LxTreeSelect', inheritAttrs: false })

const props = withDefaults(defineProps<LxTreeSelectProps>(), {
  modelValue: undefined,
  data: () => [],
  placeholder: '',
  disabled: undefined,
  clearable: false,
  filterable: false,
  multiple: false,
  collapseTags: false,
  collapseTagsTooltip: false,
  loading: false,
  error: false,
  retryable: false,
  size: 'md' as LxTreeSelectSize,
})

const emit = defineEmits<{
  'update:modelValue': [value: LxTreeSelectValue | undefined]
  change: [value: LxTreeSelectValue | undefined]
  confirm: [value: LxTreeSelectValue | undefined]
  cancel: []
  retry: []
  'visible-change': [visible: boolean]
}>()

defineSlots<{
  header?: () => unknown
  loading?: () => unknown
  empty?: () => unknown
  footer?: (scope: {
    value: LxTreeSelectValue | undefined
    confirm: () => void
    cancel: () => void
  }) => unknown
}>()

const attrs = useAttrs()
const componentUid = getCurrentInstance()?.uid ?? 0
const fieldRef = ref<HTMLDivElement>()
const isDisabled = useFormDisabled(computed(() => props.disabled))
const interactionDisabled = computed(() => isDisabled.value || props.loading)
const userPopperClass = computed(() => {
  const value = attrs.popperClass ?? attrs['popper-class']
  return typeof value === 'string' ? value : undefined
})

/**
 * Element Plus 的语言环境优先继承宿主 ElConfigProvider；没有上层配置时才
 * 使用中文兜底。locale prop 只覆盖当前树选择器，不改变业务应用全局语言。
 */
const inheritedConfig = useGlobalConfig()
const resolvedLocale = computed(
  () => props.locale ?? inheritedConfig.value?.locale ?? zhCn,
)
provideGlobalConfig(computed(() => ({ locale: resolvedLocale.value })))

const treeSelectRef = ref<TreeSelectInstance>()
const SIZE_MAP: Record<LxTreeSelectSize, 'small' | 'default' | 'large'> = {
  sm: 'small',
  md: 'default',
  lg: 'large',
}

function cloneTreeValue(
  value: LxTreeSelectValue | undefined,
): LxTreeSelectValue | undefined {
  return Array.isArray(value) ? ([...value] as LxTreeSelectValue) : value
}

const draftValue = ref<LxTreeSelectValue | undefined>(
  cloneTreeValue(props.modelValue),
)
const closeAction = ref<'confirm' | 'cancel' | null>(null)
const menuVisible = ref(false)
const multipleValue = computed(() =>
  props.multiple ? draftValue.value : props.modelValue,
)
const hasError = computed(() => Boolean(props.error))
const errorMessage = computed(() =>
  typeof props.error === 'string' ? props.error : resolvedErrorText.value,
)
const chineseLocale = computed(() => resolvedLocale.value.name.startsWith('zh'))
const resolvedErrorText = computed(
  () =>
    props.errorText ??
    (chineseLocale.value
      ? '组织目录加载失败'
      : 'Failed to load organization data'),
)
const resolvedRetryText = computed(
  () => props.retryText ?? (chineseLocale.value ? '重试' : 'Retry'),
)
const errorMessageId = computed(() => {
  const id = attrs.id
  return typeof id === 'string' && id.trim()
    ? `${id.trim()}-error`
    : `lx-tree-select-error-${componentUid}`
})
const formValidationMessageId = computed(() => {
  const id = attrs.id
  return typeof id === 'string' && id.trim()
    ? `${id.trim()}-validation-error`
    : `lx-tree-select-validation-error-${componentUid}`
})
const resolvedDescribedBy = computed(() => {
  const provided = attrs['aria-describedby']
  const ids = typeof provided === 'string' ? provided.trim().split(/\s+/) : []
  if (hasError.value) ids.push(errorMessageId.value)
  return [...new Set(ids.filter(Boolean))].join(' ') || undefined
})

let managesAriaInvalid = false
let managedFormErrorId: string | undefined
let formItemObserver: MutationObserver | undefined
let observedFormItem: HTMLElement | null = null

// TreeSelect 的额外 ARIA 属性停留在内核根节点，需要同步到实际可聚焦输入框。
function syncInputAccessibility(): void {
  const input = fieldRef.value?.querySelector('input')
  if (!(input instanceof HTMLInputElement)) return

  const formItem = fieldRef.value?.closest<HTMLElement>('.el-form-item')
  const formItemInvalid = formItem?.classList.contains('is-error') ?? false
  const providedInvalid = attrs['aria-invalid']
  const invalidValue =
    hasError.value || formItemInvalid
      ? 'true'
      : typeof providedInvalid === 'string'
        ? providedInvalid
        : undefined

  if (invalidValue !== undefined) {
    input.setAttribute('aria-invalid', invalidValue)
    managesAriaInvalid = true
  } else if (managesAriaInvalid) {
    input.removeAttribute('aria-invalid')
    managesAriaInvalid = false
  }

  const formItemError = formItem?.querySelector<HTMLElement>(
    '.el-form-item__error',
  )
  const formItemErrorId =
    formItemError?.id ||
    (formItemInvalid ? formValidationMessageId.value : undefined)
  if (
    formItemInvalid &&
    formItemError &&
    !formItemError.id &&
    formItemErrorId
  ) {
    formItemError.id = formItemErrorId
  }
  const describedBy = new Set([
    ...(resolvedDescribedBy.value?.split(/\s+/).filter(Boolean) ?? []),
    ...(input
      .getAttribute('aria-describedby')
      ?.split(/\s+/)
      .filter(
        (id) => id && id !== errorMessageId.value && id !== formItemErrorId,
      ) ?? []),
  ])
  if (managedFormErrorId) describedBy.delete(managedFormErrorId)
  if (formItemInvalid && formItemErrorId) describedBy.add(formItemErrorId)
  managedFormErrorId = formItemInvalid ? formItemErrorId : undefined

  if (describedBy.size) {
    input.setAttribute('aria-describedby', [...describedBy].join(' '))
  } else {
    input.removeAttribute('aria-describedby')
  }
}

function observeFormItemChanges(): void {
  const formItem = fieldRef.value?.closest<HTMLElement>('.el-form-item') ?? null
  if (formItem === observedFormItem) return

  formItemObserver?.disconnect()
  observedFormItem = formItem
  if (!formItem || typeof MutationObserver === 'undefined') return

  formItemObserver = new MutationObserver(syncInputAccessibility)
  formItemObserver.observe(formItem, {
    attributes: true,
    attributeFilter: ['class'],
    characterData: true,
    childList: true,
    subtree: true,
  })
}

function refreshInputAccessibility(): void {
  syncInputAccessibility()
  observeFormItemChanges()
}

onMounted(refreshInputAccessibility)
onUpdated(refreshInputAccessibility)
onBeforeUnmount(() => formItemObserver?.disconnect())
const resolvedNoDataText = computed(
  () =>
    props.noDataText ??
    props.emptyText ??
    (chineseLocale.value ? '暂无数据' : undefined),
)
const resolvedNoMatchText = computed(
  () => props.noMatchText ?? (chineseLocale.value ? '无匹配数据' : undefined),
)
const resolvedLoadingText = computed(
  () => props.loadingText ?? (chineseLocale.value ? '加载中' : undefined),
)
const resolvedSelectedText = computed(
  () =>
    props.selectedText ??
    (chineseLocale.value ? '已选 {count} 项' : '{count} selected'),
)
const resolvedUnselectedText = computed(
  () =>
    props.unselectedText ?? (chineseLocale.value ? '未选择' : 'None selected'),
)
const resolvedCancelText = computed(
  () => props.cancelText ?? (chineseLocale.value ? '取消' : 'Cancel'),
)
const resolvedConfirmText = computed(
  () => props.confirmText ?? (chineseLocale.value ? '确认' : 'Confirm'),
)
const draftCount = computed(() => {
  if (Array.isArray(draftValue.value)) return draftValue.value.length
  return draftValue.value === undefined || draftValue.value === null ? 0 : 1
})

watch(
  () => props.modelValue,
  (value) => {
    draftValue.value = cloneTreeValue(value)
  },
  { deep: true },
)

watch(
  () => props.multiple,
  () => {
    draftValue.value = cloneTreeValue(props.modelValue)
  },
)

function handleModelUpdate(value: unknown): void {
  if (interactionDisabled.value) return
  const nextValue = value as LxTreeSelectValue | undefined
  if (props.multiple) {
    draftValue.value = cloneTreeValue(nextValue)
    return
  }
  emit('update:modelValue', nextValue)
  treeSelectRef.value?.selectRef.blur()
}

function handleChange(value: unknown): void {
  if (!props.multiple && !interactionDisabled.value) {
    emit('change', value as LxTreeSelectValue | undefined)
  }
}

function handleVisibleChange(visible: boolean): void {
  menuVisible.value = visible
  if (props.multiple && !visible) {
    if (closeAction.value === null) {
      draftValue.value = cloneTreeValue(props.modelValue)
      emit('cancel')
    }
    closeAction.value = null
  }
  if (visible && props.multiple) {
    closeAction.value = null
    draftValue.value = cloneTreeValue(props.modelValue)
  }
  emit('visible-change', visible)
}

function closeMenu(action: 'confirm' | 'cancel'): void {
  if (menuVisible.value) closeAction.value = action
  treeSelectRef.value?.selectRef.blur()
}

function confirmSelection(): void {
  if (!props.multiple || interactionDisabled.value) return
  const nextValue = cloneTreeValue(draftValue.value)
  emit('update:modelValue', nextValue)
  emit('change', nextValue)
  emit('confirm', nextValue)
  closeMenu('confirm')
}

function cancelSelection(): void {
  if (!props.multiple) return
  draftValue.value = cloneTreeValue(props.modelValue)
  emit('cancel')
  closeMenu('cancel')
}

function retrySelection(): void {
  if (interactionDisabled.value) return
  emit('retry')
}

watch(
  isDisabled,
  (disabled) => {
    if (!disabled || !menuVisible.value) return
    if (props.multiple) {
      cancelSelection()
    } else {
      treeSelectRef.value?.selectRef.blur()
    }
  },
  { flush: 'sync' },
)

defineExpose({
  focus: () => treeSelectRef.value?.selectRef.focus(),
  blur: () => treeSelectRef.value?.selectRef.blur(),
  confirm: confirmSelection,
  cancel: cancelSelection,
})
</script>

<template>
  <div
    ref="fieldRef"
    class="lx-tree-select-field"
    :class="[
      $attrs.class,
      {
        'is-error': hasError,
      },
    ]"
    :style="$attrs.style"
    :aria-busy="props.loading ? 'true' : 'false'"
    :aria-invalid="hasError ? 'true' : undefined"
  >
    <ElTreeSelect
      ref="treeSelectRef"
      class="lx-tree-select"
      :class="`lx-tree-select--${props.size}`"
      v-bind="$attrs"
      :model-value="multipleValue"
      :data="props.data"
      :placeholder="props.placeholder"
      :disabled="isDisabled"
      :clearable="props.clearable"
      :filterable="props.filterable"
      :multiple="props.multiple"
      :collapse-tags="props.collapseTags"
      :collapse-tags-tooltip="props.collapseTagsTooltip"
      :loading="props.loading"
      :empty-text="props.emptyText"
      :no-data-text="resolvedNoDataText"
      :no-match-text="resolvedNoMatchText"
      :loading-text="resolvedLoadingText"
      :size="SIZE_MAP[props.size]"
      :aria-invalid="hasError ? 'true' : undefined"
      :aria-describedby="resolvedDescribedBy"
      :popper-class="['lx-tree-select__popper', userPopperClass]"
      @update:model-value="handleModelUpdate"
      @change="handleChange"
      @visible-change="handleVisibleChange"
    >
      <template v-if="$slots.header" #header><slot name="header" /></template>
      <template v-if="$slots.loading" #loading
        ><slot name="loading"
      /></template>
      <template v-if="$slots.empty" #empty><slot name="empty" /></template>
      <template v-if="props.multiple || $slots.footer" #footer>
        <slot
          name="footer"
          :value="draftValue"
          :confirm="confirmSelection"
          :cancel="cancelSelection"
        >
          <div v-if="props.multiple" class="lx-tree-select__footer">
            <span
              class="lx-tree-select__footer-count"
              role="status"
              aria-live="polite"
            >
              {{
                draftCount
                  ? resolvedSelectedText.replace('{count}', String(draftCount))
                  : resolvedUnselectedText
              }}
            </span>
            <div class="lx-tree-select__footer-actions">
              <button
                class="lx-tree-select__footer-button is-secondary"
                type="button"
                @click.stop="cancelSelection"
              >
                {{ resolvedCancelText }}
              </button>
              <button
                class="lx-tree-select__footer-button is-primary"
                type="button"
                :disabled="interactionDisabled"
                @click.stop="confirmSelection"
              >
                {{ resolvedConfirmText }}
              </button>
            </div>
          </div>
        </slot>
      </template>
    </ElTreeSelect>

    <div
      v-if="hasError"
      :id="errorMessageId"
      class="lx-tree-select__error"
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <span>{{ errorMessage }}</span>
      <button
        v-if="props.retryable"
        class="lx-tree-select__retry"
        type="button"
        :disabled="interactionDisabled"
        @click="retrySelection"
      >
        {{ resolvedRetryText }}
      </button>
    </div>
  </div>
</template>
