<script setup lang="ts">
/**
 * SvgIcon - SVG 图标渲染组件，自动识别外链或内联 symbol
 *
 * 功能特性：
 * - 自动识别外链图标（http/https/mailto/tel）并以背景图方式渲染
 * - 内联 SVG 通过 symbol id 引用渲染
 * - 支持自定义 className 扩展样式
 * - 透传 $attrs 到根元素，便于扩展属性与事件
 * - 外链图标使用 mask 方式渲染，支持 currentColor 着色
 *
 * @example 基础用法（内联 SVG）
 * <SvgIcon icon-class="user" />
 *
 * @example 外链图标 + 自定义类名
 * <SvgIcon icon-class="https://example.com/logo.png" class-name="logo" />
 *
 * Props:
 * - iconClass: string，图标标识（外链 URL 或 symbol 名），必填，无默认值
 * - className: string，附加样式类名，默认 ''
 *
 * Events: 无
 *
 * Slots: 无
 *
 * Methods: 无
 */
import { computed } from 'vue';

defineOptions({ name: 'SvgIcon' });

interface Props {
  iconClass: string;
  className?: string;
}

const props = withDefaults(defineProps<Props>(), {
  className: '',
});

const isExternal = computed(() => /^(https?:|mailto:|tel:)/.test(props.iconClass));

const iconName = computed(() => `#icon-${props.iconClass}`);
const svgClass = computed(() => {
  if (props.className) {
    return 'svg-icon ' + props.className;
  }
  return 'svg-icon';
});
</script>

<template>
  <i
    v-if="isExternal"
    :style="{ backgroundImage: `url(${iconClass})`, backgroundSize: 'cover' }"
    class="svg-external-icon svg-icon"
    v-bind="$attrs"
  />
  <svg v-else :class="svgClass" aria-hidden="true" v-bind="$attrs">
    <use :xlink:href="iconName" />
  </svg>
</template>

<style lang="less" scoped>
.svg-icon {
  width: 1em;
  height: 1em;
  vertical-align: -0.15em;
  fill: currentColor;
  overflow: hidden;
}

.svg-external-icon {
  background-color: currentColor;
  mask-size: cover !important;
  display: inline-block;
}
</style>
