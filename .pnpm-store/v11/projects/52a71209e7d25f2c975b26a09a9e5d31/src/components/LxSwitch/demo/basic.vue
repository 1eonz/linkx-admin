<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useData } from 'vitepress'
import LxSwitch from '../index.vue'

const hudTheme = ref(false)
const { isDark } = useData()
let originalDark = false
let originalHud = false
let themeObserver: MutationObserver | undefined

/** 按标本 07 展示的主形态：开关外状态文字 */
const aiIntercept = ref(true)
/** 夜间低敏静默布防模式（标本 07 关闭行） */
const nightSilent = ref(false)
/** 自定义两字文案示例（胶囊内模式不限"开启/关闭"） */
const dutyMode = ref(true)
/** 无文字开关 + 外部状态文字 */
const hudOverlay = ref(false)
/** 模拟下发中的开关（loading 点击拦截） */
const syncing = ref(false)
const syncEnabled = ref(false)
const syncFailed = ref(false)
const failNextSync = ref(true)
let syncTimer: number | undefined
/** 胶囊两侧文字模式（显式关闭 inlinePrompt） */
const sideText = ref(false)
/** 自定义值开关（active-value/inactive-value；值域必须落在 on/off 内） */
const customMode = ref<'on' | 'off'>('off')

const lastAction = ref('切换开关观察胶囊色彩。')

function setTheme(enabled: boolean) {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('dark', enabled || originalDark)
  document.documentElement.classList.toggle(
    'lx-theme-hud',
    enabled || originalHud,
  )
}

watch(hudTheme, setTheme)
watch(isDark, (value) => {
  originalDark = value
  if (hudTheme.value) setTheme(true)
})

onMounted(() => {
  const root = document.documentElement
  originalDark = root.classList.contains('dark')
  originalHud = root.classList.contains('lx-theme-hud')
  themeObserver = new MutationObserver(() => {
    if (
      hudTheme.value &&
      (!root.classList.contains('dark') ||
        !root.classList.contains('lx-theme-hud'))
    ) {
      setTheme(true)
    }
  })
  themeObserver.observe(root, { attributes: true, attributeFilter: ['class'] })
  setTheme(hudTheme.value)
})

function reportChange(field: string, value: boolean | string | number) {
  const enabled = value === true
  lastAction.value = `${field} 已${enabled ? '开启' : '关闭'}`
}

/** loading 示例：2s 内滑块 spinner + 点击拦截（模拟异步下发，不请求后端） */
function handleSync(value: boolean | string | number) {
  if (syncing.value) return
  syncing.value = true
  syncFailed.value = false
  lastAction.value = '镜像同步下发中……（loading 期间点击被拦截）'

  syncTimer = window.setTimeout(() => {
    syncing.value = false
    syncTimer = undefined

    if (failNextSync.value) {
      failNextSync.value = false
      syncFailed.value = true
      lastAction.value = '省厅镜像同步下发失败，开关保持关闭，请重新操作。'
      return
    }

    if (typeof value !== 'boolean') {
      syncFailed.value = true
      lastAction.value = '省厅镜像同步只接受布尔值，请检查开关配置。'
      return
    }

    syncEnabled.value = value
    reportChange('省厅镜像同步', value)
  }, 2000)
}

onBeforeUnmount(() => {
  themeObserver?.disconnect()
  if (typeof document !== 'undefined') {
    document.documentElement.classList.toggle('dark', originalDark)
    document.documentElement.classList.toggle('lx-theme-hud', originalHud)
  }
  if (syncTimer !== undefined) window.clearTimeout(syncTimer)
})
</script>

<template>
  <div class="lx-switch-demo" :class="{ 'lx-theme-hud': hudTheme }">
    <div class="lx-switch-demo__toolbar">
      <label>
        <input v-model="hudTheme" type="checkbox" />
        HUD 深色主题（全页预览）
      </label>
    </div>

    <section class="lx-switch-demo__panel" data-testid="standard-state">
      <h3>开关外状态文字（标本 07 主形态）</h3>
      <div class="lx-switch-demo__row">
        <div class="lx-switch-demo__item">
          <div>
            <div id="ai-intercept-label" class="lx-switch-demo__title">
              卡口车辆实时 AI 研判拦截
            </div>
            <div class="lx-switch-demo__desc">高算力端侧即时告警接入</div>
          </div>
          <div class="lx-switch-demo__control">
            <span
              class="lx-switch-demo__state"
              :class="{ 'is-on': aiIntercept }"
            >
              {{ aiIntercept ? '开启' : '关闭' }}
            </span>
            <LxSwitch
              v-model="aiIntercept"
              aria-labelledby="ai-intercept-label"
              @change="reportChange('AI 研判拦截', $event)"
            />
          </div>
        </div>
        <div class="lx-switch-demo__item">
          <div>
            <div class="lx-switch-demo__title">夜间低敏静默布防模式</div>
            <div class="lx-switch-demo__desc">未触发常规巡线时不发送警报</div>
          </div>
          <div class="lx-switch-demo__control">
            <span
              class="lx-switch-demo__state"
              :class="{ 'is-on': nightSilent }"
            >
              {{ nightSilent ? '开启' : '关闭' }}
            </span>
            <LxSwitch
              v-model="nightSilent"
              aria-label="夜间低敏静默布防模式"
              @change="reportChange('夜间静默布防', $event)"
            />
          </div>
        </div>
        <div class="lx-switch-demo__item">
          <div>
            <div class="lx-switch-demo__title">
              省厅直辖联防调度镜像（锁定）
            </div>
            <div id="upper-lock-reason" class="lx-switch-demo__desc">
              受上级指令系统锁定，本级不可改动
            </div>
          </div>
          <div class="lx-switch-demo__control">
            <span class="lx-switch-demo__state">已锁</span>
            <LxSwitch
              :model-value="true"
              disabled
              aria-label="省厅直辖联防调度镜像（锁定）"
              aria-describedby="upper-lock-reason"
            />
          </div>
        </div>
      </div>
      <p class="lx-switch-demo__hint">
        状态文字位于开关外；锁定态同时说明不可操作原因，颜色不作为唯一状态提示。
      </p>
    </section>

    <section class="lx-switch-demo__panel" data-testid="inline-default">
      <h3>胶囊内文字（扩展形态）</h3>
      <div class="lx-switch-demo__row">
        <div class="lx-switch-demo__item">
          <div>
            <div class="lx-switch-demo__title">勤务值守模式</div>
            <div class="lx-switch-demo__desc">
              自定义两字文案（胶囊内不限于"开启/关闭"）
            </div>
          </div>
          <LxSwitch
            v-model="dutyMode"
            aria-label="勤务值守模式"
            active-text="值守"
            inactive-text="休整"
            @change="reportChange('勤务值守', $event)"
          />
        </div>
      </div>
      <p class="lx-switch-demo__hint">
        inlinePrompt 默认 true；传 activeText / inactiveText
        后，文案显示在胶囊内。该形态适合状态词本身足够清楚的场景。
      </p>
    </section>

    <section class="lx-switch-demo__panel" data-testid="states">
      <h3>无文字开关（标本 07 形态：状态由外部文字表达）</h3>
      <div class="lx-switch-demo__pair">
        <LxSwitch
          v-model="hudOverlay"
          aria-label="HUD 战术图层"
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
      <h3>加载态与透传</h3>
      <div class="lx-switch-demo__pair">
        <LxSwitch
          :model-value="syncEnabled"
          :loading="syncing"
          aria-label="省厅镜像同步"
          @change="handleSync"
        />
        <span class="lx-switch-demo__desc"
          >首次操作模拟失败并保留关闭值；再次操作成功（每次约 2s）</span
        >
      </div>
      <p v-if="syncFailed" class="lx-switch-demo__error" role="alert">
        模拟下发失败，开关保持关闭；再次操作可重试。
      </p>
      <div class="lx-switch-demo__pair">
        <LxSwitch
          v-model="customMode"
          aria-label="自定义值开关"
          active-value="on"
          inactive-value="off"
          @change="reportChange('自定义值开关', $event === 'on')"
        />
        <span class="lx-switch-demo__desc">
          active-value/inactive-value 经 attrs 透传：当前值 {{ customMode }}
        </span>
      </div>
    </section>

    <section class="lx-switch-demo__panel" data-testid="text-mode">
      <h3>胶囊两侧文字（显式传 :inline-prompt="false"）</h3>
      <div class="lx-switch-demo__pair lx-switch-demo__pair--text-mode">
        <LxSwitch
          v-model="sideText"
          :inline-prompt="false"
          aria-label="外置状态文案开关"
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
  min-height: 44px;
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

.lx-switch-demo__panel h3 {
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

.lx-switch-demo__control {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 8px;
}

.lx-switch-demo__title {
  font-size: 12px;
  font-weight: 500;
  color: var(--lx-text-primary);
}

.lx-switch-demo__desc {
  font-size: 12px;
  color: var(--lx-text-secondary-strong);
}

.lx-switch-demo__pair {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 32px;
}

.lx-switch-demo__pair--text-mode :deep(.el-switch__label) {
  flex-shrink: 0;
  white-space: nowrap;
}

/* 状态文字：开启绿 / 关闭灰（不能只靠颜色，文字同步表达） */
.lx-switch-demo__state {
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  color: var(--lx-color-info);
}

.lx-switch-demo__state.is-on {
  color: var(--lx-color-success-strong);
}

.lx-switch-demo__hint {
  margin: 0;
  font-size: 12px;
  line-height: 1.6;
  color: var(--lx-text-secondary-strong);
}

.lx-switch-demo__status,
.lx-switch-demo__note {
  margin: 0;
  font-size: 12px;
  color: var(--lx-text-secondary-strong);
}

.lx-switch-demo__error {
  margin: 0;
  color: var(--lx-color-error);
  font-size: 12px;
  line-height: 1.5;
}

.lx-switch-demo__note {
  color: var(--lx-text-secondary-strong);
}

@media (max-width: 480px) {
  .lx-switch-demo__item {
    gap: 12px;
  }

  .lx-switch-demo__pair--text-mode {
    display: grid;
    min-height: 0;
    grid-template-columns: minmax(0, 1fr);
    justify-content: start;
    gap: 8px;
  }

  .lx-switch-demo__pair--text-mode :deep(.el-switch) {
    justify-self: start;
    max-width: 100%;
  }

  .lx-switch-demo__pair--text-mode .lx-switch-demo__desc {
    grid-column: 1 / -1;
    min-width: 0;
    overflow-wrap: anywhere;
  }
}
</style>
