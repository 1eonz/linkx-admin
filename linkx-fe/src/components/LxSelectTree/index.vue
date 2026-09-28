<script setup lang="ts">
/**
 * 组织树复选组件。数据和懒加载器由宿主注入，组件本身不发起业务请求。
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ElTree } from 'element-plus'
import type {
  FilterNodeMethodFunction,
  LoadFunction,
  TreeInstance,
  TreeNodeData,
} from 'element-plus'
import type { LxSelectTreeProps, LxTreeNode } from './types'
import LxIcon from '../LxIcon/index.vue'
import LxStatusDot from '../LxStatusDot/index.vue'
import 'element-plus/es/components/tree/style/css'

interface FailedLoad {
  key: string | number
  node: LxTreeNode
  resolve: (nodes: TreeNodeData[]) => void
}

const props = withDefaults(defineProps<LxSelectTreeProps>(), {
  data: () => [],
  checkedKeys: () => [],
  checkStrictly: false,
  filterable: true,
  placeholder: '搜索部门名称',
  searchLabel: '搜索部门名称',
  lazy: undefined,
  expandedKeys: () => [],
  height: 320,
})

const emit = defineEmits<{
  'update:checked-keys': [keys: (string | number)[]]
  'check-change': [keys: (string | number)[], nodes: LxTreeNode[]]
  'node-click': [node: LxTreeNode]
  'load-error': [node: LxTreeNode, error: unknown]
}>()

const treeRef = ref<TreeInstance>()
const keyword = ref('')
const loadedChildren = ref(new Map<string | number, LxTreeNode[]>())
const failedLoads = ref<FailedLoad[]>([])
const loadingKeys = ref(new Set<string | number>())
const expandedKeys = ref(new Set<string | number>(props.expandedKeys))
const autoExpandedKeys = ref(new Set<string | number>())
const normalizedKeyword = computed(() =>
  keyword.value.trim().toLocaleLowerCase(),
)
const treeData = computed(() => props.data.map(normalizeNode))
const treeProps = {
  label: 'title',
  children: 'children',
  disabled: 'disabled',
  isLeaf: 'isLeaf',
}

let syncing = false
let syncVersion = 0
let isUnmounted = false

function normalizeNode(node: LxTreeNode): LxTreeNode {
  const children = node.children?.map(normalizeNode)
  return {
    ...node,
    children,
    isLeaf: node.isLeaf ?? !(node.hasChildren || children?.length),
  }
}

function isLxTreeNode(node: TreeNodeData): node is LxTreeNode {
  return (
    (typeof node.key === 'string' || typeof node.key === 'number') &&
    typeof node.title === 'string'
  )
}

const filterState = computed(() => {
  const matches = new Set<string | number>()
  const ancestors = new Set<string | number>()
  const filter = normalizedKeyword.value

  if (!filter) return { matches, ancestors, hasMatch: false }

  function visit(node: LxTreeNode): boolean {
    const children = node.children?.length
      ? node.children
      : (loadedChildren.value.get(node.key) ?? [])
    let childMatch = false
    children.forEach((child) => {
      if (visit(child)) childMatch = true
    })
    const ownMatch = String(node.title).toLocaleLowerCase().includes(filter)
    if (ownMatch || childMatch) matches.add(node.key)
    if (childMatch) ancestors.add(node.key)
    return ownMatch || childMatch
  }

  treeData.value.forEach((node) => visit(node))
  return { matches, ancestors, hasMatch: matches.size > 0 }
})

const noMatch = computed(
  () => !!normalizedKeyword.value && !filterState.value.hasMatch,
)
const hasNoData = computed(() => treeData.value.length === 0)
const loadingKeySet = computed(() => loadingKeys.value)

watch(normalizedKeyword, (filter) => {
  treeRef.value?.filter(filter)
  if (!filter) {
    restoreAutoExpandedNodes()
    return
  }
  void nextTick(expandMatchingAncestors)
})

watch(
  () => props.checkedKeys,
  (keys) => syncChecked(keys),
  { deep: true },
)

watch(
  () => props.expandedKeys,
  (keys) => {
    expandedKeys.value = new Set(keys)
  },
  { deep: true },
)

watch(
  () => props.data,
  () => {
    loadedChildren.value = new Map()
    void nextTick(() => {
      treeRef.value?.filter(normalizedKeyword.value)
      syncChecked(props.checkedKeys)
    })
  },
)

onMounted(() => {
  syncChecked(props.checkedKeys)
})

onBeforeUnmount(() => {
  isUnmounted = true
  failedLoads.value = []
  loadingKeys.value = new Set()
})

function setLoading(key: string | number, loading: boolean): void {
  const next = new Set(loadingKeys.value)
  if (loading) next.add(key)
  else next.delete(key)
  loadingKeys.value = next
}

function removeFailedLoad(key: string | number): void {
  failedLoads.value = failedLoads.value.filter((item) => item.key !== key)
}

function saveFailedLoad(
  node: LxTreeNode,
  resolve: (nodes: TreeNodeData[]) => void,
): void {
  const entry: FailedLoad = { key: node.key, node, resolve }
  const remaining = failedLoads.value.filter((item) => item.key !== node.key)
  failedLoads.value = [...remaining, entry]
}

function syncChecked(keys: (string | number)[]): void {
  const currentVersion = ++syncVersion
  syncing = true
  treeRef.value?.setCheckedKeys(keys)
  void nextTick(() => {
    if (syncVersion === currentVersion) syncing = false
  })
}

function findNodes(keys: (string | number)[]): LxTreeNode[] {
  const requested = new Set(keys)
  const found: LxTreeNode[] = []

  function walk(nodes: LxTreeNode[]): void {
    nodes.forEach((node) => {
      if (requested.has(node.key) && !node.disabled) found.push(node)
      const children = node.children?.length
        ? node.children
        : (loadedChildren.value.get(node.key) ?? [])
      walk(children)
    })
  }

  walk(props.data)
  return found
}

function findNode(key: string | number): LxTreeNode | undefined {
  let found: LxTreeNode | undefined
  function walk(nodes: LxTreeNode[]): void {
    for (const node of nodes) {
      if (node.key === key) {
        found = node
        return
      }
      const children = node.children?.length
        ? node.children
        : (loadedChildren.value.get(node.key) ?? [])
      walk(children)
      if (found) return
    }
  }

  walk(props.data)
  return found
}

function onCheck(): void {
  if (syncing) return
  const checkedNodes = findNodes(treeRef.value?.getCheckedKeys(false) ?? [])
  const keys = checkedNodes.map((node) => node.key)
  emit('update:checked-keys', keys)
  emit('check-change', keys, checkedNodes)
}

function onLazyLoad(
  node: Parameters<LoadFunction>[0],
  resolve: Parameters<LoadFunction>[1],
): void {
  if (node.level === 0) {
    resolve(treeData.value)
    return
  }

  if (!isLxTreeNode(node.data)) {
    resolve([])
    return
  }

  const raw = findNode(node.data.key) ?? node.data
  const knownChildren = raw.children?.length
    ? raw.children
    : (loadedChildren.value.get(raw.key) ?? [])
  if (knownChildren.length || !props.lazy) {
    resolve(knownChildren.map(normalizeNode))
    return
  }

  runLazyLoad(raw, resolve)
}

function runLazyLoad(
  node: LxTreeNode,
  resolve: (nodes: TreeNodeData[]) => void,
): void {
  const loader = props.lazy
  if (!loader) {
    resolve([])
    return
  }

  setLoading(node.key, true)
  loader(node)
    .then((children) => {
      if (isUnmounted) return
      const normalizedChildren = children.map(normalizeNode)
      const nextChildren = new Map(loadedChildren.value)
      nextChildren.set(node.key, normalizedChildren)
      loadedChildren.value = nextChildren
      removeFailedLoad(node.key)
      resolve(normalizedChildren)
      return nextTick().then(() => {
        syncChecked(props.checkedKeys)
        treeRef.value?.filter(normalizedKeyword.value)
      })
    })
    .catch((error: unknown) => {
      if (isUnmounted) return
      saveFailedLoad(node, resolve)
      emit('load-error', node, error)
    })
    .finally(() => {
      if (!isUnmounted) setLoading(node.key, false)
    })
}

function retryLoad(key: string | number): void {
  const failedLoad = failedLoads.value.find((item) => item.key === key)
  if (!failedLoad || loadingKeySet.value.has(key)) return

  runLazyLoad(failedLoad.node, failedLoad.resolve)
}

function filterNode(value: string, data: TreeNodeData): boolean {
  return (
    !value || (isLxTreeNode(data) && filterState.value.matches.has(data.key))
  )
}

function expandMatchingAncestors(): void {
  restoreAutoExpandedNodes()
  const nextAutoExpanded = new Set<string | number>()
  filterState.value.ancestors.forEach((key) => {
    const node = treeRef.value?.getNode(key)
    if (node && !node.expanded) {
      node.expand()
      nextAutoExpanded.add(key)
    }
  })
  autoExpandedKeys.value = nextAutoExpanded
}

function restoreAutoExpandedNodes(): void {
  autoExpandedKeys.value.forEach((key) => {
    if (!expandedKeys.value.has(key)) treeRef.value?.getNode(key)?.collapse()
  })
  autoExpandedKeys.value = new Set()
}

function onNodeExpand(node: LxTreeNode): void {
  if (normalizedKeyword.value) return
  expandedKeys.value = new Set(expandedKeys.value).add(node.key)
}

function onNodeCollapse(node: LxTreeNode): void {
  if (normalizedKeyword.value) return
  const next = new Set(expandedKeys.value)
  next.delete(node.key)
  expandedKeys.value = next
}

function onNodeClick(data: LxTreeNode): void {
  emit('node-click', findNode(data.key) ?? data)
}
</script>

<template>
  <div class="lx-tree">
    <div v-if="filterable" class="lx-tree__search">
      <LxIcon
        name="search"
        :size="14"
        class="lx-tree__search-icon"
        aria-hidden="true"
      />
      <input
        v-model="keyword"
        class="lx-tree__input"
        type="search"
        :aria-label="searchLabel"
        :placeholder="placeholder"
      />
    </div>

    <div class="lx-tree__body" :style="{ maxHeight: `${height}px` }">
      <ElTree
        ref="treeRef"
        :data="treeData"
        :props="treeProps"
        node-key="key"
        show-checkbox
        :check-strictly="checkStrictly"
        :default-expanded-keys="[...expandedKeys]"
        :lazy="!!lazy"
        :load="onLazyLoad"
        :filter-node-method="filterNode"
        empty-text=""
        @check="onCheck"
        @node-click="onNodeClick"
        @node-expand="onNodeExpand"
        @node-collapse="onNodeCollapse"
      >
        <template #default="{ data: node }">
          <span
            class="lx-tree__label"
            :data-lx-select-tree-key="String(node.key)"
          >
            <span
              class="lx-tree__title"
              :class="{ 'is-disabled': node.disabled }"
              :title="node.title"
            >
              {{ node.title }}
            </span>
            <span v-if="node.disabled" class="lx-tree__disabled-label"
              >不可选</span
            >
            <LxStatusDot
              v-if="node.status"
              :status="node.status"
              :size="6"
              :pulse="false"
            />
          </span>
        </template>
      </ElTree>

      <div v-if="failedLoads.length" class="lx-tree__errors" aria-live="polite">
        <div
          v-for="error in failedLoads"
          :key="String(error.key)"
          class="lx-tree__error"
          role="status"
        >
          <span>“{{ error.node.title }}”加载失败</span>
          <button
            type="button"
            :disabled="loadingKeySet.has(error.key)"
            @click="retryLoad(error.key)"
          >
            {{ loadingKeySet.has(error.key) ? '重试中' : '重试' }}
          </button>
        </div>
      </div>

      <div
        v-if="noMatch || hasNoData"
        class="lx-tree__empty"
        role="status"
        aria-live="polite"
      >
        {{ hasNoData ? '暂无数据' : '未找到匹配部门' }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.lx-tree {
  display: flex;
  flex-direction: column;
  gap: var(--lx-space-sm);
  min-width: 0;
}

.lx-tree__search {
  position: relative;
  display: flex;
  align-items: center;
  min-width: 0;
}

.lx-tree__search-icon {
  position: absolute;
  inset-inline-start: var(--lx-space-sm);
  color: var(--lx-text-secondary);
  pointer-events: none;
}

.lx-tree__input {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  height: var(--lx-control-height);
  padding: 0 var(--lx-space-sm) 0 30px;
  border: 1px solid var(--lx-border);
  border-radius: var(--lx-radius-md);
  background: var(--lx-bg-card);
  color: var(--lx-text-regular);
  font-size: 12px;
  transition: border-color var(--lx-transition);
}

.lx-tree__input:focus-visible {
  border-color: var(--lx-color-primary);
  outline: 2px solid var(--lx-color-primary);
  outline-offset: 2px;
}

.lx-tree__input::placeholder {
  color: var(--lx-text-placeholder);
}

.lx-tree__body {
  min-width: 0;
  overflow: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--lx-border) transparent;
}

:deep(.el-tree) {
  --el-tree-node-content-height: 32px;
  --el-tree-node-content-hover-bg-color: var(--lx-color-primary-light);
  --el-tree-text-color: var(--lx-text-regular);
  --el-tree-expand-icon-color: var(--lx-text-secondary);
  min-width: 0;
  background: transparent;
  font-size: 13px;
}

.lx-tree__label {
  display: inline-flex;
  align-items: center;
  gap: var(--lx-space-sm);
  flex: 1;
  min-width: 0;
}

.lx-tree__title {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.lx-tree__title.is-disabled,
.lx-tree__disabled-label {
  color: var(--lx-text-secondary);
}

.lx-tree__disabled-label,
.lx-tree__error {
  font-size: 12px;
}

.lx-tree__errors {
  display: grid;
  gap: var(--lx-space-xs);
}

.lx-tree__error {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--lx-space-sm);
  color: var(--lx-color-error-strong);
}

.lx-tree__error button {
  min-height: 24px;
  padding: 0 var(--lx-space-xs);
  border: 0;
  background: transparent;
  color: var(--lx-color-primary);
  cursor: pointer;
  font: inherit;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.lx-tree__error button:focus-visible {
  border-radius: var(--lx-radius-sm);
  outline: 2px solid var(--lx-color-primary);
  outline-offset: 2px;
}

.lx-tree__error button:disabled {
  color: var(--lx-text-disabled);
  cursor: wait;
}

.lx-tree__empty {
  padding-block: var(--lx-space-xl);
  color: var(--lx-text-secondary);
  font-size: 12px;
  text-align: center;
}

@media (prefers-reduced-motion: reduce) {
  .lx-tree__input {
    transition: none;
  }
}
</style>
