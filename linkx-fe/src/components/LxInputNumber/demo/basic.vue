<script setup lang="ts">
import { ref } from 'vue'

import LxInputNumber from '../index.vue'

const hudTheme = ref(false)
const showControls = ref(true)

/** Panel 1 基础步进：巡逻车组配置配额（标本 05 文案语境，步长 1） */
const quota = ref<number>(30)
/** 告警确认时限：与巡逻配额相互独立 */
const acknowledgementMinutes = ref<number>(30)
/** 尺寸示例独立取值，避免操作一档时意外改动其他档位。 */
const smallQuota = ref<number>(30)
const mediumQuota = ref<number>(30)
const largeQuota = ref<number>(30)
/** 极值示例：最高并发处警上限（max=100，达到后增加钮禁用）。 */
const maxConcurrency = ref<number>(100)
/** Panel 3 小数步长与精度 */
const threshold = ref<number>(0.5)
/** Panel 5 禁用 */
const lockedQuota = ref<number>(12)

const lastAction = ref(
  '步进或直接输入数值观察边界与格式化行为；演示数据仅存在于页面内存。',
)

function reportChange(
  field: string,
  currentValue: number | undefined,
  oldValue: number | undefined,
) {
  lastAction.value = `${field}：${oldValue ?? '—'} → ${currentValue ?? '已清空'}`
}
</script>

<template>
  <div class="lx-input-number-demo" :class="{ 'lx-theme-hud': hudTheme }">
    <div class="lx-input-number-demo__toolbar">
      <label>
        <input v-model="hudTheme" type="checkbox" />
        HUD 深色主题
      </label>
    </div>

    <section class="lx-input-number-demo__panel" data-testid="basic">
      <h3>基础步进（160px 宽 + 右侧垂直拆分步进钮 + 值文字 mono 左对齐）</h3>
      <div class="lx-input-number-demo__row">
        <div class="lx-input-number-demo__field">
          <label class="lx-input-number-demo__label" for="demo-number-quota"
            >巡逻车组配置配额（步长 1）</label
          >
          <LxInputNumber
            id="demo-number-quota"
            name="patrolQuota"
            v-model="quota"
            :min="0"
            :max="200"
            @change="
              (currentValue, oldValue) =>
                reportChange('巡逻车组配额', currentValue, oldValue)
            "
          />
        </div>
        <div class="lx-input-number-demo__field">
          <label class="lx-input-number-demo__label" for="demo-number-timeout"
            >告警确认时限（分钟，步长 5）</label
          >
          <LxInputNumber
            id="demo-number-timeout"
            v-model="acknowledgementMinutes"
            :min="0"
            :max="120"
            :step="5"
            step-strictly
            @change="
              (currentValue, oldValue) =>
                reportChange('告警确认时限', currentValue, oldValue)
            "
          />
        </div>
      </div>
      <p class="lx-input-number-demo__hint">
        步进钮 hover 时图标转主色 + 浅灰底；步长 5 + step-strictly
        示例只允许输入 5 的倍数；方向键按 step 步进。
      </p>
    </section>

    <section class="lx-input-number-demo__panel" data-testid="limit">
      <h3>极值边界（max=100：达到上限后增加钮禁用半透明）</h3>
      <div class="lx-input-number-demo__field">
        <label class="lx-input-number-demo__label" for="demo-number-limit"
          >最高并发处警上限</label
        >
        <LxInputNumber
          id="demo-number-limit"
          v-model="maxConcurrency"
          :min="1"
          :max="100"
          readonly
          @change="
            (currentValue, oldValue) =>
              reportChange('并发处警上限', currentValue, oldValue)
          "
        />
      </div>
      <p class="lx-input-number-demo__hint">
        输入框禁止直接键入；达到 Max = 100 时增加钮禁用，减少钮仍可调整数值。
      </p>
    </section>

    <section class="lx-input-number-demo__panel" data-testid="precision">
      <h3>小数步长与精度（step 0.1 / precision 1：值守灵敏度系数）</h3>
      <div class="lx-input-number-demo__row">
        <div class="lx-input-number-demo__field">
          <label class="lx-input-number-demo__label" for="demo-number-threshold"
            >灵敏度系数（0.1 步长）</label
          >
          <LxInputNumber
            id="demo-number-threshold"
            v-model="threshold"
            :min="0"
            :max="2"
            :step="0.1"
            :precision="1"
            @change="
              (currentValue, oldValue) =>
                reportChange('灵敏度系数', currentValue, oldValue)
            "
          />
        </div>
        <div class="lx-input-number-demo__field">
          <label
            class="lx-input-number-demo__label"
            for="demo-number-no-controls"
            >无步进钮形态（controls=false）</label
          >
          <LxInputNumber
            id="demo-number-no-controls"
            v-model="threshold"
            :min="0"
            :max="2"
            :precision="1"
            :controls="false"
          />
        </div>
      </div>
    </section>

    <section class="lx-input-number-demo__panel" data-testid="sizes">
      <h3>尺寸档（sm=28px / md=32px 基准 / lg=40px）</h3>
      <label class="lx-input-number-demo__sizes-toggle">
        <input v-model="showControls" type="checkbox" />
        尺寸示例显示步进按钮
      </label>
      <div class="lx-input-number-demo__row">
        <div class="lx-input-number-demo__field">
          <label class="lx-input-number-demo__label" for="demo-number-small"
            >紧凑档 sm</label
          >
          <LxInputNumber
            id="demo-number-small"
            v-model="smallQuota"
            size="sm"
            :controls="showControls"
            :min="0"
            :max="200"
          />
        </div>
        <div class="lx-input-number-demo__field">
          <label class="lx-input-number-demo__label" for="demo-number-medium"
            >基准档 md（默认）</label
          >
          <LxInputNumber
            id="demo-number-medium"
            v-model="mediumQuota"
            size="md"
            :controls="showControls"
            :min="0"
            :max="200"
          />
        </div>
        <div class="lx-input-number-demo__field">
          <label class="lx-input-number-demo__label" for="demo-number-large"
            >宽松档 lg</label
          >
          <LxInputNumber
            id="demo-number-large"
            v-model="largeQuota"
            size="lg"
            :controls="showControls"
            :min="0"
            :max="200"
          />
        </div>
      </div>
    </section>

    <section class="lx-input-number-demo__panel" data-testid="disabled">
      <h3>禁用态（半透明 + 禁用手势）</h3>
      <div class="lx-input-number-demo__field">
        <label class="lx-input-number-demo__label" for="demo-number-locked"
          >省厅锁定配额（禁用）</label
        >
        <LxInputNumber
          id="demo-number-locked"
          v-model="lockedQuota"
          :min="0"
          :max="100"
          disabled
        />
      </div>
    </section>

    <p class="lx-input-number-demo__status" aria-live="polite">
      {{ lastAction }}
    </p>
    <p class="lx-input-number-demo__note">
      默认宽 160px / 32px 高 / 4px 圆角 / 1px #dcdfe6 描边，hover
      与焦点转主色光环； value-on-clear / autocomplete 等低频 props 经 attrs
      透传给 EP 内核。
    </p>
  </div>
</template>

<style scoped>
.lx-input-number-demo {
  display: grid;
  gap: 16px;
  padding: 16px;
  background: var(--lx-bg-page);
  color: var(--lx-text-primary);
}

.lx-input-number-demo__toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  font-size: 13px;
}

.lx-input-number-demo__toolbar label,
.lx-input-number-demo__sizes-toggle {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  gap: 8px;
}

.lx-input-number-demo__sizes-toggle {
  width: fit-content;
  color: var(--lx-text-regular);
  font-size: 13px;
}

.lx-input-number-demo__toolbar input,
.lx-input-number-demo__sizes-toggle input {
  accent-color: var(--lx-color-primary);
}

.lx-input-number-demo__panel {
  display: grid;
  min-width: 0;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--lx-border);
  border-radius: var(--lx-radius-sm);
  background: var(--lx-bg-card);
}

.lx-input-number-demo__panel h3 {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--lx-text-regular);
}

.lx-input-number-demo__row {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.lx-input-number-demo__field {
  display: grid;
  flex: 1 1 180px;
  gap: 4px;
  min-width: 0;
}

.lx-input-number-demo__label {
  font-size: 12px;
  font-weight: 500;
  color: var(--lx-text-label);
}

.lx-input-number-demo__hint,
.lx-input-number-demo__status,
.lx-input-number-demo__note {
  margin: 0;
  font-size: 12px;
  line-height: 1.6;
  color: var(--lx-text-secondary-strong);
}

.lx-input-number-demo__note {
  color: var(--lx-text-secondary-strong);
}
</style>
