<script setup lang="ts">
/**
 * LxTextarea — 多行文本域（Element Plus el-input type="textarea" 内核二次封装）
 * 视觉源：design/表单控件八件套/code.html 08
 *   3 行基准高度、设置 maxlength 后默认在底部右对齐显示长度计数（等宽 12px）、resize-y；
 *   边框、焦点和错误态使用 lx-ui 令牌，支持全局与局部主题。
 * 默认 maxlengthMode="truncate" 遵从 EP 硬截断；"validate" 模式保留超限值，
 * 并提供关联的错误说明与计数反馈，供用户直接修正。
 * 未声明的 EP props 经 $attrs 透传，兼容旧用法。
 */
import { ElInput } from 'element-plus'
import type { InputInstance } from 'element-plus'
import { computed, getCurrentInstance, ref, useAttrs, watch } from 'vue'

import type { LxTextareaProps } from './types'
import LxIcon from '../LxIcon/index.vue'
import 'element-plus/es/components/input/style/css'
import './style.css'

defineOptions({ name: 'LxTextarea', inheritAttrs: false })

const props = withDefaults(defineProps<LxTextareaProps>(), {
  modelValue: '',
  placeholder: '',
  id: undefined,
  // disabled 显式 default: undefined（对齐 EP 内核 default: void 0）：absent 时保持
  // undefined 而非被 Vue cast 为 false，useFormDisabled 的 ?? 链（表单禁用继承）
  // 才不会被短路；删掉默认值不行——无 default 的 Boolean 会被 cast 成 false
  disabled: undefined,
  readonly: false,
  rows: 3,
  autosize: false,
  maxlength: undefined,
  maxlengthMode: 'truncate',
  showWordLimit: true,
  wordLimitPosition: 'outside',
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
const inputId = () => {
  const id = props.id
  return typeof id === 'string' && id !== '' ? id : `lx-textarea-${instanceId}`
}
const overflowDescriptionId = () => `${inputId()}-overflow`
const isOverflow = computed(
  () =>
    props.maxlengthMode === 'validate' &&
    props.maxlength !== undefined &&
    props.maxlength >= 0 &&
    props.modelValue.length > props.maxlength,
)
const isAtLimit = computed(
  () =>
    props.maxlengthMode === 'truncate' &&
    props.maxlength !== undefined &&
    props.maxlength >= 0 &&
    props.modelValue.length >= props.maxlength,
)
const truncateCounterLabel = computed(() =>
  isAtLimit.value
    ? `内容长度已达到上限 ${props.modelValue.length} / ${props.maxlength}`
    : `内容长度 ${props.modelValue.length} / ${props.maxlength}`,
)
const nativeMaxlength = computed(() =>
  props.maxlengthMode === 'validate' ? undefined : props.maxlength,
)
const ariaDescribedby = () => {
  const supplied = attrs['aria-describedby']
  const ids = [
    typeof supplied === 'string' ? supplied.trim() : '',
    isOverflow.value ? overflowDescriptionId() : '',
  ].filter(Boolean)
  return ids.length > 0 ? ids.join(' ') : undefined
}
const ariaInvalid = () => (isOverflow.value ? 'true' : attrs['aria-invalid'])
const showTruncateCounter = computed(
  () =>
    props.maxlengthMode === 'truncate' &&
    props.showWordLimit &&
    props.maxlength !== undefined &&
    props.maxlength >= 0,
)
const showValidationCounter = computed(
  () =>
    props.maxlengthMode === 'validate' &&
    props.showWordLimit &&
    props.maxlength !== undefined &&
    props.maxlength >= 0,
)
const overflowAnnouncement = ref('')
const limitAnnouncement = ref('')

watch(isAtLimit, (active, wasActive) => {
  if (active && !wasActive) {
    limitAnnouncement.value = '已达到内容长度上限。'
  } else if (!active) {
    limitAnnouncement.value = ''
  }
})

watch(isOverflow, (active, wasActive) => {
  if (active && !wasActive) {
    overflowAnnouncement.value = '内容长度已超过上限。'
  } else if (!active) {
    overflowAnnouncement.value = ''
  }
})

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
      {
        'is-overflow': isOverflow,
        'is-disabled': disabled,
        'is-readonly': readonly,
      },
    ]"
    :style="$attrs.style"
  >
    <div class="lx-textarea__control-shell">
      <ElInput
        :id="inputId()"
        ref="inputRef"
        class="lx-textarea__control"
        :class="{
          'lx-textarea__control--count-inside':
            showTruncateCounter && wordLimitPosition === 'inside',
        }"
        v-bind="$attrs"
        :aria-describedby="ariaDescribedby()"
        :aria-invalid="ariaInvalid()"
        :model-value="modelValue"
        type="textarea"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :rows="rows"
        :autosize="autosize"
        :maxlength="nativeMaxlength"
        :show-word-limit="false"
        :resize="resize"
        :name="name"
        @update:model-value="emit('update:modelValue', $event)"
        @input="emit('input', $event)"
        @change="emit('change', $event)"
        @focus="emit('focus', $event)"
        @blur="emit('blur', $event)"
      />
      <span
        v-if="showTruncateCounter"
        class="lx-textarea__count"
        :class="[
          `lx-textarea__count--${wordLimitPosition}`,
          { 'is-at-limit': isAtLimit },
        ]"
        role="status"
        aria-live="off"
        :aria-label="truncateCounterLabel"
      >
        {{ modelValue.length }} / {{ maxlength }}
        <span
          v-if="isAtLimit"
          class="lx-textarea__limit-label"
          aria-hidden="true"
        >
          已达上限
        </span>
      </span>
    </div>
    <div
      v-if="showValidationCounter || isOverflow"
      class="lx-textarea__feedback"
    >
      <p
        v-if="isOverflow"
        :id="overflowDescriptionId()"
        class="lx-textarea__overflow-message"
        aria-live="off"
      >
        <LxIcon name="circle-alert" :size="12" aria-hidden="true" />
        <span>内容长度已超过上限，请删减后继续。</span>
      </p>
      <span
        v-if="showValidationCounter"
        class="lx-textarea__validation-count"
        :class="{ 'is-overflow': isOverflow }"
        role="status"
        aria-live="off"
        :aria-label="`内容长度 ${modelValue.length} / ${maxlength}`"
      >
        {{ modelValue.length }} / {{ maxlength }}
      </span>
    </div>
    <span
      class="lx-textarea__announcement lx-textarea__limit-announcement"
      role="status"
      aria-atomic="true"
    >
      {{ limitAnnouncement }}
    </span>
    <span class="lx-textarea__announcement" role="alert" aria-atomic="true">
      {{ overflowAnnouncement }}
    </span>
  </div>
</template>
