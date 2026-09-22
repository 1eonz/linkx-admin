<script setup lang="ts">
/**
 * LxNodeBadge — 专网节点状态徽章（侧边栏底部，源自 stitch_侧边栏 _1 NODE-01 规格）
 */
import type { LxStatus } from '../../tokens';
import LxStatusDot from '../LxStatusDot/index.vue';

withDefaults(
  defineProps<{
    /** 节点名（等宽显示） */
    node?: string;
    /** 节点状态 */
    status?: LxStatus;
    /** 描述文案 */
    label?: string;
  }>(),
  { node: 'NODE-01', status: 'online', label: '' }
);
</script>

<template>
  <span class="lx-node-badge">
    <LxStatusDot :status="status" :size="6" :pulse="status === 'online'" />
    <span class="lx-node-badge__name">{{ node }}</span>
    <span v-if="label" class="lx-node-badge__label">{{ label }}</span>
  </span>
</template>

<style scoped>
.lx-node-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--lx-space-sm);
  padding: 3px var(--lx-space-sm);
  border: 1px solid var(--lx-sidebar-guide);
  border-radius: var(--lx-radius-sm);
  background: rgba(255, 255, 255, 0.02);
}

.lx-node-badge__name {
  font-family: var(--lx-font-mono);
  font-size: 11px;
  font-weight: 500;
  color: var(--lx-sidebar-text);
  font-variant-numeric: tabular-nums;
}

.lx-node-badge__label {
  font-size: 11px;
  color: var(--lx-sidebar-text-muted);
}
</style>
