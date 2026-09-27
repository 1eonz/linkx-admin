<script setup lang="ts">
import { computed, ref } from 'vue'
import { LxDutyCalendar, type LxDutyShift } from '../../../index'

type DemoState = 'ready' | 'empty' | 'loading' | 'error' | 'disabled'

function currentMonth() {
  const today = new Date()
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
}

const month = ref(currentMonth())
const state = ref<DemoState>('ready')
const weekStart = ref<0 | 1>(1)
const customCell = ref(false)
const darkTheme = ref(false)
const lastAction = ref('尚未操作')

const sampleShifts = computed<LxDutyShift[]>(() => [
  { date: `${month.value}-05`, label: '早班', status: 'online', count: 8 },
  { date: `${month.value}-05`, label: '中班', status: 'busy', count: 5 },
  { date: `${month.value}-05`, label: '夜班', status: 'processing', count: 3 },
  { date: `${month.value}-05`, label: '机动', status: 'offline', count: 2 },
  { date: `${month.value}-12`, label: '早班', status: 'online', count: 6 },
  { date: `${month.value}-19`, label: '夜班', status: 'error', count: 2 },
])
const visibleShifts = computed(() =>
  state.value === 'empty' ? [] : sampleShifts.value,
)
const inertCalendar = computed(
  () => state.value === 'loading' || state.value === 'disabled',
)

function onMonthUpdate(value: string) {
  lastAction.value = `显示月份：${value}`
}

function onDateClick(value: string) {
  lastAction.value = `选择日期：${value}`
}

function onShiftClick(shift: LxDutyShift) {
  lastAction.value = `选择班次：${shift.date}，${shift.label}`
}

function retry() {
  state.value = 'ready'
  lastAction.value = '本地样例已恢复'
}
</script>

<template>
  <section class="lx-duty-calendar-demo" :class="{ 'lx-theme-hud': darkTheme }">
    <div class="lx-duty-calendar-demo__toolbar">
      <label>
        <span>宿主数据状态</span>
        <select v-model="state" aria-label="宿主数据状态">
          <option value="ready">正常数据</option>
          <option value="empty">空数据</option>
          <option value="loading">加载中</option>
          <option value="error">读取失败</option>
          <option value="disabled">只读</option>
        </select>
      </label>

      <label>
        <span>每周起始</span>
        <select v-model="weekStart" aria-label="每周起始">
          <option :value="1">周一</option>
          <option :value="0">周日</option>
        </select>
      </label>

      <label class="lx-duty-calendar-demo__check">
        <input
          v-model="customCell"
          type="checkbox"
          aria-label="自定义单元格内容"
        />
        <span>自定义单元格内容</span>
      </label>

      <label class="lx-duty-calendar-demo__check">
        <input v-model="darkTheme" type="checkbox" aria-label="HUD 深色主题" />
        <span>HUD 深色主题</span>
      </label>

      <output data-testid="duty-calendar-last-action" aria-live="polite">{{
        lastAction
      }}</output>
    </div>

    <p
      v-if="state === 'empty'"
      class="lx-duty-calendar-demo__message"
      role="status"
    >
      本月暂无排班数据，日期导航仍可使用。
    </p>
    <p
      v-else-if="state === 'loading'"
      class="lx-duty-calendar-demo__message"
      role="status"
    >
      正在读取排班数据……
    </p>
    <p
      v-else-if="state === 'disabled'"
      class="lx-duty-calendar-demo__message"
      role="status"
    >
      宿主将日历设为只读；示例用 inert 阻止后代交互，组件本身不提供 disabled
      属性。
    </p>

    <div
      v-if="state !== 'error'"
      class="lx-duty-calendar-demo__stage"
      :aria-busy="state === 'loading' ? 'true' : undefined"
      :aria-disabled="state === 'disabled' ? 'true' : undefined"
      :inert="inertCalendar"
    >
      <LxDutyCalendar
        v-if="!customCell"
        v-model:month="month"
        :shifts="visibleShifts"
        :week-start="weekStart"
        @update:month="onMonthUpdate"
        @cell-click="onDateClick"
        @shift-click="onShiftClick"
      />
      <LxDutyCalendar
        v-else
        v-model:month="month"
        :shifts="visibleShifts"
        :week-start="weekStart"
        @update:month="onMonthUpdate"
        @cell-click="onDateClick"
        @shift-click="onShiftClick"
      >
        <template #cell="{ shifts }">
          <div class="lx-duty-calendar-demo__custom-cell">
            <span
              v-for="(shift, index) in shifts.slice(0, 3)"
              :key="`${shift.date}-${shift.label}-${index}`"
              class="lx-duty-calendar-demo__custom-shift"
            >
              {{ shift.label }}
            </span>
          </div>
        </template>
      </LxDutyCalendar>
    </div>

    <div v-else class="lx-duty-calendar-demo__error" role="alert">
      <p>日历数据读取失败。当前组件不请求数据，请由宿主重试查询。</p>
      <button type="button" @click="retry">重试本地示例</button>
    </div>
  </section>
</template>

<style scoped>
.lx-duty-calendar-demo {
  display: grid;
  min-width: 0;
  gap: var(--lx-space-md);
  padding: var(--lx-space-lg);
  border: 1px solid var(--lx-border);
  background: var(--lx-bg-card);
  color: var(--lx-text-regular);
}

.lx-duty-calendar-demo__toolbar {
  display: flex;
  min-width: 0;
  align-items: end;
  flex-wrap: wrap;
  gap: var(--lx-space-sm) var(--lx-space-lg);
}

.lx-duty-calendar-demo__toolbar label {
  display: grid;
  min-width: 132px;
  gap: var(--lx-space-xs);
  color: var(--lx-text-regular);
  font-size: 12px;
}

.lx-duty-calendar-demo__toolbar select {
  min-width: 0;
  min-height: 36px;
  padding-inline: var(--lx-space-sm);
  border: 1px solid var(--lx-border);
  border-radius: var(--lx-radius-sm);
  background: var(--lx-bg-card);
  color: var(--lx-text-primary);
  font: inherit;
}

.lx-duty-calendar-demo__toolbar select:focus-visible,
.lx-duty-calendar-demo__error button:focus-visible {
  outline: 2px solid var(--lx-color-primary);
  outline-offset: 2px;
}

.lx-duty-calendar-demo__toolbar .lx-duty-calendar-demo__check {
  display: inline-flex;
  min-height: 36px;
  align-items: center;
  gap: var(--lx-space-sm);
  cursor: pointer;
}

.lx-duty-calendar-demo__check input {
  width: 16px;
  height: 16px;
  accent-color: var(--lx-color-primary);
}

.lx-duty-calendar-demo__toolbar output {
  min-height: 36px;
  align-content: center;
  color: var(--lx-text-regular);
  font-size: 12px;
}

.lx-duty-calendar-demo__message {
  margin: 0;
  color: var(--lx-text-regular);
  font-size: 13px;
}

.lx-duty-calendar-demo__stage {
  min-width: 0;
  max-width: 100%;
}

.lx-duty-calendar-demo__error {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--lx-space-md);
  padding: var(--lx-space-md);
  border: 1px solid var(--lx-color-error);
  border-radius: var(--lx-radius-sm);
  background: var(--lx-color-error-light);
  color: var(--lx-text-primary);
}

.lx-duty-calendar-demo__error p {
  margin: 0;
}

.lx-duty-calendar-demo__error button {
  min-width: 88px;
  min-height: 40px;
  padding-inline: var(--lx-space-md);
  border: 1px solid var(--lx-border);
  border-radius: var(--lx-radius-sm);
  background: var(--lx-bg-card);
  color: var(--lx-text-primary);
  cursor: pointer;
  font: inherit;
}

.lx-duty-calendar-demo__custom-cell {
  display: grid;
  gap: var(--lx-space-xs);
}

.lx-duty-calendar-demo__custom-shift {
  overflow: hidden;
  color: var(--lx-text-regular);
  font-size: 10px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 767px) {
  .lx-duty-calendar-demo {
    padding: var(--lx-space-sm);
  }

  .lx-duty-calendar-demo__toolbar output {
    flex-basis: 100%;
  }
}
</style>
