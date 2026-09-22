<script setup lang="ts">
/**
 * LxSidebar — 侧边栏容器（双形态：expanded 252px / rail 64px）
 * 视觉源：doc/stitch_侧边栏/stitch_/（_1 rail + _2 expanded，唯一设计源）
 * 文档：doc/lx-ui/demo/LXSIDEBAR.md
 */
import { computed, onBeforeUnmount, onMounted, provide, reactive, ref, watch } from 'vue';
import type { LxSidebarMode } from '../../tokens';
import type { LxMenuItem, LxSidebarProps, LxRailTip } from './types';
import { LX_SIDEBAR_KEY, type LxSidebarContext } from './context';
import LxSidebarBrand from './LxSidebarBrand.vue';
import LxSidebarItem from './LxSidebarItem.vue';
import LxSidebarGroup from './LxSidebarGroup.vue';
import LxSidebarFooter from './LxSidebarFooter.vue';

const props = withDefaults(defineProps<LxSidebarProps>(), {
  mode: 'expanded',
  items: () => [],
  activeKey: '',
  title: '警务业务协同平台',
  subtitle: '',
  mobile: false,
  showFooter: true,
  slaValue: 99.9,
  nodeLabel: 'NODE-01',
  nodeStatus: 'online',
});

const emit = defineEmits<{
  'update:mode': [mode: LxSidebarProps['mode']];
  'update:mobile': [visible: boolean];
  select: [item: LxMenuItem];
  'expand-change': [keys: string[]];
}>();

const isRail = computed(() => props.mode === 'rail');

/* —— 二级组展开状态（受控 + 非受控兜底） —— */
const innerExpandedKeys = ref<string[]>([]);
const openKeys = computed(() => {
  const keys = props.items.filter((i) => i.children?.length).map((i) => i.key);
  // 非受控：默认含激活子项的组展开
  const withActive = keys.filter((k) => {
    const g = props.items.find((i) => i.key === k);
    return g?.children?.some((c) => c.key === props.activeKey);
  });
  return Array.from(new Set([...withActive, ...innerExpandedKeys.value]));
});

function toggleGroup(key: string) {
  const next = openKeys.value.includes(key)
    ? openKeys.value.filter((k) => k !== key)
    : [...openKeys.value, key];
  innerExpandedKeys.value = next;
  emit('expand-change', next);
}

function onSelectItem(item: LxMenuItem) {
  emit('select', item);
}

function onModeToggle() {
  emit('update:mode', isRail.value ? 'expanded' : 'rail');
}

/* —— rail 浮层（tooltip / popper，Teleport 到 body，容器统一管理） —— */
const railTip = reactive<LxRailTip>({ visible: false, x: 0, y: 0, content: '' });
let hideTimer: ReturnType<typeof setTimeout> | null = null;

function showRailTip(e: MouseEvent, tip: Omit<LxRailTip, 'visible'>) {
  if (hideTimer) clearTimeout(hideTimer);
  const el = e.currentTarget as HTMLElement;
  const rect = el.getBoundingClientRect();
  railTip.visible = true;
  railTip.x = rect.right + 10;
  railTip.y = tip.subItems ? rect.top - 4 : rect.top + rect.height / 2 - 13;
  railTip.content = tip.content;
  railTip.subItems = tip.subItems;
}

function hideRailTip() {
  hideTimer = setTimeout(() => (railTip.visible = false), 150);
}

function keepRailTip() {
  if (hideTimer) clearTimeout(hideTimer);
}

function onPopperSelect(item: LxMenuItem) {
  if (item.disabled) return;
  railTip.visible = false;
  emit('select', item);
}

provide(LX_SIDEBAR_KEY, {
  showRailTip,
  hideRailTip,
  keepRailTip,
  onSelect: onSelectItem,
  get activeKey() {
    return props.activeKey;
  },
} as LxSidebarContext);

/* —— mobile 抽屉：Esc 关闭 —— */
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.mobile) emit('update:mobile', false);
}
onMounted(() => document.addEventListener('keydown', onKeydown));
onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown));

watch(
  () => props.mode,
  () => (railTip.visible = false)
);
</script>

<template>
  <!-- mobile 遮罩 -->
  <Teleport to="body">
    <div v-if="mobile" class="lx-sidebar__mask" @click="emit('update:mobile', false)" />
  </Teleport>

  <aside
    class="lx-sidebar"
    :class="[`lx-sidebar--${mode}`, { 'lx-sidebar--mobile': mobile }]"
    role="navigation"
    aria-label="主导航"
  >
    <slot name="brand">
      <LxSidebarBrand :title="title" :subtitle="subtitle" :mode="mode" />
    </slot>

    <nav class="lx-sidebar__nav">
      <template v-for="item in items" :key="item.key">
        <LxSidebarGroup
          v-if="item.children?.length"
          :item="item"
          :mode="mode"
          :expanded="openKeys.includes(item.key)"
          @toggle="toggleGroup"
          @select="onSelectItem"
        />
        <LxSidebarItem
          v-else
          :item="item"
          :mode="mode"
          :active="activeKey === item.key"
          @select="onSelectItem"
        />
      </template>
      <slot name="append" />
    </nav>

    <div v-if="showFooter" class="lx-sidebar__footer">
      <slot name="footer">
        <LxSidebarFooter
          :mode="mode"
          :sla-value="slaValue"
          :node-label="nodeLabel"
          :node-status="nodeStatus"
          @toggle="onModeToggle"
        />
      </slot>
    </div>
  </aside>

  <!-- rail 浮层：tooltip（直达项）/ popper（分组二级） -->
  <Teleport to="body">
    <div
      v-if="railTip.visible && railTip.subItems"
      class="lx-sidebar-popper"
      :style="{ left: railTip.x + 'px', top: railTip.y + 'px' }"
      @mouseenter="keepRailTip"
      @mouseleave="hideRailTip"
    >
      <div class="lx-sidebar-popper__title">{{ railTip.content }}</div>
      <a
        v-for="child in railTip.subItems"
        :key="child.key"
        class="lx-sidebar-popper__item"
        :class="{ 'is-active': activeKey === child.key, 'is-disabled': child.disabled }"
        :href="child.path || 'javascript:;'"
        @click="onPopperSelect(child)"
      >
        <span class="lx-sidebar-popper__label">
          <span class="lx-sidebar-popper__dot" :class="{ 'is-active': activeKey === child.key }" />
          <span>{{ child.title }}</span>
        </span>
        <span v-if="child.badge != null" class="lx-sidebar-popper__badge">{{ child.badge }}</span>
        <!-- 激活项右端 check（_1 规格） -->
        <LxIcon v-if="activeKey === child.key" name="check" :size="14" class="lx-sidebar-popper__check" />
      </a>
    </div>
    <div
      v-else-if="railTip.visible"
      class="lx-sidebar-tooltip"
      :style="{ left: railTip.x + 'px', top: railTip.y + 'px' }"
    >
      {{ railTip.content }}
    </div>
  </Teleport>
</template>

<style scoped>
.lx-sidebar {
  display: flex;
  flex-direction: column;
  width: var(--lx-sidebar-width);
  height: 100%;
  background: var(--lx-sidebar-bg);
  border-right: 1px solid var(--lx-sidebar-border);
  box-shadow: var(--lx-shadow-card);
  transition: width var(--lx-transition), background-color var(--lx-transition);
  flex-shrink: 0;
  overflow: hidden;
}

/* —— 展开态：右侧投影强调层次（stitch _2） —— */
.lx-sidebar--expanded {
  box-shadow: 4px 0 24px rgba(0, 0, 0, 0.5);
}

/* —— rail 态 —— */
.lx-sidebar--rail {
  width: var(--lx-sidebar-rail-width);
  background: var(--lx-sidebar-bg-rail);
}

/* —— mobile 抽屉 —— */
.lx-sidebar--mobile {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 2001;
}

.lx-sidebar__mask {
  position: fixed;
  inset: 0;
  z-index: 2000;
  background: rgba(0, 0, 0, 0.5);
}

.lx-sidebar__nav {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: var(--lx-space-sm) 0;
  scrollbar-width: thin;
  scrollbar-color: var(--lx-sidebar-guide) transparent;
}

.lx-sidebar__nav::-webkit-scrollbar {
  width: 4px;
}

.lx-sidebar__nav::-webkit-scrollbar-thumb {
  border-radius: 2px;
  background: var(--lx-sidebar-guide);
}

.lx-sidebar__footer {
  flex-shrink: 0;
}

/* —— rail 浮层（_1: tooltip left-16+ml-1 / popper w-48） —— */
.lx-sidebar-tooltip {
  position: fixed;
  padding: 6px 12px; /* px-3 py-1.5（_1） */
  border-radius: var(--lx-radius-md);
  background: var(--lx-sidebar-bg-popper);
  border: 1px solid var(--lx-sidebar-border);
  box-shadow: var(--lx-shadow-pop);
  color: var(--lx-sidebar-text);
  font-size: 12px;
  white-space: nowrap;
  pointer-events: none;
  z-index: 2100;
}

.lx-sidebar-popper {
  position: fixed;
  width: 192px; /* w-48（_1） */
  padding: var(--lx-space-xs) 0;
  border-radius: var(--lx-radius-md);
  background: var(--lx-sidebar-bg-popper);
  border: 1px solid #263445; /* _1 定值 */
  box-shadow: var(--lx-shadow-pop);
  z-index: 2100;
}

/* popper 标题（_1: px-4 py-2 + 前缀圆点 + 下分隔线） */
.lx-sidebar-popper__title {
  display: flex;
  align-items: center;
  gap: var(--lx-space-sm);
  padding: var(--lx-space-sm) 16px;
  border-bottom: 1px solid var(--lx-sidebar-border);
  font-size: 12px;
  font-weight: 500;
  color: var(--lx-sidebar-text);
  margin-bottom: var(--lx-space-xs);
}

.lx-sidebar-popper__title::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--lx-sidebar-active-glow);
  flex-shrink: 0;
}

.lx-sidebar-popper__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--lx-space-md);
  padding: 10px 16px; /* px-4 py-2.5（_1） */
  color: var(--lx-sidebar-text);
  font-size: 12px;
  text-decoration: none;
  cursor: pointer;
  transition: background-color var(--lx-transition), color var(--lx-transition);
}

.lx-sidebar-popper__item:hover:not(.is-disabled) {
  background: var(--lx-sidebar-hover-bg);
  color: var(--lx-text-on-dark);
}

.lx-sidebar-popper__item.is-active {
  color: var(--lx-sidebar-active-glow);
  background: rgba(8, 47, 73, 0.4); /* sky-950/40（_1） */
  font-weight: 500;
}

.lx-sidebar-popper__item.is-disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.lx-sidebar-popper__label {
  display: inline-flex;
  align-items: center;
  gap: var(--lx-space-sm);
  flex: 1;
  min-width: 0;
}

/* 前缀圆点（_1: w-1.5，激活 sky-400） */
.lx-sidebar-popper__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: transparent;
  flex-shrink: 0;
}

.lx-sidebar-popper__dot.is-active {
  background: var(--lx-sidebar-active-glow);
}

.lx-sidebar-popper__check {
  color: var(--lx-sidebar-active-glow);
  flex-shrink: 0;
}

.lx-sidebar-popper__badge {
  font-size: 11px;
  color: var(--lx-color-error);
  font-variant-numeric: tabular-nums;
}
</style>
