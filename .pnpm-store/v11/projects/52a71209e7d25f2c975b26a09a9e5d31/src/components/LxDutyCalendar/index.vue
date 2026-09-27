<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import type { LxStatus } from '../../tokens'
import LxIcon from '../LxIcon/index.vue'
import LxStatusDot from '../LxStatusDot/index.vue'
import type { LxDutyCalendarProps, LxDutyShift } from './types'

interface CalendarCell {
  date: string
  day: number
  inMonth: boolean
  isToday: boolean
  shifts: LxDutyShift[]
}

defineOptions({ name: 'LxDutyCalendar' })

const props = withDefaults(defineProps<LxDutyCalendarProps>(), {
  month: '',
  shifts: () => [],
  weekStart: 1,
})

const emit = defineEmits<{
  'update:month': [month: string]
  'cell-click': [date: string]
  'shift-click': [shift: LxDutyShift]
}>()

function createDate(year: number, month: number, day: number) {
  const date = new Date(0)
  date.setFullYear(year, month - 1, day)
  date.setHours(0, 0, 0, 0)
  return date
}

function monthString(date: Date) {
  return `${String(date.getFullYear()).padStart(4, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function parseMonth(value: string) {
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(value)
  if (match) return createDate(Number(match[1]), Number(match[2]), 1)
  const today = new Date()
  return createDate(today.getFullYear(), today.getMonth() + 1, 1)
}

function dateString(date: Date) {
  return `${monthString(date)}-${String(date.getDate()).padStart(2, '0')}`
}

function dateFromString(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return createDate(year, month, day)
}

function normalizedMonth(value: string) {
  return monthString(parseMonth(value))
}

const viewMonth = ref(
  props.month ? normalizedMonth(props.month) : monthString(new Date()),
)
const rootRef = ref<HTMLElement>()
const focusedDate = ref('')
watch(
  () => props.month,
  (value) => {
    viewMonth.value = value ? normalizedMonth(value) : monthString(new Date())
  },
)

const weekDays = computed(() =>
  props.weekStart === 1
    ? ['一', '二', '三', '四', '五', '六', '日']
    : ['日', '一', '二', '三', '四', '五', '六'],
)
const shiftsByDate = computed(() => {
  const map = new Map<string, LxDutyShift[]>()
  props.shifts.forEach((shift) =>
    map.set(shift.date, [...(map.get(shift.date) ?? []), shift]),
  )
  return map
})

const cells = computed<CalendarCell[]>(() => {
  const first = parseMonth(viewMonth.value)
  const firstWeekday = first.getDay()
  const offset = (firstWeekday - props.weekStart + 7) % 7
  const start = createDate(
    first.getFullYear(),
    first.getMonth() + 1,
    first.getDate() - offset,
  )
  const today = new Date()
  const todayKey = dateString(today)

  return Array.from({ length: 42 }, (_, index) => {
    const date = createDate(
      start.getFullYear(),
      start.getMonth() + 1,
      start.getDate() + index,
    )
    const key = dateString(date)
    return {
      date: key,
      day: date.getDate(),
      inMonth:
        date.getFullYear() === first.getFullYear() &&
        date.getMonth() === first.getMonth(),
      isToday: key === todayKey,
      shifts: shiftsByDate.value.get(key) ?? [],
    }
  })
})

const weeks = computed(() =>
  Array.from({ length: 6 }, (_, index) =>
    cells.value.slice(index * 7, index * 7 + 7),
  ),
)
const tabStopDate = computed(() =>
  cells.value.some((cell) => cell.date === focusedDate.value)
    ? focusedDate.value
    : cells.value[0]?.date,
)

function moveMonth(amount: number) {
  const date = parseMonth(viewMonth.value)
  date.setMonth(date.getMonth() + amount)
  const next = monthString(date)
  viewMonth.value = next
  emit('update:month', next)
}

function statusOf(shift: LxDutyShift): LxStatus {
  return shift.status ?? 'processing'
}

function cellTabIndex(date: string): number {
  return tabStopDate.value === date ? 0 : -1
}

function focusDate(date: Date) {
  const key = dateString(date)
  const nextMonth = monthString(date)
  if (nextMonth !== viewMonth.value) {
    viewMonth.value = nextMonth
    emit('update:month', nextMonth)
  }
  focusedDate.value = key
  nextTick(() => {
    ;[
      ...(rootRef.value?.querySelectorAll<HTMLElement>('[data-lx-duty-date]') ??
        []),
    ]
      .find((element) => element.dataset.lxDutyDate === key)
      ?.focus()
  })
}

function onCellKeydown(event: KeyboardEvent, dateKey: string) {
  const date = dateFromString(dateKey)
  const movement: Record<string, number> = {
    ArrowLeft: -1,
    ArrowRight: 1,
    ArrowUp: -7,
    ArrowDown: 7,
  }
  if (event.key in movement) {
    event.preventDefault()
    date.setDate(date.getDate() + movement[event.key])
    focusDate(date)
    return
  }
  if (event.key === 'Home' || event.key === 'End') {
    event.preventDefault()
    const offset = (date.getDay() - props.weekStart + 7) % 7
    date.setDate(date.getDate() - offset + (event.key === 'End' ? 6 : 0))
    focusDate(date)
  } else if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    emit('cell-click', dateKey)
  }
}

function stopCellNavigation(event: KeyboardEvent) {
  event.stopPropagation()
}
</script>

<template>
  <section ref="rootRef" class="lx-duty-calendar" aria-label="排班日历">
    <header class="lx-duty-calendar__header">
      <h2 aria-live="polite">{{ viewMonth }}</h2>
      <div class="lx-duty-calendar__nav">
        <button type="button" aria-label="上个月" @click="moveMonth(-1)">
          <LxIcon name="chevron-left" :size="16" />
        </button>
        <button type="button" aria-label="下个月" @click="moveMonth(1)">
          <LxIcon name="chevron-right" :size="16" />
        </button>
      </div>
    </header>
    <div
      class="lx-duty-calendar__grid"
      role="grid"
      :aria-label="`${viewMonth} 排班日历`"
    >
      <div class="lx-duty-calendar__weekdays" role="row">
        <span v-for="day in weekDays" :key="day" role="columnheader"
          >周{{ day }}</span
        >
      </div>
      <div
        v-for="(week, weekIndex) in weeks"
        :key="weekIndex"
        class="lx-duty-calendar__week"
        role="row"
      >
        <div
          v-for="(cell, dayIndex) in week"
          :key="cell.date"
          class="lx-duty-calendar__cell"
          :class="{ 'is-outside': !cell.inMonth, 'is-today': cell.isToday }"
          role="gridcell"
          :tabindex="cellTabIndex(cell.date)"
          :aria-label="`${cell.date}，周${weekDays[dayIndex]}${cell.isToday ? '，今天' : ''}`"
          :aria-current="cell.isToday ? 'date' : undefined"
          :data-lx-duty-date="cell.date"
          @click="emit('cell-click', cell.date)"
          @focus="focusedDate = cell.date"
          @keydown="onCellKeydown($event, cell.date)"
        >
          <time class="lx-duty-calendar__day" :datetime="cell.date">{{
            cell.day
          }}</time>
          <slot name="cell" :date="cell.date" :shifts="cell.shifts">
            <button
              v-for="(shift, shiftIndex) in cell.shifts.slice(0, 3)"
              :key="`${shift.date}-${shift.label}-${shiftIndex}`"
              class="lx-duty-calendar__shift"
              :class="`is-${statusOf(shift)}`"
              type="button"
              :aria-label="`${cell.date}，${shift.label}${shift.count === undefined ? '' : `，${shift.count} 人`}`"
              @click.stop="emit('shift-click', shift)"
              @keydown="stopCellNavigation"
            >
              <LxStatusDot :status="statusOf(shift)" :size="5" :pulse="false" />
              <span>{{ shift.label }}</span>
              <strong v-if="shift.count !== undefined">{{
                shift.count
              }}</strong>
            </button>
            <span
              v-if="cell.shifts.length > 3"
              class="lx-duty-calendar__more"
              role="note"
              :aria-label="`还有 ${cell.shifts.length - 3} 个班次未显示`"
              >+{{ cell.shifts.length - 3 }}</span
            >
          </slot>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.lx-duty-calendar {
  overflow: hidden;
  border: 1px solid var(--lx-border);
  border-radius: var(--lx-radius-md);
  background: var(--lx-bg-card);
}

.lx-duty-calendar__header {
  display: flex;
  min-height: 48px;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--lx-space-lg);
  border-bottom: 1px solid var(--lx-border-light);
}

.lx-duty-calendar__header h2 {
  margin: 0;
  color: var(--lx-text-primary);
  font-family: var(--lx-font-mono);
  font-size: 14px;
  font-variant-numeric: tabular-nums;
  font-weight: 600;
}

.lx-duty-calendar__nav {
  display: flex;
  gap: var(--lx-space-xs);
}

.lx-duty-calendar__nav button {
  display: inline-flex;
  width: var(--lx-control-height);
  height: var(--lx-control-height);
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 1px solid var(--lx-border);
  border-radius: var(--lx-radius-md);
  background: var(--lx-bg-card);
  color: var(--lx-text-regular);
  cursor: pointer;
}

.lx-duty-calendar__nav button:hover {
  border-color: var(--lx-color-primary);
  color: var(--lx-color-primary);
}

.lx-duty-calendar__nav button:focus-visible,
.lx-duty-calendar__cell:focus-visible {
  outline: 2px solid var(--lx-color-primary);
  outline-offset: -2px;
}

.lx-duty-calendar__grid {
  display: block;
}

.lx-duty-calendar__weekdays,
.lx-duty-calendar__week {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
}

.lx-duty-calendar__weekdays {
  border-bottom: 1px solid var(--lx-border-light);
  background: var(--lx-bg-table-header);
  color: var(--lx-text-regular);
  font-size: 12px;
  line-height: 32px;
  text-align: center;
}

.lx-duty-calendar__weekdays span {
  min-width: 0;
}

.lx-duty-calendar__cell {
  display: grid;
  min-width: 0;
  min-height: 88px;
  align-content: start;
  gap: var(--lx-space-xs);
  padding: var(--lx-space-sm);
  border: 0;
  border-right: 1px solid var(--lx-border-light);
  border-bottom: 1px solid var(--lx-border-light);
  background: var(--lx-bg-card);
  color: var(--lx-text-regular);
  cursor: pointer;
  text-align: start;
}

.lx-duty-calendar__cell:last-child {
  border-right: 0;
}

.lx-duty-calendar__cell:hover {
  background: var(--lx-bg-card-hover);
}

.lx-duty-calendar__cell.is-outside {
  background: var(--lx-bg-table-header);
}

.lx-duty-calendar__cell.is-today {
  box-shadow: inset 0 0 0 1px var(--lx-color-primary);
}

.lx-duty-calendar__day {
  color: var(--lx-text-primary);
  font-family: var(--lx-font-mono);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  line-height: 16px;
}

.lx-duty-calendar__shift {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: var(--lx-space-xs);
  padding: 1px var(--lx-space-xs);
  border: 0;
  border-radius: var(--lx-radius-sm);
  background: var(--lx-color-primary-light);
  color: var(--lx-text-regular);
  cursor: pointer;
  font: inherit;
  font-size: 11px;
  line-height: 16px;
  text-align: start;
}

.lx-duty-calendar__shift:focus-visible {
  outline: 2px solid var(--lx-color-primary);
  outline-offset: 1px;
}

.lx-duty-calendar__shift.is-online {
  background: var(--lx-color-success-light);
}
.lx-duty-calendar__shift.is-busy {
  background: var(--lx-color-warning-light);
}
.lx-duty-calendar__shift.is-error {
  background: var(--lx-color-error-light);
}
.lx-duty-calendar__shift.is-offline {
  background: var(--lx-color-info-light);
}

.lx-duty-calendar__shift span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.lx-duty-calendar__shift strong {
  margin-inline-start: auto;
  color: var(--lx-text-primary);
  font-family: var(--lx-font-mono);
  font-size: 10px;
  font-variant-numeric: tabular-nums;
}

.lx-duty-calendar__more {
  color: var(--lx-color-primary);
  font-size: 11px;
  line-height: 16px;
}

@media (max-width: 767px) {
  .lx-duty-calendar {
    overflow-x: auto;
  }

  .lx-duty-calendar__weekdays,
  .lx-duty-calendar__week {
    min-width: 640px;
  }

  .lx-duty-calendar__nav button {
    width: 44px;
    height: 44px;
  }
}
</style>
