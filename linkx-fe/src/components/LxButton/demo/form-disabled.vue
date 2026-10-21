<script setup lang="ts">
import { ref } from 'vue'

import LxForm from '../../LxForm/index.vue'
import LxButton from '../index.vue'

const form = {}
const formDisabled = ref(false)
const withText = ref(false)
const clickCount = ref(0)
</script>

<template>
  <section class="lx-button-form-demo" aria-label="按钮表单禁用与动态文字示例">
    <label><input v-model="formDisabled" type="checkbox" />禁用整个表单</label>
    <label><input v-model="withText" type="checkbox" />显示按钮文字</label>
    <LxForm :model="form" :disabled="formDisabled">
      <LxButton icon="refresh" aria-label="刷新表单" @click="clickCount += 1">
        <template v-if="withText" #default>刷新表单</template>
      </LxButton>
    </LxForm>
    <p role="status">已刷新 {{ clickCount }} 次</p>
  </section>
</template>

<style scoped>
.lx-button-form-demo {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--lx-space-md);
}

.lx-button-form-demo label {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  gap: var(--lx-space-xs);
}

.lx-button-form-demo p {
  margin: 0;
}
</style>
