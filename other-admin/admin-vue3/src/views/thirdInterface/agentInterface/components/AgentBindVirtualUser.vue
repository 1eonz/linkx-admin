<script setup lang="ts">
import { ElMessage } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import { computed, reactive, ref, watch } from 'vue';

import { getVirtualUserList, type VirtualUserItem } from '@/api/policeExtend/virtualUser';
import {
  assistantAgentList,
  createAssistantAgent,
  updateAssistantAgent,
  type AssistantAgentBinding,
} from '@/api/thirdInterface/agentInterface';

defineOptions({ name: 'AgentBindVirtualUser' });
const props = defineProps<{ visible: boolean; agentId?: string }>();
const emit = defineEmits<{ (e: 'update:visible', value: boolean): void }>();
const dialogVisible = computed({ get: () => props.visible, set: (value: boolean) => emit('update:visible', value) });
const formRef = ref<FormInstance>();
const loading = ref(false);
const loadError = ref(false);
const submitting = ref(false);
let requestVersion = 0;
const boundVirtualUserId = ref('');
const users = ref<VirtualUserItem[]>([]);
const form = reactive<AssistantAgentBinding>({ agentId: '', virtualUserId: '', createdUserId: null });
const rules: FormRules = { virtualUserId: [{ required: false, message: '请选择关联用户', trigger: 'change' }] };

function init(): Promise<void> {
  // 绑定关系先于用户列表加载；任一步失败都禁用提交，避免写入不完整状态。
  const version = ++requestVersion;
  Object.assign(form, {
    id: undefined,
    agentId: props.agentId ?? '',
    virtualUserId: '',
    createdUserId: localStorage.getItem('back_user_id'),
  });
  boundVirtualUserId.value = '';
  users.value = [];
  loadError.value = false;
  loading.value = true;
  const bindingRequest = form.agentId
    ? assistantAgentList({ agentId: form.agentId }).then((result) => {
        if (version !== requestVersion) return;
        if (result.code !== 0) {
          loadError.value = true;
          ElMessage.error(result.msg ?? '获取关联用户失败');
          return false;
        }
        const item = (result.data?.records ?? [])[0];
        if (item) {
          Object.assign(form, item, { agentId: form.agentId });
          boundVirtualUserId.value = item.virtualUserId ?? '';
        }
        return true;
      })
    : Promise.resolve(true);

  return bindingRequest
    .then((canLoadUsers) => {
      if (!canLoadUsers || version !== requestVersion) return;
      return getVirtualUserList({}).then((result) => {
        if (version !== requestVersion) return;
        if (result.code !== 0) {
          loadError.value = true;
          ElMessage.error(result.msg ?? '获取用户列表失败');
          return;
        }
        users.value = ((result.data as VirtualUserItem[]) ?? []).map((item) => ({
          ...item,
          isBound: Boolean(item.agentId && item.id !== boundVirtualUserId.value),
        }));
      });
    })
    .catch(() => {
      if (version !== requestVersion) return;
      loadError.value = true;
      ElMessage.error('获取用户列表失败');
    })
    .finally(() => {
      if (version === requestVersion) loading.value = false;
    });
}

async function submit(): Promise<void> {
  // 读取未完成或失败时不允许创建/更新绑定。
  if (submitting.value || loading.value || loadError.value) return;
  submitting.value = true;
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) {
    submitting.value = false;
    return;
  }
  const request = form.id ? updateAssistantAgent(form.id, form) : createAssistantAgent(form);
  return request
    .then((result) => {
      if (result.code !== 0) {
        ElMessage.error(result.msg ?? '关联失败');
        return;
      }
      ElMessage.success('关联成功');
      dialogVisible.value = false;
    })
    .catch(() => {
      ElMessage.error('关联失败');
    })
    .finally(() => {
      submitting.value = false;
    });
}
watch(dialogVisible, (value) => {
  if (value) void init();
  else requestVersion += 1;
});
watch(
  () => props.agentId,
  () => {
    if (dialogVisible.value) void init();
  },
);
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    title="关联用户"
    width="500px"
    append-to-body
    :close-on-click-modal="false"
    :close-on-press-escape="!submitting"
    :show-close="!submitting"
  >
    <el-form ref="formRef" v-loading="loading" :model="form" :rules="rules" label-width="90px">
      <el-form-item label="关联用户" prop="virtualUserId">
        <el-select v-model="form.virtualUserId" filterable clearable placeholder="请选择用户" style="width: 100%">
          <el-option
            v-for="user in users"
            :key="user.id"
            :label="user.userName"
            :value="user.id"
            :disabled="user.isBound"
          />
        </el-select>
      </el-form-item>
    </el-form>
    <el-alert v-if="loadError" title="关联信息加载失败，请重试" type="error" :closable="false" show-icon />
    <template #footer
      ><el-button :disabled="submitting" @click="dialogVisible = false">取消</el-button
      ><el-button v-if="loadError" :disabled="loading" @click="init">重试</el-button
      ><el-button type="primary" :loading="submitting" :disabled="loading || loadError || submitting" @click="submit"
        >确定</el-button
      ></template
    >
  </el-dialog>
</template>
