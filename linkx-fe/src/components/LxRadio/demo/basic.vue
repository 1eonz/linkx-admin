<script setup lang="ts">
import type { FormRules } from 'element-plus'
import { useData } from 'vitepress'
import { onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'

import { LxButton, LxForm, LxFormItem } from '../../../index'
import type { LxFormInstance } from '../../../index'
import LxRadioGroup from '../../LxRadioGroup/index.vue'
import LxRadio from '../index.vue'
import type { LxRadioValue } from '../types'

const hudTheme = ref(false)
const { isDark } = useData()

/** 水平排布：勤务响应等级（标本 03 上行） */
const responseLevel = ref<LxRadioValue>('daily')
/** 垂直排布：处置通道优先级（标本 03 下行） */
const channel = ref<LxRadioValue>('encrypted')
const standaloneChannel = ref<LxRadioValue>('encrypted')
const disabledGroupLevel = ref<LxRadioValue>('daily')
const disabledForm = reactive<{ channel: LxRadioValue }>({ channel: 'fiber' })
/** 旧 label 用法独立演示，避免与垂直组选项状态串联。 */
const legacyChannel = ref<LxRadioValue>('encrypted')
const validationFormRef = ref<LxFormInstance>()
const validationForm = reactive<{ channel: LxRadioValue | undefined }>({
  channel: undefined,
})
const validationFeedback = ref('')
const validationFeedbackIsError = ref(false)
const validationRules: FormRules = {
  channel: [
    { required: true, message: '请选择一个响应通道', trigger: 'change' },
  ],
}

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

function validateChannel() {
  validationFormRef.value
    ?.validate()
    .then(() => {
      validationFormRef.value?.clearValidate('channel')
      validationFeedbackIsError.value = false
      validationFeedback.value = '响应通道校验通过'
    })
    .catch(() => {
      validationFeedbackIsError.value = true
      validationFeedback.value = '请先修正响应通道'
    })
}

function resetValidationForm() {
  validationFormRef.value?.resetFields()
  validationFeedbackIsError.value = false
  validationFeedback.value = ''
}

watch(
  validationForm,
  () => {
    if (validationFeedbackIsError.value) {
      validationFeedbackIsError.value = false
      validationFeedback.value = ''
    }
  },
  { deep: true },
)
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
        <LxRadio value="satellite" disabled
          >卫星链路直通（当前链路尚未接通）</LxRadio
        >
        <LxRadio value="fiber">光纤骨干网</LxRadio>
      </LxRadioGroup>
      <p class="lx-radio-demo__tip">
        方向键会跳过禁用项；当前组值保存在页面内存
      </p>
    </section>

    <section class="lx-radio-demo__panel" data-testid="standalone">
      <h3>独立 LxRadio 组合</h3>
      <fieldset
        class="lx-radio-demo__standalone"
        data-testid="standalone-radio-options"
      >
        <legend>响应网络（不使用 LxRadioGroup）</legend>
        <LxRadio
          v-model="standaloneChannel"
          value="encrypted"
          name="standalone-channel"
          @change="reportChange('独立响应网络', $event, channelLabels)"
        >
          高密加密专线
        </LxRadio>
        <LxRadio
          v-model="standaloneChannel"
          value="fiber"
          name="standalone-channel"
          @change="reportChange('独立响应网络', $event, channelLabels)"
        >
          光纤骨干网
        </LxRadio>
      </fieldset>
      <p class="lx-radio-demo__tip">
        两个独立选项共享父级 v-model 和原生 name，change 状态会同步显示
      </p>
    </section>

    <section class="lx-radio-demo__panel" data-testid="validation">
      <h3>响应通道必填校验</h3>
      <LxForm
        ref="validationFormRef"
        data-testid="radio-validation-form"
        :model="validationForm"
        :rules="validationRules"
        label-position="top"
        scroll-to-error
      >
        <LxFormItem label="响应通道" prop="channel">
          <LxRadioGroup
            v-model="validationForm.channel"
            aria-label="待确认响应通道"
          >
            <LxRadio value="daily">日常勤务</LxRadio>
            <LxRadio value="emergency">应急处突</LxRadio>
          </LxRadioGroup>
        </LxFormItem>
        <LxFormItem>
          <div class="lx-radio-demo__actions">
            <LxButton type="primary" @click="validateChannel">
              提交校验
            </LxButton>
            <LxButton @click="resetValidationForm">重置</LxButton>
          </div>
        </LxFormItem>
      </LxForm>
      <p
        v-if="validationFeedback"
        data-testid="radio-validation-feedback"
        class="lx-radio-demo__feedback"
        :class="{ 'is-error': validationFeedbackIsError }"
        :role="validationFeedbackIsError ? 'alert' : 'status'"
        aria-live="polite"
      >
        {{ validationFeedback }}
      </p>
    </section>

    <p class="lx-radio-demo__status" aria-live="polite">{{ lastAction }}</p>
    <p class="lx-radio-demo__note">
      示例状态只保存在当前页面，不会写入业务系统。
    </p>

    <details
      class="lx-radio-demo__advanced"
      data-testid="radio-advanced-examples"
    >
      <summary>旧值兼容与禁用继承示例</summary>
      <div class="lx-radio-demo__advanced-content">
        <section class="lx-radio-demo__panel" data-testid="readonly-history">
          <h3>历史配置回显（只读快照）</h3>
          <div class="lx-radio-demo__readonly" data-testid="checked-disabled">
            <LxRadio model-value="satellite" value="satellite" disabled>
              卫星链路直通（链路维护中）
            </LxRadio>
          </div>
        </section>

        <section
          class="lx-radio-demo__panel"
          data-testid="disabled-inheritance"
        >
          <h3>组级与表单禁用继承</h3>
          <div
            class="lx-radio-demo__example"
            data-testid="radio-group-disabled"
          >
            <h4>整组禁用</h4>
            <LxRadioGroup
              v-model="disabledGroupLevel"
              disabled
              aria-label="整组禁用的响应等级"
            >
              <LxRadio value="daily">日常勤务</LxRadio>
              <LxRadio value="emergency">应急处突</LxRadio>
            </LxRadioGroup>
          </div>
          <div class="lx-radio-demo__example" data-testid="radio-form-disabled">
            <h4>LxForm 禁用继承</h4>
            <LxForm :model="disabledForm" disabled label-position="top">
              <LxFormItem label="响应等级" prop="channel">
                <LxRadioGroup
                  v-model="disabledForm.channel"
                  aria-label="继承表单禁用的响应等级"
                >
                  <LxRadio value="fiber">光纤骨干网</LxRadio>
                  <LxRadio value="satellite">卫星链路直通</LxRadio>
                </LxRadioGroup>
              </LxFormItem>
            </LxForm>
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
      </div>
    </details>
  </div>
</template>

<style scoped>
.lx-radio-demo {
  display: grid;
  gap: 16px;
  padding: 16px;
  color: var(--lx-text-primary);
  background: var(--lx-bg-page);
}

.lx-radio-demo__toolbar {
  display: flex;
  align-items: center;
  font-size: 13px;
}

.lx-radio-demo__toolbar label {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  min-height: 44px;
  padding-inline: 4px;
  cursor: pointer;
  border-radius: var(--lx-radius-sm);
}

.lx-radio-demo__theme-toggle:focus-within {
  outline: 2px solid var(--lx-color-primary);
  outline-offset: 2px;
}

.lx-radio-demo__panel {
  display: grid;
  gap: 12px;
  min-width: 0;
  padding: 12px;
  background: var(--lx-bg-card);
  border: 1px solid var(--lx-border);
  border-radius: var(--lx-radius-sm);
}

.lx-radio-demo__readonly {
  display: grid;
  gap: 8px;
}

.lx-radio-demo__standalone {
  display: grid;
  gap: 8px;
  min-width: 0;
  padding: 0;
  margin: 0;
  border: 0;
}

.lx-radio-demo__standalone legend {
  padding: 0;
  font-size: 14px;
  color: var(--lx-text-regular);
}

.lx-radio-demo__panel h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--lx-text-regular);
}

.lx-radio-demo__example {
  display: grid;
  gap: 8px;
  min-width: 0;
}

.lx-radio-demo__example h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: var(--lx-text-regular);
}

.lx-radio-demo__advanced {
  display: grid;
  gap: 12px;
  min-width: 0;
}

.lx-radio-demo__advanced summary {
  min-height: 44px;
  padding: 10px 4px;
  color: var(--lx-text-regular);
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
}

.lx-radio-demo__advanced summary:focus-visible {
  outline: 2px solid var(--lx-color-primary);
  outline-offset: 2px;
  border-radius: var(--lx-radius-sm);
}

.lx-radio-demo__advanced-content {
  display: grid;
  gap: 12px;
  min-width: 0;
}

.lx-radio-demo__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.lx-radio-demo__status,
.lx-radio-demo__note,
.lx-radio-demo__tip,
.lx-radio-demo__feedback {
  margin: 0;
  font-size: 14px;
  color: var(--lx-text-regular);
}

.lx-radio-demo__feedback.is-error {
  color: var(--lx-color-form-error);
}
</style>
