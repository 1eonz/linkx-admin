<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { LxDescriptions, type LxDescriptionItem } from '../../../index'

type PreviewState = 'ready' | 'loading' | 'empty' | 'error'

const previewStates = [
  { value: 'ready', label: '详情' },
  { value: 'loading', label: '读取中' },
  { value: 'empty', label: '空结果' },
  { value: 'error', label: '错误' },
] as const
const layout = ref<'two-ends' | 'grid'>('two-ends')
const bordered = ref(false)
const hudTheme = ref(false)
const previewState = ref<PreviewState>('ready')
let originalDark = false
let originalHud = false

const items: LxDescriptionItem[] = [
  { key: 'name', label: '姓名', value: '孙志国' },
  { key: 'policeId', label: '警号', value: '005882', copyable: true },
  { key: 'phone', label: '联系电话', value: '138-0010-8921' },
  {
    key: 'organization',
    label: '所属组织',
    value: '市局指挥中心 / 联合情报研判战队',
    span: 2,
  },
  { key: 'role', label: '角色分配', value: '一级协同 / 系统副管理员' },
  {
    key: 'status',
    label: '运行状态',
    value: '在线（在岗备勤），当前负责跨辖区视频联动与加密调度',
    statusDot: 'online',
  },
  { key: 'createdAt', label: '创建时间', value: '2026-09-22 14:35:10' },
  {
    key: 'deviceCode',
    label: '设备标识',
    value: 'GB28181-P2P-EDGE-NODE-20261007-00000001-REGION-OPS',
    copyable: true,
    span: 2,
  },
  {
    key: 'remarks',
    label: '业务备注',
    value: '重点高架合流区视频快反联动专员，具有跨网段加密调度二级权限。',
    span: 2,
  },
]

const drawerItems = items.slice(0, 6)

function setTheme(enabled: boolean) {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('dark', enabled || originalDark)
  document.documentElement.classList.toggle(
    'lx-theme-hud',
    enabled || originalHud,
  )
}

watch(hudTheme, setTheme)

onMounted(() => {
  originalDark = document.documentElement.classList.contains('dark')
  originalHud = document.documentElement.classList.contains('lx-theme-hud')
  setTheme(hudTheme.value)
})

onBeforeUnmount(() => {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('dark', originalDark)
  document.documentElement.classList.toggle('lx-theme-hud', originalHud)
})
</script>

<template>
  <section class="lx-descriptions-demo" aria-label="详情描述示例">
    <div class="lx-descriptions-demo__controls">
      <div
        class="lx-descriptions-demo__segmented"
        role="group"
        aria-label="详情布局"
      >
        <button
          type="button"
          :aria-pressed="layout === 'two-ends'"
          @click="layout = 'two-ends'"
        >
          单列
        </button>
        <button
          type="button"
          :aria-pressed="layout === 'grid'"
          @click="layout = 'grid'"
        >
          双列
        </button>
      </div>
      <label class="lx-descriptions-demo__toggle">
        <input v-model="bordered" type="checkbox" />
        网格边框
      </label>
      <label class="lx-descriptions-demo__toggle">
        <input v-model="hudTheme" type="checkbox" />
        HUD 深色主题（整页）
      </label>
      <div
        class="lx-descriptions-demo__segmented"
        role="group"
        aria-label="数据状态"
      >
        <button
          v-for="state in previewStates"
          :key="state.value"
          type="button"
          :aria-pressed="previewState === state.value"
          @click="previewState = state.value"
        >
          {{ state.label }}
        </button>
      </div>
    </div>

    <div v-if="previewState === 'ready'" class="lx-descriptions-demo__main">
      <LxDescriptions
        :items="items"
        :columns="2"
        :layout="layout"
        :bordered="bordered"
        :label-width="layout === 'grid' ? 96 : undefined"
      >
        <template #item-role="{ value }">
          <span class="lx-descriptions-demo__role-value">{{ value }}</span>
        </template>
      </LxDescriptions>
    </div>
    <p
      v-else-if="previewState === 'loading'"
      class="lx-descriptions-demo__state"
      role="status"
      aria-busy="true"
    >
      正在读取详情…
    </p>
    <div
      v-else-if="previewState === 'empty'"
      class="lx-descriptions-demo__state"
      role="status"
    >
      暂无可展示的详情。
    </div>
    <div v-else class="lx-descriptions-demo__state is-error" role="alert">
      <span>详情读取失败。</span>
      <button type="button" @click="previewState = 'ready'">重试</button>
    </div>

    <section class="lx-descriptions-demo__drawer" aria-label="480 像素详情抽屉">
      <h3>人员档案</h3>
      <LxDescriptions
        :items="drawerItems"
        layout="two-ends"
        :label-width="88"
      />
    </section>
  </section>
</template>

<style scoped>
.lx-descriptions-demo {
  display: grid;
  width: 100%;
  max-width: 820px;
  min-width: 0;
  grid-template-columns: minmax(0, 1fr);
  gap: 20px;
  color: var(--lx-text-primary);
}

.lx-descriptions-demo__controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.lx-descriptions-demo__segmented {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 3px;
  border: 1px solid var(--lx-border);
  border-radius: var(--lx-radius-sm);
  background: var(--lx-bg-card);
}

.lx-descriptions-demo__segmented button,
.lx-descriptions-demo__state button {
  min-height: 44px;
  padding: 0 10px;
  border: 0;
  border-radius: var(--lx-radius-sm);
  background: transparent;
  color: var(--lx-text-regular);
  cursor: pointer;
  font: inherit;
}

.lx-descriptions-demo__segmented button[aria-pressed='true'] {
  background: var(--lx-color-primary-light);
  color: var(--lx-color-primary);
}

.lx-descriptions-demo__toggle {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  gap: 8px;
  color: var(--lx-text-regular);
  font-size: 13px;
}

.lx-descriptions-demo__toggle input {
  accent-color: var(--lx-color-primary);
}

.lx-descriptions-demo__main {
  min-width: 0;
}

.lx-descriptions-demo__state {
  display: flex;
  min-height: 64px;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin: 0;
  border-block: 1px solid var(--lx-border-light);
  color: var(--lx-text-secondary);
}

.lx-descriptions-demo__state.is-error {
  color: var(--lx-color-error-strong);
}

.lx-descriptions-demo__state button {
  border: 1px solid var(--lx-border);
  background: var(--lx-bg-card);
  color: var(--lx-text-primary);
}

.lx-descriptions-demo__drawer {
  width: min(480px, 100%);
  max-width: 100%;
  box-sizing: border-box;
  min-width: 0;
  justify-self: end;
  padding: 16px;
  border: 1px solid var(--lx-border-light);
  background: var(--lx-bg-card);
}

.lx-descriptions-demo__drawer h3 {
  margin: 0 0 12px;
  font-size: 14px;
  line-height: 20px;
}

.lx-descriptions-demo__role-value {
  display: inline-flex;
  max-width: 100%;
  align-items: center;
  min-width: 0;
  overflow: hidden;
  padding: 0 6px;
  border: 1px solid var(--lx-color-primary-light);
  border-radius: var(--lx-radius-sm);
  background: var(--lx-color-primary-light);
  color: var(--lx-color-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.lx-descriptions-demo__segmented button:focus-visible,
.lx-descriptions-demo__state button:focus-visible,
.lx-descriptions-demo__toggle input:focus-visible {
  outline: 2px solid var(--lx-color-primary);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .lx-descriptions-demo__segmented button,
  .lx-descriptions-demo__state button {
    transition: none;
  }
}

@media (max-width: 600px) {
  .lx-descriptions-demo__drawer {
    justify-self: stretch;
    padding: 12px;
  }
}
</style>
