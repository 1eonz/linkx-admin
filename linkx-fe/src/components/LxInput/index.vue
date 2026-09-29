<script setup lang="ts">
/**
 * LxInput — 文本输入框（Element Plus el-input 内核二次封装）
 * 视觉源：design/表单控件八件套/code.html 01
 *   32px 基准高、4px 圆角、主色焦点光环；错误态红边浅红底深红值由
 *   element-theme.css 全局桥接层统一供给（承接波 1）。
 * 边框 / 焦点 / 错误态 / 尺寸视觉全部走全局令牌桥，本组件样式层
 * 只叠加 Lx 增量规格（mono 值字体、计数器外观，见 style.css）。
 * 未声明的 EP props（formatter/parser 等）经 $attrs 透传，兼容旧用法。
 */
import { ref } from 'vue'
import { ElInput } from 'element-plus'
import type { InputInstance } from 'element-plus'
import type { LxInputProps, LxInputSize } from './types'
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

/** 档位映射：Lx 工程档名 → EP 内核档（高度由全局令牌桥收敛 28/32/40px） */
const SIZE_MAP: Record<LxInputSize, 'small' | 'default' | 'large'> = {
  sm: 'small',
  md: 'default',
  lg: 'large',
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
    :readonly="readonly"
    :clearable="clearable"
    :show-password="showPassword"
    :maxlength="maxlength"
    :minlength="minlength"
    :show-word-limit="showWordLimit"
    :size="SIZE_MAP[size]"
    :name="name"
    :autocomplete="autocomplete"
    v-bind="$attrs"
    @update:model-value="emit('update:modelValue', $event)"
    @input="emit('input', $event)"
    @change="emit('change', $event)"
    @focus="emit('focus', $event)"
    @blur="emit('blur', $event)"
    @clear="emit('clear')"
  >
    <template v-if="$slots.prefix" #prefix><slot name="prefix" /></template>
    <template v-if="$slots.suffix" #suffix><slot name="suffix" /></template>
    <template v-if="$slots.prepend" #prepend><slot name="prepend" /></template>
    <template v-if="$slots.append" #append><slot name="append" /></template>
  </ElInput>
</template>
