<script setup lang="ts">
import {
  computed,
  getCurrentInstance,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from 'vue'

import LxCheckbox from '../LxCheckbox/index.vue'
import { lxConfirm } from '../LxConfirm'
import { syncAriaDescribedBy } from '../../utils/syncAriaDescribedBy'
import type {
  LxTransferPanelNode,
  LxTransferPanelProps,
  LxTransferPanelStatusTone,
} from './types'
import LxIcon from '../LxIcon/index.vue'
import { lxMessage } from '../LxMessage'
import LxVirtualTree from '../LxVirtualTree/index.vue'
import type {
  LxVirtualTreeExpose,
  LxVirtualTreeNode,
} from '../LxVirtualTree/types'

defineOptions({ name: 'LxTransferPanel' })

const MOBILE_PANEL_BREAKPOINT = 767

const props = withDefaults(defineProps<LxTransferPanelProps>(), {
  treeData: () => [],
  modelValue: () => [],
  selectedItems: () => [],
  titles: () => ['待选资源', '已选资源'],
  filterPlaceholders: () => [
    '输入机构名称/部门编码检索...',
    '在已选名单中检索...',
  ],
  panelHeight: 380,
  defaultExpandedKeys: () => [],
  maxCount: undefined,
  inheritChild: true,
})

const emit = defineEmits<{
  'update:modelValue': [keys: (string | number)[]]
  change: [keys: (string | number)[], nodes: LxTransferPanelNode[]]
  'update:inheritChild': [value: boolean]
  'clear-all': []
}>()

const sourceTreeRef = ref<LxVirtualTreeExpose>()
const sourceFilterInput = ref<HTMLInputElement>()
const selectedFilterInput = ref<HTMLInputElement>()
const selectedListRef = ref<HTMLUListElement>()
const treeContainerRef = ref<HTMLElement>()
const selectedRemoveButtons = new Map<string | number, HTMLButtonElement>()
const inheritCheckboxContainer = ref<HTMLElement>()
const sourceFilter = ref('')
const selectedFilter = ref('')
const mobilePanel = ref<'source' | 'selected'>('source')
const inherit = ref(props.inheritChild)
const expandedSelectedNameKeys = ref(new Set<string | number>())
const selectedNameOverflowKeys = ref(new Set<string | number>())
const hasSelectedOverflow = ref(false)
const canScrollSelectedMore = ref(false)
const remainingSelectedCount = ref(0)
const treeItemSize = ref(32)
const selectionRevision = ref(0)
let observedModelValue = [...props.modelValue]
let selectedListResizeObserver: ResizeObserver | null = null
let treeResizeObserver: ResizeObserver | null = null
let previousViewportWidth: number | null = null
let mobileSwitcherHadFocus = false
const instanceId = `lx-transfer-panel-${getCurrentInstance()?.uid ?? 0}`
const sourcePanelId = `${instanceId}-source-panel`
const sourceTitleId = `${instanceId}-source-title`
const sourceActionsStatusId = `${instanceId}-source-actions-status`
const invertAllDescriptionId = `${instanceId}-invert-all-description`
const keyboardHintId = `${instanceId}-keyboard-hint`
const selectAllStatusId = `${instanceId}-select-all-status`
const selectedTitleId = `${instanceId}-selected-title`
const selectedPanelId = `${instanceId}-selected-panel`
const inheritChildDescriptionId = `${instanceId}-inherit-child-description`
const managedInheritDescriptionIds = new Set<string>()
const selectedScrollHintId = `${instanceId}-selected-scroll-hint`
const inheritChildDescription = computed(
  () => props.inheritChildDescription?.trim() ?? '',
)

const panelHeight = computed(() =>
  Math.max(
    240,
    Math.floor(Number.isFinite(props.panelHeight) ? props.panelHeight : 380),
  ),
)
const treeHeight = ref(Math.max(120, panelHeight.value - 116))
const panelStyle = computed(() => ({
  '--lx-transfer-panel-height': `${panelHeight.value}px`,
}))

const transferStatusTones: readonly LxTransferPanelStatusTone[] = [
  'online',
  'processing',
  'busy',
  'error',
  'offline',
  'success',
  'warning',
  'info',
]
const statusLabels: Record<string, string> = {
  online: '正常',
  processing: '处理中',
  busy: '忙碌',
  error: '异常',
  offline: '停用',
}

watch(
  () => props.inheritChild,
  (value) => (inherit.value = value),
)

function syncInheritChildDescription() {
  const checkbox =
    inheritCheckboxContainer.value?.querySelector<HTMLInputElement>(
      'input[type="checkbox"]',
    )
  if (!checkbox) return

  syncAriaDescribedBy(
    checkbox,
    inheritChildDescriptionId,
    managedInheritDescriptionIds,
  )
}

onMounted(syncInheritChildDescription)
watch(inheritChildDescription, syncInheritChildDescription, { flush: 'post' })

// 仅在键序列变化时使确认失效；相同键的新数组引用不应丢弃用户确认。
watch(
  () => props.modelValue,
  (value) => {
    if (sameKeySequence(value, observedModelValue)) return

    observedModelValue = [...value]
    selectionRevision.value += 1
  },
  { deep: true, flush: 'sync' },
)

watch(sourceFilter, (value) => applySourceFilter(value))

watch(sourceTreeRef, (tree) => {
  if (tree) applySourceFilter(sourceFilter.value)
})

const nodeMap = computed(() => {
  const nodes = new Map<string | number, LxTransferPanelNode>()
  const visit = (list: LxTransferPanelNode[]) => {
    list.forEach((node) => {
      nodes.set(node.id, node)
      if (node.children) visit(node.children)
    })
  }
  visit(props.treeData)
  return nodes
})
const selectedItemMap = computed(
  () => new Map(props.selectedItems.map((item) => [item.id, item])),
)

const allKeys = computed(() =>
  [...nodeMap.value.keys()].filter((key) => !nodeMap.value.get(key)?.disabled),
)
const selectedKeySet = computed(() => new Set(props.modelValue))
const maxCount = computed(() =>
  props.maxCount == null
    ? null
    : Number.isFinite(props.maxCount)
      ? Math.max(0, Math.floor(props.maxCount))
      : 0,
)
const missingKeys = computed(() =>
  allKeys.value.filter((key) => !selectedKeySet.value.has(key)),
)
function matchesSourceNode(node: LxVirtualTreeNode, keyword: string): boolean {
  const query = keyword.trim().toLocaleLowerCase()
  if (!query) return true
  return [node.label, node.code].some(
    (value) =>
      typeof value === 'string' && value.toLocaleLowerCase().includes(query),
  )
}

const sourceFilterMatches = computed(() => {
  const query = sourceFilter.value.trim().toLocaleLowerCase()
  if (!query) return allKeys.value
  const matches: (string | number)[] = []
  nodeMap.value.forEach((node, key) => {
    if (matchesSourceNode(node, query)) matches.push(key)
  })
  return matches.filter((key) => !nodeMap.value.get(key)?.disabled)
})
const filteredMissingKeys = computed(() =>
  sourceFilterMatches.value.filter((key) => !selectedKeySet.value.has(key)),
)
const canSelectAll = computed(() => {
  if (!missingKeys.value.length) return false
  return (
    maxCount.value === null ||
    selectedKeySet.value.size + missingKeys.value.length <= maxCount.value
  )
})
const selectAllDisabledReason = computed(() => {
  if (canSelectAll.value) return ''
  if (!allKeys.value.length) return '待选树中没有可加入的节点'
  if (!missingKeys.value.length) return '待选树中的可选节点已全部加入'

  const remaining =
    maxCount.value === null
      ? null
      : Math.max(0, maxCount.value - selectedKeySet.value.size)
  if (remaining === 0) {
    return `已达到选择上限 ${maxCount.value} 项，不能继续加入待选节点`
  }
  if (remaining !== null) {
    return `全量加入需要 ${missingKeys.value.length} 项，当前还可加入 ${remaining} 项`
  }
  return ''
})
const selectAllCompactHint = computed(() => {
  if (canSelectAll.value) return ''
  if (!allKeys.value.length) return '无可加入节点'
  if (!missingKeys.value.length) return '节点已全部加入'

  const remaining =
    maxCount.value === null
      ? null
      : Math.max(0, maxCount.value - selectedKeySet.value.size)
  if (remaining === 0) return `已达上限 ${maxCount.value} 项`
  if (remaining !== null) {
    return `需加入 ${missingKeys.value.length} 项；仅剩 ${remaining} 个名额`
  }
  return ''
})
const canSelectFiltered = computed(() => {
  if (!filteredMissingKeys.value.length) return false
  return (
    maxCount.value === null ||
    selectedKeySet.value.size + filteredMissingKeys.value.length <=
      maxCount.value
  )
})
const filteredActionsStatus = computed(() => {
  const matchCount = sourceFilterMatches.value.length
  if (!matchCount) return '没有可批量操作的匹配节点'

  const missingCount = filteredMissingKeys.value.length
  if (!missingCount) return `筛选结果已全部选择，共 ${matchCount} 项`

  const remainingCount =
    maxCount.value === null
      ? null
      : Math.max(0, maxCount.value - selectedKeySet.value.size)
  if (remainingCount !== null && missingCount > remainingCount) {
    return `达到选择上限：筛选结果有 ${missingCount} 项未选，当前可再选 ${remainingCount} 项`
  }

  return `筛选到 ${matchCount} 项，已选 ${matchCount - missingCount} 项`
})
// 树按需加载时，暂未出现在当前树中的既有授权仍需可见且可移除。
const selectedNodes = computed(() =>
  props.modelValue.map((key): LxTransferPanelNode => {
    const treeNode = nodeMap.value.get(key)
    if (treeNode) return treeNode
    const selectedItem = selectedItemMap.value.get(key)
    return selectedItem ?? { id: key, label: String(key) }
  }),
)
const visibleSelectedNodes = computed(() => {
  const query = selectedFilter.value.trim().toLocaleLowerCase()
  return !query
    ? selectedNodes.value
    : selectedNodes.value.filter((node) =>
        [node.label, node.code, node.status, statusLabelOf(node)]
          .filter((value): value is string => typeof value === 'string')
          .some((value) => value.toLocaleLowerCase().includes(query)),
      )
})

function updateSelectedListObserverTargets() {
  const list = selectedListRef.value
  if (!list || !selectedListResizeObserver) return

  selectedListResizeObserver.disconnect()
  selectedListResizeObserver.observe(list)
  Array.from(list.children).forEach((item) =>
    selectedListResizeObserver?.observe(item),
  )
  list
    .querySelectorAll<HTMLElement>('.lx-transfer-panel__selected-name')
    .forEach((name) => selectedListResizeObserver?.observe(name))
}

function selectedNameKey(id: string | number) {
  return `${typeof id}:${String(id)}`
}

function updateSelectedNameOverflow() {
  const list = selectedListRef.value
  if (!list || list.clientHeight === 0) return
  const isNarrow = typeof window !== 'undefined' && window.innerWidth <= 420

  const visibleNodeIds = new Map(
    visibleSelectedNodes.value.map((node) => [
      selectedNameKey(node.id),
      node.id,
    ]),
  )
  const overflowingKeys = new Set<string | number>()

  list
    .querySelectorAll<HTMLElement>('.lx-transfer-panel__selected-name')
    .forEach((name) => {
      const key = name.dataset.selectedNameKey
      if (!key) return

      const id = visibleNodeIds.get(key)
      if (id === undefined) return
      const disclosure = name.closest('details')
      if (
        expandedSelectedNameKeys.value.has(id) ||
        (disclosure instanceof HTMLDetailsElement && disclosure.open)
      ) {
        overflowingKeys.add(id)
        return
      }

      if (isNarrow) {
        const textNode = [...name.childNodes].find(
          (node) => node.nodeType === Node.TEXT_NODE,
        )
        if (!textNode) return

        const range = document.createRange()
        range.selectNodeContents(textNode)
        const lineTops = new Set(
          [...range.getClientRects()].map((rect) => Math.round(rect.top)),
        )
        if (lineTops.size > 2) overflowingKeys.add(id)
        return
      }

      if (
        name.scrollWidth > name.clientWidth + 1 ||
        name.scrollHeight > name.clientHeight + 1
      ) {
        overflowingKeys.add(id)
      }
    })

  const previousKeys = selectedNameOverflowKeys.value
  if (
    previousKeys.size !== overflowingKeys.size ||
    [...previousKeys].some((key) => !overflowingKeys.has(key))
  ) {
    selectedNameOverflowKeys.value = overflowingKeys
  }
}

function updateTreeHeight() {
  const container = treeContainerRef.value
  if (!container) return

  const nextHeight = Math.floor(container.clientHeight)
  if (nextHeight > 0 && treeHeight.value !== nextHeight) {
    treeHeight.value = nextHeight
  }
}

function updateSelectedScrollHint() {
  const list = selectedListRef.value
  if (!list) return

  const listBottom = list.getBoundingClientRect().bottom
  const items = list.querySelectorAll<HTMLElement>(
    '.lx-transfer-panel__selected-item',
  )
  let firstRemainingIndex = 0
  while (firstRemainingIndex < items.length) {
    const item = items[firstRemainingIndex]
    if (!item || item.getBoundingClientRect().bottom > listBottom + 1) break
    firstRemainingIndex += 1
  }
  const remainingCount =
    firstRemainingIndex < items.length ? items.length - firstRemainingIndex : 0
  const hasOverflow = list.scrollHeight > list.clientHeight + 1

  remainingSelectedCount.value = remainingCount
  hasSelectedOverflow.value = hasOverflow
  canScrollSelectedMore.value = hasOverflow && remainingCount > 0
}

function updateSelectedNameExpansion(id: string | number, event: Event) {
  const details = event.currentTarget
  if (!(details instanceof HTMLDetailsElement)) return

  const expandedKeys = new Set(expandedSelectedNameKeys.value)
  if (details.open) expandedKeys.add(id)
  else expandedKeys.delete(id)
  expandedSelectedNameKeys.value = expandedKeys

  void nextTick(() => {
    if (details.open) {
      window.requestAnimationFrame(() => {
        const list = selectedListRef.value
        if (!list || !details.isConnected || !details.open) return

        const listBounds = list.getBoundingClientRect()
        const item = details.closest<HTMLElement>(
          '.lx-transfer-panel__selected-item',
        )
        const itemBounds = item?.getBoundingClientRect()
        const visibleTop = listBounds.top + list.clientTop
        const visibleBottom = visibleTop + list.clientHeight
        const visibleHeight = visibleBottom - visibleTop
        const scrollPadding = Math.min(
          8,
          Math.max(0, (visibleHeight - (itemBounds?.height ?? 0)) / 2),
        )

        if (itemBounds && itemBounds.top < visibleTop + scrollPadding) {
          list.scrollTop -= visibleTop + scrollPadding - itemBounds.top
        } else if (
          itemBounds &&
          itemBounds.bottom > visibleBottom - scrollPadding
        ) {
          list.scrollTop += itemBounds.bottom - visibleBottom + scrollPadding
        }
      })
    }

    updateSelectedListObserverTargets()
    updateSelectedScrollHint()
  })
}

function syncSelectedScrollHint() {
  updateSelectedListObserverTargets()
  updateSelectedScrollHint()
  updateSelectedNameOverflow()
}

watch(visibleSelectedNodes, syncSelectedScrollHint, {
  deep: true,
  flush: 'post',
})

function updateResponsiveTreeSize() {
  // 窄屏固定为 64px，让触控区、两行名称和单行元数据与虚拟滚动行高一致。
  treeItemSize.value = window.innerWidth <= 420 ? 64 : 32
}

function handleMobileSwitcherFocusIn() {
  mobileSwitcherHadFocus = true
}

function handleMobileSwitcherFocusOut(event: FocusEvent) {
  const switcher = event.currentTarget
  if (
    switcher instanceof HTMLElement &&
    event.relatedTarget instanceof Node &&
    switcher.contains(event.relatedTarget)
  ) {
    return
  }

  if (window.innerWidth <= MOBILE_PANEL_BREAKPOINT) {
    mobileSwitcherHadFocus = false
  }
}

function handleWindowResize() {
  const currentWidth = window.innerWidth
  const crossedToDesktop =
    previousViewportWidth !== null &&
    previousViewportWidth <= MOBILE_PANEL_BREAKPOINT &&
    currentWidth > MOBILE_PANEL_BREAKPOINT

  if (crossedToDesktop && mobileSwitcherHadFocus) {
    mobileSwitcherHadFocus = false
    const activePanelFilter =
      mobilePanel.value === 'source'
        ? sourceFilterInput.value
        : selectedFilterInput.value
    activePanelFilter?.focus()
  }

  previousViewportWidth = currentWidth
  updateResponsiveTreeSize()
  updateTreeHeight()
  updateSelectedScrollHint()
  updateSelectedNameOverflow()
}

onMounted(() => {
  previousViewportWidth = window.innerWidth
  updateResponsiveTreeSize()
  if (typeof ResizeObserver !== 'undefined') {
    selectedListResizeObserver = new ResizeObserver(() => {
      updateSelectedScrollHint()
      updateSelectedNameOverflow()
    })
    updateSelectedListObserverTargets()
    treeResizeObserver = new ResizeObserver(updateTreeHeight)
    if (treeContainerRef.value)
      treeResizeObserver.observe(treeContainerRef.value)
  }
  window.addEventListener('resize', handleWindowResize, { passive: true })
  updateTreeHeight()
  updateSelectedScrollHint()
  updateSelectedNameOverflow()
})

onBeforeUnmount(() => {
  selectedListResizeObserver?.disconnect()
  treeResizeObserver?.disconnect()
  window.removeEventListener('resize', handleWindowResize)
})

watch(
  selectedNameOverflowKeys,
  () => {
    updateSelectedListObserverTargets()
    updateSelectedScrollHint()
  },
  { flush: 'post' },
)

function selectionMatchesSnapshot(
  snapshot: (string | number)[],
  revision: number,
) {
  return (
    selectionRevision.value === revision &&
    sameKeySequence(props.modelValue, snapshot)
  )
}

function sameKeySequence(
  first: readonly (string | number)[],
  second: readonly (string | number)[],
) {
  return (
    first.length === second.length &&
    first.every((key, index) => key === second[index])
  )
}

function update(keys: (string | number)[]) {
  const unique = [...new Set(keys)].filter(
    (key) =>
      props.modelValue.includes(key) ||
      (nodeMap.value.has(key) && !nodeMap.value.get(key)?.disabled),
  )
  if (
    maxCount.value !== null &&
    unique.length > maxCount.value &&
    unique.length > selectedKeySet.value.size
  ) {
    lxMessage.warning(`最多可选择 ${maxCount.value} 项`)
    return
  }
  if (
    unique.length === props.modelValue.length &&
    unique.every((key, index) => key === props.modelValue[index])
  )
    return
  emit('update:modelValue', unique)
  emit(
    'change',
    unique,
    unique
      .map((key) => nodeMap.value.get(key))
      .filter((node): node is LxTransferPanelNode => Boolean(node)),
  )
}

function onTreeChange(keys: (string | number)[]) {
  const retainedKeys = props.modelValue.filter((key) => {
    const node = nodeMap.value.get(key)
    return !node || node.disabled
  })
  update([...keys, ...retainedKeys])
}

function selectAll() {
  update([...props.modelValue, ...allKeys.value])
}

function invertAll() {
  const retainedKeys = props.modelValue.filter((key) => {
    const node = nodeMap.value.get(key)
    return !node || node.disabled
  })
  const invertedKeys = allKeys.value.filter(
    (key) => !selectedKeySet.value.has(key),
  )
  update([...retainedKeys, ...invertedKeys])
}

const canInvertAll = computed(() => {
  if (!allKeys.value.length) return false
  if (maxCount.value === null) return true

  const retainedKeys = props.modelValue.filter((key) => {
    const node = nodeMap.value.get(key)
    return !node || node.disabled
  })
  const invertedKeys = allKeys.value.filter(
    (key) => !selectedKeySet.value.has(key),
  )
  const nextCount = retainedKeys.length + invertedKeys.length
  return nextCount <= maxCount.value || nextCount <= selectedKeySet.value.size
})

function selectFiltered() {
  update([...props.modelValue, ...sourceFilterMatches.value])
}

function invertFilteredSelection() {
  const filteredKeys = new Set(sourceFilterMatches.value)
  const retainedKeys = props.modelValue.filter((key) => !filteredKeys.has(key))
  const nextKeys = sourceFilterMatches.value.filter(
    (key) => !selectedKeySet.value.has(key),
  )
  update([...retainedKeys, ...nextKeys])
}

const canInvertFiltered = computed(() => {
  if (!sourceFilterMatches.value.length) return false
  if (maxCount.value === null) return true
  const filteredKeys = new Set(sourceFilterMatches.value)
  const nextKeys = [
    ...props.modelValue.filter((key) => !filteredKeys.has(key)),
    ...sourceFilterMatches.value.filter(
      (key) => !selectedKeySet.value.has(key),
    ),
  ]
  return (
    nextKeys.length <= maxCount.value ||
    nextKeys.length <= selectedKeySet.value.size
  )
})

function localThemeClass(event: MouseEvent) {
  return event.currentTarget instanceof Element &&
    event.currentTarget.closest('.lx-theme-hud')
    ? 'lx-theme-hud'
    : undefined
}

function clearAll(event: MouseEvent) {
  if (!props.modelValue.length) return
  const selectedKeysSnapshot = [...props.modelValue]
  const selectedKeysRevision = selectionRevision.value
  const unloadedCount = selectedNodes.value.filter(isUnloaded).length
  const customClass = localThemeClass(event)
  const clearSelectedNodes = () => {
    update([])
    emit('clear-all')
    mobilePanel.value = 'selected'
    nextTick(() => selectedListRef.value?.focus())
  }
  lxConfirm({
    title: `清空${props.titles[1]}`,
    message: unloadedCount
      ? `已选项中包含 ${unloadedCount} 个当前树中未加载的项目，无法核对其名称。确认移除全部 ${selectedKeysSnapshot.length} 项吗？`
      : `确认移除全部 ${selectedKeysSnapshot.length} 项已选资源吗？清空后列表将立即更新。`,
    confirmText: '确认清空',
    danger: true,
    ...(customClass ? { customClass } : {}),
  }).then((confirmed) => {
    if (!confirmed) return

    if (!selectionMatchesSnapshot(selectedKeysSnapshot, selectedKeysRevision)) {
      lxMessage.warning('已选授权在确认期间发生变化，请检查后重新清空')
      return
    }

    clearSelectedNodes()
  })
}

function clearSourceFilter() {
  sourceFilter.value = ''
  nextTick(() => sourceFilterInput.value?.focus())
}

function clearSelectedFilter() {
  selectedFilter.value = ''
  nextTick(() => selectedFilterInput.value?.focus())
}

function isUnloaded(node: LxTransferPanelNode) {
  return !nodeMap.value.has(node.id)
}

function setSelectedRemoveButton(id: string | number, element: unknown) {
  if (element instanceof HTMLButtonElement) {
    selectedRemoveButtons.set(id, element)
    return
  }
  selectedRemoveButtons.delete(id)
}

function remove(node: LxTransferPanelNode, event: MouseEvent) {
  const removeSelectedNode = () => {
    const currentVisibleNodes = [...visibleSelectedNodes.value]
    const removedIndex = currentVisibleNodes.findIndex(
      (item) => item.id === node.id,
    )
    const focusTargetId =
      currentVisibleNodes[removedIndex + 1]?.id ??
      currentVisibleNodes[removedIndex - 1]?.id

    // 先把焦点移到稳定容器，避免删除按钮卸载后焦点退回文档。
    selectedListRef.value?.focus()
    update(props.modelValue.filter((value) => value !== node.id))
    nextTick(() => {
      if (props.modelValue.includes(node.id)) return

      const targetButton =
        focusTargetId === undefined
          ? undefined
          : selectedRemoveButtons.get(focusTargetId)
      if (targetButton) targetButton.focus()
      else selectedListRef.value?.focus()
    })
  }

  if (!isUnloaded(node)) {
    removeSelectedNode()
    return
  }

  const selectedKeysSnapshot = [...props.modelValue]
  const selectedKeysRevision = selectionRevision.value
  const customClass = localThemeClass(event)
  lxConfirm({
    title: '移除未加载的授权',
    message: `“${node.label}”当前不在已加载的树中，键值为 ${String(node.id)}。确认从已选授权中移除吗？`,
    confirmText: '移除授权',
    danger: true,
    ...(customClass ? { customClass } : {}),
  }).then((confirmed) => {
    if (!confirmed) return
    if (!selectionMatchesSnapshot(selectedKeysSnapshot, selectedKeysRevision)) {
      lxMessage.warning('已选授权在确认期间发生变化，请检查后重新移除')
      return
    }
    removeSelectedNode()
  })
}

function updateInherit(value: string | number | boolean) {
  if (!inheritChildDescription.value) return

  const next = value === true
  inherit.value = next
  emit('update:inheritChild', next)
}

function applySourceFilter(value: string) {
  const tree = sourceTreeRef.value
  if (tree && typeof tree.filter === 'function') tree.filter(value)
}

function codeOf(node: LxVirtualTreeNode): string {
  return typeof node.code === 'string' ? node.code : ''
}

function statusOf(node: LxVirtualTreeNode): string {
  return typeof node.status === 'string' ? node.status : ''
}

function isTransferStatusTone(
  value: unknown,
): value is LxTransferPanelStatusTone {
  return (
    typeof value === 'string' &&
    transferStatusTones.includes(value as LxTransferPanelStatusTone)
  )
}

function statusToneOf(node: LxVirtualTreeNode): LxTransferPanelStatusTone {
  if (isTransferStatusTone(node.statusTone)) return node.statusTone
  const status = statusOf(node)
  return isTransferStatusTone(status) ? status : 'offline'
}

function statusLabelOf(node: LxVirtualTreeNode): string {
  const status = statusOf(node)
  return Object.prototype.hasOwnProperty.call(statusLabels, status)
    ? statusLabels[status]
    : status
}
</script>

<template>
  <section
    class="lx-transfer-panel"
    data-lx-transfer-layout="5:2:5"
    :style="panelStyle"
  >
    <div
      class="lx-transfer-panel__mobile-switch"
      role="group"
      aria-label="切换穿梭面板"
      @focusin="handleMobileSwitcherFocusIn"
      @focusout="handleMobileSwitcherFocusOut"
    >
      <button
        type="button"
        data-testid="mobile-source-panel"
        :aria-label="`显示${titles[0]}，当前树中 ${missingKeys.length} 个待选节点`"
        :aria-controls="sourcePanelId"
        :aria-pressed="mobilePanel === 'source'"
        :title="titles[0]"
        @click="mobilePanel = 'source'"
      >
        <span class="lx-transfer-panel__mobile-title">{{ titles[0] }}</span>
        <span class="lx-transfer-panel__mobile-short-title">待选</span>
        <span class="lx-transfer-panel__mobile-count">{{
          missingKeys.length
        }}</span>
      </button>
      <button
        type="button"
        data-testid="mobile-selected-panel"
        :aria-label="`显示${titles[1]}，${modelValue.length} 项已选`"
        :aria-controls="selectedPanelId"
        :aria-pressed="mobilePanel === 'selected'"
        :title="titles[1]"
        @click="mobilePanel = 'selected'"
      >
        <span class="lx-transfer-panel__mobile-title">{{ titles[1] }}</span>
        <span class="lx-transfer-panel__mobile-short-title">已选</span>
        <span class="lx-transfer-panel__mobile-count">{{
          modelValue.length
        }}</span>
      </button>
    </div>

    <div
      class="lx-transfer-panel__panel"
      :id="sourcePanelId"
      :class="{ 'is-mobile-hidden': mobilePanel !== 'source' }"
      role="group"
      :aria-labelledby="sourceTitleId"
      @focusin="mobilePanel = 'source'"
    >
      <header
        class="lx-transfer-panel__header lx-transfer-panel__header--source"
      >
        <div
          class="lx-transfer-panel__header-main"
          :class="{ 'has-filter-actions': sourceFilter.trim() }"
        >
          <span
            :id="sourceTitleId"
            class="lx-transfer-panel__title"
            :title="titles[0]"
            ><LxIcon name="folder" :size="16" />{{ titles[0] }}</span
          >
          <span class="lx-transfer-panel__header-actions">
            <template v-if="sourceFilter.trim()">
              <button
                type="button"
                aria-label="全选筛选结果"
                :aria-describedby="sourceActionsStatusId"
                :disabled="!canSelectFiltered"
                title="选择名称匹配筛选文本的节点"
                @click="selectFiltered"
              >
                全选筛选结果
              </button>
              <span aria-hidden="true">/</span>
              <button
                type="button"
                aria-label="反选筛选结果"
                :aria-describedby="sourceActionsStatusId"
                :disabled="!canInvertFiltered"
                title="只反转名称或部门编码匹配筛选文本的可选节点"
                @click="invertFilteredSelection"
              >
                反选筛选结果
              </button>
            </template>
          </span>
        </div>
        <details class="lx-transfer-panel__scope-actions">
          <summary
            aria-label="更多反选选项，包含筛选隐藏项"
            title="展开更多反选选项，包括当前筛选隐藏项"
          >
            更多反选选项
            <LxIcon
              class="lx-transfer-panel__scope-actions-icon"
              name="chevron-down"
              :size="14"
              aria-hidden="true"
            />
          </summary>
          <div class="lx-transfer-panel__scope-action-content">
            <p
              :id="invertAllDescriptionId"
              class="lx-transfer-panel__scope-action-description"
            >
              包括筛选隐藏项；不可选项和未加载到当前组织树的已选项保持不变。
            </p>
            <button
              type="button"
              aria-label="反选本树可选项"
              :aria-describedby="invertAllDescriptionId"
              title="反转当前树中全部可选项，保留不可选项和未加载到当前组织树的已选项"
              :disabled="!canInvertAll"
              @click="invertAll"
            >
              反选本树可选项
            </button>
          </div>
        </details>
        <span
          v-if="sourceFilter.trim()"
          :id="sourceActionsStatusId"
          class="lx-transfer-panel__header-status"
          role="status"
          aria-live="polite"
        >
          {{ filteredActionsStatus }}
        </span>
      </header>
      <div class="lx-transfer-panel__filter lx-transfer-panel__filter--source">
        <LxIcon name="search" :size="14" />
        <input
          ref="sourceFilterInput"
          v-model="sourceFilter"
          type="text"
          inputmode="search"
          :placeholder="filterPlaceholders[0]"
          aria-label="按机构名称或部门编码筛选待选节点"
        />
        <button
          v-if="sourceFilter"
          type="button"
          aria-label="清除待选节点筛选"
          @click="clearSourceFilter"
        >
          <LxIcon name="x" :size="14" />
        </button>
      </div>
      <div ref="treeContainerRef" class="lx-transfer-panel__tree">
        <LxVirtualTree
          ref="sourceTreeRef"
          :data="treeData"
          :height="treeHeight"
          :item-size="treeItemSize"
          :model-value="modelValue"
          :default-expanded-keys="defaultExpandedKeys"
          aria-label="待选资源树"
          :aria-describedby="keyboardHintId"
          show-checkbox
          check-strictly
          :filterable="false"
          :filter-method="matchesSourceNode"
          @update:model-value="onTreeChange"
        >
          <template #node="{ node }">
            <span class="lx-transfer-panel__node-meta">
              <span
                v-if="codeOf(node)"
                class="lx-transfer-panel__node-code"
                :title="codeOf(node)"
                :data-lx-transfer-code="codeOf(node)"
              >
                {{ codeOf(node) }}
              </span>
              <span
                v-if="statusLabelOf(node)"
                class="lx-transfer-panel__node-status"
                :class="`is-${statusToneOf(node)}`"
                :data-status-tone="statusToneOf(node)"
                :title="statusLabelOf(node)"
              >
                <span
                  class="lx-transfer-panel__status-dot"
                  aria-hidden="true"
                />
                {{ statusLabelOf(node) }}
              </span>
            </span>
          </template>
        </LxVirtualTree>
      </div>
      <footer class="lx-transfer-panel__caption">
        <span data-testid="tree-node-count"
          >树节点总数：{{ nodeMap.size.toLocaleString('zh-CN') }} 个</span
        >
        <span :id="keyboardHintId" class="lx-transfer-panel__keyboard-hint">
          键盘：方向键移动或展开，Space / Enter 选择
        </span>
      </footer>
    </div>

    <div
      class="lx-transfer-panel__controls"
      role="group"
      aria-label="穿梭批量操作"
    >
      <div class="lx-transfer-panel__controls-action">
        <button
          type="button"
          :title="canSelectAll ? '全部加入' : selectAllDisabledReason"
          aria-label="全部加入"
          :aria-describedby="
            selectAllDisabledReason ? selectAllStatusId : undefined
          "
          :disabled="!canSelectAll"
          @click="selectAll"
        >
          <LxIcon name="arrow-right" :size="18" />
        </button>
        <span
          class="lx-transfer-panel__controls-label lx-transfer-panel__controls-label--add"
          aria-hidden="true"
        >
          全部加入
        </span>
        <span
          v-if="selectAllDisabledReason"
          class="lx-transfer-panel__controls-hint"
          data-testid="select-all-compact-hint"
          aria-hidden="true"
        >
          {{ selectAllCompactHint }}
        </span>
        <span
          v-if="selectAllDisabledReason"
          :id="selectAllStatusId"
          class="lx-transfer-panel__visually-hidden"
          data-testid="select-all-disabled-reason"
          role="status"
          aria-live="polite"
        >
          {{ selectAllDisabledReason }}
        </span>
      </div>
      <div class="lx-transfer-panel__controls-action">
        <button
          type="button"
          title="全部移除"
          aria-label="全部移除"
          :disabled="!modelValue.length"
          @click="clearAll"
        >
          <LxIcon name="arrow-left" :size="18" />
        </button>
        <span
          class="lx-transfer-panel__controls-label lx-transfer-panel__controls-label--remove"
          aria-hidden="true"
        >
          全部移除
        </span>
      </div>
    </div>

    <div
      class="lx-transfer-panel__panel"
      :id="selectedPanelId"
      :class="{ 'is-mobile-hidden': mobilePanel !== 'selected' }"
      role="group"
      :aria-labelledby="selectedTitleId"
      @focusin="mobilePanel = 'selected'"
    >
      <header class="lx-transfer-panel__header">
        <span
          :id="selectedTitleId"
          class="lx-transfer-panel__title"
          :title="titles[1]"
          ><LxIcon name="check" :size="16" />{{ titles[1] }}</span
        >
      </header>
      <div class="lx-transfer-panel__filter">
        <LxIcon name="filter" :size="14" />
        <input
          ref="selectedFilterInput"
          v-model="selectedFilter"
          type="text"
          inputmode="search"
          :placeholder="filterPlaceholders[1]"
          aria-label="在已选项中检索"
        />
        <button
          v-if="selectedFilter"
          type="button"
          aria-label="清除已选项筛选"
          title="清除已选项筛选"
          @click="clearSelectedFilter"
        >
          <LxIcon name="x" :size="14" />
        </button>
      </div>
      <div class="lx-transfer-panel__selected-wrap">
        <ul
          ref="selectedListRef"
          class="lx-transfer-panel__selected"
          :class="{ 'has-overflow': hasSelectedOverflow }"
          :aria-describedby="
            canScrollSelectedMore ? selectedScrollHintId : undefined
          "
          :aria-label="`已选资源列表，当前显示 ${visibleSelectedNodes.length} 项，共 ${modelValue.length} 项`"
          tabindex="0"
          @scroll="updateSelectedScrollHint"
        >
          <li
            v-for="node in visibleSelectedNodes"
            :key="node.id"
            class="lx-transfer-panel__selected-item"
            :class="{
              'is-name-expanded': expandedSelectedNameKeys.has(node.id),
            }"
          >
            <div
              class="lx-transfer-panel__selected-main"
              :class="{
                'is-unloaded': isUnloaded(node),
                'is-name-expanded': expandedSelectedNameKeys.has(node.id),
              }"
            >
              <details
                v-if="selectedNameOverflowKeys.has(node.id)"
                class="lx-transfer-panel__selected-name-disclosure"
                :class="{ 'is-unloaded': isUnloaded(node) }"
                :open="expandedSelectedNameKeys.has(node.id)"
                @toggle="updateSelectedNameExpansion(node.id, $event)"
              >
                <summary
                  :aria-expanded="expandedSelectedNameKeys.has(node.id)"
                  :aria-label="`${expandedSelectedNameKeys.has(node.id) ? '收起' : '查看'}完整名称：${node.label}`"
                  :title="
                    expandedSelectedNameKeys.has(node.id)
                      ? '使用 Enter 或空格收起完整名称'
                      : '使用 Enter 或空格查看完整名称'
                  "
                >
                  <span
                    class="lx-transfer-panel__selected-name"
                    :class="{ 'is-unloaded': isUnloaded(node) }"
                    :data-selected-name-key="selectedNameKey(node.id)"
                    :title="node.label"
                  >
                    <span
                      v-if="statusOf(node) && !isUnloaded(node)"
                      class="lx-transfer-panel__status-dot"
                      :class="`is-${statusToneOf(node)}`"
                      aria-hidden="true"
                    />
                    {{ node.label }}
                  </span>
                  <span class="lx-transfer-panel__selected-name-collapse"
                    >收起完整名称</span
                  >
                  <span
                    class="lx-transfer-panel__selected-name-icon"
                    aria-hidden="true"
                  >
                    <LxIcon name="chevron-down" :size="14" />
                  </span>
                </summary>
                <span class="lx-transfer-panel__selected-name-full">
                  {{ node.label }}
                </span>
              </details>
              <span
                v-else
                class="lx-transfer-panel__selected-name"
                :class="{ 'is-unloaded': isUnloaded(node) }"
                :data-selected-name-key="selectedNameKey(node.id)"
                :title="node.label"
              >
                <span
                  v-if="statusOf(node) && !isUnloaded(node)"
                  class="lx-transfer-panel__status-dot"
                  :class="`is-${statusToneOf(node)}`"
                  aria-hidden="true"
                />
                {{ node.label }}
              </span>
              <span
                v-if="codeOf(node)"
                class="lx-transfer-panel__node-code"
                :title="codeOf(node)"
                :data-lx-transfer-code="codeOf(node)"
              >
                {{ codeOf(node) }}
              </span>
              <span
                v-if="statusLabelOf(node)"
                class="lx-transfer-panel__node-status"
                :class="`is-${statusToneOf(node)}`"
                :data-status-tone="statusToneOf(node)"
                :title="statusLabelOf(node)"
              >
                {{ statusLabelOf(node) }}
              </span>
              <span
                v-if="isUnloaded(node)"
                class="lx-transfer-panel__node-unloaded"
                :title="`节点未加载，键值 ${String(node.id)}`"
              >
                节点未加载
              </span>
              <code
                v-if="isUnloaded(node)"
                class="lx-transfer-panel__node-key"
                :title="`节点键值 ${String(node.id)}`"
              >
                {{ node.id }}
              </code>
            </div>
            <button
              type="button"
              :ref="(element) => setSelectedRemoveButton(node.id, element)"
              :aria-label="`移除 ${node.label}`"
              @click="remove(node, $event)"
            >
              <LxIcon name="x" :size="14" />
            </button>
          </li>
          <li
            v-if="!visibleSelectedNodes.length"
            class="lx-transfer-panel__empty"
          >
            {{
              selectedFilter.trim()
                ? '未找到匹配的已选项'
                : '暂无分配权限，请在左侧勾选'
            }}
          </li>
        </ul>
        <div
          v-if="canScrollSelectedMore"
          :id="selectedScrollHintId"
          class="lx-transfer-panel__selected-scroll-hint"
          data-testid="selected-scroll-hint"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <LxIcon name="arrow-down" :size="14" />
          <span
            >下方还有 {{ remainingSelectedCount }} 项，向下滚动查看更多</span
          >
        </div>
      </div>
      <footer class="lx-transfer-panel__footer">
        <span class="lx-transfer-panel__selected-count">
          已选 <strong>{{ modelValue.length }}</strong> 项
        </span>
        <div
          ref="inheritCheckboxContainer"
          class="lx-transfer-panel__inherit-control"
        >
          <LxCheckbox
            :model-value="inherit"
            :disabled="!inheritChildDescription"
            @update:model-value="updateInherit"
          >
            保留下级继承授权
          </LxCheckbox>
          <span
            :id="inheritChildDescriptionId"
            class="lx-transfer-panel__inherit-description"
            :class="{ 'is-missing': !inheritChildDescription }"
          >
            {{
              inheritChildDescription ||
              '尚未配置经确认的具体继承范围说明，当前不可更改此选项。'
            }}
          </span>
        </div>
      </footer>
    </div>
  </section>
</template>

<style scoped>
.lx-transfer-panel {
  display: grid;
  min-width: 0;
  grid-template-columns: minmax(0, 5fr) minmax(72px, 2fr) minmax(0, 5fr);
  align-items: stretch;
  gap: var(--lx-space-md);
}

.lx-transfer-panel__mobile-switch {
  display: none;
}

.lx-transfer-panel__mobile-short-title {
  display: none;
}

.lx-transfer-panel__selected-count {
  flex: 0 0 auto;
  line-height: 14px;
  white-space: nowrap;
}

.lx-transfer-panel__keyboard-hint {
  display: none;
}

.lx-transfer-panel__tree:focus-within
  + .lx-transfer-panel__caption
  .lx-transfer-panel__keyboard-hint {
  display: block;
  color: var(--lx-text-secondary-strong);
}

.lx-transfer-panel__panel {
  display: grid;
  grid-template-rows: minmax(36px, auto) 45px minmax(32px, 1fr) minmax(
      32px,
      auto
    );
  min-width: 0;
  height: var(--lx-transfer-panel-height);
  box-sizing: border-box;
  overflow: visible;
  border: 1px solid var(--lx-border);
  border-radius: var(--lx-radius-md);
  background: var(--lx-bg-card);
}

.lx-transfer-panel__header,
.lx-transfer-panel__caption,
.lx-transfer-panel__footer {
  display: flex;
  min-width: 0;
  box-sizing: border-box;
  align-items: center;
  justify-content: space-between;
  gap: var(--lx-space-sm);
  padding: 0 var(--lx-space-md);
  background: var(--lx-bg-table-header);
}

.lx-transfer-panel__header {
  display: flex;
  min-height: 36px;
  height: auto;
  flex-direction: column;
  align-items: stretch;
  justify-content: center;
  gap: 2px;
  padding-block: 4px;
  border-bottom: 1px solid var(--lx-border-light);
}

.lx-transfer-panel__header--source {
  position: relative;
  z-index: 2;
}

@media (min-width: 768px) {
  .lx-transfer-panel__header--source {
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
    padding-block: 0;
  }

  .lx-transfer-panel__header--source > .lx-transfer-panel__header-main {
    flex: 1 1 0;
  }

  .lx-transfer-panel__header--source
    > .lx-transfer-panel__header-main.has-filter-actions {
    flex-basis: 100%;
  }

  .lx-transfer-panel__header--source
    > .lx-transfer-panel__header-main:not(.has-filter-actions)
    .lx-transfer-panel__title {
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .lx-transfer-panel__header--source > .lx-transfer-panel__scope-actions {
    align-self: center;
  }
}

.lx-transfer-panel__header-main {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: var(--lx-space-sm);
}

.lx-transfer-panel__header-main.has-filter-actions {
  flex-wrap: wrap;
}

.lx-transfer-panel__title,
.lx-transfer-panel__selected-name {
  display: inline-flex;
  min-width: 0;
  align-items: center;
  gap: var(--lx-space-xs);
}

.lx-transfer-panel__title {
  flex: 1 1 auto;
  overflow: hidden;
  color: var(--lx-text-primary);
  overflow-wrap: anywhere;
  text-overflow: clip;
  white-space: normal;
  font-size: 13px;
  font-weight: 600;
}

.lx-transfer-panel__header-actions {
  display: inline-flex;
  flex: 0 0 auto;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--lx-space-xs);
  color: var(--lx-text-secondary);
  font-size: 12px;
  white-space: normal;
}

.lx-transfer-panel__header-main.has-filter-actions
  .lx-transfer-panel__header-actions {
  flex: 1 1 100%;
  order: 2;
  justify-content: flex-start;
}

.lx-transfer-panel__header-status {
  min-width: 0;
  color: var(--lx-text-secondary-strong);
  font-size: 11px;
  line-height: 14px;
  overflow-wrap: anywhere;
}

.lx-transfer-panel__header-actions button,
.lx-transfer-panel__scope-action-content button {
  display: inline-flex;
  flex: 0 0 auto;
  min-height: 28px;
  align-items: center;
  gap: var(--lx-space-xs);
  padding: 0 var(--lx-space-xs);
  border: 0;
  background: transparent;
  color: var(--lx-color-primary);
  cursor: pointer;
  font: inherit;
  white-space: nowrap;
}

.lx-transfer-panel__scope-actions {
  align-self: flex-end;
  flex: 0 0 auto;
  max-width: 100%;
}

.lx-transfer-panel__scope-actions[open] {
  align-self: flex-end;
}

.lx-transfer-panel__scope-actions summary {
  display: inline-flex;
  min-height: 28px;
  align-items: center;
  gap: var(--lx-space-xs);
  margin: 0;
  padding-inline: var(--lx-space-xs);
  color: var(--lx-color-primary);
  cursor: pointer;
  list-style: none;
  white-space: nowrap;
}

.lx-transfer-panel__scope-actions summary::-webkit-details-marker {
  display: none;
}

.lx-transfer-panel__scope-actions summary:hover {
  background: var(--lx-bg-card-hover);
}

.lx-transfer-panel__scope-actions summary:focus-visible {
  outline: 2px solid var(--lx-color-primary);
  outline-offset: 2px;
}

.lx-transfer-panel__scope-actions-icon {
  flex: 0 0 auto;
}

.lx-transfer-panel__scope-actions[open] .lx-transfer-panel__scope-actions-icon {
  transform: rotate(180deg);
}

.lx-transfer-panel__scope-action-content {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  width: min(360px, calc(100% - 16px));
  box-sizing: border-box;
  gap: var(--lx-space-sm);
  padding: var(--lx-space-md);
  border: 1px solid var(--lx-border);
  border-radius: var(--lx-radius-sm);
  background: var(--lx-bg-card);
  box-shadow: var(--lx-shadow-pop);
}

.lx-transfer-panel__scope-action-content button {
  position: sticky;
  inset-block-start: var(--lx-space-xs);
  z-index: 1;
  align-self: start;
  grid-column: 2;
  grid-row: 1;
}

.lx-transfer-panel__scope-actions[open]
  .lx-transfer-panel__scope-action-content {
  position: absolute;
  inset-block-start: calc(100% + 46px);
  inset-inline-end: 0;
  z-index: 3;
  max-height: min(
    76px,
    max(64px, calc(var(--lx-transfer-panel-height) - 304px))
  );
  overflow: auto;
}

.lx-transfer-panel__scope-actions:not([open])
  .lx-transfer-panel__scope-action-content {
  display: none;
}

.lx-transfer-panel__scope-action-description {
  margin: 0;
  color: var(--lx-text-secondary-strong);
  font-size: 12px;
  line-height: 18px;
  overflow-wrap: anywhere;
  white-space: normal;
}

.lx-transfer-panel__header-actions button:disabled,
.lx-transfer-panel__scope-action-content button:disabled,
.lx-transfer-panel__controls button:disabled,
.lx-transfer-panel__selected-item button:disabled {
  cursor: not-allowed;
  opacity: 0.48;
}

.lx-transfer-panel__header-actions button:focus-visible,
.lx-transfer-panel__scope-action-content button:focus-visible,
.lx-transfer-panel__selected-item button:focus-visible,
.lx-transfer-panel__controls button:focus-visible {
  outline: 2px solid var(--lx-color-primary);
  outline-offset: 2px;
}

.lx-transfer-panel__panel :deep(.lx-virtual-tree) {
  min-height: 0;
  gap: 0;
}

.lx-transfer-panel__tree {
  display: flex;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.lx-transfer-panel__tree :deep(.lx-virtual-tree) {
  flex: 1 1 auto;
}

.lx-transfer-panel__tree :deep(.lx-virtual-tree__selection-info) {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  clip-path: inset(50%);
  white-space: nowrap;
}

.lx-transfer-panel__tree :deep(.lx-virtual-tree__viewport) {
  height: 100% !important;
  border-inline: 0;
  border-radius: 0;
}

.lx-transfer-panel__caption,
.lx-transfer-panel__footer {
  min-height: 32px;
  border-top: 1px solid var(--lx-border-light);
  color: var(--lx-text-secondary);
  font-size: 11px;
}

.lx-transfer-panel__caption {
  height: auto;
  min-height: 32px;
  flex-wrap: wrap;
  justify-content: flex-start;
  padding-block: var(--lx-space-xs);
}

.lx-transfer-panel__controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--lx-space-sm);
}

.lx-transfer-panel__controls-action {
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-items: center;
  gap: var(--lx-space-xs);
}

.lx-transfer-panel__controls-hint {
  max-width: 100%;
  color: var(--lx-text-secondary-strong);
  font-size: 11px;
  line-height: 14px;
  text-align: center;
  overflow-wrap: anywhere;
}

.lx-transfer-panel__controls-label {
  max-width: 100%;
  color: var(--lx-text-secondary-strong);
  font-size: 11px;
  line-height: 14px;
  text-align: center;
  white-space: nowrap;
}

.lx-transfer-panel__visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  clip-path: inset(50%);
  white-space: nowrap;
}

.lx-transfer-panel__controls button {
  display: inline-flex;
  width: 36px;
  height: 36px;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 1px solid var(--lx-border);
  border-radius: var(--lx-radius-md);
  background: var(--lx-bg-card);
  color: var(--lx-text-regular);
  cursor: pointer;
}

.lx-transfer-panel__controls button:not(:disabled):hover,
.lx-transfer-panel__selected-item button:not(:disabled):hover {
  border-color: var(--lx-color-primary);
  color: var(--lx-color-primary);
}

.lx-transfer-panel__controls
  .lx-transfer-panel__controls-action
  > button:not(:disabled) {
  border-color: var(--lx-color-primary);
  background: var(--lx-color-primary);
  color: var(--lx-color-on-primary);
}

.lx-transfer-panel__controls
  .lx-transfer-panel__controls-action
  > button:not(:disabled):hover {
  border-color: var(--lx-color-primary-hover);
  background: var(--lx-color-primary-hover);
  color: var(--lx-color-on-primary);
}

.lx-transfer-panel__inherit-control {
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--lx-space-xs);
}

.lx-transfer-panel__inherit-description {
  max-width: min(34ch, 100%);
  color: var(--lx-text-secondary-strong);
  font-size: 12px;
  line-height: 1.45;
  text-align: end;
  overflow-wrap: anywhere;
}

.lx-transfer-panel__inherit-description.is-missing {
  color: var(--lx-color-warning-text);
}

.lx-transfer-panel__filter {
  display: flex;
  min-width: 0;
  height: 45px;
  box-sizing: border-box;
  align-items: center;
  gap: var(--lx-space-xs);
  margin: 0;
  padding: var(--lx-space-sm);
  border: 0;
  border-bottom: 1px solid var(--lx-border-light);
  color: var(--lx-text-secondary);
}

.lx-transfer-panel__filter:focus-within {
  background: var(--lx-bg-card-hover);
  box-shadow: var(--lx-focus-ring);
}

.lx-transfer-panel__filter input {
  width: 100%;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--lx-text-regular);
  font-size: 12px;
}

.lx-transfer-panel__filter button {
  display: inline-flex;
  width: 32px;
  height: 32px;
  flex: 0 0 32px;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  border-radius: var(--lx-radius-sm);
  background: transparent;
  color: var(--lx-text-secondary);
  cursor: pointer;
}

.lx-transfer-panel__filter button:hover {
  background: var(--lx-bg-card-hover);
  color: var(--lx-text-primary);
}

.lx-transfer-panel__filter button:focus-visible {
  outline: 2px solid var(--lx-color-primary);
  outline-offset: 1px;
}

.lx-transfer-panel__selected-wrap {
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.lx-transfer-panel__selected {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  gap: var(--lx-space-xs);
  overflow: auto;
  margin: 0;
  padding: var(--lx-space-sm);
  list-style: none;
  scrollbar-color: var(--lx-border) transparent;
  scrollbar-width: thin;
}

.lx-transfer-panel__selected.has-overflow {
  padding-bottom: var(--lx-space-sm);
}

.lx-transfer-panel__selected-scroll-hint {
  display: flex;
  flex: 0 0 auto;
  min-height: 28px;
  align-items: center;
  justify-content: center;
  gap: var(--lx-space-xs);
  margin: 0 var(--lx-space-sm) var(--lx-space-xs);
  padding: 0 var(--lx-space-xs);
  text-align: center;
  border: 1px solid var(--lx-border-light);
  border-radius: var(--lx-radius-sm);
  background: var(--lx-bg-card);
  color: var(--lx-text-secondary-strong);
  font-size: 12px;
  line-height: 1.35;
  overflow-wrap: anywhere;
  pointer-events: none;
}

.lx-transfer-panel__selected:focus-visible {
  outline: 2px solid var(--lx-color-primary);
  outline-offset: -2px;
}

.lx-transfer-panel__selected-item {
  display: flex;
  flex: 0 0 auto;
  min-width: 0;
  min-height: 32px;
  box-sizing: border-box;
  align-items: center;
  justify-content: space-between;
  gap: var(--lx-space-sm);
  padding: 0 var(--lx-space-sm);
  border: 1px solid var(--lx-border-light);
  border-radius: var(--lx-radius-md);
  background: var(--lx-bg-card-hover);
}

.lx-transfer-panel__selected-main {
  display: flex;
  min-width: 0;
  flex: 1 1 auto;
  flex-wrap: nowrap;
  align-items: center;
  gap: var(--lx-space-xs);
}

.lx-transfer-panel__selected-name-disclosure {
  min-width: 0;
  flex: 1 1 0;
}

.lx-transfer-panel__selected-name-disclosure summary {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: var(--lx-space-xs);
  margin: 0;
  cursor: pointer;
  list-style: none;
}

.lx-transfer-panel__selected-name-disclosure summary::-webkit-details-marker {
  display: none;
}

.lx-transfer-panel__selected-name-disclosure summary:focus-visible {
  border-radius: var(--lx-radius-sm);
  outline: 2px solid var(--lx-color-primary);
  outline-offset: 2px;
}

.lx-transfer-panel__selected-name {
  display: block;
  max-height: none;
  min-width: 0;
  flex: 1 1 auto;
  overflow: hidden;
  color: var(--lx-text-regular);
  font-size: 12px;
  line-height: 1.4;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.lx-transfer-panel__selected-name-collapse {
  display: none;
  flex: 1 1 auto;
  color: var(--lx-text-secondary);
  font-size: 11px;
  line-height: 1.4;
}

.lx-transfer-panel__selected-name-disclosure[open]
  summary
  .lx-transfer-panel__selected-name {
  display: none;
}

.lx-transfer-panel__selected-name-disclosure[open]
  summary
  .lx-transfer-panel__selected-name-collapse {
  display: inline;
}

.lx-transfer-panel__selected-name-icon {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  color: var(--lx-text-secondary);
}

.lx-transfer-panel__selected-name-disclosure[open]
  summary
  .lx-transfer-panel__selected-name-icon {
  transform: rotate(180deg);
}

.lx-transfer-panel__selected-name-full {
  display: block;
  margin-top: var(--lx-space-xs);
  color: var(--lx-text-regular);
  font-size: 12px;
  line-height: 1.4;
  overflow-wrap: anywhere;
}

.lx-transfer-panel__selected-main.is-unloaded {
  flex-wrap: wrap;
  align-content: center;
  row-gap: 2px;
}

.lx-transfer-panel__selected-name-disclosure.is-unloaded,
.lx-transfer-panel__selected-main.is-unloaded
  > .lx-transfer-panel__selected-name {
  flex-basis: 100%;
}

.lx-transfer-panel__node-code,
.lx-transfer-panel__node-status,
.lx-transfer-panel__node-unloaded,
.lx-transfer-panel__node-key {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 11px;
  line-height: 1.4;
}

.lx-transfer-panel__node-code {
  max-width: 96px;
  padding: 1px var(--lx-space-xs);
  border-radius: var(--lx-radius-sm);
  background: var(--lx-bg-table-header);
  color: var(--lx-text-secondary);
  font-family: var(--lx-font-mono);
}

.lx-transfer-panel__node-meta {
  display: inline-flex;
  min-width: 0;
  flex: 0 1 auto;
  align-items: center;
  gap: var(--lx-space-xs);
}

/* 部门短编码用于核对，优先保留完整宽度；状态标签仍可收缩以避免树行横向溢出。 */
.lx-transfer-panel__node-meta > .lx-transfer-panel__node-code {
  min-width: 0;
  flex: 0 0 auto;
}

.lx-transfer-panel__node-meta > .lx-transfer-panel__node-status {
  min-width: 0;
  flex: 0 1 auto;
}

.lx-transfer-panel__node-status {
  max-width: 72px;
  gap: var(--lx-space-xs);
  color: var(--lx-text-secondary);
}

.lx-transfer-panel__status-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  flex: 0 0 6px;
  border-radius: 50%;
  background: var(--lx-color-info);
}

.lx-transfer-panel__status-dot.is-online,
.lx-transfer-panel__status-dot.is-success {
  --lx-transfer-status-color: var(--lx-color-success);
}

.lx-transfer-panel__status-dot.is-processing,
.lx-transfer-panel__status-dot.is-info {
  --lx-transfer-status-color: var(--lx-color-primary-container);
}

.lx-transfer-panel__status-dot.is-busy,
.lx-transfer-panel__status-dot.is-warning {
  --lx-transfer-status-color: var(--lx-color-warning);
}

.lx-transfer-panel__status-dot.is-error {
  --lx-transfer-status-color: var(--lx-color-error);
}

.lx-transfer-panel__status-dot.is-offline {
  --lx-transfer-status-color: var(--lx-color-info);
}

.lx-transfer-panel__status-dot {
  background: var(--lx-transfer-status-color, var(--lx-color-info));
}

.lx-transfer-panel__node-status {
  color: var(--lx-text-secondary-strong);
}

.lx-transfer-panel__node-status.is-online,
.lx-transfer-panel__node-status.is-success {
  color: var(--lx-color-success-text);
}

.lx-transfer-panel__node-status.is-busy,
.lx-transfer-panel__node-status.is-warning {
  color: var(--lx-color-warning-text);
}

.lx-transfer-panel__node-status.is-error {
  color: var(--lx-color-error-strong);
}

.lx-transfer-panel__node-status.is-offline {
  color: var(--lx-text-secondary-strong);
}

.lx-transfer-panel__node-unloaded {
  padding: 1px var(--lx-space-xs);
  border-radius: var(--lx-radius-sm);
  background: var(--lx-color-warning-light);
  color: var(--lx-color-warning-text);
}

.lx-transfer-panel__node-key {
  max-width: 96px;
  padding: 1px var(--lx-space-xs);
  border-radius: var(--lx-radius-sm);
  background: var(--lx-bg-table-header);
  overflow: hidden;
  color: var(--lx-text-secondary-strong);
  font-size: 11px;
  line-height: 1.4;
  font-family: var(--lx-font-mono);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.lx-transfer-panel__tree :deep(.lx-virtual-tree__label) {
  flex: 1 1 auto;
}

.lx-transfer-panel__selected-item button {
  display: inline-flex;
  width: 24px;
  height: 24px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  border-radius: var(--lx-radius-md);
  background: transparent;
  color: var(--lx-text-secondary);
  cursor: pointer;
}

.lx-transfer-panel__selected-item button:hover {
  background: var(--lx-color-error-light);
  color: var(--lx-color-error);
}

.lx-transfer-panel__empty {
  padding: var(--lx-space-xl) var(--lx-space-sm);
  color: var(--lx-text-secondary);
  font-size: 12px;
  text-align: center;
}

.lx-transfer-panel__footer strong {
  color: var(--lx-color-primary);
  font-family: var(--lx-font-mono);
  font-variant-numeric: tabular-nums;
}

.lx-transfer-panel__footer :deep(.el-checkbox) {
  margin-inline-end: 0;
  font-size: 11px;
}

/* 页脚继承开关与树节点复选框共用 14px 视觉盒，外层仍保留紧凑行高。 */
.lx-transfer-panel__footer :deep(.el-checkbox__inner) {
  box-sizing: border-box;
  width: var(--lx-tree-checkbox-size);
  height: var(--lx-tree-checkbox-size);
}

@media (max-width: 767px) {
  .lx-transfer-panel {
    grid-template-columns: minmax(0, 1fr);
  }

  .lx-transfer-panel__mobile-switch {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--lx-space-xs);
    min-width: 0;
    padding: 4px;
    border: 1px solid var(--lx-border);
    border-radius: var(--lx-radius-sm);
    background: var(--lx-bg-card-hover);
  }

  .lx-transfer-panel__mobile-switch button {
    display: flex;
    min-width: 0;
    min-height: 44px;
    align-items: center;
    justify-content: center;
    gap: var(--lx-space-xs);
    padding: 6px var(--lx-space-sm);
    border: 1px solid transparent;
    border-radius: var(--lx-radius-sm);
    background: transparent;
    color: var(--lx-text-secondary-strong);
    cursor: pointer;
    font: inherit;
    font-size: 12px;
    line-height: 1.35;
  }

  .lx-transfer-panel__mobile-switch button[aria-pressed='true'] {
    border-color: var(--lx-border);
    background: var(--lx-bg-card);
    color: var(--lx-text-primary);
    box-shadow: var(--lx-shadow-card);
  }

  .lx-transfer-panel__mobile-switch button:focus-visible {
    outline: 2px solid var(--lx-color-primary);
    outline-offset: 2px;
  }

  .lx-transfer-panel__mobile-switch button > span:first-child {
    min-width: 0;
    overflow-wrap: anywhere;
  }

  .lx-transfer-panel__mobile-count {
    flex: 0 0 auto;
    color: var(--lx-color-primary);
    font-family: var(--lx-font-mono);
    font-variant-numeric: tabular-nums;
  }

  .lx-transfer-panel__panel.is-mobile-hidden {
    display: none;
  }

  .lx-transfer-panel__panel {
    height: max(var(--lx-transfer-panel-height), 352px);
    grid-template-rows: minmax(44px, auto) 45px minmax(64px, 1fr) minmax(
        32px,
        auto
      );
  }

  .lx-transfer-panel__header {
    min-height: 44px;
  }

  .lx-transfer-panel__header-main {
    flex-direction: column;
    align-items: stretch;
    gap: 0;
  }

  .lx-transfer-panel__title {
    width: 100%;
    flex: 0 1 auto;
  }

  .lx-transfer-panel__header-actions {
    flex-wrap: wrap;
    align-self: flex-start;
  }

  .lx-transfer-panel__header-main.has-filter-actions
    .lx-transfer-panel__header-actions {
    width: 100%;
    flex: 0 0 auto;
  }

  .lx-transfer-panel__header-actions button {
    min-width: 44px;
    min-height: 44px;
  }

  .lx-transfer-panel__scope-actions summary {
    min-width: 44px;
    min-height: 44px;
  }

  .lx-transfer-panel__scope-action-content button {
    min-width: 44px;
    min-height: 44px;
  }

  .lx-transfer-panel__controls {
    min-height: 56px;
    flex-direction: row;
  }

  .lx-transfer-panel__controls-action {
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0 var(--lx-space-xs);
  }

  .lx-transfer-panel__controls-label {
    align-self: center;
  }

  .lx-transfer-panel__controls-hint {
    flex: 1 1 100%;
  }

  .lx-transfer-panel__controls button {
    width: 44px;
    height: 44px;
  }

  .lx-transfer-panel__selected-item {
    height: auto;
    min-height: 44px;
    padding-block: 2px;
  }

  .lx-transfer-panel__selected-item button {
    width: 44px;
    height: 44px;
  }

  .lx-transfer-panel__filter button {
    width: 44px;
    height: 44px;
    flex-basis: 44px;
  }
}

@media (max-width: 420px) {
  .lx-transfer-panel__mobile-title {
    display: none;
  }

  .lx-transfer-panel__mobile-short-title {
    display: inline;
    min-width: 0;
    white-space: nowrap;
  }

  .lx-transfer-panel__selected-item {
    align-items: flex-start;
  }

  .lx-transfer-panel__selected-item.is-name-expanded {
    position: relative;
    display: block;
  }

  .lx-transfer-panel__selected-main.is-name-expanded {
    width: 100%;
  }

  .lx-transfer-panel__selected-main.is-name-expanded
    .lx-transfer-panel__node-key {
    max-width: 72px;
  }

  .lx-transfer-panel__selected-main.is-name-expanded summary {
    min-height: 44px;
    align-items: center;
    padding-inline-end: 44px;
  }

  .lx-transfer-panel__selected-item.is-name-expanded > button {
    position: absolute;
    top: 2px;
    right: var(--lx-space-xs);
  }

  .lx-transfer-panel__selected-main {
    flex-wrap: wrap;
    align-items: flex-start;
    row-gap: 2px;
  }

  .lx-transfer-panel__selected-name {
    display: -webkit-box;
    flex: 1 1 auto;
    max-height: none;
    overflow: hidden;
    overflow-wrap: anywhere;
    white-space: normal;
    -webkit-line-clamp: unset;
  }

  .lx-transfer-panel__selected-name-disclosure summary {
    align-items: flex-start;
  }

  .lx-transfer-panel__selected-name-disclosure
    summary
    .lx-transfer-panel__selected-name {
    max-height: 2.8em;
    -webkit-line-clamp: 2;
  }

  .lx-transfer-panel__selected-name-disclosure {
    flex-basis: 100%;
  }

  .lx-transfer-panel__selected-main > .lx-transfer-panel__selected-name {
    flex-basis: 100%;
  }

  .lx-transfer-panel__panel :deep(.lx-virtual-tree__row) {
    display: grid;
    box-sizing: border-box;
    grid-template-columns: 44px 44px 15px minmax(0, 1fr);
    grid-template-rows: minmax(44px, 1fr) 16px;
    row-gap: 2px;
    padding-block: 1px;
  }

  .lx-transfer-panel__panel :deep(.lx-virtual-tree__toggle),
  .lx-transfer-panel__panel :deep(.lx-virtual-tree__toggle-placeholder),
  .lx-transfer-panel__panel :deep(.lx-virtual-tree__node-icon) {
    grid-row: 1;
  }

  .lx-transfer-panel__panel :deep(.lx-virtual-tree__toggle),
  .lx-transfer-panel__panel :deep(.lx-virtual-tree__toggle-placeholder) {
    width: 44px;
    height: 44px;
    flex-basis: 44px;
  }

  .lx-transfer-panel__panel :deep(.lx-virtual-tree__checkbox-control) {
    grid-row: 1;
    width: 44px;
    height: 44px;
    flex-basis: 44px;
  }

  .lx-transfer-panel__panel :deep(.lx-virtual-tree__label) {
    grid-column: 4;
    grid-row: 1;
    display: -webkit-box;
    max-height: 36px;
    overflow: hidden;
    overflow-wrap: anywhere;
    white-space: normal;
    line-height: 18px;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }

  .lx-transfer-panel__node-meta {
    grid-column: 4;
    grid-row: 2;
    width: 100%;
    height: 16px;
    max-height: 16px;
    flex-wrap: nowrap;
    align-self: start;
    overflow: hidden;
    line-height: 14px;
  }

  .lx-transfer-panel__node-meta > .lx-transfer-panel__node-code,
  .lx-transfer-panel__node-meta > .lx-transfer-panel__node-status {
    min-width: 0;
    max-width: calc(50% - 2px);
    flex: 0 1 auto;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .lx-transfer-panel__footer {
    align-items: flex-start;
    flex-direction: column;
    justify-content: center;
    padding-block: var(--lx-space-sm);
  }

  .lx-transfer-panel__inherit-control {
    width: 100%;
    align-items: flex-start;
  }

  .lx-transfer-panel__inherit-description {
    max-width: 100%;
    text-align: start;
  }
}

@media (max-width: 767px) {
  .lx-transfer-panel__caption {
    height: auto;
    min-height: 32px;
    flex-wrap: wrap;
    justify-content: flex-start;
    padding-block: var(--lx-space-xs);
  }

  .lx-transfer-panel__keyboard-hint {
    display: block;
    color: var(--lx-text-secondary-strong);
  }
}
</style>
