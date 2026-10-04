<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref } from 'vue'
import {
  ElTabPane,
  ElTabs,
  LxButton,
  LxCheckbox,
  LxCheckboxGroup,
  LxDatePicker,
  LxDescriptions,
  LxForm,
  LxFormItem,
  LxInput,
  LxInputNumber,
  LxPageCard,
  LxRadio,
  LxRadioGroup,
  LxSelect,
  LxSwitch,
  LxTextarea,
  LxVirtualTree,
  type LxFormInstance,
  type FormRules,
} from '../../../index'

const formRef = ref<LxFormInstance>()
const form = reactive({
  name: '',
  department: '',
  departments: ['command', 'patrol'],
  level: 'normal',
  channels: ['radio'],
  duration: 30,
  dates: [] as Date[],
  enabled: true,
  remark: '',
})
const rules: FormRules = {
  name: [{ required: true, message: '请输入任务名称', trigger: 'blur' }],
  department: [
    { required: true, message: '请选择责任部门', trigger: 'change' },
  ],
}
const feedback = ref('')
const hud = ref(false)
const activeTab = ref('overview')
const channelValues = ['radio', 'message']
const allChannelsChecked = computed(
  () => form.channels.length === channelValues.length,
)
const allChannelsIndeterminate = computed(
  () => form.channels.length > 0 && !allChannelsChecked.value,
)
const treeData = [
  {
    id: 'command',
    label: '指挥中心',
    children: [
      { id: 'first-squad', label: '一大队' },
      { id: 'second-squad', label: '二大队' },
    ],
  },
  {
    id: 'patrol',
    label: '巡防大队',
    children: [{ id: 'mobile-squad', label: '机动中队' }],
  },
]
let initialTheme: { dark: boolean; hud: boolean } | undefined

function toggleHud(value: string | number | boolean) {
  if (typeof document === 'undefined') return
  const enabled = value === true
  const root = document.documentElement
  initialTheme ??= {
    dark: root.classList.contains('dark'),
    hud: root.classList.contains('lx-theme-hud'),
  }
  hud.value = enabled
  root.classList.toggle('dark', enabled)
  root.classList.toggle('lx-theme-hud', enabled)
}

function validate() {
  formRef.value
    ?.validate()
    .then(() => {
      feedback.value = '校验通过'
    })
    .catch(() => {
      feedback.value = '请检查标红的必填字段'
    })
}

function reset() {
  formRef.value?.resetFields()
  feedback.value = '已重置'
}

function toggleAllChannels(value: string | number | boolean) {
  form.channels = value === true ? [...channelValues] : []
}

onBeforeUnmount(() => {
  if (!initialTheme) return
  document.documentElement.classList.toggle('dark', initialTheme.dark)
  document.documentElement.classList.toggle('lx-theme-hud', initialTheme.hud)
})
</script>

<template>
  <section class="lx-control-bridge-demo" aria-label="基础控件交互示例">
    <div class="lx-control-bridge-demo__toolbar">
      <div class="lx-control-bridge-demo__buttons">
        <LxButton type="primary" size="sm">小号操作</LxButton>
        <LxButton type="primary">主操作</LxButton>
        <LxButton type="primary" size="lg">大号操作</LxButton>
        <LxButton>次要操作</LxButton>
        <LxButton type="danger">危险操作</LxButton>
        <LxButton type="primary" disabled>禁用操作</LxButton>
      </div>
      <LxCheckbox v-model="hud" @change="toggleHud">HUD 深色</LxCheckbox>
    </div>

    <LxForm
      ref="formRef"
      :model="form"
      :rules="rules"
      class="lx-control-bridge-demo__form"
      :columns="2"
    >
      <LxFormItem label="任务名称" prop="name">
        <LxInput v-model="form.name" placeholder="输入任务名称" clearable />
      </LxFormItem>
      <LxFormItem label="责任部门" prop="department">
        <LxSelect
          v-model="form.department"
          placeholder="选择部门"
          clearable
          :options="[
            { label: '指挥中心', value: 'command' },
            { label: '巡防大队', value: 'patrol' },
          ]"
        />
      </LxFormItem>
      <LxFormItem label="协同部门">
        <LxSelect
          v-model="form.departments"
          multiple
          collapse-tags
          collapse-tags-tooltip
          placeholder="选择协同部门"
          clearable
          :options="[
            { label: '指挥中心', value: 'command' },
            { label: '巡防大队', value: 'patrol' },
            { label: '应急支队', value: 'response' },
          ]"
        />
      </LxFormItem>
      <LxFormItem label="任务等级">
        <LxRadioGroup v-model="form.level">
          <LxRadio value="normal">常规</LxRadio>
          <LxRadio value="urgent">紧急</LxRadio>
        </LxRadioGroup>
      </LxFormItem>
      <LxFormItem label="通知渠道">
        <div class="lx-control-bridge-demo__channels">
          <LxCheckbox
            class="lx-control-bridge-demo__channels-all"
            :model-value="allChannelsChecked"
            :indeterminate="allChannelsIndeterminate"
            @change="toggleAllChannels"
          >
            全选通知渠道
          </LxCheckbox>
          <LxCheckboxGroup
            v-model="form.channels"
            class="lx-control-bridge-demo__channels-options"
          >
            <LxCheckbox value="radio">电台</LxCheckbox>
            <LxCheckbox value="message">短信</LxCheckbox>
          </LxCheckboxGroup>
        </div>
      </LxFormItem>
      <LxFormItem label="持续时间（分钟）">
        <LxInputNumber v-model="form.duration" :min="1" :max="120" />
      </LxFormItem>
      <LxFormItem label="执行日期">
        <LxDatePicker
          v-model="form.dates"
          type="daterange"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
        />
      </LxFormItem>
      <LxFormItem label="启用任务">
        <LxSwitch v-model="form.enabled" aria-label="启用任务" />
      </LxFormItem>
      <LxFormItem label="备注">
        <LxTextarea
          v-model="form.remark"
          :rows="2"
          placeholder="补充任务要求"
        />
      </LxFormItem>
      <LxFormItem label="只读状态">
        <LxInput model-value="由系统自动分配" disabled />
      </LxFormItem>
    </LxForm>

    <div class="lx-control-bridge-demo__actions">
      <LxButton type="primary" @click="validate">校验表单</LxButton>
      <LxButton @click="reset">重置</LxButton>
      <span role="status" aria-live="polite">{{ feedback }}</span>
    </div>

    <div class="lx-control-bridge-demo__display">
      <LxPageCard title="基础信息">
        <ElTabs v-model="activeTab" aria-label="基础信息页签">
          <ElTabPane label="概览" name="overview">
            <LxDescriptions
              :columns="2"
              :items="[
                {
                  key: 'status',
                  label: '任务状态',
                  value: '执行中',
                  statusDot: 'processing',
                },
                { key: 'department', label: '责任部门', value: '指挥中心' },
              ]"
            />
          </ElTabPane>
          <ElTabPane label="组织树" name="tree">
            <LxVirtualTree
              :data="treeData"
              :height="160"
              :default-expanded-keys="['command', 'patrol']"
            />
          </ElTabPane>
        </ElTabs>
      </LxPageCard>
    </div>
  </section>
</template>

<style scoped>
.lx-control-bridge-demo {
  min-width: 0;
  padding: var(--lx-space-lg);
  border: 1px solid var(--lx-border);
  border-radius: var(--lx-radius-md);
  background: var(--lx-bg-card);
  color: var(--lx-text-regular);
}

.lx-control-bridge-demo__toolbar,
.lx-control-bridge-demo__buttons,
.lx-control-bridge-demo__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--lx-space-sm);
}

.lx-control-bridge-demo__display {
  min-width: 0;
  margin-top: var(--lx-space-lg);
}

.lx-control-bridge-demo__toolbar {
  justify-content: space-between;
  margin-bottom: var(--lx-space-lg);
}

.lx-control-bridge-demo__form :deep(.el-form-item) {
  min-width: 0;
}

.lx-control-bridge-demo__form :deep(.lx-select),
.lx-control-bridge-demo__form :deep(.lx-date-picker) {
  width: 100%;
}

.lx-control-bridge-demo__channels {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--lx-space-xs);
}

.lx-control-bridge-demo__channels-all {
  display: flex;
  width: fit-content;
  margin: 0;
}

.lx-control-bridge-demo__channels-options {
  display: flex;
  flex-wrap: wrap;
  column-gap: var(--lx-space-sm);
  margin-left: 22px;
}

.lx-control-bridge-demo__channels-options :deep(.lx-checkbox) {
  margin-right: 0;
}

.lx-control-bridge-demo__actions {
  padding-top: var(--lx-space-sm);
  border-top: 1px solid var(--lx-border-light);
  font-size: 13px;
}

@media (max-width: 640px) {
  .lx-control-bridge-demo {
    padding: var(--lx-space-md);
  }
}
</style>
