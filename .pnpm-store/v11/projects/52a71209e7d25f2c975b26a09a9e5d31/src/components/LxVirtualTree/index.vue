<script setup lang="ts">
/**
 * 通过可见节点扁平化和固定行高窗口化渲染实现虚拟树，避免 ElTree 全量渲染 DOM。
 * 勾选值仍采用受控 API，便于与既有业务表单衔接。
 */
import { computed, nextTick, ref, watch } from 'vue';
import LxIcon from '../LxIcon/index.vue';
import type { LxVirtualTreeExpose, LxVirtualTreeNode, LxVirtualTreeProps } from './types';

interface FlatNode {
  node: LxVirtualTreeNode;
  key: string | number;
  level: number;
  parent?: string | number;
  hasChildren: boolean;
}

defineOptions({ name: 'LxVirtualTree' });

const props = withDefaults(defineProps<LxVirtualTreeProps>(), {
  data: () => [],
  height: 360,
  itemSize: 32,
  indent: 16,
  nodeKey: 'id',
  showCheckbox: false,
  checkStrictly: false,
  filterable: true,
  defaultExpandedKeys: () => [],
  scrollbarWidth: 4,
  modelValue: () => [],
});

const emit = defineEmits<{
  'update:modelValue': [keys: (string | number)[]];
  'check-change': [keys: (string | number)[], nodes: LxVirtualTreeNode[]];
  'node-click': [node: LxVirtualTreeNode];
  'expand-change': [keys: (string | number)[]];
}>();

const rootRef = ref<HTMLElement>();
const keyword = ref('');
const scrollTop = ref(0);
const expanded = ref(new Set<string | number>(props.defaultExpandedKeys));
const focusedKey = ref<string | number>();
const overscan = 6;

function keyOf(node: LxVirtualTreeNode): string | number {
  return (node[props.nodeKey] as string | number | undefined) ?? node.id;
}

function childrenOf(node: LxVirtualTreeNode): LxVirtualTreeNode[] {
  return node.children ?? [];
}

const treeIndex = computed(() => {
  const nodes = new Map<string | number, LxVirtualTreeNode>();
  const parents = new Map<string | number, string | number | undefined>();
  const descendants = new Map<string | number, (string | number)[]>();
  const branches: (string | number)[] = [];

  const visit = (node: LxVirtualTreeNode, parent?: string | number): (string | number)[] => {
    const key = keyOf(node);
    nodes.set(key, node);
    parents.set(key, parent);
    const childKeys = childrenOf(node).flatMap((child) => visit(child, key));
    descendants.set(key, childKeys);
    if (childrenOf(node).length) branches.push(key);
    return [key, ...childKeys];
  };

  props.data.forEach((node) => visit(node));
  return { nodes, parents, descendants, branches };
});

const normalizedKeyword = computed(() => keyword.value.trim().toLocaleLowerCase());

// 仅构建一次匹配集合，避免大规模组织树逐行递归匹配时退化为二次复杂度。
const matchingKeys = computed(() => {
  const filter = normalizedKeyword.value;
  const result = new Set<string | number>();
  if (!filter) return result;

  const visit = (node: LxVirtualTreeNode): boolean => {
    const ownMatch = String(node.label ?? '').toLocaleLowerCase().includes(filter);
    let childMatch = false;
    childrenOf(node).forEach((child) => {
      if (visit(child)) childMatch = true;
    });
    if (ownMatch || childMatch) result.add(keyOf(node));
    return ownMatch || childMatch;
  };

  props.data.forEach((node) => visit(node));
  return result;
});

const flatNodes = computed<FlatNode[]>(() => {
  const rows: FlatNode[] = [];
  const filter = normalizedKeyword.value;

  const walk = (node: LxVirtualTreeNode, level: number, parent?: string | number) => {
    const key = keyOf(node);
    const children = childrenOf(node);
    const hasChildren = children.length > 0 || node.isLeaf === false;
    const appears = !filter || matchingKeys.value.has(key);
    if (!appears) return;
    rows.push({ node, key, level, parent, hasChildren });
    const revealChildren = filter ? true : expanded.value.has(key);
    if (revealChildren) children.forEach((child) => walk(child, level + 1, key));
  };

  props.data.forEach((node) => walk(node, 1));
  return rows;
});

const windowRange = computed(() => {
  const start = Math.max(0, Math.floor(scrollTop.value / props.itemSize) - overscan);
  const amount = Math.ceil(props.height / props.itemSize) + overscan * 2;
  const end = Math.min(flatNodes.value.length, start + amount);
  return { start, end };
});

const visibleRows = computed(() => flatNodes.value.slice(windowRange.value.start, windowRange.value.end));
const topPad = computed(() => windowRange.value.start * props.itemSize);
const bottomPad = computed(() => (flatNodes.value.length - windowRange.value.end) * props.itemSize);
const checked = computed(() => new Set(props.modelValue));

watch(normalizedKeyword, () => {
  if (rootRef.value) rootRef.value.scrollTop = 0;
  scrollTop.value = 0;
  if (!flatNodes.value.some((row) => row.key === focusedKey.value)) focusedKey.value = flatNodes.value[0]?.key;
});

watch(() => props.data, () => {
  if (rootRef.value) rootRef.value.scrollTop = 0;
  scrollTop.value = 0;
  focusedKey.value = flatNodes.value[0]?.key;
});

function nodeStyle(row: FlatNode) {
  return {
    '--lx-tree-node-padding': `${(row.level - 1) * props.indent}px`,
    '--lx-tree-row-height': `${props.itemSize}px`,
  };
}

function isChecked(row: FlatNode): boolean {
  if (checked.value.has(row.key) || props.checkStrictly) return checked.value.has(row.key);
  const selectable = (treeIndex.value.descendants.get(row.key) ?? []).filter((key) => !treeIndex.value.nodes.get(key)?.disabled);
  return selectable.length > 0 && selectable.every((key) => checked.value.has(key));
}

function isIndeterminate(row: FlatNode): boolean {
  if (props.checkStrictly) return false;
  const selectable = (treeIndex.value.descendants.get(row.key) ?? []).filter((key) => !treeIndex.value.nodes.get(key)?.disabled);
  if (!selectable.length) return false;
  const selected = selectable.filter((key) => checked.value.has(key)).length;
  return selected > 0 && selected < selectable.length;
}

function changeChecked(row: FlatNode, next: boolean) {
  if (row.node.disabled) return;
  const keys = new Set(checked.value);
  const affected = (props.checkStrictly ? [row.key] : [row.key, ...(treeIndex.value.descendants.get(row.key) ?? [])]).filter(
    (key) => !treeIndex.value.nodes.get(key)?.disabled,
  );
  affected.forEach((key) => (next ? keys.add(key) : keys.delete(key)));
  const nextKeys = [...keys];
  emit('update:modelValue', nextKeys);
  emit('check-change', nextKeys, nextKeys.map((key) => treeIndex.value.nodes.get(key)).filter((node): node is LxVirtualTreeNode => Boolean(node)));
}

function toggleExpanded(row: FlatNode) {
  if (!row.hasChildren) return;
  const next = new Set(expanded.value);
  if (next.has(row.key)) next.delete(row.key);
  else next.add(row.key);
  expanded.value = next;
  emit('expand-change', [...next]);
}

function onScroll(event: Event) {
  scrollTop.value = (event.target as HTMLElement).scrollTop;
}

function elementForKey(key: string | number): HTMLElement | undefined {
  return [...(rootRef.value?.querySelectorAll<HTMLElement>('[data-lx-tree-key]') ?? [])].find(
    (element) => element.dataset.lxTreeKey === String(key),
  );
}

function tabIndex(row: FlatNode): number {
  const defaultKey = flatNodes.value[0]?.key;
  return (focusedKey.value ?? defaultKey) === row.key ? 0 : -1;
}

function focusKey(key: string | number) {
  const index = flatNodes.value.findIndex((row) => row.key === key);
  if (index < 0 || !rootRef.value) return;
  focusedKey.value = key;
  const root = rootRef.value;
  const expectedTop = index * props.itemSize;
  const expectedBottom = expectedTop + props.itemSize;
  if (expectedTop < root.scrollTop) root.scrollTop = expectedTop;
  if (expectedBottom > root.scrollTop + props.height) root.scrollTop = expectedBottom - props.height;
  scrollTop.value = root.scrollTop;
  nextTick(() => elementForKey(key)?.focus());
}

function focusRelative(row: FlatNode, direction: number) {
  const index = flatNodes.value.findIndex((candidate) => candidate.key === row.key);
  const target = flatNodes.value[index + direction];
  if (!target) return;
  focusKey(target.key);
}

function onKeydown(event: KeyboardEvent, row: FlatNode) {
  if (event.key === 'ArrowDown') {
    event.preventDefault();
    focusRelative(row, 1);
  } else if (event.key === 'ArrowUp') {
    event.preventDefault();
    focusRelative(row, -1);
  } else if (event.key === 'ArrowRight' && row.hasChildren) {
    event.preventDefault();
    if (!expanded.value.has(row.key)) toggleExpanded(row);
    else focusRelative(row, 1);
  } else if (event.key === 'ArrowLeft') {
    event.preventDefault();
    if (row.hasChildren && expanded.value.has(row.key)) toggleExpanded(row);
    else if (row.parent !== undefined) focusKey(row.parent);
  } else if ((event.key === ' ' || event.key === 'Enter') && props.showCheckbox) {
    event.preventDefault();
    changeChecked(row, !isChecked(row));
  }
}

function getCheckedKeys() {
  return [...props.modelValue];
}

function setCheckedKeys(keys: (string | number)[]) {
  const known = [...new Set(keys)].filter((key) => treeIndex.value.nodes.has(key) && !treeIndex.value.nodes.get(key)?.disabled);
  emit('update:modelValue', known);
  emit('check-change', known, known.map((key) => treeIndex.value.nodes.get(key)).filter((node): node is LxVirtualTreeNode => Boolean(node)));
}

function expandAll(expand = true) {
  expanded.value = new Set(expand ? treeIndex.value.branches : []);
  emit('expand-change', [...expanded.value]);
}

function filter(value: string) {
  keyword.value = value;
  scrollTop.value = 0;
  if (rootRef.value) rootRef.value.scrollTop = 0;
}

function scrollToKey(key: string | number) {
  const index = flatNodes.value.findIndex((row) => row.key === key);
  if (index < 0 || !rootRef.value) return;
  rootRef.value.scrollTop = index * props.itemSize;
  scrollTop.value = rootRef.value.scrollTop;
}

const publicMethods: LxVirtualTreeExpose = { getCheckedKeys, setCheckedKeys, expandAll, filter, scrollToKey };
defineExpose(publicMethods);
</script>

<template>
  <section class="lx-virtual-tree">
    <label v-if="filterable" class="lx-virtual-tree__filter">
      <LxIcon name="search" :size="14" />
      <input v-model="keyword" type="search" placeholder="过滤节点" aria-label="过滤节点" />
      <button v-if="keyword" type="button" aria-label="清除过滤" @click="filter('')"><LxIcon name="x" :size="14" /></button>
    </label>

    <div
      ref="rootRef"
      class="lx-virtual-tree__viewport"
      :style="{ height: `${height}px`, '--lx-scrollbar-width': `${scrollbarWidth}px` }"
      role="tree"
      :aria-multiselectable="showCheckbox || undefined"
      @scroll="onScroll"
    >
      <div :style="{ height: `${topPad}px` }" aria-hidden="true" />
      <div
        v-for="row in visibleRows"
        :key="String(row.key)"
        class="lx-virtual-tree__row"
        :class="{ 'is-checked': isChecked(row), 'is-disabled': row.node.disabled }"
        :style="nodeStyle(row)"
        :data-lx-tree-key="String(row.key)"
        role="treeitem"
        :aria-level="row.level"
        :aria-expanded="row.hasChildren ? expanded.has(row.key) : undefined"
        :aria-checked="showCheckbox ? (isIndeterminate(row) ? 'mixed' : isChecked(row)) : undefined"
        :aria-disabled="row.node.disabled || undefined"
        :tabindex="tabIndex(row)"
        @click="!row.node.disabled && emit('node-click', row.node)"
        @focus="focusedKey = row.key"
        @keydown="onKeydown($event, row)"
      >
        <button
          v-if="row.hasChildren"
          class="lx-virtual-tree__toggle"
          type="button"
          :aria-label="expanded.has(row.key) ? '收起节点' : '展开节点'"
          :aria-expanded="expanded.has(row.key)"
          @click.stop="toggleExpanded(row)"
        >
          <LxIcon :name="expanded.has(row.key) ? 'chevron-down' : 'chevron-right'" :size="14" />
        </button>
        <span v-else class="lx-virtual-tree__toggle-placeholder" aria-hidden="true" />

        <input
          v-if="showCheckbox"
          class="lx-virtual-tree__checkbox"
          type="checkbox"
          :checked="isChecked(row)"
          :indeterminate="isIndeterminate(row)"
          :disabled="Boolean(row.node.disabled)"
          :aria-label="`选择 ${row.node.label}`"
          @click.stop
          @change="changeChecked(row, ($event.target as HTMLInputElement).checked)"
        />
        <LxIcon :name="row.hasChildren ? (expanded.has(row.key) ? 'folder-open' : 'folder') : 'file'" :size="15" class="lx-virtual-tree__node-icon" />
        <span class="lx-virtual-tree__label" :title="row.node.label">{{ row.node.label }}</span>
        <slot name="node" :node="row.node" :level="row.level" :checked="isChecked(row)" />
      </div>
      <div :style="{ height: `${bottomPad}px` }" aria-hidden="true" />
      <p v-if="!flatNodes.length" class="lx-virtual-tree__empty">{{ keyword ? '未找到匹配节点' : '暂无数据' }}</p>
    </div>
  </section>
</template>

<style scoped>
.lx-virtual-tree {
  display: grid;
  min-width: 0;
  gap: var(--lx-space-sm);
}

.lx-virtual-tree__filter {
  display: flex;
  min-height: 28px;
  align-items: center;
  gap: var(--lx-space-xs);
  padding: 0 var(--lx-space-sm);
  border: 1px solid var(--lx-border);
  border-radius: var(--lx-radius-md);
  background: var(--lx-bg-card);
  color: var(--lx-text-secondary);
}

.lx-virtual-tree__filter:focus-within {
  border-color: var(--lx-color-primary);
  box-shadow: var(--lx-focus-ring);
}

.lx-virtual-tree__filter input {
  width: 100%;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--lx-text-regular);
  font: inherit;
  font-size: 12px;
}

.lx-virtual-tree__filter button {
  display: inline-flex;
  width: 20px;
  height: 20px;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  border-radius: var(--lx-radius-sm);
  background: transparent;
  color: var(--lx-text-secondary);
  cursor: pointer;
}

.lx-virtual-tree__filter button:hover {
  background: var(--lx-bg-card-hover);
  color: var(--lx-text-primary);
}

.lx-virtual-tree__viewport {
  overflow: auto;
  border: 1px solid var(--lx-border-light);
  border-radius: var(--lx-radius-md);
  background: var(--lx-bg-card);
  scrollbar-color: var(--lx-text-placeholder) transparent;
  scrollbar-width: thin;
}

.lx-virtual-tree__viewport::-webkit-scrollbar {
  width: var(--lx-scrollbar-width);
  height: var(--lx-scrollbar-width);
}

.lx-virtual-tree__viewport::-webkit-scrollbar-thumb {
  border-radius: var(--lx-radius-sm);
  background: var(--lx-text-placeholder);
}

.lx-virtual-tree__row {
  display: flex;
  min-width: 0;
  height: var(--lx-tree-row-height);
  align-items: center;
  gap: var(--lx-space-xs);
  padding-inline: calc(var(--lx-space-sm) + var(--lx-tree-node-padding)) var(--lx-space-sm);
  color: var(--lx-text-regular);
  cursor: pointer;
  outline: 0;
}

.lx-virtual-tree__row:hover,
.lx-virtual-tree__row:focus-visible {
  background: var(--lx-bg-card-hover);
}

.lx-virtual-tree__row:focus-visible {
  outline: 2px solid var(--lx-color-primary);
  outline-offset: -2px;
}

.lx-virtual-tree__row.is-checked {
  background: var(--lx-color-primary-light);
  color: var(--lx-color-primary);
}

.lx-virtual-tree__row.is-disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.lx-virtual-tree__toggle,
.lx-virtual-tree__toggle-placeholder {
  display: inline-flex;
  width: 16px;
  height: 16px;
  flex: 0 0 16px;
  align-items: center;
  justify-content: center;
}

.lx-virtual-tree__toggle {
  padding: 0;
  border: 0;
  border-radius: var(--lx-radius-sm);
  background: transparent;
  color: var(--lx-text-secondary);
  cursor: pointer;
}

.lx-virtual-tree__toggle:hover {
  color: var(--lx-color-primary);
}

.lx-virtual-tree__checkbox {
  width: 14px;
  height: 14px;
  accent-color: var(--lx-color-primary);
}

.lx-virtual-tree__node-icon {
  flex: 0 0 auto;
  color: var(--lx-text-secondary);
}

.lx-virtual-tree__row.is-checked .lx-virtual-tree__node-icon {
  color: var(--lx-color-primary);
}

.lx-virtual-tree__label {
  overflow: hidden;
  min-width: 0;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  line-height: 20px;
}

.lx-virtual-tree__empty {
  margin: 0;
  padding: var(--lx-space-xl) var(--lx-space-md);
  color: var(--lx-text-secondary);
  font-size: 13px;
  text-align: center;
}
</style>
