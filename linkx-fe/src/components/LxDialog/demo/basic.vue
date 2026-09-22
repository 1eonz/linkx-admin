<script setup lang="ts">
// demo：新建涉警联动工单 — 双列表单弹窗（stitch FormModal 原型场景）
import { ref } from 'vue';
import { LxDialog, lxMessage } from '../../../index';

const visible = ref(false);
const loading = ref(false);
const form = ref({ level: '紧急', place: '', assignee: '084920 (张警官)' });

function submit() {
  if (!form.value.place.trim()) {
    lxMessage.warning('请填写案发精确地点');
    return;
  }
  loading.value = true;
  // 业务在此发请求（P7：组件零请求依赖）
  setTimeout(() => {
    loading.value = false;
    visible.value = false;
    lxMessage.success('工单已派发至 3 号网格');
  }, 800);
}
</script>

<template>
  <div>
    <button class="demo-btn" @click="visible = true">新建涉警联动工单</button>

    <LxDialog
      v-model="visible"
      title="新建涉警联动工单"
      icon="shield"
      confirm-text="确认派单"
      :loading="loading"
      @confirm="submit"
    >
      <div class="lx-dialog-form-grid">
        <label class="lx-dialog-form-field">
          <span class="lx-dialog-form-label">接报人警号</span>
          <input class="lx-dialog-form-input" v-model="form.assignee" readonly />
        </label>
        <label class="lx-dialog-form-field">
          <span class="lx-dialog-form-label">险情响应等级</span>
          <select class="lx-dialog-form-input" v-model="form.level">
            <option>紧急</option>
            <option>重大</option>
            <option>一般</option>
          </select>
        </label>
        <label class="lx-dialog-form-field lx-dialog-form-field--full">
          <span class="lx-dialog-form-label">案发精确地点</span>
          <input class="lx-dialog-form-input" v-model="form.place" placeholder="道路 + 门牌 / 网格编号" />
        </label>
      </div>
    </LxDialog>
  </div>
</template>

<style scoped>
.lx-dialog-form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--lx-space-md);
}

.lx-dialog-form-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.lx-dialog-form-field--full {
  grid-column: 1 / -1;
}

.lx-dialog-form-label {
  font-size: 11px;
  color: var(--lx-text-secondary);
}

.lx-dialog-form-input {
  height: var(--lx-control-height);
  padding: 0 var(--lx-space-sm);
  border: 1px solid var(--lx-border);
  border-radius: var(--lx-radius-md);
  background: var(--lx-bg-card);
  color: var(--lx-text-regular);
  font-size: 13px;
}

.lx-dialog-form-input:focus {
  outline: none;
  border-color: var(--lx-color-primary);
}
</style>
