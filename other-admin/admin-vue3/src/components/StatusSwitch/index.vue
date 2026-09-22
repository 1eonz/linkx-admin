<script setup lang="ts">
/**
 * StatusSwitch - 通用状态切换组件
 *
 * 功能特性：
 * 1. 用于表格中的状态显示和切换
 * 2. 业务值与 switch 值反向映射：value=0 表示启用，value=1 表示禁用
 * 3. 支持禁用状态下显示标签（el-tag）
 * 4. 支持自定义启用/禁用文本
 * 5. loading 状态防止重复切换
 * 6. 使用 el-switch inline-prompt 在开关内部显示文字
 *
 * 设计规范：
 * - 颜色使用项目 tokens：@color-success / @color-danger
 * - 尺寸使用项目 tokens：@spacing-* / @font-size-* / @radius-pill
 * - 不硬编码十六进制色值，不使用内联 style 覆盖 Element Plus 变量
 *
 * @example 基础用法
 * ```vue
 * <StatusSwitch :value="row.status" @change="handleStatusChange(row, $event)" />
 * ```
 *
 * @example 禁用 + 自定义文本
 * ```vue
 * <StatusSwitch :value="grant === 1 ? 0 : 1" :disabled="true" normal-text="开放" forbidden-text="关闭" />
 * ```
 *
 * Props:
 * - value: number，当前状态值（0=启用，1=禁用），默认 0
 * - disabled: boolean，是否禁用切换（禁用时显示 el-tag），默认 false
 * - loading: boolean，加载状态，默认 false
 * - normalText: string，启用状态文本，默认 '正常'
 * - forbiddenText: string，禁用状态文本，默认 '禁用'
 *
 * Events:
 * - change: 状态切换时触发，参数为新的业务状态值（0 或 1）
 */
import { computed } from 'vue';

defineOptions({ name: 'StatusSwitch' });

const props = withDefaults(
  defineProps<{
    /** 当前状态值（0=启用，1=禁用） */
    value: number;
    /** 是否禁用切换（禁用时显示 el-tag） */
    disabled?: boolean;
    /** 加载状态 */
    loading?: boolean;
    /** 启用状态文本 */
    normalText?: string;
    /** 禁用状态文本 */
    forbiddenText?: string;
  }>(),
  {
    value: 0,
    disabled: false,
    loading: false,
    normalText: '正常',
    forbiddenText: '禁用',
  },
);

const emit = defineEmits<{
  /** 状态切换时触发，参数为新的业务状态值（0=启用，1=禁用） */
  (e: 'change', value: number): void;
}>();

/** switch 组件值（true=启用，false=禁用），业务值 0 → switch true */
const switchValue = computed(() => props.value === 0);

/**
 * switch 切换处理：将 switch 值转换为业务状态值并 emit change
 * @param newValue - switch 当前值（true/false/字符串/数字）
 */
function handleChange(newValue: boolean | string | number): void {
  // 转换为业务状态值: true -> 0 (启用), false -> 1 (禁用)
  const statusValue = newValue ? 0 : 1;
  emit('change', statusValue);
}
</script>

<template>
  <div class="status-switch-wrapper">
    <!-- 禁用状态：根据实际值显示对应标签 -->
    <el-tag v-if="disabled" :type="value === 0 ? 'success' : 'danger'" class="status-tag">
      {{ value === 0 ? normalText : forbiddenText }}
    </el-tag>

    <!-- 可操作状态：inline-prompt 在开关内部显示文字 -->
    <el-switch
      v-else
      :model-value="switchValue"
      :loading="loading"
      inline-prompt
      :active-text="normalText"
      :inactive-text="forbiddenText"
      class="status-switch"
      @change="handleChange"
    />
  </div>
</template>

<style lang="less" scoped>
.status-switch-wrapper {
  display: inline-flex;
  align-items: center;
  justify-content: center;

  .status-tag {
    font-weight: @font-weight-medium;
  }

  // 通过 CSS 变量将项目 token 传入 Element Plus（不使用内联 style）
  // 使用 -dark 变体保证 inline-prompt 白字达到 WCAG AA 对比度（≥4.5:1）
  // el-tag 的 type 仍用标准 success/danger（浅底深字，对比充足）
  .status-switch {
    --el-switch-on-color: @color-success-dark;
    --el-switch-off-color: @color-danger-dark;

    // 尺寸：保持与表格行高（32px）协调，略小于默认开关
    :deep(.el-switch__core) {
      min-width: 46px;
      height: 22px;
      border-radius: @radius-pill;

      &::after {
        height: 18px;
        width: 18px;
        top: 1px;
      }
    }

    // 键盘 focus 可见性增强：主色环 + 淡色光晕（与 el-input 一致）
    :deep(.el-switch__core:focus-visible) {
      box-shadow:
        0 0 0 1px var(--el-switch-on-color) inset,
        0 0 0 3px fade(@color-primary, 18%);
    }

    // inline-prompt 文字：字号 ≥ 11px 保证可读性，字重加粗增强对比
    :deep(.el-switch__inner .is-text) {
      font-size: @font-size-2xs; // 11px
      font-weight: @font-weight-semibold;
      letter-spacing: 0.02em;
    }
  }
}
</style>
