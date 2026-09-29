<script setup lang="ts">
import { ref } from 'vue'
import type { LxDatePickerShortcut } from '../types'
import LxDatePicker from '../index.vue'

const hudTheme = ref(false)

/** Panel 1 单值：布控生效日期（标本 06 文案语境） */
const effectiveDate = ref<string>('2026-09-15')
/** Panel 2 区间：专项布控日期区间（标本 06 主形态，W-320px 触发器） */
const controlRange = ref<[string, string]>(['2026-09-15', '2026-10-08'])
/** Panel 3 带时间：告警汇聚窗口 */
const windowTime = ref<string>('2026-09-29 08:00:00')
/** Panel 4 禁用/只读 */
const lockedRange = ref<[string, string]>(['2026-09-01', '2026-09-30'])

const lastAction = ref(
  '选择日期观察触发器与面板行为；演示数据仅存在于页面内存。',
)

function reportChange(field: string, value: unknown) {
  lastAction.value = `${field} 已选：${Array.isArray(value) ? value.join(' 至 ') : value}`
}

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
        HUD 深色主题
      </label>
    </div>

    <section class="lx-date-picker-demo__panel" data-testid="single">
      <h4>基础单值（32px 触发器 + 主色日历图标 + 值文字等宽字体）</h4>
      <div class="lx-date-picker-demo__row">
        <div class="lx-date-picker-demo__field">
          <span class="lx-date-picker-demo__label">布控生效日期</span>
          <LxDatePicker
            v-model="effectiveDate"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="请选择生效日期"
            @change="reportChange('布控生效日期', $event)"
          />
        </div>
        <div class="lx-date-picker-demo__field">
          <span class="lx-date-picker-demo__label">月份选择（月度复盘）</span>
          <LxDatePicker
            v-model="effectiveDate"
            type="month"
            value-format="YYYY-MM"
            placeholder="请选择月份"
            @change="reportChange('复盘月份', $event)"
          />
        </div>
      </div>
    </section>

    <section class="lx-date-picker-demo__panel" data-testid="range">
      <h4>
        日期区间（标本 06 主形态：分隔符"至" + 展开双月联动面板 + 周一起始）
      </h4>
      <div class="lx-date-picker-demo__field">
        <span class="lx-date-picker-demo__label">专项布控日期区间</span>
        <LxDatePicker
          v-model="controlRange"
          type="daterange"
          value-format="YYYY-MM-DD"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          unlink-panels
          @change="reportChange('专项布控区间', $event)"
        />
      </div>
      <p class="lx-date-picker-demo__hint">
        面板周表头为"一 二 三 四 五 六 日"（内置 zh-cn 语境，周一起始）；
        拖选区间时中段呈连贯浅蓝带 #ecf5ff，起止为主色圆点白字。
      </p>
    </section>

    <section class="lx-date-picker-demo__panel" data-testid="shortcuts">
      <h4>快捷预设（今日/本周/近30天；左侧竖排位置随 EP 原生）</h4>
      <div class="lx-date-picker-demo__field">
        <span class="lx-date-picker-demo__label">研判时间范围</span>
        <LxDatePicker
          v-model="controlRange"
          type="daterange"
          value-format="YYYY-MM-DD"
          :shortcuts="shortcuts"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          @change="reportChange('研判时间范围', $event)"
        />
      </div>
      <p class="lx-date-picker-demo__hint">
        "本周"预设按周一起始计算（与面板周表头同契约）；快捷项点击后回填区间并保持面板开启，
        宿主可按业务追加"案发时段"等自定义预设。
      </p>
    </section>

    <section class="lx-date-picker-demo__panel" data-testid="datetime">
      <h4>
        带时间面板（datetimerange：区间 + 时分秒，底部此刻/确定随 EP 原生）
      </h4>
      <div class="lx-date-picker-demo__field">
        <span class="lx-date-picker-demo__label">告警汇聚窗口</span>
        <LxDatePicker
          v-model="windowTime"
          type="datetime"
          value-format="YYYY-MM-DD HH:mm:ss"
          placeholder="请选择窗口起点"
          @change="reportChange('告警汇聚窗口', $event)"
        />
      </div>
    </section>

    <section class="lx-date-picker-demo__panel" data-testid="disabled">
      <h4>禁用与只读（禁用半透明；只读可聚焦不可改值）</h4>
      <div class="lx-date-picker-demo__row">
        <div class="lx-date-picker-demo__field">
          <span class="lx-date-picker-demo__label">省厅锁定区间（禁用）</span>
          <LxDatePicker
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
          <LxDatePicker
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

    <p class="lx-date-picker-demo__status" aria-live="polite">
      {{ lastAction }}
    </p>
    <p class="lx-date-picker-demo__note">
      触发器 32px / 4px 圆角 / 1px #dcdfe6 描边，hover
      与展开转主色光环；区间分隔符默认"至"； disabled-date / default-value
      等低频 props 经 attrs 透传给 EP 内核。
    </p>
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
  align-items: center;
  font-size: 13px;
}

.lx-date-picker-demo__toolbar label {
  display: inline-flex;
  min-height: 32px;
  align-items: center;
  gap: 8px;
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

.lx-date-picker-demo__panel h4 {
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

.lx-date-picker-demo__field .lx-date-picker {
  width: 100%;
}

.lx-date-picker-demo__hint,
.lx-date-picker-demo__status,
.lx-date-picker-demo__note {
  margin: 0;
  font-size: 12px;
  line-height: 1.6;
  color: var(--lx-text-secondary);
}

.lx-date-picker-demo__note {
  color: var(--lx-color-warning-strong);
}
</style>
