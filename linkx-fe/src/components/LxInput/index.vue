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
import { computed, inject, nextTick, ref, watch } from 'vue'

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
  clearButtonTabbable: true,
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

// 关闭显隐能力、更换输入类型或禁用时恢复遮罩，避免再次启用时沿用明文状态。
watch(
  [() => props.showPassword, () => props.type, isDisabled],
  () => {
    if (inputRef.value) inputRef.value.passwordVisible = false
  },
  { flush: 'sync' },
)

function togglePasswordVisibility() {
  const kernel = inputRef.value
  if (!kernel || !props.showPassword || isDisabled.value) return

  const input = kernel.input
  const selection = input
    ? ([
        input.selectionStart,
        input.selectionEnd,
        input.selectionDirection,
      ] as const)
    : undefined

  // 继续使用 EP 公开的显隐状态，保留 showPassword 接管 type 和 change 事件的内核契约。
  kernel.passwordVisible = !kernel.passwordVisible
  nextTick(() => {
    if (
      !input ||
      input !== inputRef.value?.input ||
      !props.showPassword ||
      !selection ||
      selection[0] === null ||
      selection[1] === null
    )
      return

    // 仅恢复选区，不主动聚焦：鼠标保留输入焦点，键盘保留按钮焦点。
    input.setSelectionRange(
      selection[0],
      selection[1],
      selection[2] ?? undefined,
    )
  })
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
        class="lx-input__clear el-input__clear"
        :class="{ 'lx-input__clear--touch-visible': clearButtonEnabled }"
        type="button"
        :disabled="!clearButtonEnabled"
        :tabindex="clearButtonVisible && clearButtonTabbable ? 0 : -1"
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
    <template #password-icon="{ visible }">
      <button
        class="lx-input__password-toggle"
        type="button"
        :disabled="isDisabled"
        :aria-label="visible ? '隐藏密码' : '显示密码'"
        :aria-pressed="visible"
        @mousedown.prevent
        @click.stop="togglePasswordVisibility"
      >
        <slot name="password-icon" :visible="visible">
          <LxIcon :name="visible ? 'eye-off' : 'eye'" :size="14" />
        </slot>
      </button>
    </template>
    <template v-if="$slots.prepend" #prepend><slot name="prepend" /></template>
    <template v-if="$slots.append" #append><slot name="append" /></template>
  </ElInput>
</template>
