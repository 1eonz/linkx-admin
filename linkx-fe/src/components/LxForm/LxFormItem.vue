<script setup lang="ts">
/**
 * LxFormItem — 表单项（Element Plus el-form-item 二次封装）
 * 额外能力：span 跨列（LxForm columns>1 网格内生效；'full' 通栏）
 * $attrs 全透传（labelWidth/error/showMessage/inlineMessage…），插槽原样转发（含 #error）
 */
import { computed } from 'vue';
import { ElFormItem } from 'element-plus';
import type { LxFormItemProps } from './types';
import 'element-plus/es/components/form/style/css';

const props = withDefaults(defineProps<LxFormItemProps>(), {
  label: '',
  prop: undefined,
  rules: undefined,
  required: undefined,
  span: 1,
});

const spanStyle = computed(() => {
  if (props.span === 'full') return { gridColumn: '1 / -1' };
  if (typeof props.span === 'number' && props.span > 1) return { gridColumn: `span ${props.span}` };
  return undefined;
});
</script>

<template>
  <ElFormItem
    class="lx-form-item"
    :label="label"
    :prop="prop"
    :rules="rules"
    :required="required"
    :style="spanStyle"
    v-bind="$attrs"
  >
    <template v-for="(_, name) in $slots" :key="name" #[name]="slotProps">
      <slot :name="name" v-bind="slotProps ?? {}" />
    </template>
  </ElFormItem>
</template>
