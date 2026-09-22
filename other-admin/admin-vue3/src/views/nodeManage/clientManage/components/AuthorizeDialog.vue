<script setup lang="ts">
/**
 * AuthorizeDialog - 客户端授权弹窗
 *
 * 功能特性：
 * 1. 控制客户端授权状态（grant）和授权有效期（expiredIn）
 * 2. grant 使用 StatusSwitch 组件，状态值反转：grant=1 时 StatusSwitch value=0（开放），grant=0 时 value=1（关闭）
 * 3. expiredIn 仅当 grant===1 时显示，使用 el-date-picker datetime
 * 4. 校验规则：仅 expiredIn 自定义校验器 — grant===1 且 expiredIn 为空时报「请选择授权有效期」
 * 5. watch visible 变 true 时从 clientData 初始化 grant 和 expiredIn
 * 6. 提交 emit submit({ peerId, data: { grant, expiredIn? } })，仅 grant=1 时携带 expiredIn
 *
 * Props:
 * - visible: boolean，v-model 控制弹窗显隐
 * - clientData: ClientItem | null，当前授权的客户端数据
 * - loading: boolean，提交按钮 loading 状态（由父组件控制）
 *
 * Events:
 * - update:visible: 弹窗显隐变化
 * - submit: ({ peerId, data }) => void，data 为 { grant, expiredIn? }
 *
 * @example
 * ```vue
 * <AuthorizeDialog v-model:visible="dialogVisible" :client-data="currentClient" :loading="submitLoading" @submit="handleSubmit" />
 * ```
 */
import type { FormInstance, FormItemRule } from 'element-plus';
import { computed, reactive, ref, watch } from 'vue';

import type { ClientItem, ClientUpdatePayload } from '@/api/nodeManage/client';
import StatusSwitch from '@/components/StatusSwitch/index.vue';

defineOptions({ name: 'AuthorizeDialog' });

interface SubmitPayload {
  peerId: string;
  data: Pick<ClientUpdatePayload, 'grant' | 'expiredIn'>;
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

interface AuthorizeForm {
  /** 授权状态：1=已授权，0=未授权 */
  grant: number;
  /** 授权有效期（时间戳），仅 grant=1 时有效 */
  expiredIn?: number;
}

const form = reactive<AuthorizeForm>({
  grant: 0,
  expiredIn: undefined,
});

/** StatusSwitch 值反转映射：grant=1 → value=0（开放），grant=0 → value=1（关闭） */
const statusSwitchValue = computed(() => (form.grant === 1 ? 0 : 1));

/** expiredIn 自定义校验器：grant===1 且 expiredIn 为空时报错 */
const expiredInRule: FormItemRule = {
  validator: (_rule, _value, callback) => {
    if (form.grant === 1 && !form.expiredIn) {
      callback(new Error('请选择授权有效期'));
      return;
    }
    callback();
  },
  trigger: 'change',
};

/** visible 变 true 时从 clientData 初始化 grant 和 expiredIn */
watch(
  () => props.visible,
  (val) => {
    if (val) {
      initFormData();
    }
  },
);

/** 从 clientData 初始化 grant 和 expiredIn */
function initFormData(): void {
  const data = props.clientData;
  form.grant = data?.grant ?? 0;
  form.expiredIn = data?.expiredIn;
  formRef.value?.clearValidate();
}

/** StatusSwitch change 事件：反转回业务 grant 值 */
function handleStatusChange(value: number): void {
  // StatusSwitch value=0（启用）→ grant=1（已授权）；value=1（禁用）→ grant=0（未授权）
  form.grant = value === 0 ? 1 : 0;
  // 切换为关闭时清空 expiredIn
  if (form.grant === 0) {
    form.expiredIn = undefined;
  }
  formRef.value?.clearValidate('expiredIn');
}

/** 提交表单：emit submit，仅 grant=1 时携带 expiredIn */
async function handleSubmit(): Promise<void> {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  const peerId = props.clientData?.peerId ?? '';
  const data: SubmitPayload['data'] = { grant: form.grant };
  if (form.grant === 1) {
    data.expiredIn = form.expiredIn;
  }
  emit('submit', { peerId, data });
}
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    title="授权客户端"
    width="500px"
    align-center
    append-to-body
    :close-on-click-modal="false"
  >
    <el-alert
      title="同意以后将会允许此服务器与本机进行数据通信。"
      type="info"
      :closable="false"
      show-icon
      style="margin-bottom: 16px"
    />
    <el-form ref="formRef" :model="form" label-width="100px" size="large">
      <el-form-item label="授权状态" prop="grant">
        <StatusSwitch
          :value="statusSwitchValue"
          normal-text="开放"
          forbidden-text="关闭"
          @change="handleStatusChange"
        />
      </el-form-item>
      <el-form-item v-if="form.grant === 1" label="授权有效期" prop="expiredIn" :rules="[expiredInRule]">
        <el-date-picker
          v-model="form.expiredIn"
          type="datetime"
          placeholder="请选择授权有效期"
          value-format="timestamp"
          style="width: 100%"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">确定</el-button>
    </template>
  </el-dialog>
</template>
