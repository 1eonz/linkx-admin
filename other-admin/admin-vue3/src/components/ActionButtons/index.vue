<script setup lang="ts">
/**
 * ActionButtons - 表格行内操作按钮组（统一规范）
 *
 * 功能特性：
 * - 对齐原型 docs/components.html 的表格行内操作按钮规范
 * - 强制使用 el-button link 模式 + 标准图标
 * - 支持 buttons 数组配置式渲染
 * - 支持快捷预设方法（view/edit/disable/enable/delete）
 *
 * @example 基础用法（数组配置）
 * ```vue
 * <ActionButtons :buttons="[
 *   { type: 'primary', icon: View, label: '查看', onClick: () => handleView(row) },
 *   { type: 'primary', icon: Edit, label: '编辑', onClick: () => handleEdit(row) },
 *   { type: 'danger', icon: Delete, label: '删除', onClick: () => handleDelete(row) },
 * ]" />
 * ```
 *
 * @example 快捷预设方法
 * ```vue
 * <ActionButtons :actions="{
 *   view: () => handleView(row),
 *   edit: () => handleEdit(row),
 *   delete: () => handleDelete(row),
 * }" />
 * ```
 */
import { Delete, Edit, VideoPause, VideoPlay, View } from '@element-plus/icons-vue';
import { computed } from 'vue';
import type { Component } from 'vue';

defineOptions({ name: 'ActionButtons' });

interface ButtonConfig {
  /** 按钮类型 */
  type?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  /** 图标组件 */
  icon?: Component;
  /** 按钮文字 */
  label: string;
  /** 点击回调 */
  onClick?: () => void;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否显示，默认 true */
  visible?: boolean;
}

// 预设动作配置
interface PresetActions {
  view?: () => void;
  edit?: () => void;
  disable?: () => void;
  enable?: () => void;
  delete?: () => void;
}

const props = withDefaults(
  defineProps<{
    /** 按钮配置数组（与 actions 二选一） */
    buttons?: ButtonConfig[];
    /** 预设动作对象（与 buttons 二选一，更简洁） */
    actions?: PresetActions;
    /** 按钮间距，默认 8px */
    gap?: number;
  }>(),
  {
    buttons: () => [],
    actions: () => ({}),
    gap: 8,
  },
);

// 最终渲染的按钮列表
const finalButtons = computed<ButtonConfig[]>(() => {
  // 优先使用 buttons 数组
  if (props.buttons.length > 0) {
    return props.buttons.filter((b) => b.visible !== false);
  }

  // 使用预设 actions
  const presets: ButtonConfig[] = [];
  const a = props.actions;

  if (a.view) {
    presets.push({ type: 'primary', icon: View, label: '查看', onClick: a.view });
  }
  if (a.edit) {
    presets.push({ type: 'primary', icon: Edit, label: '编辑', onClick: a.edit });
  }
  if (a.disable) {
    presets.push({ type: 'warning', icon: VideoPause, label: '禁用', onClick: a.disable });
  }
  if (a.enable) {
    presets.push({ type: 'success', icon: VideoPlay, label: '启用', onClick: a.enable });
  }
  if (a.delete) {
    presets.push({ type: 'danger', icon: Delete, label: '删除', onClick: a.delete });
  }

  return presets;
});

const containerStyle = computed(() => ({
  gap: `${props.gap}px`,
}));
</script>

<template>
  <div class="action-btn-group custom-action-btns" :style="containerStyle">
    <el-button
      v-for="(btn, idx) in finalButtons"
      :key="idx"
      link
      :type="btn.type || 'primary'"
      :disabled="btn.disabled"
      @click="btn.onClick?.()"
    >
      <el-icon v-if="btn.icon" style="margin-right: 2px">
        <component :is="btn.icon" />
      </el-icon>
      {{ btn.label }}
    </el-button>
  </div>
</template>

<style lang="less" scoped>
.custom-action-btns {
  display: flex;
  align-items: center;
}
</style>
