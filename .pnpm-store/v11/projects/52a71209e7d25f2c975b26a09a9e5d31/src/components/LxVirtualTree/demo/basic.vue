<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'

import {
  LxVirtualTree,
  type LxVirtualTreeNode,
  type LxVirtualTreeExpose,
} from '../../../index'

type DemoState = 'ready' | 'loading' | 'error' | 'empty'

const treeRef = ref<LxVirtualTreeExpose>()
const state = ref<DemoState>('ready')
const checkStrictly = ref(false)
const darkTheme = ref(false)
const selectedKeys = ref<(string | number)[]>(['unit-1-1'])
const keysFromExpose = ref<(string | number)[]>([])
const lastAction = ref('树数据已就绪')

const treeData: LxVirtualTreeNode[] = Array.from(
  { length: 12 },
  (_, groupIndex) => ({
    id: `region-${groupIndex + 1}`,
    label: `辖区单位 ${String(groupIndex + 1).padStart(2, '0')}`,
    code: `REGION-${String(groupIndex + 1).padStart(2, '0')}`,
    children: Array.from({ length: 20 }, (_, unitIndex) => ({
      id: `unit-${groupIndex + 1}-${unitIndex + 1}`,
      label: `执勤单元 ${String(unitIndex + 1).padStart(2, '0')}`,
      disabled: groupIndex === 1 && unitIndex === 4,
      isLeaf: true,
    })),
  }),
)

const visibleData = computed(() => (state.value === 'empty' ? [] : treeData))
const selectedSummary = computed(
  () => selectedKeys.value.slice(0, 6).join('、') || '无',
)

function filterNode(node: LxVirtualTreeNode, keyword: string) {
  return [node.label, node.code].some(
    (value) =>
      typeof value === 'string' && value.toLocaleLowerCase().includes(keyword),
  )
}

function setState(next: DemoState) {
  state.value = next
  lastAction.value = {
    ready: '树数据已就绪',
    loading: '宿主正在加载组织数据',
    error: '组织数据加载失败，可重试',
    empty: '宿主返回了空结果',
  }[next]
}

function applyRegionFilter() {
  treeRef.value?.filter('辖区单位 02')
  lastAction.value = '已通过 filter 方法筛选第二个辖区'
}

function clearFilter() {
  treeRef.value?.filter('')
  lastAction.value = '已清除节点筛选'
}

function setExampleSelection() {
  treeRef.value?.setCheckedKeys([
    'unit-1-2',
    'unit-2-4',
    'unit-2-5',
    'not-in-tree',
  ])
  lastAction.value = '已提交示例键；禁用节点和未知键会被忽略'
}

function readCheckedKeys() {
  keysFromExpose.value = treeRef.value?.getCheckedKeys() ?? []
  lastAction.value = `读取到 ${keysFromExpose.value.length} 个受控选中键`
}

function expandAll(expand: boolean) {
  treeRef.value?.expandAll(expand)
  lastAction.value = expand ? '已展开全部分支' : '已收起全部分支'
}

function scrollToLastNode() {
  treeRef.value?.expandAll()
  nextTick(() => treeRef.value?.scrollToKey('unit-12-20'))
  lastAction.value = '已展开组织树并定位到末尾节点'
}

function onCheckChange(keys: (string | number)[]) {
  lastAction.value = `选中 ${keys.length} 项`
}
</script>

<template>
  <div class="virtual-tree-demo">
    <details class="virtual-tree-demo__controls">
      <summary>演示状态和更多操作</summary>
      <div
        class="virtual-tree-demo__toolbar"
        role="group"
        aria-label="树状态示例"
      >
        <button
          type="button"
          :aria-pressed="state === 'ready'"
          @click="setState('ready')"
        >
          正常数据
        </button>
        <button
          type="button"
          :aria-pressed="state === 'empty'"
          @click="setState('empty')"
        >
          空结果
        </button>
        <button
          type="button"
          :aria-pressed="state === 'loading'"
          @click="setState('loading')"
        >
          加载中
        </button>
        <button
          type="button"
          :aria-pressed="state === 'error'"
          @click="setState('error')"
        >
          加载失败
        </button>
      </div>

      <div class="virtual-tree-demo__actions">
        <fieldset class="virtual-tree-demo__action-group">
          <legend>筛选</legend>
          <div class="virtual-tree-demo__action-content">
            <button type="button" @click="applyRegionFilter">
              筛选第二个辖区
            </button>
            <button type="button" @click="treeRef?.filter('REGION-02')">
              按编码筛选第二个辖区
            </button>
            <button type="button" @click="clearFilter">清除筛选</button>
          </div>
        </fieldset>
        <fieldset class="virtual-tree-demo__action-group">
          <legend>选中</legend>
          <div class="virtual-tree-demo__action-content">
            <button type="button" @click="setExampleSelection">
              设置示例选择
            </button>
            <button type="button" @click="readCheckedKeys">读取选中键</button>
          </div>
        </fieldset>
        <fieldset class="virtual-tree-demo__action-group">
          <legend>展开与定位</legend>
          <div class="virtual-tree-demo__action-content">
            <button type="button" @click="expandAll(true)">展开全部</button>
            <button type="button" @click="expandAll(false)">收起全部</button>
            <button type="button" @click="scrollToLastNode">
              定位末尾节点
            </button>
          </div>
        </fieldset>
        <fieldset class="virtual-tree-demo__action-group">
          <legend>选择方式</legend>
          <div class="virtual-tree-demo__action-content">
            <label class="virtual-tree-demo__strict">
              <input v-model="checkStrictly" type="checkbox" />
              父子独立勾选
            </label>
          </div>
        </fieldset>
        <fieldset class="virtual-tree-demo__action-group">
          <legend>外观主题</legend>
          <div class="virtual-tree-demo__action-content">
            <label class="virtual-tree-demo__strict">
              <input v-model="darkTheme" type="checkbox" />
              HUD 深色主题
            </label>
          </div>
        </fieldset>
      </div>
    </details>

    <p class="virtual-tree-demo__status" aria-live="polite">{{ lastAction }}</p>

    <div
      v-if="state === 'loading'"
      class="virtual-tree-demo__message"
      role="status"
    >
      组织数据加载中……
    </div>
    <div
      v-else-if="state === 'error'"
      class="virtual-tree-demo__message"
      role="alert"
    >
      <span>组织数据加载失败。</span>
      <button type="button" @click="setState('ready')">重试</button>
    </div>
    <div
      v-else
      class="virtual-tree-demo__preview"
      :class="{ 'lx-theme-hud': darkTheme }"
    >
      <LxVirtualTree
        ref="treeRef"
        v-model="selectedKeys"
        aria-label="组织结构"
        :data="visibleData"
        :height="280"
        :item-size="32"
        :show-checkbox="true"
        :check-strictly="checkStrictly"
        :filter-method="filterNode"
        :default-expanded-keys="['region-1', 'region-2']"
        @check-change="onCheckChange"
        @node-click="lastAction = `查看节点：${$event.label}`"
        @expand-change="lastAction = `展开分支：${$event.length} 个`"
      >
        <template #node="{ node, level, checked }">
          <span v-if="node.children?.length" class="virtual-tree-demo__count"
            >{{ node.children.length }} 个单元</span
          >
          <span v-else-if="checked" class="virtual-tree-demo__selected"
            >已选</span
          >
          <span v-else-if="level > 1" class="virtual-tree-demo__kind"
            >单位</span
          >
        </template>
      </LxVirtualTree>
    </div>

    <div class="virtual-tree-demo__summary">
      <span>受控选中：{{ selectedKeys.length }} 项</span>
      <span class="virtual-tree-demo__keys">{{ selectedSummary }}</span>
      <span>公开方法读取：{{ keysFromExpose.length }} 项</span>
    </div>
    <p class="virtual-tree-demo__note">
      加载与错误状态由宿主负责；虚拟树只接收已准备好的节点数据。
    </p>
  </div>
</template>

<style scoped>
.virtual-tree-demo {
  display: grid;
  min-width: 0;
  gap: var(--lx-space-md);
  color: var(--lx-text-regular);
  font-size: 13px;
}

.virtual-tree-demo__preview {
  min-width: 0;
}

.virtual-tree-demo__preview.lx-theme-hud {
  background-color: var(--lx-bg-page);
}

.virtual-tree-demo__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--lx-space-xs);
}

.virtual-tree-demo__actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 180px), 1fr));
  align-items: start;
  gap: var(--lx-space-md);
}

.virtual-tree-demo__action-group {
  min-width: 0;
  margin: 0;
  padding: 0 0 0 var(--lx-space-sm);
  border: 0;
  border-inline-start: 1px solid var(--lx-border-light);
}

.virtual-tree-demo__action-group legend {
  margin-bottom: var(--lx-space-xs);
  padding: 0;
  color: var(--lx-text-secondary);
  font-size: 12px;
}

.virtual-tree-demo__action-content {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--lx-space-xs);
}

.virtual-tree-demo__controls {
  display: grid;
  gap: var(--lx-space-sm);
}

.virtual-tree-demo__controls summary {
  display: flex;
  width: fit-content;
  min-height: 32px;
  align-items: center;
  color: var(--lx-text-secondary);
  cursor: pointer;
}

.virtual-tree-demo button {
  min-height: 30px;
  padding: 4px 8px;
  border: 1px solid var(--lx-border);
  border-radius: var(--lx-radius-sm);
  background: var(--lx-bg-card);
  color: var(--lx-text-regular);
  cursor: pointer;
  font: inherit;
}

.virtual-tree-demo button:hover,
.virtual-tree-demo button[aria-pressed='true'] {
  border-color: var(--lx-color-primary);
  color: var(--lx-color-primary);
}

.virtual-tree-demo button:focus-visible,
.virtual-tree-demo input:focus-visible {
  outline: 2px solid var(--lx-color-primary);
  outline-offset: 2px;
}

.virtual-tree-demo__strict {
  display: inline-flex;
  min-height: 30px;
  align-items: center;
  gap: var(--lx-space-xs);
  padding-inline: var(--lx-space-xs);
}

.virtual-tree-demo__strict input {
  accent-color: var(--lx-color-primary);
}

.virtual-tree-demo__status,
.virtual-tree-demo__summary,
.virtual-tree-demo__note {
  margin: 0;
  line-height: 20px;
}

.virtual-tree-demo__status {
  color: var(--lx-text-secondary);
}

.virtual-tree-demo__message {
  display: flex;
  min-height: 120px;
  align-items: center;
  justify-content: center;
  gap: var(--lx-space-sm);
  border: 1px solid var(--lx-border-light);
  border-radius: var(--lx-radius-md);
  background: var(--lx-bg-card);
}

.virtual-tree-demo__summary {
  display: flex;
  flex-wrap: wrap;
  gap: var(--lx-space-xs) var(--lx-space-lg);
  padding-top: var(--lx-space-sm);
  border-top: 1px solid var(--lx-border-light);
}

.virtual-tree-demo__keys,
.virtual-tree-demo__note {
  color: var(--lx-text-secondary);
}

.virtual-tree-demo__count,
.virtual-tree-demo__selected,
.virtual-tree-demo__kind {
  flex: 0 0 auto;
  color: var(--lx-text-secondary);
  font-size: 11px;
}

.virtual-tree-demo__selected {
  color: var(--lx-color-primary);
}

@media (max-width: 640px) {
  .virtual-tree-demo button,
  .virtual-tree-demo__strict {
    min-height: 44px;
  }
}
</style>
