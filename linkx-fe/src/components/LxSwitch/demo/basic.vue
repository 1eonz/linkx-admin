<script setup lang="ts">
import { ref } from 'vue'
import LxSwitch from '../index.vue'

const hudTheme = ref(false)

/** Panel 1 默认形态：胶囊内文字（不传 inlinePrompt，默认 true 即胶囊内显示） */
const aiIntercept = ref(true)
/** 夜间低敏静默布防模式（标本 07 关闭行） */
const nightSilent = ref(false)
/** 自定义两字文案示例（胶囊内模式不限"开启/关闭"） */
const dutyMode = ref(true)
/** Panel 2 标本 07 形态：无文字开关 + 外部状态文字 */
const hudOverlay = ref(false)
/** 模拟下发中的开关（loading 点击拦截） */
const syncing = ref(false)
/** 胶囊两侧文字模式（显式关闭 inlinePrompt） */
const sideText = ref(false)
/** 自定义值开关（active-value/inactive-value；值域必须落在 on/off 内） */
const customMode = ref<'on' | 'off'>('off')

const lastAction = ref('切换开关观察胶囊色彩；演示数据仅存在于页面内存。')

function reportChange(field: string, value: boolean | string | number) {
  lastAction.value = `${field} 已${value ? '开启' : '关闭'}`
}

/** loading 示例：2s 内滑块 spinner + 点击拦截（模拟异步下发，不请求后端） */
function handleSync(value: boolean | string | number) {
  if (syncing.value) return
  syncing.value = true
  lastAction.value = '镜像同步下发中……（loading 期间点击被拦截）'
  window.setTimeout(() => {
    syncing.value = false
    reportChange('省厅镜像同步', value)
  }, 2000)
}
</script>

<template>
  <div class="lx-switch-demo" :class="{ 'lx-theme-hud': hudTheme }">
    <div class="lx-switch-demo__toolbar">
      <label>
        <input v-model="hudTheme" type="checkbox" />
        HUD 深色主题
      </label>
    </div>

    <section class="lx-switch-demo__panel" data-testid="inline-default">
      <h4>胶囊内文字（默认形态：传文字即生效，无需配置 inlinePrompt）</h4>
      <div class="lx-switch-demo__row">
        <div class="lx-switch-demo__item">
          <div>
            <div class="lx-switch-demo__title">卡口车辆实时 AI 研判拦截</div>
            <div class="lx-switch-demo__desc">高算力端侧即时告警接入</div>
          </div>
          <LxSwitch
            v-model="aiIntercept"
            active-text="开启"
            inactive-text="关闭"
            @change="reportChange('AI 研判拦截', $event)"
          />
        </div>
        <div class="lx-switch-demo__item">
          <div>
            <div class="lx-switch-demo__title">夜间低敏静默布防模式</div>
            <div class="lx-switch-demo__desc">未触发常规巡线时不发送警报</div>
          </div>
          <LxSwitch
            v-model="nightSilent"
            active-text="开启"
            inactive-text="关闭"
            @change="reportChange('夜间静默布防', $event)"
          />
        </div>
        <div class="lx-switch-demo__item lx-switch-demo__item--locked">
          <div>
            <div class="lx-switch-demo__title">
              省厅直辖联防调度镜像（锁定）
            </div>
            <div class="lx-switch-demo__desc">
              受上级指令系统锁定，本级不可改动
            </div>
          </div>
          <LxSwitch
            :model-value="true"
            disabled
            active-text="开启"
            inactive-text="关闭"
          />
        </div>
        <div class="lx-switch-demo__item">
          <div>
            <div class="lx-switch-demo__title">勤务值守模式</div>
            <div class="lx-switch-demo__desc">
              自定义两字文案（胶囊内不限于"开启/关闭"）
            </div>
          </div>
          <LxSwitch
            v-model="dutyMode"
            active-text="值守"
            inactive-text="休整"
            @change="reportChange('勤务值守', $event)"
          />
        </div>
      </div>
      <p class="lx-switch-demo__hint">
        inlinePrompt 默认 true：传 activeText / inactiveText
        即在胶囊内显示状态文案（胶囊放宽至 42px）， 与 LxStatusSwitch
        表格行内形态共用同一开关本体；胶囊内文字即状态，无需外部重复标注。
      </p>
    </section>

    <section class="lx-switch-demo__panel" data-testid="states">
      <h4>无文字开关（标本 07 形态：状态由外部文字表达）</h4>
      <div class="lx-switch-demo__pair">
        <LxSwitch
          v-model="hudOverlay"
          @change="reportChange('HUD 战术图层', $event)"
        />
        <span class="lx-switch-demo__state" :class="{ 'is-on': hudOverlay }">
          {{ hudOverlay ? '开启' : '关闭' }}
        </span>
        <span class="lx-switch-demo__desc"
          >无文字时胶囊保持标本 40×20；状态不能只靠颜色区分</span
        >
      </div>
    </section>

    <section class="lx-switch-demo__panel" data-testid="loading">
      <h4>加载态与透传</h4>
      <div class="lx-switch-demo__pair">
        <LxSwitch
          :model-value="false"
          :loading="syncing"
          @change="handleSync"
        />
        <span class="lx-switch-demo__desc"
          >loading：滑块 spinner + 点击拦截（2s 模拟下发）</span
        >
      </div>
      <div class="lx-switch-demo__pair">
        <LxSwitch
          v-model="customMode"
          active-value="on"
          inactive-value="off"
          @change="reportChange('自定义值开关', $event)"
        />
        <span class="lx-switch-demo__desc">
          active-value/inactive-value 经 attrs 透传：当前值 {{ customMode }}
        </span>
      </div>
    </section>

    <section class="lx-switch-demo__panel" data-testid="text-mode">
      <h4>胶囊两侧文字（显式传 :inline-prompt="false"）</h4>
      <div class="lx-switch-demo__pair">
        <LxSwitch
          v-model="sideText"
          :inline-prompt="false"
          active-text="已联动"
          inactive-text="未联动"
          @change="reportChange('两侧文字开关', $event)"
        />
        <span class="lx-switch-demo__desc"
          >文字显示在胶囊两侧，激活侧转主色（EP 原生 label 契约）</span
        >
      </div>
    </section>

    <p class="lx-switch-demo__status" aria-live="polite">{{ lastAction }}</p>
    <p class="lx-switch-demo__note">
      胶囊固定 40×20（胶囊内文字放宽至 42px）、滑块 16px；开启 #67c23a
      成功绿、关闭 #909399 信息灰；不开放 size 档。
    </p>
  </div>
</template>

<style scoped>
.lx-switch-demo {
  display: grid;
  gap: 16px;
  padding: 16px;
  background: var(--lx-bg-page);
  color: var(--lx-text-primary);
}

.lx-switch-demo__toolbar {
  display: flex;
  align-items: center;
  font-size: 13px;
}

.lx-switch-demo__toolbar label {
  display: inline-flex;
  min-height: 32px;
  align-items: center;
  gap: 8px;
}

.lx-switch-demo__panel {
  display: grid;
  min-width: 0;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--lx-border);
  border-radius: var(--lx-radius-sm);
  background: var(--lx-bg-card);
}

.lx-switch-demo__panel h4 {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--lx-text-regular);
}

.lx-switch-demo__row {
  display: grid;
  gap: 8px;
}

.lx-switch-demo__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px;
  border-radius: var(--lx-radius-md);
  background: color-mix(in srgb, var(--lx-bg-table-header) 50%, transparent);
}

.lx-switch-demo__item--locked {
  opacity: 0.6;
}

.lx-switch-demo__title {
  font-size: 12px;
  font-weight: 500;
  color: var(--lx-text-primary);
}

.lx-switch-demo__desc {
  font-size: 11px;
  color: var(--lx-text-secondary);
}

.lx-switch-demo__pair {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 32px;
}

/* 状态文字：开启绿 / 关闭灰（不能只靠颜色，文字同步表达） */
.lx-switch-demo__state {
  font-size: 12px;
  font-weight: 600;
  color: var(--lx-color-info);
}

.lx-switch-demo__state.is-on {
  color: var(--lx-color-success-strong);
}

.lx-switch-demo__hint {
  margin: 0;
  font-size: 12px;
  line-height: 1.6;
  color: var(--lx-text-secondary);
}

.lx-switch-demo__status,
.lx-switch-demo__note {
  margin: 0;
  font-size: 12px;
  color: var(--lx-text-secondary);
}

.lx-switch-demo__note {
  color: var(--lx-color-warning-strong);
}
</style>
