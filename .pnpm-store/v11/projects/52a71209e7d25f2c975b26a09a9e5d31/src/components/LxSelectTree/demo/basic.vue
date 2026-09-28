<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { LxSelectTree, type LxTreeNode } from '../../../index'

const tree: LxTreeNode[] = [
  {
    key: 'hz',
    title: '杭州市公安局',
    children: [
      {
        key: 'bj',
        title: '滨江分局',
        status: 'online',
        children: [
          { key: 'bj-1', title: '长河派出所' },
          { key: 'bj-2', title: '西兴派出所', status: 'busy' },
        ],
      },
      {
        key: 'gx',
        title: '高新园区分局（懒加载）',
        hasChildren: true,
        status: 'processing',
      },
      { key: 'locked', title: '离线专网（禁用）', disabled: true },
    ],
  },
  {
    key: 'nb',
    title: '宁波市公安局',
    children: [
      {
        key: 'yz',
        title: '鄞州分局',
        children: [{ key: 'yz-1', title: '首南派出所' }],
      },
    ],
  },
]
const checkedKeys = ref<(string | number)[]>(['bj-1'])
const expandedKeys = ['hz', 'bj']
const showEmpty = ref(false)
const themeRoot =
  typeof document === 'undefined' ? undefined : document.documentElement
const hud = ref(themeRoot?.classList.contains('lx-theme-hud') ?? false)
const originalDark = themeRoot?.classList.contains('dark') ?? false
const originalHud = themeRoot?.classList.contains('lx-theme-hud') ?? false
const visibleTree = computed(() => (showEmpty.value ? [] : tree))
const failedOnce = new Set<string | number>()
const pendingTimers = new Set<ReturnType<typeof setTimeout>>()

function loadChildren(node: LxTreeNode): Promise<LxTreeNode[]> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pendingTimers.delete(timer)
      if (node.key === 'gx' && !failedOnce.has(node.key)) {
        failedOnce.add(node.key)
        reject(new Error('模拟的首次加载失败'))
        return
      }

      resolve([
        { key: `${node.key}-a`, title: '科技城派出所' },
        { key: `${node.key}-b`, title: '白杨派出所', status: 'online' },
      ])
    }, 280)
    pendingTimers.add(timer)
  })
}

function applyHud(enabled: boolean): void {
  if (!themeRoot) return
  themeRoot.classList.toggle('dark', enabled || originalDark)
  themeRoot.classList.toggle('lx-theme-hud', enabled)
}

watch(hud, applyHud)

onBeforeUnmount(() => {
  pendingTimers.forEach(clearTimeout)
  pendingTimers.clear()
  themeRoot?.classList.toggle('dark', originalDark)
  themeRoot?.classList.toggle('lx-theme-hud', originalHud)
})
</script>

<template>
  <section class="lx-select-tree-demo">
    <div class="lx-select-tree-demo__toolbar">
      <label>
        <input v-model="hud" type="checkbox" />
        HUD 深色
      </label>
      <button type="button" @click="showEmpty = !showEmpty">
        {{ showEmpty ? '返回组织目录' : '查看空目录' }}
      </button>
    </div>
    <output class="lx-select-tree-demo__selection" aria-live="polite">
      已选节点：{{ checkedKeys.join('、') || '无' }}
    </output>
    <LxSelectTree
      v-model:checked-keys="checkedKeys"
      :data="visibleTree"
      :expanded-keys="expandedKeys"
      :lazy="loadChildren"
      :height="300"
      style="max-width: 360px"
    />
  </section>
</template>

<style scoped>
.lx-select-tree-demo {
  display: grid;
  gap: 12px;
  max-width: 360px;
}

.lx-select-tree-demo__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.lx-select-tree-demo__toolbar label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.lx-select-tree-demo__toolbar button {
  min-height: 32px;
  padding: 0 10px;
  border: 1px solid var(--lx-border);
  border-radius: var(--lx-radius-sm);
  background: var(--lx-bg-card);
  color: var(--lx-text-regular);
  cursor: pointer;
}

.lx-select-tree-demo__toolbar button:focus-visible,
.lx-select-tree-demo__toolbar input:focus-visible {
  outline: 2px solid var(--lx-color-primary);
  outline-offset: 2px;
}

.lx-select-tree-demo__selection {
  color: var(--lx-text-secondary);
  font-size: 12px;
}
</style>
