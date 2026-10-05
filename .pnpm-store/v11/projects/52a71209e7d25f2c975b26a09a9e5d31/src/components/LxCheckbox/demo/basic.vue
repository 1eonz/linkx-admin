<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useData } from 'vitepress'
import LxCheckbox from '../index.vue'
import LxCheckboxGroup from '../../LxCheckboxGroup/index.vue'

const hudTheme = ref(false)
const { isDark } = useData()

/** 组内多选：关联授权业务权限（标本 04）；组值集合对齐 EP 契约（string | number 数组） */
const permissions = ref<(string | number)[]>(['video'])
const horizontalPermissions = ref<(string | number)[]>(['briefing'])
/** 独立复选：单条承诺确认 */
const agreed = ref(false)
const dispatchIndeterminate = ref(true)

const permissionLabels: Record<string, string> = {
  video: '视频巡查权限',
  dispatch: '警单流转',
  broadcast: '全网广播调度',
}
const channelLabels: Record<string, string> = {
  briefing: '警情简报',
  dispatch: '勤务调度',
  broadcast: '协同通知',
}

function formatSelected(
  values: (string | number)[],
  labels: Record<string, string>,
) {
  return values.length
    ? values.map((value) => labels[String(value)] ?? String(value)).join(' / ')
    : '无'
}

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
</script>

<template>
  <div class="lx-checkbox-demo" :class="{ 'lx-theme-hud': hudTheme }">
    <div class="lx-checkbox-demo__toolbar">
      <label class="lx-checkbox-demo__theme-toggle">
        <input v-model="hudTheme" type="checkbox" />
        HUD 深色主题
      </label>
    </div>

    <section class="lx-checkbox-demo__panel" data-testid="group">
      <h3>关联授权业务权限</h3>
      <LxCheckboxGroup
        v-model="permissions"
        vertical
        aria-label="关联授权业务权限"
      >
        <LxCheckbox value="video">视频巡查权限 (已授权)</LxCheckbox>
        <LxCheckbox
          value="dispatch"
          :indeterminate="dispatchIndeterminate"
          @change="dispatchIndeterminate = false"
        >
          警单流转 (部分下属权限)
        </LxCheckbox>
        <LxCheckbox value="broadcast">全网广播调度</LxCheckbox>
        <LxCheckbox value="cross" disabled
          >重特大警情跨区移送 (需支队审批)</LxCheckbox
        >
      </LxCheckboxGroup>
      <p class="lx-checkbox-demo__tip">半选表示部分授权；禁用项不可更改</p>
    </section>

    <section class="lx-checkbox-demo__panel" data-testid="standalone">
      <h3>独立确认与通知渠道</h3>
      <LxCheckbox v-model="agreed">已知晓涉密核验义务并承诺遵守</LxCheckbox>
      <LxCheckboxGroup
        v-model="horizontalPermissions"
        aria-label="水平排布的通知渠道"
      >
        <LxCheckbox value="briefing">警情简报</LxCheckbox>
        <LxCheckbox value="dispatch">勤务调度</LxCheckbox>
        <LxCheckbox value="broadcast">协同通知</LxCheckbox>
      </LxCheckboxGroup>
      <p class="lx-checkbox-demo__tip">
        独立复选框使用布尔值；组内选项使用字符串或数字值
      </p>
    </section>

    <section
      class="lx-checkbox-demo__panel"
      data-testid="disabled-states"
      aria-label="禁用复选框的选中与半选回显"
    >
      <h3>禁用状态的选中与半选回显</h3>
      <LxCheckbox :model-value="true" disabled>已分配的受限权限</LxCheckbox>
      <LxCheckbox :model-value="false" indeterminate disabled>
        部分分配的受限权限
      </LxCheckbox>
    </section>

    <p
      class="lx-checkbox-demo__status"
      data-testid="selection-summary"
      aria-live="polite"
    >
      当前授权：{{ formatSelected(permissions, permissionLabels) }}；
      通知渠道：{{ formatSelected(horizontalPermissions, channelLabels) }}；
      承诺{{ agreed ? '已' : '未' }}勾选
    </p>
    <p class="lx-checkbox-demo__note">
      示例状态只保存在当前页面，不会写入业务系统。
    </p>
  </div>
</template>

<style scoped>
.lx-checkbox-demo {
  display: grid;
  gap: 16px;
  padding: 16px;
  background: var(--lx-bg-page);
  color: var(--lx-text-primary);
}

.lx-checkbox-demo__toolbar {
  display: flex;
  align-items: center;
  font-size: 13px;
}

.lx-checkbox-demo__toolbar label {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  gap: 8px;
  padding-inline: 4px;
  border-radius: var(--lx-radius-sm);
  cursor: pointer;
}

.lx-checkbox-demo__theme-toggle:focus-within {
  outline: 2px solid var(--lx-color-primary);
  outline-offset: 2px;
}

.lx-checkbox-demo__panel {
  display: grid;
  min-width: 0;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--lx-border);
  border-radius: var(--lx-radius-sm);
  background: var(--lx-bg-card);
}

.lx-checkbox-demo__panel h3 {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--lx-text-regular);
}

.lx-checkbox-demo__status,
.lx-checkbox-demo__note,
.lx-checkbox-demo__tip {
  margin: 0;
  font-size: 12px;
  color: var(--lx-text-regular);
}
</style>
