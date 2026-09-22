<script setup lang="ts">
/**
 * LxSidebarGroup — 分组项（一级标题 + 可展开二级 / rail 态 hover popper）
 * 视觉源：_2 分组容器（bg-#0e1728/70 + border + p-1）/ 引导线 ml-3.5 pl-4 / 二级 h-7 前缀圆点
 */
import { computed, inject, ref } from 'vue';
import type { LxMenuItem } from './types';
import { LX_SIDEBAR_KEY } from './context';
import LxIcon from '../LxIcon/index.vue';

const props = withDefaults(
  defineProps<{
    item: LxMenuItem;
    mode?: 'rail' | 'expanded';
    /** 受控展开态 */
    expanded?: boolean;
  }>(),
  { mode: 'expanded', expanded: undefined }
);

const emit = defineEmits<{
  select: [item: LxMenuItem];
  toggle: [key: string];
}>();

const ctx = inject(LX_SIDEBAR_KEY);
const isRail = computed(() => props.mode === 'rail');
// 非受控兜底
const innerExpanded = ref(true);
const isOpen = computed(() => (props.expanded != null ? props.expanded : innerExpanded.value));

const hasActiveChild = computed(
  () => !!ctx?.activeKey && !!props.item.children?.some((c) => c.key === ctx.activeKey)
);

const badgeCount = computed(() => {
  if (props.item.badge != null) return props.item.badge;
  return props.item.children?.reduce((s, c) => s + (typeof c.badge === 'number' ? c.badge : 0), 0);
});

function onHeadClick() {
  if (props.item.disabled) return;
  // 非受控兜底（独立使用时）；容器使用时由容器切换
  if (props.expanded == null) innerExpanded.value = !innerExpanded.value;
  emit('toggle', props.item.key);
}

function onChildClick(child: LxMenuItem) {
  if (child.disabled) return;
  emit('select', child);
  ctx?.onSelect(child);
  ctx?.hideRailTip();
}

function onEnter(e: MouseEvent) {
  if (!isRail.value || !ctx || props.item.disabled) return;
  ctx.showRailTip(e, {
    x: 0,
    y: 0,
    content: props.item.title,
    subItems: props.item.children,
  });
}

function onLeave() {
  ctx?.hideRailTip();
}
</script>

<template>
  <div class="lx-sidebar-group" :class="`lx-sidebar-group--${mode}`" @mouseenter="onEnter" @mouseleave="onLeave">
    <!-- 一级头部 -->
    <div
      class="lx-sidebar-group__head"
      :class="{ 'has-active': hasActiveChild, 'is-disabled': item.disabled }"
      role="menuitem"
      :aria-expanded="isRail ? undefined : isOpen"
      :tabindex="item.disabled ? -1 : 0"
      @click="onHeadClick"
    >
      <span class="lx-sidebar-group__bar" />
      <span class="lx-sidebar-group__icon">
        <LxIcon :name="item.icon || 'cube'" :size="isRail ? 20 : 16" />
        <span v-if="isRail && badgeCount" class="lx-sidebar-group__dot" />
      </span>
      <template v-if="!isRail">
        <span class="lx-sidebar-group__title">{{ item.title }}</span>
        <span v-if="badgeCount" class="lx-sidebar-group__badge">{{ typeof badgeCount === 'number' && badgeCount > 99 ? '99+' : badgeCount }}</span>
        <LxIcon name="chevron-down" :size="14" class="lx-sidebar-group__arrow" :class="{ 'is-open': isOpen }" />
      </template>
    </div>

    <!-- 展开态二级列表（引导线 + 前缀圆点，_2 规格） -->
    <div v-if="!isRail" v-show="isOpen" class="lx-sidebar-group__sub">
      <a
        v-for="child in item.children"
        :key="child.key"
        class="lx-sidebar-group__subitem"
        :class="{
          'is-active': ctx?.activeKey === child.key,
          'is-disabled': child.disabled,
        }"
        role="menuitem"
        :aria-current="ctx?.activeKey === child.key ? 'page' : undefined"
        :tabindex="child.disabled ? -1 : 0"
        :href="child.path || 'javascript:;'"
        @click="onChildClick(child)"
      >
        <!-- 前缀圆点：激活 sky-400 / 非激活 slate-500（_2: w-1 h-1） -->
        <span class="lx-sidebar-group__subdot" :class="{ 'is-active': ctx?.activeKey === child.key }" />
        <span class="lx-sidebar-group__subtext">{{ child.title }}</span>
        <span v-if="child.badge != null" class="lx-sidebar-group__subbadge">{{ child.badge }}</span>
      </a>
    </div>
  </div>
</template>

<style scoped>
/* —— 分组容器（_2: bg-#0e1728/70 rounded border p-1 gap-0.5） —— */
.lx-sidebar-group {
  margin: 0 var(--lx-space-sm) 2px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: var(--lx-space-xs);
  border-radius: var(--lx-radius-md);
  background: var(--lx-sidebar-bg-submenu);
  border: 1px solid rgba(30, 47, 71, 0.8);
  transition: background-color var(--lx-transition);
}

.lx-sidebar-group:hover {
  background: rgba(14, 23, 40, 0.85);
}

.lx-sidebar-group__head {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: var(--lx-sidebar-group-height); /* 36px（_2 h-9） */
  padding: 0 var(--lx-space-sm);
  border-radius: var(--lx-radius-sm);
  color: var(--lx-sidebar-text);
  cursor: pointer;
  transition: background-color var(--lx-transition), color var(--lx-transition);
  user-select: none;
}

.lx-sidebar-group__head:hover:not(.is-disabled) {
  color: var(--lx-text-on-dark);
}

.lx-sidebar-group__head.is-disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.lx-sidebar-group__head.has-active {
  color: var(--lx-sidebar-active-text);
}

/* 分组头竖条：w-1 h-3.5（_2） */
.lx-sidebar-group__bar {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 14px;
  border-radius: 1px;
  background: transparent;
}

.lx-sidebar-group__head.has-active .lx-sidebar-group__bar {
  background: var(--lx-sidebar-active-glow);
  box-shadow: var(--lx-glow-active);
}

/* 图标盒：w-6 h-6（_2） */
.lx-sidebar-group__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  margin-right: 10px;
  border-radius: var(--lx-radius-sm);
  color: var(--lx-sidebar-text-muted);
  flex-shrink: 0;
  transition: color var(--lx-transition);
}

.lx-sidebar-group__head:hover:not(.is-disabled) .lx-sidebar-group__icon,
.lx-sidebar-group__head.has-active .lx-sidebar-group__icon {
  color: var(--lx-sidebar-active-text);
}

.lx-sidebar-group__title {
  flex: 1;
  min-width: 0;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.lx-sidebar-group__badge {
  font-size: 12px;
  font-weight: 600;
  color: var(--lx-color-error);
  font-variant-numeric: tabular-nums;
}

.lx-sidebar-group__arrow {
  margin-left: var(--lx-space-sm);
  color: var(--lx-sidebar-text-muted);
  transition: transform var(--lx-transition);
}

.lx-sidebar-group__arrow.is-open {
  transform: rotate(180deg);
}

/* —— 二级列表（_2: ml-3.5 mt-0.5 border-l pl-4 pr-1 py-1） —— */
.lx-sidebar-group__sub {
  margin: 2px 0 var(--lx-space-xs) 14px;
  padding: var(--lx-space-xs) var(--lx-space-xs) var(--lx-space-xs) var(--lx-space-md);
  border-left: 1px solid var(--lx-sidebar-guide);
  display: flex;
  flex-direction: column;
  gap: var(--lx-space-xs);
}

.lx-sidebar-group__subitem {
  display: flex;
  align-items: center;
  gap: var(--lx-space-sm);
  height: var(--lx-sidebar-subitem-height); /* 28px（_2 h-7） */
  padding: 0 10px;
  border-radius: var(--lx-radius-sm);
  color: var(--lx-sidebar-text);
  font-size: 12px;
  text-decoration: none;
  cursor: pointer;
  transition: color var(--lx-transition), background-color var(--lx-transition);
}

.lx-sidebar-group__subitem:hover:not(.is-disabled) {
  color: var(--lx-text-on-dark);
  background: var(--lx-sidebar-hover-bg);
}

.lx-sidebar-group__subitem.is-active {
  color: var(--lx-sidebar-active-text);
  background: rgba(8, 47, 73, 0.6); /* sky-950/60（_2） */
  font-weight: 500;
}

.lx-sidebar-group__subitem.is-disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* 前缀圆点（_2: w-1 h-1） */
.lx-sidebar-group__subdot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #64748b;
  flex-shrink: 0;
}

.lx-sidebar-group__subdot.is-active {
  background: var(--lx-sidebar-active-glow);
}

.lx-sidebar-group__subtext {
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.lx-sidebar-group__subbadge {
  font-size: 11px;
  color: var(--lx-color-error);
  font-variant-numeric: tabular-nums;
}

/* —— rail 形态：取消组容器视觉，仅图标（_1 无分组容器底） —— */
.lx-sidebar-group--rail {
  margin: 0;
  padding: 0;
  border: none;
  background: transparent;
  border-radius: 0;
}

.lx-sidebar-group--rail:hover {
  background: transparent;
}

.lx-sidebar-group--rail .lx-sidebar-group__head {
  justify-content: center;
  height: var(--lx-sidebar-rail-item-height); /* 48px（_1 h-12） */
  padding: 0;
  border-radius: 0;
}

.lx-sidebar-group--rail .lx-sidebar-group__head:hover:not(.is-disabled) {
  color: var(--lx-sidebar-active-text);
  background: rgba(30, 41, 59, 0.4);
}

.lx-sidebar-group--rail .lx-sidebar-group__head.has-active {
  color: var(--lx-sidebar-active-glow);
  background: rgba(14, 165, 233, 0.1);
}

.lx-sidebar-group--rail .lx-sidebar-group__bar {
  left: 0;
  top: var(--lx-space-sm);
  bottom: var(--lx-space-sm);
  transform: none;
  width: 2px;
  height: auto;
}

.lx-sidebar-group--rail .lx-sidebar-group__icon {
  position: relative;
  width: 32px;
  height: 32px;
  margin-right: 0;
  border-radius: var(--lx-radius-md);
}

.lx-sidebar-group__dot {
  position: absolute;
  top: 1px;
  right: 1px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--lx-color-error);
  box-shadow: 0 0 6px var(--lx-color-error);
}
</style>
