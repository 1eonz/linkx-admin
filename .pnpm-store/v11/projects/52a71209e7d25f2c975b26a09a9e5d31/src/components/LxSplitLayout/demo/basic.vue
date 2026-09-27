<script setup lang="ts">
import { computed, ref } from 'vue'
import { LxSplitLayout } from '../../../index'

const asideWidth = ref(280)
const collapsed = ref(false)
const darkTheme = ref(false)
const activeUnit = ref('command')

const units = [
  { key: 'command', name: '市局指挥中心', count: 18 },
  { key: 'north', name: '北城勤务组', count: 12 },
  { key: 'south', name: '南城联勤组', count: 9 },
  { key: 'response', name: '快速响应队', count: 6 },
]

const people = [
  { name: '张晨', unit: '市局指挥中心', role: '值班长', state: '在岗' },
  { name: '王宁', unit: '北城勤务组', role: '调度员', state: '在岗' },
  { name: '李敏', unit: '南城联勤组', role: '联络员', state: '值班' },
  { name: '赵磊', unit: '快速响应队', role: '处置员', state: '在岗' },
]

const activeUnitName = computed(
  () => units.find((unit) => unit.key === activeUnit.value)?.name ?? '',
)
const layoutStatus = computed(
  () =>
    `侧栏 ${Math.round(asideWidth.value)} 像素 · ${collapsed.value ? '已收起' : '已展开'}`,
)

function onResize(value: number) {
  asideWidth.value = value
}
</script>

<template>
  <section class="lx-split-layout-demo" :class="{ 'lx-theme-hud': darkTheme }">
    <header class="lx-split-layout-demo__toolbar">
      <label>
        <input v-model="darkTheme" type="checkbox" aria-label="HUD 深色主题" />
        <span>HUD 深色主题</span>
      </label>
      <output data-testid="split-layout-status" aria-live="polite">{{
        layoutStatus
      }}</output>
    </header>

    <LxSplitLayout
      :aside-width="asideWidth"
      :collapsed="collapsed"
      class="lx-split-layout-demo__layout"
      resizable
      @resize="onResize"
      @update:collapsed="collapsed = $event"
    >
      <template #aside>
        <section class="lx-split-layout-demo__aside">
          <h3>组织单位</h3>
          <nav aria-label="组织单位">
            <button
              v-for="unit in units"
              :key="unit.key"
              type="button"
              :aria-pressed="activeUnit === unit.key"
              @click="activeUnit = unit.key"
            >
              <span>{{ unit.name }}</span>
              <span>{{ unit.count }}</span>
            </button>
          </nav>
        </section>
      </template>

      <section class="lx-split-layout-demo__main">
        <header>
          <div>
            <h3>人员名册</h3>
            <p>{{ activeUnitName }} · {{ people.length }} 人</p>
          </div>
          <output data-testid="split-layout-width"
            >{{ Math.round(asideWidth) }} px</output
          >
        </header>

        <div
          class="lx-split-layout-demo__table-wrap"
          role="region"
          aria-label="人员名册数据，可横向滚动"
          tabindex="0"
        >
          <table>
            <thead>
              <tr>
                <th scope="col">姓名</th>
                <th scope="col">所属单位</th>
                <th scope="col">岗位</th>
                <th scope="col">当前状态</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="person in people" :key="person.name">
                <td>{{ person.name }}</td>
                <td>{{ person.unit }}</td>
                <td>{{ person.role }}</td>
                <td>{{ person.state }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </LxSplitLayout>
  </section>
</template>

<style scoped>
.lx-split-layout-demo {
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--lx-border);
  background: var(--lx-bg-card);
  color: var(--lx-text-regular);
}

.lx-split-layout-demo__toolbar {
  display: flex;
  min-height: 48px;
  align-items: center;
  justify-content: space-between;
  gap: var(--lx-space-md);
  padding: var(--lx-space-sm) var(--lx-space-lg);
  border-bottom: 1px solid var(--lx-border-light);
}

.lx-split-layout-demo__toolbar label {
  display: inline-flex;
  min-height: 32px;
  align-items: center;
  gap: var(--lx-space-sm);
  color: var(--lx-text-primary);
  cursor: pointer;
}

.lx-split-layout-demo__toolbar input {
  width: 16px;
  height: 16px;
  accent-color: var(--lx-color-primary);
}

.lx-split-layout-demo__toolbar output {
  color: var(--lx-text-secondary);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}

.lx-split-layout-demo__layout {
  min-height: 360px;
  padding: var(--lx-space-lg);
}

.lx-split-layout-demo__aside {
  display: grid;
  gap: var(--lx-space-sm);
  padding-block: var(--lx-space-xs);
}

.lx-split-layout-demo h3 {
  margin: 0;
  color: var(--lx-text-primary);
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
}

.lx-split-layout-demo__aside nav {
  display: grid;
  gap: var(--lx-space-xs);
}

.lx-split-layout-demo__aside button {
  display: flex;
  min-width: 0;
  min-height: 40px;
  align-items: center;
  justify-content: space-between;
  gap: var(--lx-space-sm);
  padding: var(--lx-space-sm);
  border: 1px solid transparent;
  border-radius: var(--lx-radius-sm);
  background: transparent;
  color: var(--lx-text-regular);
  cursor: pointer;
  font: inherit;
  text-align: start;
}

.lx-split-layout-demo__aside button[aria-pressed='true'] {
  border-color: var(--lx-color-primary);
  background: var(--lx-color-primary-light);
  color: var(--lx-color-primary);
}

.lx-split-layout-demo__aside button:focus-visible,
.lx-split-layout-demo__table-wrap:focus-visible {
  outline: 2px solid var(--lx-color-primary);
  outline-offset: 2px;
}

.lx-split-layout-demo__aside button span:first-child {
  overflow-wrap: anywhere;
}

.lx-split-layout-demo__aside button span:last-child {
  color: var(--lx-text-secondary);
  font-variant-numeric: tabular-nums;
}

.lx-split-layout-demo__main {
  min-width: 0;
}

.lx-split-layout-demo__main > header {
  display: flex;
  min-height: 48px;
  align-items: center;
  justify-content: space-between;
  gap: var(--lx-space-md);
  margin-bottom: var(--lx-space-md);
}

.lx-split-layout-demo__main p {
  margin: var(--lx-space-xs) 0 0;
  color: var(--lx-text-secondary);
  font-size: 12px;
}

.lx-split-layout-demo__main output {
  color: var(--lx-text-secondary);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}

.lx-split-layout-demo__table-wrap {
  max-width: 100%;
  overflow: auto;
  border: 1px solid var(--lx-border);
}

.lx-split-layout-demo table {
  width: 100%;
  min-width: 520px;
  border-collapse: collapse;
  font-size: 13px;
  text-align: start;
}

.lx-split-layout-demo th,
.lx-split-layout-demo td {
  height: 40px;
  padding: 0 var(--lx-space-md);
  border-bottom: 1px solid var(--lx-border-light);
  white-space: nowrap;
}

.lx-split-layout-demo th {
  background: var(--lx-bg-table-header);
  color: var(--lx-text-primary);
  font-weight: 600;
}

.lx-split-layout-demo tr:last-child td {
  border-bottom: 0;
}

@media (max-width: 767px) {
  .lx-split-layout-demo__toolbar {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
