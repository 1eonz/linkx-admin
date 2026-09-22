<script setup lang="ts">
/**
 * LxSidebarFooter — 底部状态区（SLA 仪表 + 节点徽章 + 形态切换）
 * 视觉源：stitch_侧边栏 _1（rail 竖排）/_2（expanded 横排）
 */
import type { LxSidebarMode, LxStatus } from '../../tokens';
import LxIcon from '../LxIcon/index.vue';
import LxGauge from './LxGauge.vue';
import LxNodeBadge from './LxNodeBadge.vue';

withDefaults(
  defineProps<{
    mode?: LxSidebarMode;
    slaValue?: number;
    nodeLabel?: string;
    nodeStatus?: LxStatus;
  }>(),
  { mode: 'expanded', slaValue: 99.9, nodeLabel: 'NODE-01', nodeStatus: 'online' }
);

defineEmits<{ toggle: [] }>();
</script>

<template>
  <div class="lx-sidebar-footer" :class="`lx-sidebar-footer--${mode}`">
    <div v-if="mode === 'expanded'" class="lx-sidebar-footer__status">
      <LxGauge :value="slaValue" :size="36" label="SLA" />
      <LxNodeBadge :node="nodeLabel" :status="nodeStatus" label="专网" />
    </div>
    <template v-else>
      <LxGauge :value="slaValue" :size="36" />
      <LxNodeBadge :node="nodeLabel" :status="nodeStatus" />
    </template>

    <button
      class="lx-sidebar-footer__toggle"
      :class="{ 'is-rail': mode === 'rail' }"
      type="button"
      :aria-label="mode === 'rail' ? '展开导航' : '收起导航'"
      @click="$emit('toggle')"
    >
      <template v-if="mode === 'expanded'">
        <span>收起导航</span>
        <LxIcon name="chevrons-left" :size="16" />
      </template>
      <LxIcon v-else name="chevrons-left" :size="16" class="lx-sidebar-footer__expand-icon" />
    </button>
  </div>
</template>

<style scoped>
.lx-sidebar-footer {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: var(--lx-space-sm);
  padding: var(--lx-space-md);
  border-top: 1px solid var(--lx-sidebar-border);
  background: var(--lx-sidebar-bg-header);
}

.lx-sidebar-footer__status {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--lx-space-sm);
}

.lx-sidebar-footer--rail {
  align-items: center;
}

.lx-sidebar-footer__toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--lx-space-sm);
  width: 100%;
  height: 30px;
  border: none;
  border-radius: var(--lx-radius-md);
  background: transparent;
  color: var(--lx-sidebar-text-muted);
  font-size: 12px;
  cursor: pointer;
  transition: background-color var(--lx-transition), color var(--lx-transition);
}

.lx-sidebar-footer__toggle:hover {
  background: var(--lx-sidebar-hover-bg);
  color: var(--lx-text-on-dark);
}

.lx-sidebar-footer__toggle.is-rail {
  width: 40px;
  height: 32px;
}

.lx-sidebar-footer__expand-icon {
  transform: rotate(180deg);
}
</style>
