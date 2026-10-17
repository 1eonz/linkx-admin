<script setup lang="ts">
/**
 * StatusSwitch - 保留旧业务 props/events 的 lx-ui 适配层。
 *
 * `value=0/1`、`normalText/forbiddenText` 和 `change(number)` 是现役页面
 * 已使用的契约；视觉、确认、权限降级和加载竞态统一交给 LxStatusSwitch。
 */
import { LxStatusSwitch } from 'lx-ui';

defineOptions({ name: 'StatusSwitch' });

const props = withDefaults(
  defineProps<{
    /** 当前状态值（0=启用，1=禁用） */
    value: number;
    /** 是否禁用切换，禁用时显示只读标签 */
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
  /** 状态切换时触发，参数为新的业务状态值（0 或 1） */
  (e: 'change', value: number): void;
}>();

/** 保持旧适配器只向业务层发出数字状态值。 */
function handleChange(newValue: boolean | number): void {
  const statusValue = typeof newValue === 'number' ? newValue : newValue ? 0 : 1;
  emit('change', statusValue);
}
</script>

<template>
  <LxStatusSwitch
    :model-value="value"
    :loading="loading"
    :disabled="disabled"
    fallback-tag
    :on-text="normalText"
    :off-text="forbiddenText"
    @change="handleChange"
  />
</template>
