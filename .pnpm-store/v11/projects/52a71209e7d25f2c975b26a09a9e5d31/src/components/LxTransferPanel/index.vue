<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import LxCheckbox from '../LxCheckbox/index.vue'
import LxIcon from '../LxIcon/index.vue'
import LxVirtualTree from '../LxVirtualTree/index.vue'
import type { LxVirtualTreeNode } from '../LxVirtualTree/types'
import { lxMessage } from '../LxMessage'
import type { LxTransferPanelProps } from './types'

defineOptions({ name: 'LxTransferPanel' })

const props = withDefaults(defineProps<LxTransferPanelProps>(), {
  treeData: () => [],
  modelValue: () => [],
  titles: () => ['待选资源', '已选资源'],
  panelHeight: 380,
  maxCount: undefined,
  inheritChild: true,
})

const emit = defineEmits<{
  'update:modelValue': [keys: (string | number)[]]
  change: [keys: (string | number)[], nodes: LxVirtualTreeNode[]]
  'update:inheritChild': [value: boolean]
  'clear-all': []
}>()

const selectedFilter = ref('')
const inherit = ref(props.inheritChild)

watch(
  () => props.inheritChild,
  (value) => (inherit.value = value)
)

const nodeMap = computed(() => {
  const nodes = new Map<string | number, LxVirtualTreeNode>()
  const visit = (list: LxVirtualTreeNode[]) => {
    list.forEach((node) => {
      nodes.set(node.id, node)
      if (node.children) visit(node.children)
    })
  }
  visit(props.treeData)
  return nodes
})

const allKeys = computed(() =>
  [...nodeMap.value.keys()].filter((key) => !nodeMap.value.get(key)?.disabled)
)
const selectedKeySet = computed(() => new Set(props.modelValue))
const maxCount = computed(() =>
  props.maxCount == null ? null : Math.max(0, Math.floor(props.maxCount))
)
const missingKeys = computed(() =>
  allKeys.value.filter((key) => !selectedKeySet.value.has(key))
)
const canSelectAll = computed(() => {
  if (!missingKeys.value.length) return false
  return (
    maxCount.value === null ||
    selectedKeySet.value.size + missingKeys.value.length <= maxCount.value
  )
})
// 树按需加载时，暂未出现在当前树中的既有授权仍需可见且可移除。
const selectedNodes = computed(() =>
  props.modelValue.map(
    (key) => nodeMap.value.get(key) ?? { id: key, label: String(key) }
  )
)
const visibleSelectedNodes = computed(() => {
  const query = selectedFilter.value.trim().toLocaleLowerCase()
  return !query
    ? selectedNodes.value
    : selectedNodes.value.filter((node) =>
        node.label.toLocaleLowerCase().includes(query)
      )
})

function getInvertedKeys() {
  const fixedKeys = props.modelValue.filter((key) => {
    const node = nodeMap.value.get(key)
    return !node || node.disabled
  })
  const nextKeys = allKeys.value.filter((key) => !selectedKeySet.value.has(key))
  return [...fixedKeys, ...nextKeys]
}

const canInvert = computed(() => {
  if (!allKeys.value.length) return false
  if (maxCount.value === null) return true
  const nextCount = new Set(getInvertedKeys()).size
  return nextCount <= maxCount.value || nextCount <= selectedKeySet.value.size
})

function update(keys: (string | number)[]) {
  const unique = [...new Set(keys)].filter(
    (key) =>
      props.modelValue.includes(key) ||
      (nodeMap.value.has(key) && !nodeMap.value.get(key)?.disabled)
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
      .filter((node): node is LxVirtualTreeNode => Boolean(node))
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

function invertSelection() {
  update(getInvertedKeys())
}

function clearAll() {
  if (!props.modelValue.length) return
  update([])
  emit('clear-all')
}

function remove(key: string | number) {
  update(props.modelValue.filter((value) => value !== key))
}

function updateInherit(value: string | number | boolean) {
  const next = value === true
  inherit.value = next
  emit('update:inheritChild', next)
}
</script>

<template>
  <section class="lx-transfer-panel">
    <div class="lx-transfer-panel__panel">
      <header class="lx-transfer-panel__header">
        <span class="lx-transfer-panel__title"
          ><LxIcon name="folder" :size="16" />{{ titles[0] }}</span
        >
        <span class="lx-transfer-panel__header-actions">
          <button
            type="button"
            :disabled="!canSelectAll"
            :title="canSelectAll ? '全选待选节点' : '已全部选择或达到选择上限'"
            @click="selectAll"
          >
            全选
          </button>
          <span aria-hidden="true">/</span>
          <button
            type="button"
            :disabled="!canInvert"
            title="反转当前已加载树中的可选节点"
            @click="invertSelection"
          >
            反选
          </button>
        </span>
      </header>
      <LxVirtualTree
        :data="treeData"
        :height="Math.max(120, panelHeight - 116)"
        :model-value="modelValue"
        show-checkbox
        check-strictly
        @update:model-value="onTreeChange"
      />
      <footer class="lx-transfer-panel__caption">
        待选池：{{ nodeMap.size }} 个节点
      </footer>
    </div>

    <div class="lx-transfer-panel__controls" aria-label="穿梭批量操作">
      <button
        type="button"
        :title="canSelectAll ? '全部加入' : '已全部选择或达到选择上限'"
        aria-label="全部加入"
        :disabled="!canSelectAll"
        @click="selectAll"
      >
        <LxIcon name="arrow-right" :size="18" />
      </button>
      <button
        type="button"
        title="全部移除"
        aria-label="全部移除"
        :disabled="!modelValue.length"
        @click="clearAll"
      >
        <LxIcon name="arrow-left" :size="18" />
      </button>
    </div>

    <div class="lx-transfer-panel__panel">
      <header class="lx-transfer-panel__header">
        <span class="lx-transfer-panel__title"
          ><LxIcon name="check" :size="16" />{{ titles[1] }}</span
        >
        <button
          class="lx-transfer-panel__clear"
          type="button"
          :disabled="!modelValue.length"
          @click="clearAll"
        >
          <LxIcon name="delete" :size="14" />清空
        </button>
      </header>
      <label class="lx-transfer-panel__filter">
        <LxIcon name="filter" :size="14" />
        <input
          v-model="selectedFilter"
          type="search"
          placeholder="在已选项中检索"
          aria-label="在已选项中检索"
        />
      </label>
      <ul
        class="lx-transfer-panel__selected"
        :style="{ maxHeight: `${panelHeight - 108}px` }"
      >
        <li
          v-for="node in visibleSelectedNodes"
          :key="String(node.id)"
          class="lx-transfer-panel__selected-item"
        >
          <span class="lx-transfer-panel__selected-name"
            ><LxIcon name="folder" :size="14" />{{ node.label }}</span
          >
          <button
            type="button"
            :aria-label="`移除 ${node.label}`"
            @click="remove(node.id)"
          >
            <LxIcon name="x" :size="14" />
          </button>
        </li>
        <li
          v-if="!visibleSelectedNodes.length"
          class="lx-transfer-panel__empty"
        >
          暂无已选项
        </li>
      </ul>
      <footer class="lx-transfer-panel__footer">
        <span
          >已选 <strong>{{ modelValue.length }}</strong> 项</span
        >
        <LxCheckbox :model-value="inherit" @update:model-value="updateInherit"
          >保留下级继承授权</LxCheckbox
        >
      </footer>
    </div>
  </section>
</template>

<style scoped>
.lx-transfer-panel {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: stretch;
  gap: var(--lx-space-md);
}

.lx-transfer-panel__panel {
  display: grid;
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--lx-border);
  border-radius: var(--lx-radius-md);
  background: var(--lx-bg-card);
}

.lx-transfer-panel__header,
.lx-transfer-panel__caption,
.lx-transfer-panel__footer {
  display: flex;
  min-height: 36px;
  align-items: center;
  justify-content: space-between;
  gap: var(--lx-space-sm);
  padding: 0 var(--lx-space-md);
  background: var(--lx-bg-table-header);
}

.lx-transfer-panel__header {
  border-bottom: 1px solid var(--lx-border-light);
}

.lx-transfer-panel__title,
.lx-transfer-panel__selected-name {
  display: inline-flex;
  min-width: 0;
  align-items: center;
  gap: var(--lx-space-xs);
}

.lx-transfer-panel__title {
  color: var(--lx-text-primary);
  font-size: 13px;
  font-weight: 600;
}

.lx-transfer-panel__header-actions {
  display: inline-flex;
  align-items: center;
  gap: var(--lx-space-xs);
  color: var(--lx-text-secondary);
  font-size: 12px;
}

.lx-transfer-panel__header-actions button,
.lx-transfer-panel__clear {
  display: inline-flex;
  min-height: 28px;
  align-items: center;
  gap: var(--lx-space-xs);
  padding: 0 var(--lx-space-xs);
  border: 0;
  background: transparent;
  color: var(--lx-color-primary);
  cursor: pointer;
  font: inherit;
}

.lx-transfer-panel__header-actions button:disabled,
.lx-transfer-panel__clear:disabled,
.lx-transfer-panel__controls button:disabled,
.lx-transfer-panel__selected-item button:disabled {
  cursor: not-allowed;
  opacity: 0.48;
}

.lx-transfer-panel__clear {
  color: var(--lx-color-error);
  font-size: 12px;
}

.lx-transfer-panel__header-actions button:focus-visible,
.lx-transfer-panel__clear:focus-visible,
.lx-transfer-panel__selected-item button:focus-visible,
.lx-transfer-panel__controls button:focus-visible {
  outline: 2px solid var(--lx-color-primary);
  outline-offset: 2px;
}

.lx-transfer-panel__panel :deep(.lx-virtual-tree) {
  gap: 0;
}

.lx-transfer-panel__panel :deep(.lx-virtual-tree__filter) {
  margin: var(--lx-space-sm);
}

.lx-transfer-panel__panel :deep(.lx-virtual-tree__viewport) {
  border-inline: 0;
  border-radius: 0;
}

.lx-transfer-panel__caption,
.lx-transfer-panel__footer {
  border-top: 1px solid var(--lx-border-light);
  color: var(--lx-text-secondary);
  font-size: 11px;
}

.lx-transfer-panel__controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--lx-space-sm);
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

.lx-transfer-panel__controls button:first-child:not(:disabled) {
  border-color: var(--lx-color-primary);
  background: var(--lx-color-primary);
  color: var(--lx-color-on-primary);
}

.lx-transfer-panel__filter {
  display: flex;
  min-height: 28px;
  align-items: center;
  gap: var(--lx-space-xs);
  margin: var(--lx-space-sm);
  padding: 0 var(--lx-space-sm);
  border: 1px solid var(--lx-border);
  border-radius: var(--lx-radius-md);
  color: var(--lx-text-secondary);
}

.lx-transfer-panel__filter:focus-within {
  border-color: var(--lx-color-primary);
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

.lx-transfer-panel__selected {
  display: grid;
  align-content: start;
  gap: var(--lx-space-xs);
  overflow: auto;
  margin: 0;
  padding: var(--lx-space-sm);
  list-style: none;
}

.lx-transfer-panel__selected-item {
  display: flex;
  min-height: var(--lx-control-height);
  align-items: center;
  justify-content: space-between;
  gap: var(--lx-space-sm);
  padding: 0 var(--lx-space-sm);
  border: 1px solid var(--lx-border-light);
  border-radius: var(--lx-radius-md);
  background: var(--lx-bg-card-hover);
}

.lx-transfer-panel__selected-name {
  overflow: hidden;
  color: var(--lx-text-regular);
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.lx-transfer-panel__selected-item button {
  display: inline-flex;
  width: 32px;
  height: 32px;
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

@media (max-width: 767px) {
  .lx-transfer-panel {
    grid-template-columns: minmax(0, 1fr);
  }

  .lx-transfer-panel__header-actions button,
  .lx-transfer-panel__clear {
    min-height: 44px;
  }

  .lx-transfer-panel__controls {
    flex-direction: row;
  }

  .lx-transfer-panel__controls button {
    width: 44px;
    height: 44px;
  }

  .lx-transfer-panel__selected-item {
    min-height: 44px;
  }

  .lx-transfer-panel__selected-item button {
    width: 44px;
    height: 44px;
  }

  .lx-transfer-panel__filter {
    min-height: 44px;
  }
}
</style>
