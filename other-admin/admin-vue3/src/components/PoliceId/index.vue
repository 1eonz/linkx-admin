<script setup lang="ts">
/**
 * PoliceId - 警号/设备编号高亮标签
 *
 * 功能特性：
 * - 对齐原型 docs/components.html 的 .police-id 样式
 * - 等宽字体（JetBrains Mono）+ 主色文字 + 主色淡色背景
 * - 支持前缀（如 'P'）+ 值拼接
 *
 * @example 基础用法
 * ```vue
 * <PoliceId :value="row.policeId" />
 * ```
 *
 * @example 带前缀
 * ```vue
 * <PoliceId :value="row.policeId" prefix="P" />
 * // 渲染：P001021
 * ```
 */
defineOptions({ name: 'PoliceId' });

withDefaults(
  defineProps<{
    /** 警号值 */
    value: string | number;
    /** 前缀，如 'P' */
    prefix?: string;
  }>(),
  {
    prefix: '',
  },
);
</script>

<template>
  <span class="police-id custom-police-id">{{ prefix }}{{ value }}</span>
</template>

<style lang="less" scoped>
.custom-police-id {
  // 继承全局 .police-id 样式（reset.less 中定义）
}
</style>
