<script setup lang="ts">
/**
 * LxTextarea — 多行文本域（Element Plus el-input type="textarea" 内核二次封装）
 * 视觉源：design/表单控件八件套/code.html 08
 *   3 行基准高度、底部右对齐字数计数（等宽 11px）、resize-y；
 *   边框 / 焦点 / 错误态视觉由 element-theme.css 全局令牌桥供给（承接波 1）。
 * 默认 maxlengthMode="truncate" 遵从 EP 硬截断；"validate" 模式保留超限值，
 * 并提供关联的错误说明与计数反馈，供用户直接修正。
 * 未声明的 EP props 经 $attrs 透传，兼容旧用法。
 */
import { computed, getCurrentInstance, ref, useAttrs } from 'vue'
import { ElInput } from 'element-plus'
import type { InputInstance } from 'element-plus'
import type { LxTextareaProps } from './types'
import LxIcon from '../LxIcon/index.vue'
import 'element-plus/es/components/input/style/css'
import './style.css'

defineOptions({ name: 'LxTextarea', inheritAttrs: false })

const props = withDefaults(defineProps<LxTextareaProps>(), {
  modelValue: '',
  placeholder: '',
  // disabled 显式 default: undefined（对齐 EP 内核 default: void 0）：absent 时保持
  // undefined 而非被 Vue cast 为 false，useFormDisabled 的 ?? 链（表单禁用继承）
  // 才不会被短路；删掉默认值不行——无 default 的 Boolean 会被 cast 成 false
  disabled: undefined,
  readonly: false,
  rows: 3,
  autosize: false,
  maxlength: undefined,
  maxlengthMode: 'truncate',
  showWordLimit: false,
  resize: 'vertical',
  name: undefined,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  input: [value: string]
  change: [value: string]
  focus: [event: FocusEvent]
  blur: [event: FocusEvent]
}>()

/** EP 内核实例引用：textarea 形态下 focus/blur 方法透传给调用方 */
const inputRef = ref<InputInstance>()
const attrs = useAttrs()
const instanceId = getCurrentInstance()?.uid ?? 0
const inputId = computed(() => {
  const id = attrs.id
  return typeof id === 'string' && id !== '' ? id : `lx-textarea-${instanceId}`
})
const overflowDescriptionId = computed(() => `${inputId.value}-overflow`)
const isOverflow = computed(
  () =>
    props.maxlengthMode === 'validate' &&
    props.maxlength !== undefined &&
    props.maxlength >= 0 &&
    props.modelValue.length > props.maxlength,
)
const nativeMaxlength = computed(() =>
  props.maxlengthMode === 'validate' ? undefined : props.maxlength,
)
const ariaDescribedby = computed(() => {
  const supplied = attrs['aria-describedby']
  const ids = [
    typeof supplied === 'string' ? supplied.trim() : '',
    isOverflow.value ? overflowDescriptionId.value : '',
  ].filter(Boolean)
  return ids.length > 0 ? ids.join(' ') : undefined
})
const ariaInvalid = computed(() =>
  isOverflow.value ? 'true' : attrs['aria-invalid'],
)
const showValidationCounter = computed(
  () =>
    props.maxlengthMode === 'validate' &&
    props.showWordLimit &&
    props.maxlength !== undefined &&
    props.maxlength >= 0,
)

defineExpose({
  /** 聚焦文本域 */
  focus: () => inputRef.value?.focus(),
  /** 移除焦点 */
  blur: () => inputRef.value?.blur(),
})
</script>

<template>
  <div
    class="lx-textarea"
    :class="[
      $attrs.class,
      { 'is-overflow': isOverflow, 'is-disabled': disabled },
    ]"
    :style="$attrs.style"
  >
    <ElInput
      ref="inputRef"
      class="lx-textarea__control"
      v-bind="$attrs"
      :id="inputId"
      :aria-describedby="ariaDescribedby"
      :aria-invalid="ariaInvalid"
      :model-value="modelValue"
      type="textarea"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      :rows="rows"
      :autosize="autosize"
      :maxlength="nativeMaxlength"
      :show-word-limit="maxlengthMode === 'truncate' && showWordLimit"
      :resize="resize"
      :name="name"
      @update:model-value="emit('update:modelValue', $event)"
      @input="emit('input', $event)"
      @change="emit('change', $event)"
      @focus="emit('focus', $event)"
      @blur="emit('blur', $event)"
    />
    <div
      v-if="showValidationCounter || isOverflow"
      class="lx-textarea__feedback"
    >
      <p
        v-if="isOverflow"
        :id="overflowDescriptionId"
        class="lx-textarea__overflow-message"
        role="alert"
      >
        <LxIcon name="circle-alert" :size="12" aria-hidden="true" />
        <span>字数超出上限 {{ maxlength }} 字</span>
      </p>
      <span
        v-if="showValidationCounter"
        class="lx-textarea__validation-count"
        :class="{ 'is-overflow': isOverflow }"
        role="status"
        :aria-label="`字数 ${modelValue.length} / ${maxlength}`"
      >
        {{ modelValue.length }} / {{ maxlength }}
      </span>
    </div>
  </div>
</template>
