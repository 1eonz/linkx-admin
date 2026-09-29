<script setup lang="ts">
/**
 * LxRadioGroup — 单选组（Element Plus el-radio-group 内核二次封装）
 * 视觉源：design/表单控件八件套/code.html 03
 *   水平排布 16px 间距（标本 gap-4）；vertical 开启垂直排布 8px 行距
 *   （标本"处置通道优先级"行）。组内选项用 LxRadio。
 */
import { ElRadioGroup } from 'element-plus'
import type { LxRadioGroupProps } from './types'
import 'element-plus/es/components/radio-group/style/css'
import './style.css'

defineOptions({ name: 'LxRadioGroup', inheritAttrs: false })

withDefaults(defineProps<LxRadioGroupProps>(), {
  modelValue: undefined,
  // disabled 显式 default: undefined（对齐 EP 内核 default: void 0）：absent 时保持
  // undefined 而非被 Vue cast 为 false，useFormDisabled 的 ?? 链（表单禁用继承）
  // 才不会被短路；删掉默认值不行——无 default 的 Boolean 会被 cast 成 false
  disabled: undefined,
  vertical: false,
  name: undefined,
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number | boolean | undefined]
  change: [value: string | number | boolean | undefined]
}>()
</script>

<template>
  <ElRadioGroup
    class="lx-radio-group"
    :class="{ 'lx-radio-group--vertical': vertical }"
    :model-value="modelValue"
    :disabled="disabled"
    :name="name"
    v-bind="$attrs"
    @update:model-value="emit('update:modelValue', $event)"
    @change="emit('change', $event)"
  >
    <slot />
  </ElRadioGroup>
</template>
