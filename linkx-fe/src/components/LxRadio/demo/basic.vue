<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useData } from 'vitepress'
import LxRadio from '../index.vue'
import LxRadioGroup from '../../LxRadioGroup/index.vue'
import type { LxRadioValue } from '../types'

const hudTheme = ref(false)
const { isDark } = useData()

/** 水平排布：勤务响应等级（标本 03 上行） */
const responseLevel = ref<LxRadioValue>('daily')
/** 垂直排布：处置通道优先级（标本 03 下行） */
const channel = ref<LxRadioValue>('encrypted')
/** 旧 label 用法独立演示，避免与垂直组选项状态串联。 */
const legacyChannel = ref<LxRadioValue>('encrypted')

const responseLevelLabels: Record<string, string> = {
  daily: '日常勤务',
  emergency: '应急处突',
  security: '特勤安保',
}
const channelLabels: Record<string, string> = {
  encrypted: '高密加密专线',
  satellite: '卫星链路直通',
  fiber: '光纤骨干网',
}
const legacyChannelLabels = {
  encrypted: '高密加密专线',
  fiber: '光纤骨干网',
}

const lastAction = ref('点选选项观察靶环选中态；演示数据仅存在于页面内存。')
let originalDark = false
let originalHud = false

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
})

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

function reportChange(
  field: string,
  value: LxRadioValue | undefined,
  labels: Record<string, string>,
) {
  const label = value == null ? '未选择' : (labels[String(value)] ?? '未知选项')
  lastAction.value = `${field} 选中：${label}`
}
</script>

<template>
  <div class="lx-radio-demo" :class="{ 'lx-theme-hud': hudTheme }">
    <div class="lx-radio-demo__toolbar">
      <label class="lx-radio-demo__theme-toggle">
        <input v-model="hudTheme" type="checkbox" />
        HUD 深色主题
      </label>
    </div>

    <section class="lx-radio-demo__panel" data-testid="horizontal">
      <h3>勤务响应等级</h3>
      <LxRadioGroup
        v-model="responseLevel"
        aria-label="勤务响应等级"
        @change="reportChange('响应等级', $event, responseLevelLabels)"
      >
        <LxRadio value="daily">日常勤务</LxRadio>
        <LxRadio value="emergency">应急处突</LxRadio>
        <LxRadio value="security">特勤安保</LxRadio>
      </LxRadioGroup>
      <p class="lx-radio-demo__tip">
        方向键可切换；状态提示播报已选选项的中文名称
      </p>
    </section>

    <section class="lx-radio-demo__panel" data-testid="vertical">
      <h3>处置通道优先级</h3>
      <LxRadioGroup
        v-model="channel"
        vertical
        aria-label="处置通道优先级"
        @change="reportChange('处置通道', $event, channelLabels)"
      >
        <LxRadio value="encrypted">高密加密专线</LxRadio>
        <LxRadio value="satellite" disabled>卫星链路直通（未联通）</LxRadio>
        <LxRadio value="fiber">光纤骨干网</LxRadio>
      </LxRadioGroup>
      <p class="lx-radio-demo__tip">
        方向键会跳过禁用项；当前组值保存在页面内存
      </p>
      <div class="lx-radio-demo__readonly" data-testid="checked-disabled">
        <span class="lx-radio-demo__tip">历史配置回显（只读）</span>
        <LxRadio model-value="satellite" value="satellite" disabled>
          卫星链路直通（链路维护中）
        </LxRadio>
      </div>
    </section>

    <section class="lx-radio-demo__panel" data-testid="legacy">
      <h3>旧值兼容</h3>
      <LxRadioGroup
        v-model="legacyChannel"
        aria-label="旧版单选值用法"
        @change="reportChange('旧契约通道', $event, legacyChannelLabels)"
      >
        <!-- 未传 value 时 label 按 EP 旧契约兼作选中值，存量代码迁移零改动 -->
        <LxRadio label="encrypted">高密加密专线</LxRadio>
        <LxRadio label="fiber">光纤骨干网</LxRadio>
      </LxRadioGroup>
      <p class="lx-radio-demo__tip">未传 value 时以 label 作为选中值</p>
    </section>

    <p class="lx-radio-demo__status" aria-live="polite">{{ lastAction }}</p>
    <p class="lx-radio-demo__note">
      示例状态只保存在当前页面，不会写入业务系统。
    </p>
  </div>
</template>

<style scoped>
.lx-radio-demo {
  display: grid;
  gap: 16px;
  padding: 16px;
  background: var(--lx-bg-page);
  color: var(--lx-text-primary);
}

.lx-radio-demo__toolbar {
  display: flex;
  align-items: center;
  font-size: 13px;
}

.lx-radio-demo__toolbar label {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  gap: 8px;
  padding-inline: 4px;
  border-radius: var(--lx-radius-sm);
  cursor: pointer;
}

.lx-radio-demo__theme-toggle:focus-within {
  outline: 2px solid var(--lx-color-primary);
  outline-offset: 2px;
}

.lx-radio-demo__panel {
  display: grid;
  min-width: 0;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--lx-border);
  border-radius: var(--lx-radius-sm);
  background: var(--lx-bg-card);
}

.lx-radio-demo__readonly {
  display: grid;
  gap: 4px;
  padding-top: 8px;
  border-top: 1px solid var(--lx-border);
}

.lx-radio-demo__panel h3 {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--lx-text-regular);
}

.lx-radio-demo__status,
.lx-radio-demo__note,
.lx-radio-demo__tip {
  margin: 0;
  font-size: 12px;
  color: var(--lx-text-regular);
}
</style>
