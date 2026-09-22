<script setup lang="ts">
/**
 * StatusDot - 呼吸灯状态点组件
 *
 * 功能特性：
 * - 对齐原型 docs/components.html 的 .status-dot 样式
 * - 五种状态：online（绿+脉冲）/ processing（蓝）/ busy（黄）/ error（红）/ offline（灰）
 * - online 状态有 pulse 呼吸动画（外扩淡出）
 * - 可配置圆点大小
 * - 支持 code prop（数字 0-7）兼容 ConnectionStatusDot 旧 API
 * - 可选显示状态描述文本（statusDesc + showText）
 *
 * @example 基础用法（字符串状态）
 * ```vue
 * <StatusDot status="online" />
 * <span style="margin-left:6px">在线/正常</span>
 * ```
 *
 * @example 兼容 ConnectionStatusDot 旧 API（code 数字 + 文本）
 * ```vue
 * <StatusDot :code="row.status" :status-desc="row.statusDesc" />
 * ```
 *
 * @example 自定义大小 + 关闭动画
 * ```vue
 * <StatusDot status="online" :size="10" :pulse="false" />
 * ```
 *
 * 替代关系：
 * - 替代 `src/views/nodeManage/components/ConnectionStatusDot.vue`
 * - 类名从 BEM 风格（status-dot--online）改为修饰符风格（status-dot online）
 * - 新增 pulse 呼吸动画
 * - code prop 数字映射：4→online, 1/2/7→processing, 0/5→busy, 3/6→error, 其他→offline
 */
import { computed } from 'vue';

defineOptions({ name: 'StatusDot' });

const props = withDefaults(
  defineProps<{
    /** 状态：online(在线) / processing(处理中) / busy(忙碌) / error(错误) / offline(离线) */
    status?: 'online' | 'processing' | 'busy' | 'error' | 'offline';
    /** 兼容 ConnectionStatusDot 旧 API：数字状态值（0-7）。传入时优先于 status */
    code?: number;
    /** 圆点大小（px），默认 8 */
    size?: number;
    /** 是否显示呼吸动画（仅 online 生效），默认 true */
    pulse?: boolean;
    /** 状态描述文本（兼容 ConnectionStatusDot） */
    statusDesc?: string;
    /** 是否显示状态描述文本，默认 false（仅显示圆点） */
    showText?: boolean;
  }>(),
  {
    status: 'offline',
    code: undefined,
    size: 8,
    pulse: true,
    statusDesc: '',
    showText: false,
  },
);

// 数字 code → 字符串 status 映射（兼容 ConnectionStatusDot 旧 API）
const codeToStatus = (code: number): 'online' | 'processing' | 'busy' | 'error' | 'offline' => {
  switch (code) {
    case 4:
      return 'online';
    case 1:
    case 2:
    case 7:
      return 'processing';
    case 0:
    case 5:
      return 'busy';
    case 3:
    case 6:
      return 'error';
    default:
      return 'offline';
  }
};

// 最终使用的 status（code 优先于 status prop）
const finalStatus = computed(() => {
  if (props.code !== undefined) {
    return codeToStatus(props.code);
  }
  return props.status;
});

// 圆点尺寸样式
const dotStyle = computed(() => ({
  width: `${props.size}px`,
  height: `${props.size}px`,
}));

// 是否禁用脉冲动画
const pulseClass = computed(() => (!props.pulse ? 'no-pulse' : ''));
</script>

<template>
  <div v-if="showText" class="status-dot-wrapper">
    <span class="status-dot custom-status-dot" :class="[finalStatus, pulseClass]" :style="dotStyle" />
    <span class="status-text">{{ statusDesc || '-' }}</span>
  </div>
  <span v-else class="status-dot custom-status-dot" :class="[finalStatus, pulseClass]" :style="dotStyle" />
</template>

<style lang="less" scoped>
.custom-status-dot {
  // 继承全局 .status-dot 基础样式（reset.less 中定义）
  // 此处覆盖动画控制 + 补充 processing/error 状态颜色

  &.no-pulse::after {
    display: none !important;
  }

  // processing 状态（蓝色，处理中）
  &.processing {
    background-color: @color-primary;

    &::after {
      display: none; // processing 默认无动画
    }
  }

  // error 状态（红色，错误）
  &.error {
    background-color: @color-danger;

    &::after {
      display: none;
    }
  }
}

.status-dot-wrapper {
  display: inline-flex;
  align-items: center;
  gap: 6px;

  .status-text {
    font-size: @font-size-sm;
    color: @color-text-regular;
  }
}
</style>
