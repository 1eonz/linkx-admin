<script setup lang="ts">
/**
 * LxRadio — 单选项（Element Plus el-radio 内核二次封装）
 * 视觉源：design/表单控件八件套/code.html 03
 *   选中态为"白底蓝心靶环"（14px 圆环 + 6px 主色靶心，非 EP 默认蓝底白心），
 *   hover 时描边与文字同步转主色——样式在 style.css 组件级固化；
 *   element-theme.css 的同款全局覆写保留过渡期（存量 el-radio 直用页面迁移完成后摘除）。
 * 与 LxRadioGroup 配合使用；单项独立使用时亦可 v-model（EP 内核契约）。
 */
import { computed } from 'vue'
import { ElRadio } from 'element-plus'
import type { LxRadioProps } from './types'
import 'element-plus/es/components/radio/style/css'
import './style.css'

defineOptions({ name: 'LxRadio', inheritAttrs: false })

const props = withDefaults(defineProps<LxRadioProps>(), {
  value: undefined,
  label: '',
  // disabled 显式 default: undefined（对齐 EP 内核 default: void 0）：absent 时保持
  // undefined 而非被 Vue cast 为 false，useFormDisabled 的 ?? 链（组禁用 / 表单
  // 禁用继承）才不会被短路；删掉默认值不行——无 default 的 Boolean 会被 cast 成 false
  disabled: undefined,
  name: undefined,
})

const resolvedValue = computed(() => props.value ?? (props.label || undefined))

defineEmits<{
  /** 选中项变化（EP 内核原生 change 契约） */
  change: [value: unknown]
}>()
</script>

<template>
  <ElRadio
    class="lx-radio"
    :value="resolvedValue"
    :disabled="props.disabled"
    :name="props.name"
    v-bind="$attrs"
    @change="$emit('change', $event)"
  >
    <slot>{{ props.label }}</slot>
  </ElRadio>
</template>
