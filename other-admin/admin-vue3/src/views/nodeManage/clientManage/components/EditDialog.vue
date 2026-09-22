<script setup lang="ts">
/**
 * EditDialog - 客户端节点编辑弹窗
 *
 * 功能特性：
 * 1. 编辑客户端的 name / remark / tag 三个字段（无校验规则）
 * 2. peerId 隐藏不展示，从 clientData 取，提交时回传
 * 3. watch visible 变 true 时通过 Object.assign 填充表单
 * 4. 提交 emit submit({ peerId, data: { name, remark, tag } })，由父组件调用 API
 *
 * Props:
 * - visible: boolean，v-model 控制弹窗显隐
 * - clientData: ClientItem | null，当前编辑的客户端数据
 * - loading: boolean，提交按钮 loading 状态（由父组件控制）
 *
 * Events:
 * - update:visible: 弹窗显隐变化
 * - submit: ({ peerId, data }) => void，data 为 { name, remark, tag }
 *
 * @example
 * ```vue
 * <EditDialog v-model:visible="dialogVisible" :client-data="currentClient" :loading="submitLoading" @submit="handleSubmit" />
 * ```
 */
import type { FormInstance } from 'element-plus';
import { computed, reactive, ref, watch } from 'vue';

import type { ClientItem, ClientUpdatePayload } from '@/api/nodeManage/client';

defineOptions({ name: 'EditDialog' });

interface SubmitPayload {
  peerId: string;
  data: Pick<ClientUpdatePayload, 'name' | 'remark' | 'tag'>;
}

const props = defineProps<{
  visible: boolean;
  clientData: ClientItem | null;
  loading: boolean;
}>();
const emit = defineEmits<{
  (e: 'update:visible', v: boolean): void;
  (e: 'submit', payload: SubmitPayload): void;
}>();

const dialogVisible = computed({
  get: () => props.visible,
  set: (v) => emit('update:visible', v),
});

const formRef = ref<FormInstance>();

interface EditForm {
  name: string;
  remark: string;
  tag: string;
}

const form = reactive<EditForm>({
  name: '',
  remark: '',
  tag: '',
});

/** visible 变 true 时初始化表单数据 */
watch(
  () => props.visible,
  (val) => {
    if (val) {
      initFormData();
    }
  },
);

/** 用 Object.assign 从 clientData 填充表单 */
function initFormData(): void {
  const data = props.clientData;
  Object.assign(form, {
    name: data?.name ?? '',
    remark: data?.remark ?? '',
    tag: data?.tag ?? '',
  });
  formRef.value?.clearValidate();
}

/** 提交表单：emit submit，peerId 从 clientData 取 */
async function handleSubmit(): Promise<void> {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  const peerId = props.clientData?.peerId ?? '';
  emit('submit', {
    peerId,
    data: {
      name: form.name,
      remark: form.remark,
      tag: form.tag,
    },
  });
}
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    title="编辑客户端"
    width="500px"
    align-center
    append-to-body
    :close-on-click-modal="false"
  >
    <el-form ref="formRef" :model="form" label-width="80px" size="large">
      <el-form-item label="名称" prop="name">
        <el-input v-model="form.name" placeholder="请输入名称" maxlength="255" />
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input v-model="form.remark" placeholder="请输入备注" maxlength="255" />
      </el-form-item>
      <el-form-item label="标签" prop="tag">
        <el-input v-model="form.tag" placeholder="请输入标签" maxlength="255" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">确定</el-button>
    </template>
  </el-dialog>
</template>
