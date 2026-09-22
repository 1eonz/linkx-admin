<script setup lang="ts">
/**
 * ModernCard - 现代卡片容器组件
 *
 * 功能特性：
 * - 对齐原型 docs/components.html 的 .modern-card 样式
 * - 白色背景 + border + radius + 单层阴影
 * - 可选 section-title（通过 title/icon props 自动渲染 SectionTitle 组件）
 * - 支持 default 插槽（卡片内容）+ extra 插槽（右侧操作）
 *
 * @example 基础用法（无标题）
 * ```vue
 * <ModernCard>
 *   <div>卡片内容</div>
 * </ModernCard>
 * ```
 *
 * @example 带标题 + 图标
 * ```vue
 * <ModernCard title="警务数据与指标统计" :icon="DataAnalysis">
 *   <div class="metric-grid">...</div>
 * </ModernCard>
 * ```
 *
 * @example 自定义标题 + 右侧操作
 * ```vue
 * <ModernCard>
 *   <template #title>自定义标题</template>
 *   <template #extra><el-button type="primary">新增</el-button></template>
 *   卡片内容
 * </ModernCard>
 * ```
 */
import type { Component } from 'vue';

import SectionTitle from '@/components/SectionTitle/index.vue';

defineOptions({ name: 'ModernCard' });

withDefaults(
  defineProps<{
    /** 卡片标题（当 title 插槽为空时使用） */
    title?: string;
    /** 标题图标 */
    icon?: Component;
    /** 是否显示边框，默认 true */
    bordered?: boolean;
  }>(),
  {
    title: '',
    icon: undefined,
    bordered: true,
  },
);
</script>

<template>
  <div class="modern-card custom-modern-card" :class="{ 'no-border': !bordered }">
    <SectionTitle v-if="title || $slots.title" :title="title" :icon="icon">
      <template v-if="$slots.title" #default><slot name="title" /></template>
      <template v-if="$slots.extra" #extra><slot name="extra" /></template>
    </SectionTitle>
    <slot />
  </div>
</template>

<style lang="less" scoped>
.custom-modern-card {
  // 继承全局 .modern-card 样式（reset.less 中定义）
  &.no-border {
    border: none;
  }
}
</style>
