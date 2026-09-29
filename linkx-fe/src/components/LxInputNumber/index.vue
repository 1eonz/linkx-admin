<script setup lang="ts">
/**
 * LxInputNumber — 数字输入器（Element Plus el-input-number 内核二次封装）
 * 视觉源：design/表单控件八件套/code.html 05
 *   默认宽 160px、值文字 mono + 600 字重左对齐、步进钮右侧垂直拆分
 *   （controlsPosition 默认 'right'，标本 05 唯一形态）。
 * 步进钮 hover 图标转主色由 EP 原生提供；触屏档步进钮高度在 style.css 放大。
 * value-on-clear / autocomplete 等低频 props 经 $attrs 透传。
 * 模板绑定顺序契约：v-bind="$attrs" 在前、显式绑定在后。
 * 模板保持单根（无根级注释）：注释节点会引入 Fragment 根，
 * 破坏 $attrs 单根继承与测试工具对根元素类的断言。
 */
import { ref } from 'vue'
import { ElInputNumber } from 'element-plus'
import type { InputNumberInstance } from 'element-plus'
import type {
  LxInputNumberAlign,
  LxInputNumberProps,
  LxInputNumberSize,
} from './types'
import 'element-plus/es/components/input-number/style/css'
import './style.css'

defineOptions({ name: 'LxInputNumber', inheritAttrs: false })

withDefaults(defineProps<LxInputNumberProps>(), {
  modelValue: undefined,
  // 边界默认值与 EP 内核对齐（-Infinity/Infinity），显式固化防升级漂移
  min: -Infinity,
  max: Infinity,
  step: 1,
  stepStrictly: false,
  precision: undefined,
  // disabled 显式 default: undefined：absent 时保持 undefined 而非被 Vue cast
  // 为 false，useFormDisabled 的 ?? 链（表单禁用继承）才不会被短路
  disabled: undefined,
  controls: true,
  // Lx 默认右侧垂直拆分（标本 05 契约；EP 原生默认 '' 两侧形态）
  controlsPosition: 'right',
  placeholder: '',
  // 值文字左对齐（标本 05 契约；EP 原生默认 'center'）。经 EP 内核
  // align prop → 根类 is-left → 原生规则 .el-input-number.is-left .el-input__inner
  align: 'left',
  size: 'md',
  name: undefined,
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  change: [currentValue: number | undefined, oldValue: number | undefined]
  focus: [event: FocusEvent]
  blur: [event: FocusEvent]
}>()

/** EP 内核实例引用：focus/blur 方法透传给调用方 */
const numberRef = ref<InputNumberInstance>()

/** 档位映射：Lx 工程档名 → EP 内核档（高度由全局令牌桥收敛 28/32/40px） */
const SIZE_MAP: Record<LxInputNumberSize, 'small' | 'default' | 'large'> = {
  sm: 'small',
  md: 'default',
  lg: 'large',
}

defineExpose({
  /** 聚焦输入框 */
  focus: () => numberRef.value?.focus(),
  /** 移除焦点 */
  blur: () => numberRef.value?.blur(),
})
</script>

<template>
  <ElInputNumber
    ref="numberRef"
    class="lx-input-number"
    v-bind="$attrs"
    :model-value="modelValue"
    :min="min"
    :max="max"
    :step="step"
    :step-strictly="stepStrictly"
    :precision="precision"
    :disabled="disabled"
    :controls="controls"
    :controls-position="controlsPosition"
    :placeholder="placeholder"
    :align="align"
    :size="SIZE_MAP[size]"
    :name="name"
    @update:model-value="emit('update:modelValue', $event)"
    @change="
      (currentValue: number | undefined, oldValue: number | undefined) =>
        emit('change', currentValue, oldValue)
    "
    @focus="emit('focus', $event)"
    @blur="emit('blur', $event)"
  />
</template>
