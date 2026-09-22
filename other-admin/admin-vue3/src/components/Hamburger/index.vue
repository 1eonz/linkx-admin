<script setup lang="ts">
/**
 * Hamburger - 侧边栏折叠开关组件
 *
 * 功能特性：
 * - 通过 isActive 切换展开/折叠图标（Expand / Fold）
 * - 点击容器触发 toggleClick 事件，由父组件控制侧边栏状态
 * - hover 时高亮背景色，提供交互反馈
 * - 高度撑满父容器，宽度由 padding 控制
 *
 * @example 基础用法
 * ```vue
 * <Hamburger :is-active="sidebarCollapsed" @toggle-click="toggleSidebar" />
 * ```
 *
 * Props：
 * - isActive: boolean，是否处于展开（激活）状态，默认 false
 *
 * Events：
 * - toggleClick: 点击容器时触发，无参数
 *
 * Slots：无
 *
 * Methods：无
 */
import { Expand, Fold } from '@element-plus/icons-vue';

defineOptions({ name: 'Hamburger' });

interface Props {
  isActive?: boolean;
}

withDefaults(defineProps<Props>(), {
  isActive: false,
});

const emit = defineEmits<{
  (e: 'toggleClick'): void;
}>();
</script>

<template>
  <div class="hamburger-container" @click="emit('toggleClick')">
    <el-icon :size="20">
      <Expand v-if="!isActive" />
      <Fold v-else />
    </el-icon>
  </div>
</template>

<style lang="less" scoped>
.hamburger-container {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  cursor: pointer;
  transition: background @transition-duration;
  color: @color-text-regular;
  padding: 0 @spacing-sm;

  &:hover {
    background-color: @color-hover-mask;
    color: @color-primary;
  }
}
</style>
