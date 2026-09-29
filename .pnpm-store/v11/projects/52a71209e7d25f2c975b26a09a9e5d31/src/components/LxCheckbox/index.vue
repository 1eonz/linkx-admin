<script setup lang="ts">
/**
 * LxCheckbox — 复选项（Element Plus el-checkbox 内核二次封装）
 * 视觉源：design/表单控件八件套/code.html 04
 *   选中主色填充白勾 / 半选横杠走 EP 原生契约（已对齐标本）；
 *   hover 描边与文字同步转主色为 Lx 增量规格（style.css 组件级固化，
 *   element-theme.css 全局同款覆写保留过渡期）。
 * 与 LxCheckboxGroup 配合使用；独立使用时直接 v-model boolean。
 */
import { ElCheckbox } from 'element-plus'
import type { LxCheckboxProps } from './types'
import 'element-plus/es/components/checkbox/style/css'
import './style.css'

defineOptions({ name: 'LxCheckbox', inheritAttrs: false })

withDefaults(defineProps<LxCheckboxProps>(), {
  modelValue: undefined,
  value: undefined,
  label: '',
  // disabled 显式 default: undefined（对齐 EP 内核 default: void 0）：absent 时保持
  // undefined 而非被 Vue cast 为 false，useFormDisabled 的 ?? 链（组禁用 / 表单
  // 禁用继承）才不会被短路；删掉默认值不行——无 default 的 Boolean 会被 cast 成 false
  disabled: undefined,
  indeterminate: false,
  name: undefined,
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number | boolean]
  change: [value: string | number | boolean]
}>()
</script>

<template>
  <ElCheckbox
    class="lx-checkbox"
    :model-value="modelValue"
    :value="value"
    :label="label || undefined"
    :disabled="disabled"
    :indeterminate="indeterminate"
    :name="name"
    v-bind="$attrs"
    @update:model-value="emit('update:modelValue', $event)"
    @change="emit('change', $event)"
  >
    <slot>{{ label }}</slot>
  </ElCheckbox>
</template>
