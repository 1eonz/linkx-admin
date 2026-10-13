<script setup lang="ts">
import type { FormRules } from 'element-plus'
import { useData } from 'vitepress'
import { onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'

import { LxButton, LxForm, LxFormItem } from '../../../index'
import type { LxFormInstance } from '../../../index'
import LxCheckboxGroup from '../../LxCheckboxGroup/index.vue'
import LxCheckbox from '../index.vue'

const hudTheme = ref(false)
const { isDark } = useData()

/** 组内多选：关联授权业务权限（标本 04）；组值集合对齐 EP 契约（string | number 数组） */
const permissions = ref<(string | number)[]>(['video'])
const horizontalPermissions = ref<(string | number)[]>(['briefing'])
const legacyPermissions = ref<(string | number)[]>(['video'])
const disabledGroupPermissions = ref<(string | number)[]>(['video'])
const disabledForm = reactive({
  agreed: true,
  channels: ['briefing'] as (string | number)[],
})
/** 独立复选：单条承诺确认 */
const agreed = ref(false)
const dispatchIndeterminate = ref(true)
const permissionChangeMessage = ref('勾选后在此显示更新的组选中值')
const legacyChangeMessage = ref('旧 label 组初始选中值：视频巡查权限')
const validationFormRef = ref<LxFormInstance>()
const validationForm = reactive({ permissions: [] as string[] })
const validationFeedback = ref('')
const validationFeedbackIsError = ref(false)
const validationRules: FormRules = {
  permissions: [
    {
      type: 'array',
      required: true,
      min: 1,
      message: '至少选择一项权限',
      trigger: 'change',
    },
  ],
}

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

function reportPermissionChange(values: (string | number)[]) {
  permissionChangeMessage.value =
    '组选中值已更新：' + formatSelected(values, permissionLabels)
}

function reportLegacyChange(values: (string | number)[]) {
  legacyChangeMessage.value =
    '旧 label 组选中值已更新：' + formatSelected(values, permissionLabels)
}

function validatePermissions() {
  validationFormRef.value
    ?.validate()
    .then(() => {
      validationFormRef.value?.clearValidate('permissions')
      validationFeedbackIsError.value = false
      validationFeedback.value = '权限校验通过'
    })
    .catch(() => {
      validationFeedbackIsError.value = true
      validationFeedback.value = '请先修正授权范围'
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
        @change="reportPermissionChange"
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
      <p
        class="lx-checkbox-demo__status"
        data-testid="permission-change-message"
        aria-live="polite"
      >
        {{ permissionChangeMessage }}
      </p>
    </section>

    <section class="lx-checkbox-demo__panel" data-testid="standalone">
      <h3>独立确认与通知渠道</h3>
      <div class="lx-checkbox-demo__example">
        <h4>知情确认</h4>
        <LxCheckbox v-model="agreed">已知晓涉密核验义务并承诺遵守</LxCheckbox>
      </div>
      <div class="lx-checkbox-demo__example">
        <h4>通知渠道</h4>
        <LxCheckboxGroup
          v-model="horizontalPermissions"
          aria-label="水平排布的通知渠道"
        >
          <LxCheckbox value="briefing">警情简报</LxCheckbox>
          <LxCheckbox value="dispatch">勤务调度</LxCheckbox>
          <LxCheckbox value="broadcast">协同通知</LxCheckbox>
        </LxCheckboxGroup>
      </div>
      <p class="lx-checkbox-demo__tip">
        独立复选框使用布尔值；组内选项使用字符串或数字值
      </p>
    </section>

    <section class="lx-checkbox-demo__panel" data-testid="validation">
      <h3>授权范围必填校验</h3>
      <LxForm
        ref="validationFormRef"
        data-testid="checkbox-validation-form"
        :model="validationForm"
        :rules="validationRules"
        label-position="top"
        scroll-to-error
      >
        <LxFormItem label="授权范围" prop="permissions">
          <LxCheckboxGroup
            v-model="validationForm.permissions"
            aria-label="待确认权限范围"
          >
            <LxCheckbox value="video">视频巡查权限</LxCheckbox>
            <LxCheckbox value="dispatch">警单流转</LxCheckbox>
          </LxCheckboxGroup>
        </LxFormItem>
        <LxFormItem>
          <div class="lx-checkbox-demo__actions">
            <LxButton type="primary" @click="validatePermissions">
              提交校验
            </LxButton>
            <LxButton @click="resetValidationForm">重置</LxButton>
          </div>
        </LxFormItem>
      </LxForm>
      <p
        v-if="validationFeedback"
        data-testid="checkbox-validation-feedback"
        class="lx-checkbox-demo__feedback"
        :class="{ 'is-error': validationFeedbackIsError }"
        :role="validationFeedbackIsError ? 'alert' : 'status'"
        aria-live="polite"
      >
        {{ validationFeedback }}
      </p>
    </section>

    <p
      class="lx-checkbox-demo__status"
      data-testid="selection-summary"
      aria-live="polite"
    >
      完全授权：{{ formatSelected(permissions, permissionLabels) }}；
      部分授权：{{ dispatchIndeterminate ? '警单流转' : '无' }}； 通知渠道：{{
        formatSelected(horizontalPermissions, channelLabels)
      }}； 承诺{{ agreed ? '已' : '未' }}勾选
    </p>
    <p class="lx-checkbox-demo__note">
      示例状态只保存在当前页面，不会写入业务系统。
    </p>

    <details
      class="lx-checkbox-demo__advanced"
      data-testid="checkbox-advanced-examples"
    >
      <summary>旧值兼容与禁用继承示例</summary>
      <div class="lx-checkbox-demo__advanced-content">
        <section class="lx-checkbox-demo__panel" data-testid="legacy">
          <h3>旧版 label 组选中值兼容</h3>
          <LxCheckboxGroup
            v-model="legacyPermissions"
            aria-label="旧版 label 权限范围"
            @change="reportLegacyChange"
          >
            <LxCheckbox label="video">视频巡查权限</LxCheckbox>
            <LxCheckbox label="broadcast">全网广播调度</LxCheckbox>
          </LxCheckboxGroup>
          <p
            class="lx-checkbox-demo__status"
            data-testid="legacy-change-message"
            aria-live="polite"
          >
            {{ legacyChangeMessage }}
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
          <div
            class="lx-checkbox-demo__example"
            data-testid="checkbox-group-disabled"
          >
            <h4>整组禁用</h4>
            <LxCheckboxGroup
              v-model="disabledGroupPermissions"
              disabled
              aria-label="整组禁用的授权范围"
            >
              <LxCheckbox value="video">视频巡查权限</LxCheckbox>
              <LxCheckbox value="broadcast">全网广播调度</LxCheckbox>
            </LxCheckboxGroup>
          </div>
          <div
            class="lx-checkbox-demo__example"
            data-testid="checkbox-form-disabled"
          >
            <h4>LxForm 禁用继承</h4>
            <LxForm :model="disabledForm" disabled label-position="top">
              <LxFormItem label="独立确认" prop="agreed">
                <LxCheckbox
                  v-model="disabledForm.agreed"
                  aria-label="继承表单禁用的独立确认"
                >
                  已知晓涉密核验义务
                </LxCheckbox>
              </LxFormItem>
              <LxFormItem label="通知渠道" prop="channels">
                <LxCheckboxGroup
                  v-model="disabledForm.channels"
                  aria-label="继承表单禁用的通知渠道"
                >
                  <LxCheckbox value="briefing">警情简报</LxCheckbox>
                  <LxCheckbox value="dispatch">勤务调度</LxCheckbox>
                </LxCheckboxGroup>
              </LxFormItem>
            </LxForm>
          </div>
        </section>
      </div>
    </details>
  </div>
</template>

<style scoped>
.lx-checkbox-demo {
  display: grid;
  gap: 16px;
  padding: 16px;
  color: var(--lx-text-primary);
  background: var(--lx-bg-page);
}

.lx-checkbox-demo__toolbar {
  display: flex;
  align-items: center;
  font-size: 13px;
}

.lx-checkbox-demo__toolbar label {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  min-height: 44px;
  padding-inline: 4px;
  cursor: pointer;
  border-radius: var(--lx-radius-sm);
}

.lx-checkbox-demo__theme-toggle:focus-within {
  outline: 2px solid var(--lx-color-primary);
  outline-offset: 2px;
}

.lx-checkbox-demo__panel {
  display: grid;
  gap: 12px;
  min-width: 0;
  padding: 12px;
  background: var(--lx-bg-card);
  border: 1px solid var(--lx-border);
  border-radius: var(--lx-radius-sm);
}

.lx-checkbox-demo__panel h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--lx-text-regular);
}

.lx-checkbox-demo__example {
  display: grid;
  gap: 8px;
  min-width: 0;
}

.lx-checkbox-demo__example h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: var(--lx-text-regular);
}

.lx-checkbox-demo__advanced {
  display: grid;
  gap: 12px;
  min-width: 0;
}

.lx-checkbox-demo__advanced summary {
  min-height: 44px;
  padding: 10px 4px;
  color: var(--lx-text-regular);
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
}

.lx-checkbox-demo__advanced summary:focus-visible {
  outline: 2px solid var(--lx-color-primary);
  outline-offset: 2px;
  border-radius: var(--lx-radius-sm);
}

.lx-checkbox-demo__advanced-content {
  display: grid;
  gap: 12px;
  min-width: 0;
}

.lx-checkbox-demo__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.lx-checkbox-demo__status,
.lx-checkbox-demo__note,
.lx-checkbox-demo__tip,
.lx-checkbox-demo__feedback {
  margin: 0;
  font-size: 14px;
  color: var(--lx-text-regular);
}

.lx-checkbox-demo__feedback.is-error {
  color: var(--lx-color-form-error);
}
</style>
