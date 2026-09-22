<script setup lang="ts">
/**
 * MetricCard - 指标卡片组件（三段式：title / value / footer）
 *
 * 功能特性：
 * - 对齐原型 docs/components.html 的 .metric-card 样式
 * - 渐变背景 + border + radius
 * - 三段式布局：标题 / 数值 / 底部说明
 * - 数值用等宽字体（JetBrains Mono）+ 大号字重
 * - 支持 valueType 控制数值颜色（default/success/warning/danger）
 * - 支持右上角附加内容（extra 插槽，如 el-tag）
 *
 * @example 基础用法
 * ```vue
 * <MetricCard title="今日高危告警" :value="142" value-type="danger" footer="较昨日 ↑ 12%" />
 * ```
 *
 * @example 自定义数值 + 右上角 tag
 * ```vue
 * <MetricCard title="在线警力">
 *   <template #value>1,280</template>
 *   <template #footer>巡逻车 320 辆 | 执勤警员 960 人</template>
 *   <template #extra><el-tag type="success" size="small">实时</el-tag></template>
 * </MetricCard>
 * ```
 */
import { computed } from 'vue';

defineOptions({ name: 'MetricCard' });

const props = withDefaults(
  defineProps<{
    /** 指标标题 */
    title?: string;
    /** 指标值 */
    value?: string | number;
    /** 数值颜色类型 */
    valueType?: 'default' | 'success' | 'warning' | 'danger';
    /** 底部说明 */
    footer?: string;
  }>(),
  {
    title: '',
    value: '',
    valueType: 'default',
    footer: '',
  },
);

// 数值颜色 class
const valueClass = computed(() => `metric-value--${props.valueType}`);
</script>

<template>
  <div class="metric-card custom-metric-card">
    <!-- 标题（支持插槽覆盖） -->
    <div class="metric-title">
      <slot name="title">{{ title }}</slot>
      <div class="metric-extra">
        <slot name="extra" />
      </div>
    </div>

    <!-- 数值（支持插槽覆盖） -->
    <div class="metric-value" :class="valueClass">
      <slot name="value">{{ value }}</slot>
    </div>

    <!-- 底部说明（支持插槽覆盖） -->
    <div v-if="footer || $slots.footer" class="metric-footer">
      <slot name="footer">{{ footer }}</slot>
    </div>
  </div>
</template>

<style lang="less" scoped>
.custom-metric-card {
  // 继承全局 .metric-card 样式（reset.less 中定义）
  .metric-extra {
    margin-left: auto;
  }

  // 数值颜色变体
  .metric-value--default {
    color: @color-text-primary;
  }

  .metric-value--success {
    color: @color-success;
  }

  .metric-value--warning {
    color: @color-warning;
  }

  .metric-value--danger {
    color: @color-danger;
  }
}
</style>
