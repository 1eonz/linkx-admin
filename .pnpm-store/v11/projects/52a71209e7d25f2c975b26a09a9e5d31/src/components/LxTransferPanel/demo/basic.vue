<script setup lang="ts">
import { computed, ref } from 'vue'
import { LxTransferPanel, type LxVirtualTreeNode } from '../../../index'

type HostState = 'ready' | 'loading' | 'error' | 'empty'

const hostState = ref<HostState>('ready')
const selectedKeys = ref<(string | number)[]>(['unit-01', 'legacy-unit-08'])
const maxCountEnabled = ref(true)
const darkTheme = ref(false)
const inheritChild = ref(true)
const lastAction = ref('已载入组织权限数据')

const treeData: LxVirtualTreeNode[] = [
  {
    id: 'org-01',
    label: '市公安局指挥中心',
    children: [
      { id: 'unit-01', label: '情指行一体化研判调度专班' },
      { id: 'unit-02', label: '交警直属特勤一中队' },
      { id: 'unit-03', label: '站前路派出所综合作战室' },
      { id: 'unit-locked', label: '受限巡检单位', disabled: true },
    ],
  },
]

const visibleTreeData = computed(() =>
  hostState.value === 'empty' ? [] : treeData,
)

function setHostState(state: HostState) {
  hostState.value = state
  lastAction.value = {
    ready: '已载入组织权限数据',
    loading: '宿主正在加载组织权限数据',
    error: '组织权限数据加载失败，可重试',
    empty: '宿主返回了空树数据',
  }[state]
}

function onChange(keys: (string | number)[], nodes: LxVirtualTreeNode[]) {
  lastAction.value = `选中 ${keys.length} 项；当前树中可解析 ${nodes.length} 个节点`
}

function onClearAll() {
  lastAction.value = '已清空全部选中项'
}

function onInheritChange(value: boolean) {
  inheritChild.value = value
  lastAction.value = value ? '已保留下级继承授权' : '已关闭下级继承授权'
}
</script>

<template>
  <div class="transfer-panel-demo" :class="{ 'lx-theme-hud': darkTheme }">
    <div
      class="transfer-panel-demo__toolbar"
      role="group"
      aria-label="宿主数据状态"
    >
      <button
        type="button"
        :aria-pressed="hostState === 'ready'"
        @click="setHostState('ready')"
      >
        正常数据
      </button>
      <button
        type="button"
        :aria-pressed="hostState === 'empty'"
        @click="setHostState('empty')"
      >
        空结果
      </button>
      <button
        type="button"
        :aria-pressed="hostState === 'loading'"
        @click="setHostState('loading')"
      >
        加载中
      </button>
      <button
        type="button"
        :aria-pressed="hostState === 'error'"
        @click="setHostState('error')"
      >
        加载失败
      </button>
      <label
        ><input v-model="maxCountEnabled" type="checkbox" /> 最多 5 项</label
      >
      <label><input v-model="darkTheme" type="checkbox" /> HUD 深色主题</label>
    </div>

    <p
      class="transfer-panel-demo__status"
      data-testid="transfer-status"
      aria-live="polite"
    >
      {{ lastAction }}
    </p>

    <div
      v-if="hostState === 'loading'"
      class="transfer-panel-demo__message"
      role="status"
    >
      组织权限数据加载中……
    </div>
    <div
      v-else-if="hostState === 'error'"
      class="transfer-panel-demo__message"
      role="alert"
    >
      <span>组织权限数据加载失败。</span>
      <button type="button" @click="setHostState('ready')">重试</button>
    </div>
    <LxTransferPanel
      v-else
      v-model="selectedKeys"
      :tree-data="visibleTreeData"
      :titles="['组织与数据权限树（待选）', '已选数据权限清单']"
      :panel-height="380"
      :max-count="maxCountEnabled ? 5 : undefined"
      :inherit-child="inheritChild"
      @change="onChange"
      @clear-all="onClearAll"
      @update:inherit-child="onInheritChange"
    />

    <div class="transfer-panel-demo__summary">
      <span data-testid="selected-count"
        >当前已选 {{ selectedKeys.length }} 项</span
      >
      <span>包含一个当前树中未加载的既有选中键</span>
    </div>
    <p class="transfer-panel-demo__note">
      数据、加载状态和错误恢复由宿主提供；示例只使用本地内存数据。
    </p>
  </div>
</template>

<style scoped>
.transfer-panel-demo {
  display: grid;
  min-width: 0;
  gap: var(--lx-space-md);
  color: var(--lx-text-regular);
  font-size: 13px;
}

.transfer-panel-demo__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--lx-space-xs);
}

.transfer-panel-demo button {
  min-height: 32px;
  padding: 4px var(--lx-space-sm);
  border: 1px solid var(--lx-border);
  border-radius: var(--lx-radius-sm);
  background: var(--lx-bg-card);
  color: var(--lx-text-regular);
  cursor: pointer;
  font: inherit;
}

.transfer-panel-demo button:hover,
.transfer-panel-demo button[aria-pressed='true'] {
  border-color: var(--lx-color-primary);
  color: var(--lx-color-primary);
}

.transfer-panel-demo button:focus-visible,
.transfer-panel-demo input:focus-visible {
  outline: 2px solid var(--lx-color-primary);
  outline-offset: 2px;
}

.transfer-panel-demo label {
  display: inline-flex;
  min-height: 32px;
  align-items: center;
  gap: var(--lx-space-xs);
  padding-inline: var(--lx-space-xs);
}

.transfer-panel-demo input {
  accent-color: var(--lx-color-primary);
}

.transfer-panel-demo__status,
.transfer-panel-demo__summary,
.transfer-panel-demo__note {
  margin: 0;
  line-height: 20px;
}

.transfer-panel-demo__status,
.transfer-panel-demo__note {
  color: var(--lx-text-secondary);
}

.transfer-panel-demo__summary {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: var(--lx-space-xs) var(--lx-space-md);
}

.transfer-panel-demo__message {
  display: flex;
  min-height: 96px;
  align-items: center;
  justify-content: center;
  gap: var(--lx-space-sm);
  border: 1px solid var(--lx-border);
  color: var(--lx-text-secondary);
}

@media (max-width: 480px) {
  .transfer-panel-demo button,
  .transfer-panel-demo label {
    min-height: 44px;
  }
}
</style>
