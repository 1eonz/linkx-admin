<script setup lang="ts">
/**
 * LxSidebarItem — 一级直达项（双形态）
 * 视觉源：_2 展开态（h-10 / 竖条 w-1 h-4 / 图标盒 w-6）+ _1 rail 态（h-12 / 图标盒 w-8 / 竖条 w-0.5）
 */
import { computed, inject } from 'vue';
import type { LxMenuItem } from './types';
import { LX_SIDEBAR_KEY } from './context';
import LxIcon from '../LxIcon/index.vue';

const props = withDefaults(defineProps<{ item: LxMenuItem; mode?: 'rail' | 'expanded'; active?: boolean }>(), {
  mode: 'expanded',
  active: false,
});

const emit = defineEmits<{ select: [item: LxMenuItem] }>();

const ctx = inject(LX_SIDEBAR_KEY);
const isRail = computed(() => props.mode === 'rail');
const badgeTypeColor = computed(() => {
  const map: Record<string, string> = {
    online: 'var(--lx-color-success)',
    processing: 'var(--lx-color-primary-container)',
    busy: 'var(--lx-color-warning)',
    error: 'var(--lx-color-error)',
    offline: 'var(--lx-color-info)',
  };
  return map[props.item.badgeType ?? 'error'];
});

function onClick() {
  if (props.item.disabled) return;
  emit('select', props.item);
  ctx?.onSelect(props.item);
}

function onEnter(e: MouseEvent) {
  if (!isRail.value || !ctx || props.item.disabled) return;
  ctx.showRailTip(e, { x: 0, y: 0, content: props.item.title });
}

function onLeave() {
  ctx?.hideRailTip();
}
</script>

<template>
  <component
    :is="isRail ? 'div' : 'a'"
    class="lx-sidebar-item"
    :class="[
      `lx-sidebar-item--${mode}`,
      { 'is-active': active, 'is-disabled': item.disabled },
    ]"
    role="menuitem"
    :aria-current="active ? 'page' : undefined"
    :tabindex="item.disabled ? -1 : 0"
    v-bind="isRail ? {} : { href: item.path || 'javascript:;' }"
    @click="onClick"
    @mouseenter="onEnter"
    @mouseleave="onLeave"
  >
    <!-- 激活竖条：expanded w-1 h-4 + glow / rail w-0.5 上下内缩（_1 精确冰蓝切口） -->
    <span class="lx-sidebar-item__bar" />

    <!-- 图标盒：expanded w-6（16px 图标）/ rail w-8（20px 图标） -->
    <span class="lx-sidebar-item__icon">
      <LxIcon :name="item.icon || 'dashboard'" :size="isRail ? 20 : 16" />
      <!-- rail 态角标退化为圆点（_1: w-1.5 右上角） -->
      <span v-if="isRail && item.badge" class="lx-sidebar-item__dot-badge" :style="{ background: badgeTypeColor }" />
    </span>

    <template v-if="!isRail">
      <span class="lx-sidebar-item__title">{{ item.title }}</span>
      <span v-if="item.badge != null" class="lx-sidebar-item__badge" :style="{ color: badgeTypeColor }">
        {{ typeof item.badge === 'number' && item.badge > 99 ? '99+' : item.badge }}
      </span>
    </template>
  </component>
</template>

<style scoped>
.lx-sidebar-item {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  height: var(--lx-sidebar-item-height); /* 40px（含 border，_2 激活态实高） */
  margin: 0 var(--lx-space-sm);
  width: calc(100% - var(--lx-space-sm) * 2);
  padding: 0 10px;
  border: 1px solid transparent;
  border-radius: var(--lx-radius-md);
  color: var(--lx-sidebar-text);
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  transition: background-color var(--lx-transition), color var(--lx-transition),
    border-color var(--lx-transition), box-shadow var(--lx-transition);
  user-select: none;
}

.lx-sidebar-item:hover:not(.is-disabled) {
  background: var(--lx-sidebar-hover-bg);
  color: var(--lx-text-on-dark);
}

.lx-sidebar-item.is-disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* —— 激活态（_2：渐变底 + sky 边框 + 内发光） —— */
.lx-sidebar-item.is-active {
  background: linear-gradient(90deg, rgba(14, 165, 233, 0.2) 0%, rgba(14, 165, 233, 0.1) 50%, transparent 100%);
  border-color: rgba(14, 165, 233, 0.3);
  color: var(--lx-text-on-dark);
  box-shadow: inset 0 0 12px rgba(56, 189, 248, 0.15);
}

/* —— 激活竖条：w-1 h-4 + glow（_2） —— */
.lx-sidebar-item__bar {
  position: absolute;
  left: -1px;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 16px;
  border-radius: 1px;
  background: transparent;
  transition: background-color var(--lx-transition), box-shadow var(--lx-transition);
}

.lx-sidebar-item.is-active .lx-sidebar-item__bar {
  background: var(--lx-sidebar-active-glow);
  box-shadow: var(--lx-glow-active);
}

/* —— 图标盒：w-6 h-6（_2） —— */
.lx-sidebar-item__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: var(--lx-radius-sm);
  color: var(--lx-sidebar-text-muted);
  margin-right: var(--lx-space-sm);
  flex-shrink: 0;
  transition: color var(--lx-transition), background-color var(--lx-transition);
}

.lx-sidebar-item.is-active .lx-sidebar-item__icon {
  color: var(--lx-sidebar-active-text);
  background: rgba(14, 165, 233, 0.2);
}

.lx-sidebar-item:hover:not(.is-disabled):not(.is-active) .lx-sidebar-item__icon {
  color: var(--lx-sidebar-active-text);
}

.lx-sidebar-item__title {
  flex: 1;
  min-width: 0;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.lx-sidebar-item__badge {
  font-size: 12px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

/* —— rail 形态（_1：h-12 / 图标盒 w-8 / 竖条 w-0.5） —— */
.lx-sidebar-item--rail {
  justify-content: center;
  margin: 0;
  width: 100%;
  height: var(--lx-sidebar-rail-item-height); /* 48px */
  padding: 0;
  border: none;
  border-radius: 0;
  color: var(--lx-sidebar-text-muted);
}

.lx-sidebar-item--rail:hover:not(.is-disabled) {
  background: rgba(30, 41, 59, 0.4);
}

.lx-sidebar-item--rail.is-active {
  background: rgba(14, 165, 233, 0.1);
  color: var(--lx-sidebar-active-glow);
  border: none;
  box-shadow: none;
}

.lx-sidebar-item--rail .lx-sidebar-item__bar {
  left: 0;
  top: var(--lx-space-sm);
  bottom: var(--lx-space-sm);
  transform: none;
  width: 2px;
  height: auto;
  border-radius: 0 1px 1px 0;
}

.lx-sidebar-item--rail .lx-sidebar-item__icon {
  position: relative;
  width: 32px;
  height: 32px;
  margin-right: 0;
  border-radius: var(--lx-radius-md);
}

.lx-sidebar-item--rail.is-active .lx-sidebar-item__icon,
.lx-sidebar-item--rail:hover:not(.is-disabled) .lx-sidebar-item__icon {
  background: transparent;
}

.lx-sidebar-item__dot-badge {
  position: absolute;
  top: 1px;
  right: 1px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  box-shadow: 0 0 6px var(--lx-sidebar-active-glow);
}
</style>
