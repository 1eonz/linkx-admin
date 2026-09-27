<script setup lang="ts">
import { onBeforeUnmount, reactive, ref } from 'vue'
import {
  ElButton,
  ElCheckbox,
  ElCheckboxGroup,
  ElDatePicker,
  ElDescriptions,
  ElDescriptionsItem,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElOption,
  ElRadio,
  ElRadioGroup,
  ElSelect,
  ElSwitch,
  ElTabPane,
  ElTabs,
  ElTree,
  type FormInstance,
  type FormRules,
} from '../../../index'

const formRef = ref<FormInstance>()
const form = reactive({
  name: '',
  department: '',
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
const treeData = [
  { label: '指挥中心', children: [{ label: '一大队' }, { label: '二大队' }] },
  { label: '巡防大队', children: [{ label: '机动中队' }] },
]
let initialTheme: { dark: boolean; hud: boolean } | undefined

function toggleHud(value: boolean) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  initialTheme ??= {
    dark: root.classList.contains('dark'),
    hud: root.classList.contains('lx-theme-hud'),
  }
  hud.value = value
  root.classList.toggle('dark', value)
  root.classList.toggle('lx-theme-hud', value)
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
        <ElButton type="primary" size="small">小号操作</ElButton>
        <ElButton type="primary">主操作</ElButton>
        <ElButton type="primary" size="large">大号操作</ElButton>
        <ElButton>次要操作</ElButton>
        <ElButton type="danger">危险操作</ElButton>
        <ElButton type="primary" disabled>禁用操作</ElButton>
      </div>
      <label class="lx-control-bridge-demo__theme">
        <input
          :checked="hud"
          type="checkbox"
          @change="toggleHud(($event.target as HTMLInputElement).checked)"
        />
        HUD 深色
      </label>
    </div>

    <ElForm
      ref="formRef"
      :model="form"
      :rules="rules"
      label-position="top"
      class="lx-control-bridge-demo__form"
    >
      <ElFormItem label="任务名称" prop="name">
        <ElInput v-model="form.name" placeholder="输入任务名称" clearable />
      </ElFormItem>
      <ElFormItem label="责任部门" prop="department">
        <ElSelect v-model="form.department" placeholder="选择部门" clearable>
          <ElOption label="指挥中心" value="command" />
          <ElOption label="巡防大队" value="patrol" />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="任务等级">
        <ElRadioGroup v-model="form.level">
          <ElRadio value="normal">常规</ElRadio>
          <ElRadio value="urgent">紧急</ElRadio>
        </ElRadioGroup>
      </ElFormItem>
      <ElFormItem label="通知渠道">
        <ElCheckboxGroup v-model="form.channels">
          <ElCheckbox value="radio">电台</ElCheckbox>
          <ElCheckbox value="message">短信</ElCheckbox>
        </ElCheckboxGroup>
      </ElFormItem>
      <ElFormItem label="持续时间（分钟）">
        <ElInputNumber v-model="form.duration" :min="1" :max="120" />
      </ElFormItem>
      <ElFormItem label="执行日期">
        <ElDatePicker
          v-model="form.dates"
          type="daterange"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
        />
      </ElFormItem>
      <ElFormItem label="启用任务">
        <ElSwitch v-model="form.enabled" aria-label="启用任务" />
      </ElFormItem>
      <ElFormItem label="备注">
        <ElInput
          v-model="form.remark"
          type="textarea"
          :rows="2"
          placeholder="补充任务要求"
        />
      </ElFormItem>
      <ElFormItem label="只读状态">
        <ElInput model-value="由系统自动分配" disabled />
      </ElFormItem>
    </ElForm>

    <div class="lx-control-bridge-demo__actions">
      <ElButton type="primary" @click="validate">校验表单</ElButton>
      <ElButton @click="reset">重置</ElButton>
      <span role="status" aria-live="polite">{{ feedback }}</span>
    </div>

    <div class="lx-control-bridge-demo__display">
      <ElCard shadow="never" class="lx-control-bridge-demo__card">
        <ElTabs v-model="activeTab" aria-label="基础信息页签">
          <ElTabPane label="概览" name="overview">
            <ElDescriptions :column="2" border>
              <ElDescriptionsItem label="任务状态">执行中</ElDescriptionsItem>
              <ElDescriptionsItem label="责任部门">指挥中心</ElDescriptionsItem>
            </ElDescriptions>
          </ElTabPane>
          <ElTabPane label="组织树" name="tree">
            <ElTree :data="treeData" node-key="label" default-expand-all />
          </ElTabPane>
        </ElTabs>
      </ElCard>
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

.lx-control-bridge-demo__card :deep(.el-tree) {
  max-height: 160px;
  overflow: auto;
}

.lx-control-bridge-demo__toolbar {
  justify-content: space-between;
  margin-bottom: var(--lx-space-lg);
}

.lx-control-bridge-demo__theme {
  display: inline-flex;
  align-items: center;
  gap: var(--lx-space-xs);
  font-size: 13px;
}

.lx-control-bridge-demo__theme input {
  accent-color: var(--lx-color-primary);
}

.lx-control-bridge-demo__theme input:focus-visible {
  outline: 2px solid var(--lx-color-primary);
  outline-offset: 2px;
}

.lx-control-bridge-demo__form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: var(--lx-space-lg);
}

.lx-control-bridge-demo__form :deep(.el-form-item) {
  min-width: 0;
}

.lx-control-bridge-demo__form :deep(.el-select),
.lx-control-bridge-demo__form :deep(.el-date-editor) {
  width: 100%;
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

  .lx-control-bridge-demo__form {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
