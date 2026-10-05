<script setup lang="ts">
/**
 * LxCheckboxGroup — 复选组（Element Plus el-checkbox-group 内核二次封装）
 * 视觉源：design/表单控件八件套/code.html 04
 *   水平排布 16px 间距；vertical 开启垂直排布 12px 行距
 *   （标本 04 权限列表 space-y-3）。组内选项用 LxCheckbox。
 */
import { computed } from 'vue'
import { ElCheckboxGroup } from 'element-plus'
import type { LxCheckboxGroupProps } from './types'
import 'element-plus/es/components/checkbox-group/style/css'
import './style.css'

defineOptions({ name: 'LxCheckboxGroup', inheritAttrs: false })

const props = withDefaults(defineProps<LxCheckboxGroupProps>(), {
  modelValue: () => [],
  // disabled 显式 default: undefined（对齐 EP 内核 default: void 0）：absent 时保持
  // undefined 而非被 Vue cast 为 false，useFormDisabled 的 ?? 链（表单禁用继承）
  // 才不会被短路；删掉默认值不行——无 default 的 Boolean 会被 cast 成 false
  disabled: undefined,
  vertical: false,
  name: undefined,
})

/** 过滤组选项不支持的布尔值，保持传给内核及发出的值集合一致。 */
function normalizeGroupValues(values: (string | number | boolean)[]) {
  return values.filter(
    (value): value is string | number =>
      typeof value === 'string' || typeof value === 'number',
  )
}

const elementModelValue = computed(() => normalizeGroupValues(props.modelValue))

const emit = defineEmits<{
  'update:modelValue': [value: (string | number)[]]
  change: [value: (string | number)[]]
}>()
</script>

<template>
  <ElCheckboxGroup
    class="lx-checkbox-group"
    :class="{ 'lx-checkbox-group--vertical': vertical }"
    :model-value="elementModelValue"
    :disabled="disabled"
    :name="name"
    v-bind="$attrs"
    @update:model-value="
      emit('update:modelValue', normalizeGroupValues($event))
    "
    @change="emit('change', normalizeGroupValues($event))"
  >
    <slot />
  </ElCheckboxGroup>
</template>
