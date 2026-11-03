<script setup lang="ts">
import type { FormRules } from 'element-plus'
import { reactive, ref } from 'vue'

import LxButton from '../../LxButton/index.vue'
import LxForm from '../../LxForm/index.vue'
import LxFormItem from '../../LxForm/LxFormItem.vue'
import type { LxFormInstance } from '../../LxForm/types'
import LxPasswordInput from '../index.vue'

const formRef = ref<LxFormInstance>()
const model = reactive({ password: '' })
const hudTheme = ref(false)
const feedback = ref('')
const rules: FormRules = {
  password: [
    {
      required: true,
      message: '请输入表单访问口令',
      trigger: ['blur', 'change'],
    },
    {
      min: 8,
      max: 32,
      message: '访问口令需为 8 至 32 个字符',
      trigger: ['blur', 'change'],
    },
  ],
}

function validatePassword() {
  formRef.value?.validate().then(
    () => {
      feedback.value = '口令校验通过'
    },
    () => {
      feedback.value = '口令校验未通过'
    },
  )
}

function resetPassword() {
  formRef.value?.resetFields()
  feedback.value = ''
}
</script>

<template>
  <section
    class="password-form-demo"
    :class="{ 'lx-theme-hud': hudTheme }"
    data-testid="password-form-demo"
    aria-label="访问口令表单校验"
  >
    <label class="password-form-demo__theme">
      <input v-model="hudTheme" type="checkbox" />表单示例 HUD 深色主题
    </label>
    <LxForm
      ref="formRef"
      :model="model"
      :rules="rules"
      scroll-to-error
      @submit.prevent="validatePassword"
    >
      <LxFormItem
        label="表单访问口令"
        prop="password"
        for="demo-password-required"
      >
        <LxPasswordInput
          id="demo-password-required"
          v-model="model.password"
          name="demoAccessPassword"
          autocomplete="new-password"
          placeholder="请输入演示口令"
          :maxlength="32"
          clearable
          mask-on-blur
          aria-describedby="demo-password-hint"
          @update:model-value="feedback = ''"
        />
        <p id="demo-password-hint" class="password-form-demo__hint">
          本例校验 8 至 32 个字符。
        </p>
      </LxFormItem>
      <div class="password-form-demo__actions">
        <LxButton type="primary" native-type="submit">校验口令</LxButton>
        <LxButton @click="resetPassword">重置口令</LxButton>
      </div>
    </LxForm>
    <p
      class="password-form-demo__feedback"
      role="status"
      data-testid="password-validation-feedback"
    >
      {{ feedback }}
    </p>
  </section>
</template>

<style scoped>
.password-form-demo {
  min-width: 0;
  padding: var(--lx-space-md);
  background: var(--lx-bg-page);
  color: var(--lx-text-regular);
}

.password-form-demo__theme {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  gap: var(--lx-space-sm);
  font-size: 13px;
}

.password-form-demo__hint {
  flex-basis: 100%;
  margin-block: var(--lx-space-xs) 0;
  color: var(--lx-text-secondary-strong);
  font-size: 12px;
}

.password-form-demo__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--lx-space-sm);
  padding-block-start: var(--lx-space-sm);
}

.password-form-demo__actions :deep(.lx-btn) {
  min-height: 44px;
  margin-inline-start: 0;
}

.password-form-demo__feedback {
  min-height: 20px;
  margin-block: var(--lx-space-sm) 0;
  font-size: 13px;
}
</style>
