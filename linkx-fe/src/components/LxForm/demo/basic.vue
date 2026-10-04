<script setup lang="ts">
// demo：巡防任务登记 — 基础校验表单（label 上置 + blur/change 触发，错误样式由 LxForm 接管）
// 同时演示：LxForm 内直接写原生 el-form-item，同样获得组件库错误样式（存量迁移零成本）
import { reactive, ref, watch } from 'vue'
import type { FormRules } from 'element-plus'
import {
  LxForm,
  LxFormItem,
  LxButton,
  LxInput,
  LxSelect,
  LxTextarea,
} from '../../../index'
import type { LxFormInstance } from '../../../index'

const formRef = ref<LxFormInstance>()

const form = reactive({
  taskName: '',
  grid: '',
  phone: '',
  remark: '',
})
const feedback = ref('')
const feedbackIsError = ref(false)

const rules: FormRules = {
  taskName: [
    { required: true, message: '请输入任务名称', trigger: 'blur' },
    { min: 2, max: 20, message: '任务名称长度 2 ~ 20 个字符', trigger: 'blur' },
  ],
  grid: [{ required: true, message: '请选择责任网格', trigger: 'change' }],
  phone: [
    {
      pattern: /^1\d{10}$/,
      message: '联系电话须为 11 位手机号',
      trigger: 'blur',
    },
  ],
}

function onSubmit() {
  formRef
    .value!.validate()
    .then(() => {
      feedbackIsError.value = false
      feedback.value = '巡防任务登记校验通过'
    })
    .catch(() => {
      feedbackIsError.value = true
      feedback.value = '表单校验未通过，请检查字段错误'
    })
}

function onReset() {
  formRef.value!.resetFields()
  feedback.value = ''
}

watch(
  form,
  () => {
    if (feedbackIsError.value) feedback.value = ''
  },
  { deep: true },
)
</script>

<template>
  <div class="lx-form-basic-demo">
    <LxForm
      ref="formRef"
      :model="form"
      :rules="rules"
      label-position="top"
      scroll-to-error
    >
      <LxFormItem label="任务名称" prop="taskName">
        <LxInput
          v-model="form.taskName"
          placeholder="如：广场东侧夜间巡防"
          clearable
        />
      </LxFormItem>

      <LxFormItem label="责任网格" prop="grid">
        <LxSelect
          v-model="form.grid"
          placeholder="选择网格"
          clearable
          :options="[
            { label: 'GRID-01 中心商圈', value: 'grid-01' },
            { label: 'GRID-02 关山片区', value: 'grid-02' },
            { label: 'GRID-03 高新园区', value: 'grid-03' },
          ]"
        />
      </LxFormItem>

      <LxFormItem label="联系电话" prop="phone">
        <LxInput v-model="form.phone" placeholder="值班民警手机号" clearable />
      </LxFormItem>

      <LxFormItem label="现场备注" prop="remark">
        <LxTextarea v-model="form.remark" :rows="2" placeholder="选填" />
      </LxFormItem>

      <LxFormItem>
        <div style="display: flex; gap: 8px">
          <LxButton type="primary" @click="onSubmit"> 提交校验 </LxButton>
          <LxButton @click="onReset">重置</LxButton>
        </div>
      </LxFormItem>
    </LxForm>
    <p
      v-if="feedback"
      class="lx-form-basic-demo__feedback"
      :class="{ 'is-error': feedbackIsError }"
      :role="feedbackIsError ? 'alert' : 'status'"
      aria-live="polite"
    >
      {{ feedback }}
    </p>
  </div>
</template>

<style scoped>
.lx-form-basic-demo {
  max-width: 480px;
}

.lx-form-basic-demo__feedback {
  margin: var(--lx-space-sm) 0 0;
  color: var(--lx-color-success-text);
  font-size: 12px;
}

.lx-form-basic-demo__feedback.is-error {
  color: var(--lx-color-form-error);
}
</style>
