<script setup lang="ts">
/**
 * LxTextarea — 多行文本域（Element Plus el-input type="textarea" 内核二次封装）
 * 视觉源：design/表单控件八件套/code.html 08
 *   3 行基准高度、底部右对齐字数计数（等宽 11px）、resize-y；
 *   边框 / 焦点 / 错误态视觉由 element-theme.css 全局令牌桥供给（承接波 1）。
 * 溢出红字计数为有意识裁剪：EP maxlength 硬截断，超限态不可达（审计终裁）。
 * 未声明的 EP props 经 $attrs 透传，兼容旧用法。
 */
import { ref } from 'vue'
import { ElInput } from 'element-plus'
import type { InputInstance } from 'element-plus'
import type { LxTextareaProps } from './types'
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

defineExpose({
  /** 聚焦文本域 */
  focus: () => inputRef.value?.focus(),
  /** 移除焦点 */
  blur: () => inputRef.value?.blur(),
})
</script>

<template>
  <ElInput
    ref="inputRef"
    class="lx-textarea"
    :model-value="modelValue"
    type="textarea"
    :placeholder="placeholder"
    :disabled="disabled"
    :readonly="readonly"
    :rows="rows"
    :autosize="autosize"
    :maxlength="maxlength"
    :show-word-limit="showWordLimit"
    :resize="resize"
    :name="name"
    v-bind="$attrs"
    @update:model-value="emit('update:modelValue', $event)"
    @input="emit('input', $event)"
    @change="emit('change', $event)"
    @focus="emit('focus', $event)"
    @blur="emit('blur', $event)"
  />
</template>
