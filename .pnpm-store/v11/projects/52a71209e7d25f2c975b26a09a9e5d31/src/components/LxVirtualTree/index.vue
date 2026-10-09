<script setup lang="ts">
/**
 * 通过可见节点扁平化和固定行高窗口化渲染实现虚拟树，避免 ElTree 全量渲染 DOM。
 * 勾选值仍采用受控 API，便于与既有业务表单衔接。
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import type {
  LxVirtualTreeExpose,
  LxVirtualTreeNode,
  LxVirtualTreeProps,
} from './types'
import LxIcon from '../LxIcon/index.vue'

interface FlatNode {
  node: LxVirtualTreeNode
  key: string | number
  level: number
  parent?: string | number
  hasChildren: boolean
  posInSet: number
  setSize: number
}

defineOptions({ name: 'LxVirtualTree' })

const props = withDefaults(defineProps<LxVirtualTreeProps>(), {
  data: () => [],
  ariaLabel: '树形结构',
  ariaDescribedby: undefined,
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
})

const isTouchOrNarrowViewport = ref(false)
const effectiveItemSize = computed(() => {
  const itemSize =
    Number.isFinite(props.itemSize) && props.itemSize > 0 ? props.itemSize : 32
  return Math.max(itemSize, isTouchOrNarrowViewport.value ? 44 : 0)
})
const controlSize = computed(() => (isTouchOrNarrowViewport.value ? 44 : 24))

const emit = defineEmits<{
  'update:modelValue': [keys: (string | number)[]]
  'check-change': [keys: (string | number)[], nodes: LxVirtualTreeNode[]]
  'node-click': [node: LxVirtualTreeNode]
  'expand-change': [keys: (string | number)[]]
}>()

const rootRef = ref<HTMLElement>()
const filterInputRef = ref<HTMLInputElement>()
const keyword = ref('')
const scrollTop = ref(0)
const expanded = ref(new Set<string | number>(props.defaultExpandedKeys))
const filterCollapsed = ref(new Set<string | number>())
const focusedKey = ref<string | number>()
const selectionFeedback = ref<
  { keys: (string | number)[]; message: string } | undefined
>()
const overscan = 6
const cascadeDescription =
  '勾选或取消此节点会同步处理全部未禁用下级节点，包括当前筛选隐藏的节点。'
let responsiveViewportQuery: MediaQueryList | undefined

function updateTouchOrNarrowViewport() {
  if (typeof window === 'undefined') return
  isTouchOrNarrowViewport.value =
    responsiveViewportQuery?.matches ?? window.innerWidth <= 640
}

onMounted(() => {
  if (typeof window === 'undefined') return
  responsiveViewportQuery =
    typeof window.matchMedia === 'function'
      ? window.matchMedia('(any-pointer: coarse), (max-width: 640px)')
      : undefined
  updateTouchOrNarrowViewport()
  responsiveViewportQuery?.addEventListener(
    'change',
    updateTouchOrNarrowViewport,
  )
  window.addEventListener('resize', updateTouchOrNarrowViewport)
})

onBeforeUnmount(() => {
  responsiveViewportQuery?.removeEventListener(
    'change',
    updateTouchOrNarrowViewport,
  )
  if (typeof window !== 'undefined')
    window.removeEventListener('resize', updateTouchOrNarrowViewport)
})

function isTreeKey(value: unknown): value is string | number {
  return typeof value === 'string' || typeof value === 'number'
}

function keyOf(node: LxVirtualTreeNode): string | number {
  const configuredKey = node[props.nodeKey]
  return isTreeKey(configuredKey) ? configuredKey : node.id
}

// DOM 标记和 Vue key 同时保留原始键类型，避免数字 1 与字符串 "1" 互相覆盖焦点。
function keyTypeOf(key: string | number): 'string' | 'number' {
  return typeof key === 'number' ? 'number' : 'string'
}

function domKeyOf(key: string | number): string {
  return `${keyTypeOf(key)}:${String(key)}`
}

function childrenOf(node: LxVirtualTreeNode): LxVirtualTreeNode[] {
  return node.children ?? []
}

const treeIndex = computed(() => {
  const nodes = new Map<string | number, LxVirtualTreeNode>()
  const parents = new Map<string | number, string | number | undefined>()
  const descendants = new Map<string | number, (string | number)[]>()
  const branches: (string | number)[] = []

  const visit = (
    node: LxVirtualTreeNode,
    parent?: string | number,
  ): (string | number)[] => {
    const key = keyOf(node)
    nodes.set(key, node)
    parents.set(key, parent)
    const childKeys = childrenOf(node).flatMap((child) => visit(child, key))
    descendants.set(key, childKeys)
    if (childrenOf(node).length) branches.push(key)
    return [key, ...childKeys]
  }

  props.data.forEach((node) => visit(node))
  return { nodes, parents, descendants, branches }
})

const normalizedKeyword = computed(() =>
  keyword.value.trim().toLocaleLowerCase(),
)

// 单次遍历同时保留路径祖先和真实命中数，避免把结构节点计入筛选结果。
const filterResults = computed(() => {
  const filter = normalizedKeyword.value
  const matchingKeys = new Set<string | number>()
  let matchingNodeCount = 0
  if (!filter) return { matchingKeys, matchingNodeCount }

  const visit = (node: LxVirtualTreeNode): boolean => {
    const ownMatch = props.filterMethod
      ? props.filterMethod(node, filter)
      : String(node.label ?? '')
          .toLocaleLowerCase()
          .includes(filter)
    if (ownMatch) matchingNodeCount += 1
    let childMatch = false
    childrenOf(node).forEach((child) => {
      if (visit(child)) childMatch = true
    })
    if (ownMatch || childMatch) matchingKeys.add(keyOf(node))
    return ownMatch || childMatch
  }

  props.data.forEach((node) => visit(node))
  return { matchingKeys, matchingNodeCount }
})
const matchingKeys = computed(() => filterResults.value.matchingKeys)
const matchingNodeCount = computed(() => filterResults.value.matchingNodeCount)
const filterStatus = computed(
  () => `筛选匹配到 ${matchingNodeCount.value} 个节点；路径祖先不计入数量。`,
)

const filteredBranchKeys = computed(() => {
  if (!normalizedKeyword.value) return []

  const branches: (string | number)[] = []
  const visit = (node: LxVirtualTreeNode) => {
    const filteredChildren = childrenOf(node).filter((child) =>
      matchingKeys.value.has(keyOf(child)),
    )
    if (filteredChildren.length) branches.push(keyOf(node))
    filteredChildren.forEach(visit)
  }

  props.data
    .filter((node) => matchingKeys.value.has(keyOf(node)))
    .forEach(visit)
  return branches
})

const filteredExpandedKeys = computed(() =>
  filteredBranchKeys.value.filter((key) => !filterCollapsed.value.has(key)),
)

const flatNodes = computed<FlatNode[]>(() => {
  const rows: FlatNode[] = []
  const filter = normalizedKeyword.value
  const roots = props.data.filter(
    (node) => !filter || matchingKeys.value.has(keyOf(node)),
  )

  const walk = (
    node: LxVirtualTreeNode,
    level: number,
    parent?: string | number,
    posInSet = 1,
    setSize = 1,
  ) => {
    const key = keyOf(node)
    const children = childrenOf(node)
    const visibleChildren = filter
      ? children.filter((child) => matchingKeys.value.has(keyOf(child)))
      : children
    const hasUnloadedChildren = node.isLeaf === false && children.length === 0
    const hasChildren = filter
      ? visibleChildren.length > 0 || hasUnloadedChildren
      : children.length > 0 || node.isLeaf === false
    rows.push({ node, key, level, parent, hasChildren, posInSet, setSize })

    const revealChildren = filter
      ? visibleChildren.length > 0 && !filterCollapsed.value.has(key)
      : expanded.value.has(key)
    if (revealChildren) {
      visibleChildren.forEach((child, index) =>
        walk(child, level + 1, key, index + 1, visibleChildren.length),
      )
    }
  }

  roots.forEach((node, index) =>
    walk(node, 1, undefined, index + 1, roots.length),
  )
  return rows
})

const windowRange = computed(() => {
  const start = Math.max(
    0,
    Math.floor(scrollTop.value / effectiveItemSize.value) - overscan,
  )
  const amount =
    Math.ceil(props.height / effectiveItemSize.value) + overscan * 2
  const end = Math.min(flatNodes.value.length, start + amount)
  return { start, end }
})

const visibleRows = computed(() =>
  flatNodes.value.slice(windowRange.value.start, windowRange.value.end),
)
const topPad = computed(() => windowRange.value.start * effectiveItemSize.value)
const bottomPad = computed(
  () =>
    (flatNodes.value.length - windowRange.value.end) * effectiveItemSize.value,
)
const checked = computed(() => new Set(props.modelValue))
const selectionStatus = computed(() => {
  const feedback = selectionFeedback.value
  const isCurrentFeedback =
    feedback &&
    feedback.keys.length === checked.value.size &&
    feedback.keys.every((key) => checked.value.has(key))

  return isCurrentFeedback
    ? feedback.message
    : `当前已选中 ${checked.value.size} 项。`
})
const emptyText = computed(() =>
  props.data.length && normalizedKeyword.value ? '未找到匹配节点' : '暂无数据',
)

watch(
  () => props.modelValue,
  (keys) => {
    const feedback = selectionFeedback.value
    if (
      feedback &&
      (feedback.keys.length !== new Set(keys).size ||
        !feedback.keys.every((key) => keys.includes(key)))
    ) {
      selectionFeedback.value = undefined
    }
  },
)

function resetViewport() {
  if (rootRef.value) rootRef.value.scrollTop = 0
  scrollTop.value = 0
  focusedKey.value = flatNodes.value[0]?.key
}

function activeTreeItem(): HTMLElement | undefined {
  const root = rootRef.value
  const activeElement = root?.ownerDocument.activeElement
  const row = activeElement?.closest<HTMLElement>('[role="treeitem"]')
  return row && root?.contains(row) ? row : undefined
}

function focusCurrentItem() {
  nextTick(() => {
    const row =
      focusedKey.value === undefined
        ? undefined
        : elementForKey(focusedKey.value)
    if (row) row.focus()
    else if (!flatNodes.value.length) rootRef.value?.focus()
  })
}

function focusTreeTarget(key: string | number, activeElement?: Element | null) {
  const row = elementForKey(key)
  if (!row) return
  const selector = activeElement?.classList.contains('lx-virtual-tree__toggle')
    ? '.lx-virtual-tree__toggle'
    : activeElement?.classList.contains('lx-virtual-tree__checkbox')
      ? '.lx-virtual-tree__checkbox'
      : undefined
  const target = selector ? row.querySelector<HTMLElement>(selector) : undefined
  if (target) target.focus()
  else row.focus()
}

function restoreViewport(
  previousScrollTop: number,
  restoreFocus: boolean,
  activeElement?: Element | null,
) {
  const maxScrollTop = Math.max(
    0,
    flatNodes.value.length * effectiveItemSize.value - props.height,
  )
  const nextScrollTop = Math.min(Math.max(0, previousScrollTop), maxScrollTop)
  scrollTop.value = nextScrollTop
  nextTick(() => {
    if (!rootRef.value) return
    rootRef.value.scrollTop = nextScrollTop
    scrollTop.value = rootRef.value.scrollTop
    if (restoreFocus && focusedKey.value !== undefined)
      focusTreeTarget(focusedKey.value, activeElement)
  })
}

watch([flatNodes, normalizedKeyword], ([rows, filter], [, previousFilter]) => {
  const previousScrollTop = rootRef.value?.scrollTop ?? scrollTop.value
  const activeElement = rootRef.value?.ownerDocument.activeElement
  const activeItem = activeTreeItem()
  const activeKey = activeItem?.dataset.lxTreeKey
  const activeKeyType = activeItem?.dataset.lxTreeKeyType
  const activeRow =
    activeKey !== undefined
      ? rows.find(
          (row) =>
            String(row.key) === activeKey &&
            keyTypeOf(row.key) === activeKeyType,
        )
      : undefined
  const hasTreeFocus = Boolean(activeItem) || activeElement === rootRef.value

  if (filter !== previousFilter) {
    filterCollapsed.value = new Set()
    if (rootRef.value) rootRef.value.scrollTop = 0
    scrollTop.value = 0
    const focusedRowIsVisible = rows.some((row) => row.key === focusedKey.value)
    focusedKey.value = activeItem
      ? (activeRow?.key ?? rows[0]?.key)
      : focusedRowIsVisible
        ? focusedKey.value
        : rows[0]?.key
    if (hasTreeFocus) {
      if (focusedKey.value !== undefined) focusKey(focusedKey.value)
      else focusCurrentItem()
    }
    return
  }

  const hasRows = rows.length > 0
  const hasFocusedRow =
    focusedKey.value !== undefined &&
    rows.some((row) => row.key === focusedKey.value)

  if (!hasRows || (focusedKey.value !== undefined && !hasFocusedRow)) {
    resetViewport()
    if (hasTreeFocus) focusCurrentItem()
    return
  }

  // 数据按不可变方式追加时保留当前窗口；没有焦点节点时选择窗口附近的行作为 Tab 停靠点。
  if (activeRow) {
    focusedKey.value = activeRow.key
    const focusedIndex = rows.findIndex((row) => row.key === activeRow.key)
    const focusedTop = focusedIndex * effectiveItemSize.value
    const focusedBottom = focusedTop + effectiveItemSize.value
    const nextScrollTop =
      focusedTop < previousScrollTop
        ? focusedTop
        : focusedBottom > previousScrollTop + props.height
          ? focusedBottom - props.height
          : previousScrollTop
    restoreViewport(nextScrollTop, true, activeElement)
    return
  }

  if (focusedKey.value === undefined) {
    const fallbackIndex = Math.min(
      Math.floor(previousScrollTop / effectiveItemSize.value),
      rows.length - 1,
    )
    focusedKey.value = rows[Math.max(0, fallbackIndex)]?.key
  }
  restoreViewport(previousScrollTop, hasTreeFocus)
})

// 响应式行高变化时以焦点行或视口首行作锚点，避免虚拟窗口错位并卸载焦点项。
watch(effectiveItemSize, (itemSize, previousItemSize) => {
  const root = rootRef.value
  if (!root || itemSize === previousItemSize) return

  const previousScrollTop = root.scrollTop
  const activeElement = root.ownerDocument.activeElement
  const activeItem = activeTreeItem()
  const activeKey = activeItem?.dataset.lxTreeKey
  const activeKeyType = activeItem?.dataset.lxTreeKeyType
  const activeRow = flatNodes.value.find(
    (row) =>
      String(row.key) === activeKey && keyTypeOf(row.key) === activeKeyType,
  )
  const hasTreeFocus = Boolean(activeItem) || activeElement === root
  const anchorRow =
    activeRow ??
    (hasTreeFocus
      ? flatNodes.value.find((row) => row.key === focusedKey.value)
      : undefined)

  let anchorIndex: number
  let nextScrollTop: number
  if (anchorRow) {
    anchorIndex = flatNodes.value.findIndex((row) => row.key === anchorRow.key)
    const previousRowTop = anchorIndex * previousItemSize
    const rowOffset = previousRowTop - previousScrollTop
    const rowTop = anchorIndex * itemSize
    const rowBottom = rowTop + itemSize
    nextScrollTop = rowTop - rowOffset
    if (rowTop < nextScrollTop) nextScrollTop = rowTop
    if (rowBottom > nextScrollTop + props.height)
      nextScrollTop = rowBottom - props.height
    focusedKey.value = anchorRow.key
  } else {
    anchorIndex = Math.max(
      0,
      Math.min(
        Math.floor(previousScrollTop / Math.max(1, previousItemSize)),
        flatNodes.value.length - 1,
      ),
    )
    const rowOffset = previousScrollTop - anchorIndex * previousItemSize
    nextScrollTop = anchorIndex * itemSize + rowOffset
  }

  restoreViewport(nextScrollTop, hasTreeFocus)
})

function nodeStyle(row: FlatNode) {
  return {
    '--lx-tree-node-padding': `${(row.level - 1) * props.indent}px`,
    '--lx-tree-row-height': `${effectiveItemSize.value}px`,
  }
}

function isChecked(row: FlatNode): boolean {
  if (checked.value.has(row.key) || props.checkStrictly)
    return checked.value.has(row.key)
  const selectable = (treeIndex.value.descendants.get(row.key) ?? []).filter(
    (key) => !treeIndex.value.nodes.get(key)?.disabled,
  )
  return (
    selectable.length > 0 && selectable.every((key) => checked.value.has(key))
  )
}

function isExpanded(row: FlatNode): boolean {
  return (
    row.hasChildren &&
    (normalizedKeyword.value
      ? filteredExpandedKeys.value.includes(row.key)
      : expanded.value.has(row.key))
  )
}

function isIndeterminate(row: FlatNode): boolean {
  if (props.checkStrictly) return false
  const selectable = (treeIndex.value.descendants.get(row.key) ?? []).filter(
    (key) => !treeIndex.value.nodes.get(key)?.disabled,
  )
  if (!selectable.length) return false
  const selected = selectable.filter((key) => checked.value.has(key)).length
  return selected > 0 && selected < selectable.length
}

function changeChecked(row: FlatNode, next: boolean) {
  if (row.node.disabled) return
  const keys = new Set(checked.value)
  const affected = (
    props.checkStrictly
      ? [row.key]
      : [row.key, ...(treeIndex.value.descendants.get(row.key) ?? [])]
  ).filter((key) => !treeIndex.value.nodes.get(key)?.disabled)
  const changedCount = affected.filter((key) =>
    next ? !keys.has(key) : keys.has(key),
  ).length
  affected.forEach((key) => (next ? keys.add(key) : keys.delete(key)))
  const nextKeys = [...keys]
  selectionFeedback.value = {
    keys: nextKeys,
    message: next
      ? `本次新增 ${changedCount} 项，当前共选中 ${nextKeys.length} 项。`
      : `本次取消 ${changedCount} 项，当前共选中 ${nextKeys.length} 项。`,
  }
  emit('update:modelValue', nextKeys)
  emit(
    'check-change',
    nextKeys,
    nextKeys
      .map((key) => treeIndex.value.nodes.get(key))
      .filter((node): node is LxVirtualTreeNode => Boolean(node)),
  )
}

function toggleExpanded(row: FlatNode) {
  if (!row.hasChildren) return
  if (normalizedKeyword.value) {
    const hasFilteredChildren = childrenOf(row.node).some((child) =>
      matchingKeys.value.has(keyOf(child)),
    )
    if (!hasFilteredChildren) return

    const next = new Set(filterCollapsed.value)
    if (filteredExpandedKeys.value.includes(row.key)) next.add(row.key)
    else next.delete(row.key)
    filterCollapsed.value = next
    emit('expand-change', [...filteredExpandedKeys.value])
    return
  }

  const next = new Set(expanded.value)
  if (next.has(row.key)) next.delete(row.key)
  else next.add(row.key)
  expanded.value = next
  emit('expand-change', [...next])
}

function onScroll(event: Event) {
  const root = event.currentTarget as HTMLElement
  const activeItem = activeTreeItem()
  scrollTop.value = root.scrollTop
  syncTabStopWithViewport(root, activeItem)
}

function elementForKey(key: string | number): HTMLElement | undefined {
  return [
    ...(rootRef.value?.querySelectorAll<HTMLElement>('[data-lx-tree-key]') ??
      []),
  ].find(
    (element) =>
      element.dataset.lxTreeKey === String(key) &&
      element.dataset.lxTreeKeyType === keyTypeOf(key),
  )
}

function syncTabStopWithViewport(
  root: HTMLElement,
  previousActiveItem?: HTMLElement,
) {
  nextTick(() => {
    if (rootRef.value !== root) return

    const focusedRow =
      focusedKey.value === undefined
        ? undefined
        : elementForKey(focusedKey.value)
    if (focusedRow) {
      const rowBounds = focusedRow.getBoundingClientRect()
      const viewportBounds = root.getBoundingClientRect()
      const remainsVisible =
        rowBounds.bottom > viewportBounds.top &&
        rowBounds.top < viewportBounds.bottom
      if (remainsVisible) return
    }

    const rows = flatNodes.value
    if (!rows.length) {
      focusedKey.value = undefined
      return
    }

    const index = Math.min(
      Math.max(Math.floor(root.scrollTop / effectiveItemSize.value), 0),
      rows.length - 1,
    )
    const target = rows[index]
    if (!target) return
    focusedKey.value = target.key

    if (!previousActiveItem) return
    const activeElement = root.ownerDocument.activeElement
    if (
      activeElement !== root.ownerDocument.body &&
      !previousActiveItem.contains(activeElement)
    )
      return

    nextTick(() => {
      const currentActiveElement = root.ownerDocument.activeElement
      if (
        currentActiveElement !== root.ownerDocument.body &&
        !previousActiveItem.contains(currentActiveElement)
      )
        return
      elementForKey(target.key)?.focus()
    })
  })
}

function tabIndex(row: FlatNode): number {
  const defaultKey = flatNodes.value[0]?.key
  return (focusedKey.value ?? defaultKey) === row.key ? 0 : -1
}

function focusKey(key: string | number) {
  const index = flatNodes.value.findIndex((row) => row.key === key)
  if (index < 0 || !rootRef.value) return
  focusedKey.value = key
  const root = rootRef.value
  const expectedTop = index * effectiveItemSize.value
  const expectedBottom = expectedTop + effectiveItemSize.value
  if (expectedTop < root.scrollTop) root.scrollTop = expectedTop
  if (expectedBottom > root.scrollTop + props.height)
    root.scrollTop = expectedBottom - props.height
  scrollTop.value = root.scrollTop
  nextTick(() => elementForKey(key)?.focus())
}

function focusRelative(row: FlatNode, direction: number) {
  const index = flatNodes.value.findIndex(
    (candidate) => candidate.key === row.key,
  )
  const target = flatNodes.value[index + direction]
  if (!target) return
  focusKey(target.key)
}

function onKeydown(event: KeyboardEvent, row: FlatNode) {
  // 行内控件保留 Space/Enter 语义；方向键仍可从控件继续浏览树。
  const isArrowKey = [
    'ArrowDown',
    'ArrowUp',
    'ArrowLeft',
    'ArrowRight',
  ].includes(event.key)
  if (event.target !== event.currentTarget && !isArrowKey) return

  if (event.key === 'ArrowDown') {
    event.preventDefault()
    focusRelative(row, 1)
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    focusRelative(row, -1)
  } else if (event.key === 'ArrowRight' && row.hasChildren) {
    event.preventDefault()
    if (!isExpanded(row)) toggleExpanded(row)
    else focusRelative(row, 1)
  } else if (event.key === 'ArrowLeft') {
    event.preventDefault()
    if (row.hasChildren && isExpanded(row)) toggleExpanded(row)
    else if (row.parent !== undefined) focusKey(row.parent)
  } else if (
    (event.key === ' ' || event.key === 'Enter') &&
    props.showCheckbox
  ) {
    event.preventDefault()
    changeChecked(row, !isChecked(row))
  }
}

function getCheckedKeys() {
  return [...props.modelValue]
}

function setCheckedKeys(keys: (string | number)[]) {
  const known = [...new Set(keys)].filter(
    (key) =>
      treeIndex.value.nodes.has(key) &&
      !treeIndex.value.nodes.get(key)?.disabled,
  )
  emit('update:modelValue', known)
  emit(
    'check-change',
    known,
    known
      .map((key) => treeIndex.value.nodes.get(key))
      .filter((node): node is LxVirtualTreeNode => Boolean(node)),
  )
}

function expandAll(expand = true) {
  if (normalizedKeyword.value) {
    filterCollapsed.value = new Set(expand ? [] : filteredBranchKeys.value)
    expanded.value = new Set(expand ? treeIndex.value.branches : [])
    emit('expand-change', [...filteredExpandedKeys.value])
    return
  }

  expanded.value = new Set(expand ? treeIndex.value.branches : [])
  emit('expand-change', [...expanded.value])
}

function filter(value: string) {
  keyword.value = value
  scrollTop.value = 0
  if (rootRef.value) rootRef.value.scrollTop = 0
}

function clearFilterFromButton() {
  filter('')
  nextTick(() => filterInputRef.value?.focus())
}

function scrollToKey(key: string | number) {
  const index = flatNodes.value.findIndex((row) => row.key === key)
  const root = rootRef.value
  if (index < 0 || !root) return
  const activeItem = activeTreeItem()
  root.scrollTop = index * effectiveItemSize.value
  scrollTop.value = root.scrollTop
  syncTabStopWithViewport(root, activeItem)
}

const publicMethods: LxVirtualTreeExpose = {
  getCheckedKeys,
  setCheckedKeys,
  expandAll,
  filter,
  scrollToKey,
}
defineExpose(publicMethods)
</script>

<template>
  <section
    class="lx-virtual-tree"
    :style="{ '--lx-tree-control-size': `${controlSize}px` }"
  >
    <label v-if="filterable" class="lx-virtual-tree__filter">
      <LxIcon name="search" :size="14" />
      <input
        ref="filterInputRef"
        v-model="keyword"
        type="text"
        inputmode="search"
        placeholder="过滤节点"
        aria-label="过滤节点"
      />
      <button
        v-if="keyword"
        type="button"
        aria-label="清除过滤"
        @click="clearFilterFromButton"
      >
        <LxIcon name="x" :size="14" />
      </button>
    </label>

    <div
      v-if="showCheckbox || normalizedKeyword"
      class="lx-virtual-tree__selection-info"
    >
      <template v-if="showCheckbox">
        <p v-if="!checkStrictly" class="lx-virtual-tree__selection-scope">
          勾选父节点会同步影响全部未禁用下级节点，包括当前筛选隐藏的节点；禁用节点会跳过。
        </p>
        <p
          class="lx-virtual-tree__selection-status"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {{ selectionStatus }}
        </p>
      </template>
      <p
        v-if="normalizedKeyword"
        class="lx-virtual-tree__filter-status"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {{ filterStatus }}
      </p>
    </div>

    <div
      ref="rootRef"
      class="lx-virtual-tree__viewport"
      :style="{
        height: `${height}px`,
        '--lx-scrollbar-width': `${scrollbarWidth}px`,
      }"
      role="tree"
      :tabindex="flatNodes.length ? undefined : -1"
      :aria-label="ariaLabel"
      :aria-describedby="ariaDescribedby || undefined"
      :aria-multiselectable="showCheckbox || undefined"
      @scroll="onScroll"
    >
      <div :style="{ height: `${topPad}px` }" aria-hidden="true" />
      <div
        v-for="row in visibleRows"
        :key="domKeyOf(row.key)"
        class="lx-virtual-tree__row"
        :class="{
          'is-checked': isChecked(row),
          'is-disabled': row.node.disabled,
        }"
        :style="nodeStyle(row)"
        :data-lx-tree-key="String(row.key)"
        :data-lx-tree-key-type="keyTypeOf(row.key)"
        role="treeitem"
        :aria-level="row.level"
        :aria-posinset="row.posInSet"
        :aria-setsize="row.setSize"
        :aria-expanded="row.hasChildren ? isExpanded(row) : undefined"
        :aria-description="
          showCheckbox && !checkStrictly ? cascadeDescription : undefined
        "
        :aria-checked="
          showCheckbox
            ? isIndeterminate(row)
              ? 'mixed'
              : isChecked(row)
            : undefined
        "
        :aria-disabled="row.node.disabled || undefined"
        :tabindex="tabIndex(row)"
        @click="!row.node.disabled && emit('node-click', row.node)"
        @focusin="focusedKey = row.key"
        @keydown="onKeydown($event, row)"
      >
        <button
          v-if="row.hasChildren"
          class="lx-virtual-tree__toggle"
          type="button"
          tabindex="-1"
          :aria-label="isExpanded(row) ? '收起节点' : '展开节点'"
          :aria-expanded="isExpanded(row)"
          @click.stop="toggleExpanded(row)"
        >
          <LxIcon
            :name="isExpanded(row) ? 'chevron-down' : 'chevron-right'"
            :size="14"
          />
        </button>
        <span
          v-else
          class="lx-virtual-tree__toggle-placeholder"
          aria-hidden="true"
        />

        <label
          v-if="showCheckbox"
          class="lx-virtual-tree__checkbox-control"
          :class="{ 'is-disabled': row.node.disabled }"
          @click.stop
        >
          <input
            class="lx-virtual-tree__checkbox"
            type="checkbox"
            tabindex="-1"
            :checked="isChecked(row)"
            :indeterminate="isIndeterminate(row)"
            :disabled="Boolean(row.node.disabled)"
            :aria-label="`选择 ${row.node.label}`"
            :aria-description="!checkStrictly ? cascadeDescription : undefined"
            @click.stop
            @change="
              changeChecked(row, ($event.target as HTMLInputElement).checked)
            "
          />
        </label>
        <LxIcon
          :name="
            row.hasChildren
              ? isExpanded(row)
                ? 'folder-open'
                : 'folder'
              : 'file'
          "
          :size="15"
          class="lx-virtual-tree__node-icon"
        />
        <span class="lx-virtual-tree__label" :title="row.node.label">{{
          row.node.label
        }}</span>
        <slot
          name="node"
          :node="row.node"
          :level="row.level"
          :checked="isChecked(row)"
        />
      </div>
      <div :style="{ height: `${bottomPad}px` }" aria-hidden="true" />
      <p v-if="!flatNodes.length" class="lx-virtual-tree__empty">
        {{ emptyText }}
      </p>
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
  width: var(--lx-tree-control-size, 24px);
  height: var(--lx-tree-control-size, 24px);
  flex: 0 0 var(--lx-tree-control-size, 24px);
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

.lx-virtual-tree__selection-info {
  display: grid;
  gap: var(--lx-space-xs);
  color: var(--lx-text-secondary);
  font-size: 12px;
  line-height: 1.5;
}

.lx-virtual-tree__selection-info p {
  margin: 0;
}

.lx-virtual-tree__selection-status {
  color: var(--lx-text-regular);
}

.lx-virtual-tree__filter-status {
  color: var(--lx-text-secondary-strong);
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
  padding-inline: calc(var(--lx-space-sm) + var(--lx-tree-node-padding))
    var(--lx-space-sm);
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
.lx-virtual-tree__toggle-placeholder,
.lx-virtual-tree__checkbox-control {
  display: inline-flex;
  width: var(--lx-tree-control-size, 24px);
  height: var(--lx-tree-control-size, 24px);
  flex: 0 0 var(--lx-tree-control-size, 24px);
  align-items: center;
  justify-content: center;
}

.lx-virtual-tree__toggle-placeholder {
  cursor: default;
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

.lx-virtual-tree__checkbox-control {
  cursor: pointer;
}

.lx-virtual-tree__checkbox-control.is-disabled {
  cursor: not-allowed;
}

.lx-virtual-tree__checkbox {
  box-sizing: border-box;
  width: var(--lx-tree-checkbox-size);
  min-width: var(--lx-tree-checkbox-size);
  max-width: var(--lx-tree-checkbox-size);
  height: var(--lx-tree-checkbox-size);
  min-height: var(--lx-tree-checkbox-size);
  max-height: var(--lx-tree-checkbox-size);
  flex: 0 0 var(--lx-tree-checkbox-size);
  margin: 0;
  accent-color: var(--lx-color-primary);
}

.lx-virtual-tree__checkbox:focus-visible {
  outline: 2px solid var(--lx-color-primary);
  outline-offset: 2px;
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
