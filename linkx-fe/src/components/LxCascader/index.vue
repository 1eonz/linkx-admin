<script setup lang="ts">
/**
 * LxCascader — 级联选择器的 lx-ui 外观封装。
 *
 * 级联是 SearchBar 仍需要的 Element Plus 能力；宿主只接触 LxCascader，
 * 选项值、键盘行为和低频 props 仍按 EP 契约透传，视觉由 lx-ui 令牌统一。
 */
import {
  ElCascader,
  provideGlobalConfig,
  useFormDisabled,
  useGlobalConfig,
} from 'element-plus'
import type { CascaderInstance, CascaderProps } from 'element-plus'
import type { Language } from 'element-plus/es/locale'
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
  LxCascaderModelValue,
  LxCascaderProps,
  LxCascaderSize,
} from './types'
import 'element-plus/es/components/cascader/style/css'
import './style.css'

defineOptions({ name: 'LxCascader', inheritAttrs: false })

const props = withDefaults(defineProps<LxCascaderProps>(), {
  modelValue: undefined,
  options: () => [],
  placeholder: '',
  disabled: undefined,
  clearable: false,
  filterable: false,
  multiple: undefined,
  collapseTags: false,
  collapseTagsTooltip: false,
  checkStrictly: undefined,
  showAllLevels: true,
  emitPath: undefined,
  loading: false,
  error: false,
  size: 'md' as LxCascaderSize,
})

const emit = defineEmits<{
  'update:modelValue': [value: LxCascaderModelValue]
  change: [value: LxCascaderModelValue]
  expandChange: [value: LxCascaderModelValue]
  blur: [event: FocusEvent]
  focus: [event: FocusEvent]
  visibleChange: [visible: boolean]
  retry: []
}>()

const attrs = useAttrs()
const componentUid = getCurrentInstance()?.uid ?? 0
const fieldRef = ref<HTMLDivElement>()
const hasError = computed(() => Boolean(props.error) && !props.loading)
const isDisabled = useFormDisabled(computed(() => props.disabled))
const interactionPaused = computed(
  () => isDisabled.value || props.loading || hasError.value,
)
const resolvedCascaderProps = computed<CascaderProps | undefined>(() => {
  const config: CascaderProps = { ...(props.props ?? {}) }

  if (props.multiple !== undefined) config.multiple = props.multiple
  if (props.checkStrictly !== undefined) {
    config.checkStrictly = props.checkStrictly
  }
  if (props.emitPath !== undefined) config.emitPath = props.emitPath
  if (interactionPaused.value) config.disabled = () => true

  return Object.keys(config).length > 0 ? config : undefined
})
const errorMessageId = computed(() =>
  props.id ? `${props.id}-error` : `lx-cascader-error-${componentUid}`,
)
const formValidationMessageId = computed(() =>
  props.id
    ? `${props.id}-validation-error`
    : `lx-cascader-validation-error-${componentUid}`,
)
const resolvedDescribedBy = computed(() => {
  const provided = attrs['aria-describedby']
  const ids = typeof provided === 'string' ? provided.trim().split(/\s+/) : []
  if (hasError.value) ids.push(errorMessageId.value)
  return [...new Set(ids.filter(Boolean))].join(' ') || undefined
})
const userPopperClass = computed(() => {
  const value = attrs.popperClass ?? attrs['popper-class']
  return typeof value === 'string' ? value : undefined
})

const cascaderRef = ref<CascaderInstance>()
const popperVisible = ref(false)
const cascaderDisabled = computed(
  () => isDisabled.value && !popperVisible.value,
)
let managesAriaInvalid = false
let managedFormErrorId: string | undefined
let formItemObserver: MutationObserver | undefined
let observedFormItem: HTMLElement | null = null

watch(
  isDisabled,
  (disabled) => {
    if (disabled && popperVisible.value) {
      // 禁用 prop 传给内核前先收起弹层；Element Plus 禁用后会拒绝关闭调用。
      cascaderRef.value?.togglePopperVisible(false)
    }
  },
  { flush: 'sync' },
)

function syncInputAccessibility(): void {
  const input = fieldRef.value?.querySelector('input')
  if (!(input instanceof HTMLInputElement)) return

  const attributes: Record<string, unknown> = {
    id: props.id,
    name: props.name,
    autocomplete: props.autocomplete,
    'aria-label': props.ariaLabel,
    'aria-labelledby': props.ariaLabelledby,
  }

  Object.entries(attributes).forEach(([name, value]) => {
    if (typeof value === 'string' && value.length > 0) {
      input.setAttribute(name, value)
    } else {
      input.removeAttribute(name)
    }
  })

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
        (id) =>
          id &&
          id !== errorMessageId.value &&
          id !== formItemErrorId &&
          id !== managedFormErrorId,
      ) ?? []),
  ])
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

const inheritedConfig = useGlobalConfig()
const resolvedLocale = computed<Language>(
  () => props.locale ?? inheritedConfig.value?.locale ?? zhCn,
)
provideGlobalConfig(computed(() => ({ locale: resolvedLocale.value })))

const isChineseLocale = computed(() =>
  resolvedLocale.value.name.startsWith('zh'),
)
const resolvedEmptyText = computed(
  () => props.emptyText ?? (isChineseLocale.value ? '暂无数据' : 'No data'),
)
const resolvedLoadingText = computed(
  () => props.loadingText ?? (isChineseLocale.value ? '加载中' : 'Loading'),
)
const resolvedErrorText = computed(
  () =>
    props.errorText ??
    (isChineseLocale.value
      ? '组织数据加载失败'
      : 'Failed to load organization data'),
)
const resolvedRetryText = computed(
  () => props.retryText ?? (isChineseLocale.value ? '重试' : 'Retry'),
)
const SIZE_MAP: Record<LxCascaderSize, 'small' | 'default' | 'large'> = {
  sm: 'small',
  md: 'default',
  lg: 'large',
}

const popperClass = computed(() => [
  'lx-cascader__popper',
  props.loading ? 'is-loading' : undefined,
  hasError.value ? 'is-error' : undefined,
  userPopperClass.value,
])

function removeEscapeListener(): void {
  if (typeof document !== 'undefined') {
    document.removeEventListener('keydown', handleDocumentKeydown, true)
  }
}

function handleDocumentKeydown(event: KeyboardEvent): void {
  if (!popperVisible.value || event.key !== 'Escape') return

  event.preventDefault()
  event.stopPropagation()
  cascaderRef.value?.togglePopperVisible(false)
}

function handleVisibleChange(visible: boolean): void {
  popperVisible.value = visible
  if (visible && typeof document !== 'undefined') {
    document.addEventListener('keydown', handleDocumentKeydown, true)
  } else {
    removeEscapeListener()
  }
  emit('visibleChange', visible)
}

function handleModelUpdate(value: LxCascaderModelValue): void {
  if (interactionPaused.value) return
  emit('update:modelValue', value)
}

function handleChange(value: LxCascaderModelValue): void {
  if (interactionPaused.value) return
  emit('change', value)
}

function handleKeydownCapture(event: KeyboardEvent): void {
  if (
    !interactionPaused.value ||
    (event.key !== 'Backspace' && event.key !== 'Delete')
  ) {
    return
  }

  const target = event.target
  if (target instanceof HTMLInputElement && target.value.length > 0) return

  event.preventDefault()
  event.stopPropagation()
}

function handleRetry(): void {
  if (isDisabled.value) return
  emit('retry')
}

onBeforeUnmount(() => {
  removeEscapeListener()
  formItemObserver?.disconnect()
})

defineExpose({
  focus: () => cascaderRef.value?.focus(),
  blur: () => cascaderRef.value?.blur(),
  togglePopperVisible: (visible?: boolean) =>
    cascaderRef.value?.togglePopperVisible(visible),
  getCheckedNodes: (...args: Parameters<CascaderInstance['getCheckedNodes']>) =>
    cascaderRef.value?.getCheckedNodes(...args),
})
</script>

<template>
  <div
    ref="fieldRef"
    class="lx-cascader-field"
    :class="[$attrs.class, { 'is-error': hasError }]"
    :style="$attrs.style"
    :aria-busy="props.loading ? 'true' : 'false'"
    :aria-invalid="hasError ? 'true' : undefined"
    @keydown.capture="handleKeydownCapture"
  >
    <ElCascader
      ref="cascaderRef"
      class="lx-cascader"
      :class="[
        `lx-cascader--${props.size}`,
        { 'lx-cascader--selection-paused': interactionPaused },
      ]"
      v-bind="$attrs"
      :model-value="props.modelValue"
      :options="props.options"
      :props="resolvedCascaderProps"
      :placeholder="props.placeholder"
      :disabled="cascaderDisabled"
      :clearable="props.clearable && !interactionPaused"
      :filterable="props.filterable"
      :collapse-tags="props.collapseTags"
      :collapse-tags-tooltip="props.collapseTagsTooltip"
      :show-all-levels="props.showAllLevels"
      :size="SIZE_MAP[props.size]"
      :aria-busy="props.loading ? 'true' : undefined"
      :aria-invalid="hasError ? 'true' : undefined"
      :popper-class="popperClass"
      @update:model-value="handleModelUpdate($event as LxCascaderModelValue)"
      @change="handleChange($event as LxCascaderModelValue)"
      @expand-change="emit('expandChange', $event as LxCascaderModelValue)"
      @blur="emit('blur', $event)"
      @focus="emit('focus', $event)"
      @visible-change="handleVisibleChange"
    >
      <template #header>
        <div
          v-if="props.loading"
          class="lx-cascader__panel-state"
          role="status"
          aria-live="polite"
        >
          <span>{{ resolvedLoadingText }}</span>
        </div>
      </template>
      <template #empty>
        <div v-if="!props.loading && !hasError" class="lx-cascader__empty">
          {{ resolvedEmptyText }}
        </div>
      </template>
      <template #footer>
        <div v-if="hasError" class="lx-cascader__panel-footer">
          <span
            :id="popperVisible ? errorMessageId : undefined"
            role="alert"
            aria-live="assertive"
            >{{ resolvedErrorText }}</span
          >
          <button
            type="button"
            class="lx-cascader__retry"
            :disabled="isDisabled"
            @click="handleRetry"
          >
            {{ resolvedRetryText }}
          </button>
        </div>
      </template>
    </ElCascader>

    <div
      v-if="(props.loading || hasError) && !popperVisible"
      class="lx-cascader__feedback"
      :class="{ 'is-error': hasError, 'is-loading': props.loading }"
      :role="hasError ? 'alert' : 'status'"
      :aria-live="hasError ? 'assertive' : 'polite'"
    >
      <span :id="hasError ? errorMessageId : undefined">
        {{ hasError ? resolvedErrorText : resolvedLoadingText }}
      </span>
      <button
        v-if="hasError"
        type="button"
        class="lx-cascader__retry"
        :disabled="isDisabled"
        @click="handleRetry"
      >
        {{ resolvedRetryText }}
      </button>
    </div>
  </div>
</template>
