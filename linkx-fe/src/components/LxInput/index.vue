<script setup lang="ts">
/**
 * LxInput — 文本输入框（Element Plus el-input 内核二次封装）
 * 视觉源：design/表单控件八件套/code.html 01
 *   32px 基准高、4px 圆角、主色焦点光环；错误态红边浅红底深红值由
 *   element-theme.css 全局桥接层统一供给（承接波 1）。
 * 边框 / 焦点 / 错误态使用全局令牌；尺寸高度由组件样式按令牌固定，
 * 避免内核内容行高撑开外框（mono 值字体、计数器外观也见 style.css）。
 * 未声明的 EP props（formatter/parser 等）经 $attrs 透传，兼容旧用法。
 */
import type { InputInstance } from 'element-plus'
import { ElInput, formContextKey } from 'element-plus'
import { computed, inject, ref } from 'vue'

import type { LxInputProps, LxInputSize } from './types'
import LxIcon from '../LxIcon/index.vue'
import 'element-plus/es/components/input/style/css'
import './style.css'

defineOptions({ name: 'LxInput', inheritAttrs: false })

const props = withDefaults(defineProps<LxInputProps>(), {
  modelValue: '',
  type: 'text',
  placeholder: '',
  // disabled 显式 default: undefined（对齐 EP 内核 default: void 0）：absent 时保持
  // undefined 而非被 Vue cast 为 false，useFormDisabled 的 ?? 链（表单禁用继承）
  // 才不会被短路；删掉默认值不行——无 default 的 Boolean 会被 cast 成 false
  disabled: undefined,
  readonly: false,
  required: false,
  clearable: false,
  showPassword: false,
  maxlength: undefined,
  minlength: undefined,
  showWordLimit: false,
  mono: false,
  size: 'md',
  name: undefined,
  autocomplete: 'off',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  input: [value: string]
  change: [value: string]
  focus: [event: FocusEvent]
  blur: [event: FocusEvent]
  clear: []
}>()

/** EP 内核实例引用：focus/blur/select 方法透传给调用方 */
const inputRef = ref<InputInstance>()
const formContext = inject(formContextKey, undefined)
const isFocused = ref(false)
const isHovered = ref(false)
const isClearFocused = ref(false)
const isDisabled = computed(
  () => props.disabled ?? formContext?.disabled ?? false,
)

const clearButtonEnabled = computed(() => {
  const hasValue = String(props.modelValue ?? '').length > 0

  return props.clearable && !isDisabled.value && !props.readonly && hasValue
})

const clearButtonVisible = computed(() => {
  return (
    clearButtonEnabled.value &&
    (isFocused.value || isHovered.value || isClearFocused.value)
  )
})

/** 档位映射：Lx 工程档名 → EP 内核档（高度由全局令牌桥收敛 28/32/40px） */
const SIZE_MAP: Record<LxInputSize, 'small' | 'default' | 'large'> = {
  sm: 'small',
  md: 'default',
  lg: 'large',
}

function handleFocus(event: FocusEvent) {
  isFocused.value = true
  emit('focus', event)
}

function handleBlur(event: FocusEvent) {
  isFocused.value = false
  emit('blur', event)
}

function clearInput(event: MouseEvent) {
  if (!clearButtonEnabled.value) return

  inputRef.value?.clear(event)
  inputRef.value?.focus()
}

defineExpose({
  /** 聚焦输入框 */
  focus: () => inputRef.value?.focus(),
  /** 移除焦点 */
  blur: () => inputRef.value?.blur(),
  /** 选中文本框全部内容 */
  select: () => inputRef.value?.select(),
})
</script>

<template>
  <ElInput
    ref="inputRef"
    class="lx-input"
    :class="[`lx-input--${size}`, { 'lx-input--mono': mono }]"
    :model-value="modelValue"
    :type="type"
    :placeholder="placeholder"
    :disabled="disabled"
    :required="required"
    :readonly="readonly"
    :clearable="false"
    :show-password="showPassword"
    :maxlength="maxlength"
    :minlength="minlength"
    :show-word-limit="showWordLimit"
    :size="SIZE_MAP[size]"
    :name="name"
    :autocomplete="autocomplete"
    v-bind="$attrs"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
    @update:model-value="emit('update:modelValue', $event)"
    @input="emit('input', $event)"
    @change="emit('change', $event)"
    @focus="handleFocus"
    @blur="handleBlur"
    @clear="emit('clear')"
  >
    <template v-if="$slots.prefix" #prefix><slot name="prefix" /></template>
    <template v-if="$slots.suffix || clearable" #suffix>
      <slot name="suffix" />
      <button
        v-if="clearable"
        class="lx-input__clear"
        :class="{ 'lx-input__clear--touch-visible': clearButtonEnabled }"
        type="button"
        :disabled="!clearButtonEnabled"
        :tabindex="clearButtonEnabled ? 0 : -1"
        :aria-hidden="clearButtonEnabled ? undefined : 'true'"
        aria-label="清空输入框"
        title="清空输入"
        :style="{ visibility: clearButtonVisible ? 'visible' : 'hidden' }"
        @mousedown.prevent
        @focus="isClearFocused = true"
        @blur="isClearFocused = false"
        @click="clearInput"
      >
        <LxIcon name="x" :size="14" />
      </button>
    </template>
    <template v-if="$slots.prepend" #prepend><slot name="prepend" /></template>
    <template v-if="$slots.append" #append><slot name="append" /></template>
  </ElInput>
</template>
