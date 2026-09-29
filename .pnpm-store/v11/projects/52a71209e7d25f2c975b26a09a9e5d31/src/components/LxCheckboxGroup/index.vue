<script setup lang="ts">
/**
 * LxCheckboxGroup — 复选组（Element Plus el-checkbox-group 内核二次封装）
 * 视觉源：design/表单控件八件套/code.html 04
 *   水平排布 16px 间距；vertical 开启垂直排布 12px 行距
 *   （标本 04 权限列表 space-y-3）。组内选项用 LxCheckbox。
 */
import { ElCheckboxGroup } from 'element-plus'
import type { LxCheckboxGroupProps } from './types'
import 'element-plus/es/components/checkbox-group/style/css'
import './style.css'

defineOptions({ name: 'LxCheckboxGroup', inheritAttrs: false })

withDefaults(defineProps<LxCheckboxGroupProps>(), {
  modelValue: () => [],
  // disabled 显式 default: undefined（对齐 EP 内核 default: void 0）：absent 时保持
  // undefined 而非被 Vue cast 为 false，useFormDisabled 的 ?? 链（表单禁用继承）
  // 才不会被短路；删掉默认值不行——无 default 的 Boolean 会被 cast 成 false
  disabled: undefined,
  vertical: false,
  name: undefined,
})

const emit = defineEmits<{
  'update:modelValue': [value: (string | number)[]]
  /** change 载荷对齐 EP 2.14.6 事件契约 CheckboxValueType[]（比 prop 宽、含 boolean） */
  change: [value: (string | number | boolean)[]]
}>()
</script>

<template>
  <ElCheckboxGroup
    class="lx-checkbox-group"
    :class="{ 'lx-checkbox-group--vertical': vertical }"
    :model-value="modelValue"
    :disabled="disabled"
    :name="name"
    v-bind="$attrs"
    @update:model-value="emit('update:modelValue', $event)"
    @change="emit('change', $event)"
  >
    <slot />
  </ElCheckboxGroup>
</template>
