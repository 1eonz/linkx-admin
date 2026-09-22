<script setup lang="ts">
/**
 * SectionTitle - 区块标题组件
 *
 * 功能特性：
 * - 支持三种风格变体（variant prop）：
 *   - `dashed`（默认）：对齐原型 docs/components.html 的 .section-title 样式（图标+文字+底部虚线分隔）
 *   - `border`：左 border 风格（padding-left + 3px 主色竖线），兼容项目原有的 mapConfig/CommonConfig 等场景
 *   - `plain`：纯标题风格（无装饰），兼容项目原有的 ClientDetailDrawer 等场景
 * - 左侧图标（可选，默认主色）+ 标题文字
 * - 支持右侧附加内容（extra 插槽）
 *
 * @example 默认风格（dashed，图标+虚线）
 * ```vue
 * <SectionTitle title="警务数据与指标统计" :icon="DataAnalysis" />
 * ```
 *
 * @example 左 border 风格（兼容旧 mapConfig 样式）
 * ```vue
 * <SectionTitle title="底图文件" variant="border" />
 * ```
 *
 * @example 纯标题风格（兼容旧 ClientDetailDrawer 样式）
 * ```vue
 * <SectionTitle title="基本信息" variant="plain" />
 * ```
 *
 * @example 自定义标题内容 + 右侧附加
 * ```vue
 * <SectionTitle :icon="Operation">
 *   <template #default>自定义标题</template>
 *   <template #extra><el-tag size="small">NEW</el-tag></template>
 * </SectionTitle>
 * ```
 */
import type { Component } from 'vue';
import { computed } from 'vue';

defineOptions({ name: 'SectionTitle' });

const props = withDefaults(
  defineProps<{
    /** 标题文字（当默认插槽为空时使用） */
    title?: string;
    /** 标题图标组件 */
    icon?: Component;
    /** 图标颜色，默认主色 */
    iconColor?: string;
    /** 风格变体：dashed（图标+虚线，默认）/ border（左 border）/ plain（纯标题） */
    variant?: 'dashed' | 'border' | 'plain';
  }>(),
  {
    title: '',
    icon: undefined,
    iconColor: undefined,
    variant: 'dashed',
  },
);

// 容器 class
const containerClass = computed(() => `section-title--${props.variant}`);
</script>

<template>
  <div class="custom-section-title" :class="containerClass">
    <div class="title-left">
      <el-icon v-if="icon" class="title-icon" :color="iconColor">
        <component :is="icon" />
      </el-icon>
      <slot>{{ title }}</slot>
    </div>
    <div class="title-extra">
      <slot name="extra" />
    </div>
  </div>
</template>

<style lang="less" scoped>
.custom-section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: @spacing-sm;
  font-weight: @font-weight-semibold;

  .title-left {
    display: flex;
    align-items: center;
    gap: @spacing-sm;
  }

  .title-icon {
    font-size: @font-size-xl;
    color: @color-primary;
  }

  .title-extra {
    margin-left: auto;
  }

  // 变体：dashed（默认，对齐原型 .section-title）
  &.section-title--dashed {
    font-size: @font-size-lg;
    color: @color-text-primary;
    padding-bottom: 10px;
    border-bottom: 1px dashed @color-border;
    margin-bottom: @spacing-md;
  }

  // 变体：border（左 border 风格，兼容项目旧样式）
  &.section-title--border {
    margin: 0 0 @spacing-md;
    padding-left: @spacing-sm;
    border-left: 3px solid @color-primary;
    font-size: @font-size-lg;
    color: @color-text-primary;
  }

  // 变体：plain（纯标题，兼容项目旧样式）
  &.section-title--plain {
    margin-bottom: @spacing-sm;
    font-size: @font-size-sm;
    color: @color-text-primary;
  }
}
</style>
