<script setup lang="ts">
import type { FormRules } from 'element-plus'
import { reactive, ref } from 'vue'

import LxButton from '../../LxButton/index.vue'
import LxForm from '../../LxForm/index.vue'
import LxFormItem from '../../LxForm/LxFormItem.vue'
import type { LxFormInstance } from '../../LxForm/types'
import LxInputNumber from '../index.vue'

const formRef = ref<LxFormInstance>()
const numberRef = ref<InstanceType<typeof LxInputNumber>>()
const model = reactive<{ quota: number | undefined }>({ quota: undefined })
const hudTheme = ref(false)
const feedback = ref('')
const focusFeedback = ref('尚未操作数值字段')
const rules: FormRules = {
  quota: [
    {
      required: true,
      message: '请输入本次调度配额',
      trigger: ['blur', 'change'],
    },
    {
      type: 'number',
      min: 1,
      max: 10,
      message: '本次调度配额应为 1 至 10',
      trigger: ['blur', 'change'],
    },
  ],
}

function validateQuota() {
  formRef.value?.validate().then(
    () => {
      feedback.value = '配额校验通过'
    },
    () => {
      feedback.value = '配额校验未通过'
    },
  )
}

function resetQuota() {
  formRef.value?.resetFields()
  feedback.value = ''
}
</script>

<template>
  <section
    class="lx-input-number-form-demo"
    :class="{ 'lx-theme-hud': hudTheme }"
    data-testid="number-form-demo"
    aria-label="调度配额校验"
  >
    <label class="lx-input-number-form-demo__theme">
      <input v-model="hudTheme" type="checkbox" />表单示例 HUD 深色主题
    </label>
    <LxForm
      ref="formRef"
      :model="model"
      :rules="rules"
      scroll-to-error
      @submit.prevent="validateQuota"
    >
      <LxFormItem label="本次调度配额" prop="quota" for="demo-number-required">
        <LxInputNumber
          id="demo-number-required"
          ref="numberRef"
          v-model="model.quota"
          :min="0"
          :max="20"
          placeholder="请输入配额"
          aria-describedby="demo-number-quota-hint"
          @change="feedback = ''"
          @focus="focusFeedback = '数值字段已聚焦'"
          @blur="focusFeedback = '数值字段已失焦'"
        />
        <p id="demo-number-quota-hint" class="lx-input-number-form-demo__hint">
          本次可调度 1 至 10 组。
        </p>
      </LxFormItem>
      <div class="lx-input-number-form-demo__actions">
        <LxButton type="primary" native-type="submit">校验配额</LxButton>
        <LxButton @click="resetQuota">重置配额</LxButton>
        <LxButton @click="numberRef?.focus()">聚焦数值字段</LxButton>
        <LxButton @pointerdown.prevent @click="numberRef?.blur()"
          >失焦数值字段</LxButton
        >
      </div>
    </LxForm>
    <p
      class="lx-input-number-form-demo__status"
      role="status"
      data-testid="number-validation-feedback"
    >
      {{ feedback }}
    </p>
    <p
      class="lx-input-number-form-demo__status"
      role="status"
      data-testid="number-focus-feedback"
    >
      {{ focusFeedback }}
    </p>
  </section>
</template>

<style scoped>
.lx-input-number-form-demo {
  min-width: 0;
  padding: var(--lx-space-md);
  background: var(--lx-bg-page);
  color: var(--lx-text-regular);
}

.lx-input-number-form-demo__theme {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  gap: var(--lx-space-sm);
  font-size: 13px;
}

.lx-input-number-form-demo__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--lx-space-sm);
}

.lx-input-number-form-demo__actions :deep(.lx-btn) {
  min-height: 44px;
  margin-inline-start: 0;
}

.lx-input-number-form-demo__hint {
  flex-basis: 100%;
  margin-block: var(--lx-space-xs) 0;
  color: var(--lx-text-secondary-strong);
  font-size: 12px;
}

.lx-input-number-form-demo__status {
  min-height: 20px;
  margin-block: var(--lx-space-sm) 0;
  font-size: 13px;
}
</style>
