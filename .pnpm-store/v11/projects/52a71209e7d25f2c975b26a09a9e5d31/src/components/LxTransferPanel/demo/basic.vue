<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import { LxTransferPanel, type LxTransferPanelNode } from '../../../index'

type HostState = 'ready' | 'loading' | 'error' | 'empty'

const hostState = ref<HostState>('ready')
const selectedKeys = ref<(string | number)[]>([
  'org-01',
  'unit-01',
  'unit-02',
  'legacy-unit-08',
])
const maxCountEnabled = ref(true)
const panelHeight = ref(240)
const darkTheme = ref(false)
const inheritChild = ref(true)
const inheritDescriptionProvided = ref(true)
const lastAction = ref('已载入组织权限数据')
const undoKeys = ref<(string | number)[] | null>(null)
const lastNonEmptySelection = ref<(string | number)[]>([...selectedKeys.value])
const GROUP_COUNT = 20
const CHILD_COUNT = 70

const treeData: LxTransferPanelNode[] = [
  {
    id: 'org-01',
    label: '市公安局指挥中心',
    code: 'ORG-01',
    status: 'online',
    statusTone: 'success',
    children: [
      {
        id: 'unit-01',
        label: '情指行一体化研判调度专班',
        code: 'DEPT-03',
        status: 'online',
        statusTone: 'success',
      },
      {
        id: 'unit-02',
        label: '交警直属特勤一中队',
        code: 'TRF-101',
        status: 'processing',
        statusTone: 'processing',
      },
      {
        id: 'unit-03',
        label: '站前路派出所综合作战室',
        code: 'SUB-22',
        status: 'busy',
        statusTone: 'warning',
      },
      {
        id: 'unit-locked',
        label: '受限巡检单位',
        code: 'RESTRICTED',
        status: 'offline',
        statusTone: 'offline',
        disabled: true,
      },
      ...Array.from({ length: CHILD_COUNT - 4 }, (_, index) => {
        const sequence = String(index + 1).padStart(2, '0')
        const assignable = index === 0
        return {
          id: `archive-unit-${sequence}`,
          label: assignable ? '待授权特勤支队' : `历史归档单位 ${sequence}`,
          code: assignable ? 'UNIT-PENDING-01' : `ARCHIVE-${sequence}`,
          status: assignable ? 'online' : 'offline',
          statusTone: assignable ? ('success' as const) : ('offline' as const),
          disabled: !assignable,
        }
      }),
    ],
  },
  ...Array.from({ length: GROUP_COUNT - 1 }, (_, index) => {
    const group = index + 2
    const groupSequence = String(group).padStart(2, '0')
    return {
      id: `division-${groupSequence}`,
      label: `历史归档机构 ${groupSequence}`,
      code: `ORG-${groupSequence}`,
      status: 'offline',
      statusTone: 'offline' as const,
      disabled: true,
      children: Array.from({ length: CHILD_COUNT }, (_, childIndex) => {
        const childSequence = String(childIndex + 1).padStart(3, '0')
        return {
          id: `division-${groupSequence}-unit-${childSequence}`,
          label: `历史归档机构 ${groupSequence} 单位 ${childSequence}`,
          code: `D${groupSequence}-${childSequence}`,
          status: 'offline',
          statusTone: 'offline' as const,
          disabled: true,
        }
      }),
    }
  }),
]
const selectedItems = [
  {
    id: 'org-01',
    label: '市公安局指挥中心',
    code: 'ORG-01',
    status: 'online',
    statusTone: 'success',
  },
  {
    id: 'unit-01',
    label: '情指行一体化研判调度专班',
    code: 'DEPT-03',
    status: 'online',
    statusTone: 'success',
  },
  {
    id: 'unit-02',
    label: '交警直属特勤一中队',
    code: 'TRF-101',
    status: 'processing',
    statusTone: 'processing',
  },
  {
    id: 'unit-03',
    label: '站前路派出所综合作战室',
    code: 'SUB-22',
    status: 'busy',
    statusTone: 'warning',
  },
  {
    id: 'legacy-unit-08',
    label:
      '历史授权单位（记录中）：跨区域应急联动研判与协同处置权限，含历史组织关系核对、跨年度授权变更追踪、部门编码映射、责任单位复核及档案留痕审计记录与例外规则审批流程',
    code: 'LEGACY-08',
    status: 'offline',
    statusTone: 'offline',
  },
] satisfies LxTransferPanelNode[]

const expandedGroupKeys = treeData.map((node) => node.id)
const visibleTreeData = computed(() =>
  hostState.value === 'empty' ? [] : treeData,
)
watch(selectedKeys, (value, previousValue) => {
  if (value.length) {
    lastNonEmptySelection.value = [...value]
    if (undoKeys.value && value !== previousValue) undoKeys.value = null
  }
})

function setHostState(state: HostState) {
  hostState.value = state
  lastAction.value = {
    ready: '已载入组织权限数据',
    loading: '宿主正在加载组织权限数据',
    error: '组织权限数据加载失败，可重试',
    empty: '宿主返回了空树数据',
  }[state]
}

function onChange(keys: (string | number)[], nodes: LxTransferPanelNode[]) {
  lastAction.value = `选中 ${keys.length} 项；当前树中可解析 ${nodes.length} 个节点`
}

function onClearAll() {
  undoKeys.value = [...lastNonEmptySelection.value]
  lastAction.value = '已清空全部选中项，可撤销'
}

function undoClear() {
  if (!undoKeys.value) return
  selectedKeys.value = [...undoKeys.value]
  undoKeys.value = null
  lastAction.value = '已恢复清空前的选中项'
}

function onInheritChange(value: boolean) {
  inheritChild.value = value
  lastAction.value = value ? '已保留下级继承授权' : '已关闭下级继承授权'
}
</script>

<template>
  <div class="transfer-panel-demo">
    <details class="transfer-panel-demo__settings">
      <summary>示例状态与主题</summary>
      <div class="transfer-panel-demo__toolbar">
        <div
          class="transfer-panel-demo__toolbar-group"
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
        </div>
        <div
          class="transfer-panel-demo__toolbar-group"
          role="group"
          aria-label="示例参数"
        >
          <label
            ><input v-model="maxCountEnabled" type="checkbox" /> 最多 5
            项</label
          >
          <label
            ><input v-model="darkTheme" type="checkbox" /> HUD 深色主题</label
          >
          <label
            ><input v-model="inheritDescriptionProvided" type="checkbox" />
            提供继承说明</label
          >
        </div>
      </div>
    </details>

    <div
      class="transfer-panel-demo__toolbar-group transfer-panel-demo__height-control"
      role="group"
      aria-label="面板预览高度"
    >
      <label>
        面板高度
        <select v-model.number="panelHeight" aria-label="面板高度">
          <option :value="240">紧凑 240px（默认）</option>
          <option :value="300">适中 300px</option>
          <option :value="380">标准 380px</option>
        </select>
      </label>
    </div>

    <div
      class="transfer-panel-demo__status"
      data-testid="transfer-status"
      aria-live="polite"
    >
      <span>{{ lastAction }}</span>
      <button v-if="undoKeys" type="button" @click="undoClear">撤销清空</button>
    </div>

    <div
      class="transfer-panel-demo__preview"
      :class="{ 'lx-theme-hud': darkTheme }"
    >
      <div
        class="transfer-panel-demo__surface"
        :class="{
          'is-blocked': hostState === 'loading' || hostState === 'error',
        }"
        :aria-busy="hostState === 'loading' ? 'true' : undefined"
      >
        <LxTransferPanel
          v-model="selectedKeys"
          :tree-data="visibleTreeData"
          :selected-items="selectedItems"
          :titles="['组织与数据权限树（待选）', '已选数据权限清单']"
          :panel-height="panelHeight"
          :max-count="maxCountEnabled ? 5 : undefined"
          :default-expanded-keys="expandedGroupKeys"
          :inherit-child="inheritChild"
          :inherit-child-description="
            inheritDescriptionProvided
              ? '示例：直属下级继承，关闭后仅保留本级。'
              : undefined
          "
          :inert="hostState === 'loading' || hostState === 'error'"
          @change="onChange"
          @clear-all="onClearAll"
          @update:inherit-child="onInheritChange"
        />
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
          <span>组织权限数据加载失败，当前选择仍然保留。</span>
          <button type="button" @click="setHostState('ready')">重试</button>
        </div>
      </div>
    </div>

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

.transfer-panel-demo__toolbar-group {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--lx-space-xs);
}

.transfer-panel-demo__height-control {
  width: fit-content;
}

.transfer-panel-demo__settings {
  border: 1px solid var(--lx-border);
  border-radius: var(--lx-radius-sm);
  background: var(--lx-bg-card);
}

.transfer-panel-demo__settings summary {
  min-height: 36px;
  box-sizing: border-box;
  margin: 0;
  padding: 8px var(--lx-space-sm);
  color: var(--lx-text-primary);
  cursor: pointer;
  font-weight: 600;
}

.transfer-panel-demo__settings[open] summary {
  border-bottom: 1px solid var(--lx-border-light);
}

.transfer-panel-demo__settings .transfer-panel-demo__toolbar {
  padding: var(--lx-space-sm);
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
.transfer-panel-demo input:focus-visible,
.transfer-panel-demo select:focus-visible {
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

.transfer-panel-demo select {
  min-height: 28px;
  padding: 2px var(--lx-space-xs);
  border: 1px solid var(--lx-border);
  border-radius: var(--lx-radius-sm);
  background: var(--lx-bg-card);
  color: var(--lx-text-regular);
  font: inherit;
}

.transfer-panel-demo__status,
.transfer-panel-demo__summary,
.transfer-panel-demo__note {
  margin: 0;
  line-height: 20px;
}

.transfer-panel-demo__status {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: var(--lx-space-sm);
}

.transfer-panel-demo__status button {
  min-height: 28px;
  padding: 2px var(--lx-space-sm);
  color: var(--lx-color-primary);
  font-size: 12px;
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

.transfer-panel-demo__surface {
  position: relative;
  display: grid;
  min-width: 0;
  max-width: 820px;
  margin-inline: auto;
  gap: var(--lx-space-sm);
}

.transfer-panel-demo__preview.lx-theme-hud {
  background: var(--lx-bg-page);
}

.transfer-panel-demo__surface.is-blocked :deep(.lx-transfer-panel) {
  pointer-events: none;
}

.transfer-panel-demo__surface.is-blocked :deep(.lx-transfer-panel button),
.transfer-panel-demo__surface.is-blocked :deep(.lx-transfer-panel input),
.transfer-panel-demo__surface.is-blocked
  :deep(.lx-transfer-panel [role='button']) {
  opacity: 0.55;
}

.transfer-panel-demo__note {
  padding: var(--lx-space-sm) var(--lx-space-md);
  border: 1px solid var(--lx-border);
  border-radius: var(--lx-radius-sm);
  background: var(--lx-bg-card);
}

.transfer-panel-demo__message {
  display: flex;
  min-height: 40px;
  align-items: center;
  justify-content: center;
  gap: var(--lx-space-sm);
  padding: var(--lx-space-md);
  border: 1px solid var(--lx-border);
  border-radius: var(--lx-radius-sm);
  background: var(--lx-bg-card-hover);
  color: var(--lx-text-secondary-strong);
  text-align: center;
}

@media (max-width: 480px) {
  .transfer-panel-demo button,
  .transfer-panel-demo label {
    min-height: 44px;
  }

  .transfer-panel-demo__header-actions button {
    min-width: 44px;
  }
}
</style>
