<script setup lang="ts">
/**
 * LxForm — 表单容器（Element Plus el-form 二次封装）
 * 视觉源：stitch component_library_showcase · StandardInput/Select
 *        + _26 节点管理表单弹窗（错误态高亮规格）
 * 铁律：
 *  - $attrs 全透传：未声明的 props（statusIcon/scrollToError/labelSuffix/hideRequiredAsterisk/
 *    validateOnRuleChange/size…）与 @validate 事件原样传给 el-form，存量用法零成本迁移
 *  - 错误提示样式由组件库接管（style.css），业务禁止自写校验红字
 *  - 纯受控零请求（P7）：校验/提交/重置全部由业务驱动
 */
import { computed, ref } from 'vue';
import { ElForm } from 'element-plus';
import type { FormInstance } from 'element-plus';
import type { LxFormProps } from './types';
import './style.css';
import 'element-plus/es/components/form/style/css';

const props = withDefaults(defineProps<LxFormProps>(), {
  model: () => ({}),
  rules: () => ({}),
  labelWidth: '',
  labelPosition: 'top',
  inline: false,
  disabled: false,
  columns: 1,
  rowGap: 16,
});

const formRef = ref<FormInstance>();

const isGrid = computed(() => props.columns > 1 && !props.inline);

const gridStyle = computed(() =>
  isGrid.value ? { gridTemplateColumns: `repeat(${props.columns}, minmax(0, 1fr))`, rowGap: `${props.rowGap}px` } : undefined
);

/**
 * 转发 FormInstance 校验能力（业务模板 ref 直接调用）：
 *   validate / validateField / resetFields / clearValidate / scrollToField
 * 典型惯用法见 demo：
 *   - 提交：formRef.value!.validate().then(submit).catch(() => lxMessage.warning(...))
 *   - 弹窗回显后清残留：nextTick(() => formRef.value?.clearValidate())
 */
defineExpose({
  validate: (...args: Parameters<FormInstance['validate']>) => formRef.value!.validate(...args),
  validateField: (...args: Parameters<FormInstance['validateField']>) => formRef.value!.validateField(...args),
  resetFields: (...args: Parameters<FormInstance['resetFields']>) => formRef.value!.resetFields(...args),
  clearValidate: (...args: Parameters<FormInstance['clearValidate']>) => formRef.value!.clearValidate(...args),
  scrollToField: (...args: Parameters<FormInstance['scrollToField']>) => formRef.value!.scrollToField(...args),
});
</script>

<template>
  <ElForm
    ref="formRef"
    class="lx-form"
    :class="{ 'lx-form--grid': isGrid }"
    :style="gridStyle"
    v-bind="$attrs"
    :model="model"
    :rules="rules"
    :label-width="labelWidth"
    :label-position="labelPosition"
    :inline="inline"
    :disabled="disabled"
  >
    <slot />
  </ElForm>
</template>
