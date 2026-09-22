<script setup lang="ts">
/**
 * ConnectionStatusDot - 连接状态圆点组件（已用 StatusDot 重构内部实现）
 *
 * 功能特性：
 * 1. 根据 status 值显示不同颜色的圆点（8x8）
 * 2. 可选显示状态描述文本
 * 3. 被 serverManage / clientManage / outboundData / inboundData 共用
 * 4. 内部使用 StatusDot 组件渲染，保留原 API 兼容
 *
 * 状态值映射（委托给 StatusDot 的 code prop）：
 * - 4：认证成功并心跳正常 → 绿色（online）
 * - 1/2/7：连接中/JWT 认证通过/等待认证 → 蓝色（processing）
 * - 0/5：初始/心跳失活 → 橙色（busy）
 * - 3/6：JWT 认证失败/关闭 → 红色（error）
 * - 其他：未知 → 灰色（offline）
 *
 * @example 基础用法
 * ```vue
 * <ConnectionStatusDot :status="row.status" :status-desc="row.statusDesc" />
 * ```
 *
 * @example 仅显示圆点（不显示文本）
 * ```vue
 * <ConnectionStatusDot :status="row.status" :show-text="false" />
 * ```
 *
 * Props:
 * - status: number，连接状态值（0-7），默认 0
 * - statusDesc: string，状态描述文本，默认 ''
 * - showText: boolean，是否显示文本，默认 true
 *
 * Events: 无
 * Slots: 无
 * Methods: 无
 */
import StatusDot from '@/components/StatusDot/index.vue';

defineOptions({ name: 'ConnectionStatusDot' });

withDefaults(
  defineProps<{
    /** 连接状态值（0-7） */
    status?: number;
    /** 状态描述文本 */
    statusDesc?: string;
    /** 是否显示文本 */
    showText?: boolean;
  }>(),
  {
    status: 0,
    statusDesc: '',
    showText: true,
  },
);
</script>

<template>
  <!-- 委托给 StatusDot 组件，传入 code（数字 0-7）+ 状态描述 + 是否显示文本 -->
  <StatusDot :code="status" :status-desc="statusDesc" :show-text="showText" :pulse="false" />
</template>
