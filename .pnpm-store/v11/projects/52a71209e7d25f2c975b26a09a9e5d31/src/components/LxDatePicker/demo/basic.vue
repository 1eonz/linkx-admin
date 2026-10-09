<script setup lang="ts">
import { onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'

import LxFormItem from '../../LxForm/LxFormItem.vue'
import LxIcon from '../../LxIcon/index.vue'
import LxDatePicker from '../index.vue'
import type { LxDatePickerShortcut } from '../types'

const hudTheme = ref(false)
const showDualPanels = ref(false)
const showWeekNumber = ref(false)

/** 第一组区间示例：专项布控日期区间（标本 06 主形态，W-320px 触发器） */
const controlRange = ref<[string, string] | null>(['2026-09-15', '2026-10-08'])
const analysisRange = ref<[string, string] | null>(['2026-09-15', '2026-10-08'])
/** 单值示例：布控生效日期（标本 06 文案语境） */
const effectiveDate = ref<string | null>('2026-09-15')
const reviewMonth = ref<string | null>('2026-09')
const annotatedDate = ref<string | null>('2026-09-15')
const reviewDate = ref<Date | null>(null)
/** 带时间示例：告警汇聚窗口 */
const windowTime = ref<string | null>('2026-09-29 08:00:00')
/** 禁用和只读示例 */
const lockedRange = ref<[string, string]>(['2026-09-01', '2026-09-30'])

const actionMessages = reactive<Record<string, string>>({})
let originalDark = false
let originalHud = false

function reportChange(field: string, value: unknown) {
  const selectedValue = Array.isArray(value)
    ? value.join(' 至 ')
    : value == null
      ? '已清空'
      : value
  actionMessages[field] = field + ' 已选：' + String(selectedValue)
}

function syncTheme() {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle(
    'dark',
    hudTheme.value || originalDark,
  )
  document.documentElement.classList.toggle(
    'lx-theme-hud',
    hudTheme.value || originalHud,
  )
}

watch(hudTheme, syncTheme)

onMounted(() => {
  originalDark = document.documentElement.classList.contains('dark')
  originalHud = document.documentElement.classList.contains('lx-theme-hud')
  syncTheme()
})

onBeforeUnmount(() => {
  document.documentElement.classList.toggle('dark', originalDark)
  document.documentElement.classList.toggle('lx-theme-hud', originalHud)
})

/** 周一锚定：返回给定日期所在周的周一（zh-cn 周一起始契约的快捷预设表达） */
function getMonday(base: Date): Date {
  const date = new Date(base)
  const day = date.getDay() // 0 = 周日
  date.setDate(date.getDate() + (day === 0 ? -6 : 1 - day))
  date.setHours(0, 0, 0, 0)
  return date
}

/** 快捷预设（标本 06：今日/本周/近30天；位置随 EP 原生左侧竖排，裁剪记录 #8） */
const shortcuts: LxDatePickerShortcut[] = [
  {
    text: '今日',
    value: () => {
      const now = new Date()
      now.setHours(0, 0, 0, 0)
      return now
    },
  },
  {
    text: '本周',
    value: () => {
      const monday = getMonday(new Date())
      const sunday = new Date(monday)
      sunday.setDate(monday.getDate() + 6)
      return [monday, sunday]
    },
  },
  {
    text: '近30天',
    value: () => {
      const end = new Date()
      end.setHours(0, 0, 0, 0)
      const start = new Date(end)
      start.setDate(end.getDate() - 29)
      return [start, end]
    },
  },
]
</script>

<template>
  <div class="lx-date-picker-demo" :class="{ 'lx-theme-hud': hudTheme }">
    <div class="lx-date-picker-demo__toolbar">
      <label>
        <input v-model="hudTheme" type="checkbox" />
        文档站整体深色（HUD）
      </label>
      <label>
        <input v-model="showDualPanels" type="checkbox" />
        显示双月日历
      </label>
    </div>

    <section class="lx-date-picker-demo__panel" data-testid="range">
      <h3>日期区间</h3>
      <div class="lx-date-picker-demo__field">
        <span class="lx-date-picker-demo__label">专项布控日期区间</span>
        <label
          class="lx-date-picker-demo__sr-only"
          for="demo-date-control-start"
          >专项布控日期区间开始日期</label
        >
        <label class="lx-date-picker-demo__sr-only" for="demo-date-control-end"
          >专项布控日期区间结束日期</label
        >
        <LxDatePicker
          :id="['demo-date-control-start', 'demo-date-control-end']"
          :popper-class="hudTheme ? 'lx-theme-hud' : undefined"
          v-model="controlRange"
          type="daterange"
          value-format="YYYY-MM-DD"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :single-panel="showDualPanels ? false : undefined"
          :show-week-number="showWeekNumber"
          unlink-panels
          @change="reportChange('专项布控区间', $event)"
        />
      </div>
      <p class="lx-date-picker-demo__hint">
        周一开周，左右月份可独立翻页，所选日期以连续色带显示。
      </p>
      <p class="lx-date-picker-demo__hint">聚焦后按 ArrowDown 打开日历。</p>
      <p
        v-if="actionMessages['专项布控区间']"
        class="lx-date-picker-demo__status"
        data-testid="date-action-range"
        role="status"
        aria-live="polite"
      >
        {{ actionMessages['专项布控区间'] }}
      </p>
    </section>

    <section class="lx-date-picker-demo__panel" data-testid="single">
      <h3>单日和月份</h3>
      <div class="lx-date-picker-demo__row">
        <div class="lx-date-picker-demo__field">
          <label class="lx-date-picker-demo__label" for="demo-date-effective"
            >布控生效日期</label
          >
          <LxDatePicker
            id="demo-date-effective"
            :popper-class="hudTheme ? 'lx-theme-hud' : undefined"
            v-model="effectiveDate"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="请选择生效日期"
            @change="reportChange('布控生效日期', $event)"
          />
          <p
            v-if="actionMessages['布控生效日期']"
            class="lx-date-picker-demo__status"
            data-testid="date-action-effective"
            role="status"
            aria-live="polite"
          >
            {{ actionMessages['布控生效日期'] }}
          </p>
        </div>
        <div class="lx-date-picker-demo__field">
          <label class="lx-date-picker-demo__label" for="demo-date-month"
            >月份选择（月度复盘）</label
          >
          <LxDatePicker
            id="demo-date-month"
            :popper-class="hudTheme ? 'lx-theme-hud' : undefined"
            v-model="reviewMonth"
            type="month"
            value-format="YYYY-MM"
            placeholder="请选择月份"
            @change="reportChange('复盘月份', $event)"
          />
          <p
            v-if="actionMessages['复盘月份']"
            class="lx-date-picker-demo__status"
            data-testid="date-action-month"
            role="status"
            aria-live="polite"
          >
            {{ actionMessages['复盘月份'] }}
          </p>
        </div>
      </div>
    </section>

    <section class="lx-date-picker-demo__panel" data-testid="shortcuts">
      <h3>常用日期范围</h3>
      <div class="lx-date-picker-demo__field">
        <span class="lx-date-picker-demo__label">研判时间范围</span>
        <label
          class="lx-date-picker-demo__sr-only"
          for="demo-date-analysis-start"
          >研判时间范围开始日期</label
        >
        <label class="lx-date-picker-demo__sr-only" for="demo-date-analysis-end"
          >研判时间范围结束日期</label
        >
        <LxDatePicker
          :id="['demo-date-analysis-start', 'demo-date-analysis-end']"
          :popper-class="
            hudTheme
              ? 'lx-date-picker-demo__shortcuts-popper lx-theme-hud'
              : 'lx-date-picker-demo__shortcuts-popper'
          "
          v-model="analysisRange"
          type="daterange"
          value-format="YYYY-MM-DD"
          :shortcuts="shortcuts"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          @change="reportChange('研判时间范围', $event)"
        >
          <template #range-separator>至</template>
        </LxDatePicker>
        <p
          v-if="actionMessages['研判时间范围']"
          class="lx-date-picker-demo__status"
          data-testid="date-action-analysis"
          role="status"
          aria-live="polite"
        >
          {{ actionMessages['研判时间范围'] }}
        </p>
      </div>
      <p class="lx-date-picker-demo__hint">
        "本周"从周一开始计算。选择预设后会回填日期范围并关闭弹层；重新打开后可继续调整。
      </p>
    </section>

    <section class="lx-date-picker-demo__panel" data-testid="slots">
      <h3>日期标记</h3>
      <div class="lx-date-picker-demo__field">
        <label class="lx-date-picker-demo__label" for="demo-date-annotated"
          >专项复盘日期</label
        >
        <LxDatePicker
          id="demo-date-annotated"
          :popper-class="hudTheme ? 'lx-theme-hud' : undefined"
          v-model="annotatedDate"
          value-format="YYYY-MM-DD"
          @change="reportChange('专项复盘日期', $event)"
        >
          <template #default="cell">
            <div class="el-date-table-cell">
              <span class="el-date-table-cell__text">{{ cell.text }}</span>
              <LxIcon
                v-if="cell.dayjs?.format('YYYY-MM-DD') === '2026-09-15'"
                class="lx-date-picker-demo__marker"
                name="star"
                :size="10"
                label="专项复盘"
              />
            </div>
          </template>
          <template #prev-month
            ><LxIcon name="chevron-left" :size="16"
          /></template>
          <template #next-month
            ><LxIcon name="chevron-right" :size="16"
          /></template>
        </LxDatePicker>
        <p
          v-if="actionMessages['专项复盘日期']"
          class="lx-date-picker-demo__status"
          data-testid="date-action-annotated"
          role="status"
          aria-live="polite"
        >
          {{ actionMessages['专项复盘日期'] }}
        </p>
      </div>
    </section>

    <section class="lx-date-picker-demo__panel" data-testid="datetime">
      <h3>日期与时间</h3>
      <div class="lx-date-picker-demo__field">
        <label class="lx-date-picker-demo__label" for="demo-date-window"
          >告警汇聚窗口</label
        >
        <LxDatePicker
          id="demo-date-window"
          :popper-class="hudTheme ? 'lx-theme-hud' : undefined"
          v-model="windowTime"
          type="datetime"
          value-format="YYYY-MM-DD HH:mm:ss"
          placeholder="请选择窗口起点"
          @change="reportChange('告警汇聚窗口', $event)"
        />
        <p
          v-if="actionMessages['告警汇聚窗口']"
          class="lx-date-picker-demo__status"
          data-testid="date-action-window"
          role="status"
          aria-live="polite"
        >
          {{ actionMessages['告警汇聚窗口'] }}
        </p>
      </div>
    </section>

    <section class="lx-date-picker-demo__panel" data-testid="error">
      <h3>表单校验</h3>
      <LxFormItem label="复核日期" prop="reviewDate" error="请选择复核日期">
        <LxDatePicker
          id="reviewDate"
          v-model="reviewDate"
          :popper-class="hudTheme ? 'lx-theme-hud' : undefined"
          placeholder="请选择日期"
          @change="reportChange('复核日期', $event)"
        />
      </LxFormItem>
      <p
        v-if="actionMessages['复核日期']"
        class="lx-date-picker-demo__status"
        data-testid="date-action-review"
        role="status"
        aria-live="polite"
      >
        {{ actionMessages['复核日期'] }}
      </p>
    </section>

    <section class="lx-date-picker-demo__panel" data-testid="disabled">
      <h3>禁用与只读</h3>
      <div class="lx-date-picker-demo__row">
        <div class="lx-date-picker-demo__field">
          <span class="lx-date-picker-demo__label">省厅锁定区间（禁用）</span>
          <label
            class="lx-date-picker-demo__sr-only"
            for="demo-date-locked-start"
            >省厅锁定区间开始日期</label
          >
          <label class="lx-date-picker-demo__sr-only" for="demo-date-locked-end"
            >省厅锁定区间结束日期</label
          >
          <LxDatePicker
            :id="['demo-date-locked-start', 'demo-date-locked-end']"
            :popper-class="hudTheme ? 'lx-theme-hud' : undefined"
            :model-value="lockedRange"
            type="daterange"
            value-format="YYYY-MM-DD"
            disabled
            start-placeholder="开始日期"
            end-placeholder="结束日期"
          />
        </div>
        <div class="lx-date-picker-demo__field">
          <span class="lx-date-picker-demo__label">归档区间（只读）</span>
          <label
            class="lx-date-picker-demo__sr-only"
            for="demo-date-archive-start"
            >归档区间开始日期</label
          >
          <label
            class="lx-date-picker-demo__sr-only"
            for="demo-date-archive-end"
            >归档区间结束日期</label
          >
          <LxDatePicker
            :id="['demo-date-archive-start', 'demo-date-archive-end']"
            :popper-class="hudTheme ? 'lx-theme-hud' : undefined"
            :model-value="lockedRange"
            type="daterange"
            value-format="YYYY-MM-DD"
            readonly
            start-placeholder="开始日期"
            end-placeholder="结束日期"
          />
        </div>
      </div>
    </section>

    <details class="lx-date-picker-demo__details">
      <summary>键盘操作与扩展参数</summary>
      <label class="lx-date-picker-demo__advanced-toggle">
        <input v-model="showWeekNumber" type="checkbox" />
        显示周数
      </label>
      <p class="lx-date-picker-demo__keyboard-note">
        方向键移动日期，Enter 选择，Escape 关闭日历。
      </p>
      <p class="lx-date-picker-demo__note">
        默认尺寸为 32px 高、4px
        圆角，聚焦时显示主题色边线。disabled-date、default-value
        等低频参数会传递给底层日期选择器。
      </p>
    </details>
  </div>
</template>

<style scoped>
.lx-date-picker-demo {
  display: grid;
  gap: 16px;
  padding: 16px;
  background: var(--lx-bg-page);
  color: var(--lx-text-primary);
}

.lx-date-picker-demo__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  font-size: 13px;
}

.lx-date-picker-demo__toolbar label {
  display: inline-flex;
  min-height: 32px;
  align-items: center;
  gap: 8px;
}

@media (max-width: 640px) {
  .lx-date-picker-demo__toolbar label {
    min-height: 44px;
  }
}

.lx-date-picker-demo__panel {
  display: grid;
  min-width: 0;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--lx-border);
  border-radius: var(--lx-radius-sm);
  background: var(--lx-bg-card);
}

.lx-date-picker-demo__panel h3 {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--lx-text-regular);
}

.lx-date-picker-demo__row {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.lx-date-picker-demo__field {
  display: grid;
  flex: 1 1 240px;
  gap: 4px;
  min-width: 0;
}

.lx-date-picker-demo__label {
  font-size: 12px;
  font-weight: 500;
  color: var(--lx-text-label);
}

.lx-date-picker-demo__sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}

.lx-date-picker-demo__marker {
  position: absolute;
  inset-inline-end: 2px;
  inset-block-start: 0;
  color: var(--lx-color-primary);
}

:deep(.lx-date-picker-demo__field .lx-date-picker) {
  /* 区间日期选择器有 EP 的 350px 默认宽度；Demo 字段必须在窄屏容器内收缩。 */
  width: 100% !important;
  max-width: 100%;
}

.lx-date-picker-demo__hint,
.lx-date-picker-demo__status,
.lx-date-picker-demo__note {
  margin: 0;
  font-size: 12px;
  line-height: 1.6;
  color: var(--lx-text-secondary-strong);
}

.lx-date-picker-demo__note {
  color: var(--lx-color-warning-text);
}

.lx-date-picker-demo__details {
  display: grid;
  gap: 8px;
  border-top: 1px solid var(--lx-border-light);
  padding-top: 8px;
}

.lx-date-picker-demo__details summary {
  display: flex;
  min-height: 40px;
  align-items: center;
  color: var(--lx-text-secondary-strong);
  cursor: pointer;
  font-size: 12px;
}

.lx-date-picker-demo__details summary:focus-visible {
  outline: 2px solid var(--lx-color-primary);
  outline-offset: 2px;
}

.lx-date-picker-demo__details[open] summary {
  color: var(--lx-color-primary);
}

.lx-date-picker-demo__advanced-toggle {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--lx-text-secondary-strong);
}
</style>
