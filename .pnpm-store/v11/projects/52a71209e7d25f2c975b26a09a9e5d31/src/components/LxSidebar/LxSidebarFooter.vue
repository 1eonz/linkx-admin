<script setup lang="ts">
/**
 * LxSidebarFooter — 侧边栏底部状态区。
 * expanded 对齐 _2 的专网状态条、控制台设置和收起按钮；rail 对齐 _1 的
 * SLA 圆环、节点徽章和展开按钮。组件只报告交互事件，状态由宿主持有。
 */
import { computed } from 'vue'
import type { LxSidebarMode, LxStatus } from '../../tokens'
import LxIcon from '../LxIcon/index.vue'
import LxGauge from './LxGauge.vue'
import LxNodeBadge from './LxNodeBadge.vue'
import LxStatusDot from '../LxStatusDot/index.vue'

const props = withDefaults(
  defineProps<{
    mode?: LxSidebarMode
    /** 链路健康度（0-100，rail 圆环仪表） */
    sla?: number
    /** 节点标识 */
    node?: string
    /** 节点在线状态 */
    nodeStatus?: LxStatus
    /** 延迟展示文案（expanded 专网条） */
    latencyLabel?: string
    /** 兼容旧契约：等价于 sla */
    slaValue?: number
    /** 兼容旧契约：等价于 node */
    nodeLabel?: string
  }>(),
  {
    mode: 'expanded',
    sla: 100,
    node: 'NODE-01',
    nodeStatus: 'online',
    latencyLabel: '',
  },
)

const emit = defineEmits<{
  'toggle-mode': []
  settings: []
  /** 兼容旧契约：与 toggle-mode 同时触发 */
  toggle: []
}>()

const resolvedSla = computed(() => props.slaValue ?? props.sla)
const resolvedNode = computed(() => props.nodeLabel ?? props.node)

function toggleMode() {
  emit('toggle-mode')
  emit('toggle')
}
</script>

<template>
  <div
    class="lx-sidebar-footer"
    :class="`lx-sidebar-footer--${mode}`"
    aria-label="导航状态"
  >
    <template v-if="mode === 'expanded'">
      <div class="lx-sidebar-footer__network" aria-label="专网状态">
        <LxStatusDot
          :status="nodeStatus"
          :size="6"
          :pulse="nodeStatus === 'online'"
        />
        <span class="lx-sidebar-footer__latency">
          {{ latencyLabel || resolvedNode }}
        </span>
        <span class="lx-sidebar-footer__network-label">专网</span>
      </div>
      <div class="lx-sidebar-footer__actions">
        <button
          class="lx-sidebar-footer__settings"
          type="button"
          aria-label="控制台设置"
          @click="emit('settings')"
        >
          <LxIcon name="setting" :size="14" />
          <span>控制台设置</span>
        </button>
        <button
          class="lx-sidebar-footer__toggle"
          type="button"
          aria-label="收起导航"
          @click="toggleMode"
        >
          <LxIcon name="chevrons-left" :size="16" />
        </button>
      </div>
    </template>

    <template v-else>
      <LxGauge :value="resolvedSla" :size="40" />
      <LxNodeBadge :node="resolvedNode" :status="nodeStatus" />
      <button
        class="lx-sidebar-footer__toggle lx-sidebar-footer__toggle--rail"
        type="button"
        aria-label="展开导航"
        @click="toggleMode"
      >
        <LxIcon
          name="chevrons-left"
          :size="16"
          class="lx-sidebar-footer__expand-icon"
        />
      </button>
    </template>
  </div>
</template>

<style scoped>
.lx-sidebar-footer {
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  gap: var(--lx-space-sm);
  padding: var(--lx-space-md);
  border-top: 1px solid var(--lx-sidebar-border);
  background: var(--lx-sidebar-bg-header);
}

.lx-sidebar-footer__network {
  display: flex;
  min-width: 0;
  min-height: 28px;
  align-items: center;
  gap: var(--lx-space-sm);
  padding: 0 var(--lx-space-sm);
  border: 1px solid var(--lx-sidebar-guide);
  border-radius: var(--lx-radius-sm);
  background: var(--lx-sidebar-bg-submenu);
  color: var(--lx-sidebar-text);
  font-size: 11px;
}

.lx-sidebar-footer__latency {
  min-width: 0;
  overflow: hidden;
  flex: 1;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--lx-font-mono);
  font-variant-numeric: tabular-nums;
}

.lx-sidebar-footer__network-label {
  flex-shrink: 0;
  color: var(--lx-sidebar-active-text);
  font-size: 11px;
}

.lx-sidebar-footer__actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--lx-space-sm);
}

.lx-sidebar-footer__settings,
.lx-sidebar-footer__toggle {
  display: inline-flex;
  min-width: 44px;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  gap: var(--lx-space-sm);
  padding: 0 var(--lx-space-sm);
  border: 1px solid transparent;
  border-radius: var(--lx-radius-md);
  background: transparent;
  color: var(--lx-sidebar-text-muted);
  font: inherit;
  font-size: 12px;
  cursor: pointer;
  transition:
    background-color var(--lx-transition),
    color var(--lx-transition),
    border-color var(--lx-transition);
}

.lx-sidebar-footer__settings {
  justify-content: flex-start;
  flex: 1;
  min-width: 0;
}

.lx-sidebar-footer__settings:hover,
.lx-sidebar-footer__toggle:hover {
  border-color: var(--lx-sidebar-guide);
  background: var(--lx-sidebar-hover-bg);
  color: var(--lx-text-on-dark);
}

.lx-sidebar-footer__settings:focus-visible,
.lx-sidebar-footer__toggle:focus-visible {
  outline: 2px solid var(--lx-sidebar-active-glow);
  outline-offset: 2px;
}

.lx-sidebar-footer--rail {
  align-items: center;
}

.lx-sidebar-footer--rail .lx-sidebar-footer__toggle--rail {
  width: 44px;
  padding: 0;
}

.lx-sidebar-footer__expand-icon {
  transform: rotate(180deg);
}

@media (prefers-reduced-motion: reduce) {
  .lx-sidebar-footer__settings,
  .lx-sidebar-footer__toggle {
    transition: none;
  }
}
</style>
