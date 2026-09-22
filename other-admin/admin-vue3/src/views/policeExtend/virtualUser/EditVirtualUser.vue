<script setup lang="ts">
/**
 * 虚拟用户新增/编辑弹窗
 *
 * Props:
 * - visible: boolean，v-model 控制弹窗显隐
 *
 * Events:
 * - update:visible: 弹窗显隐变化
 * - success: 提交成功，父组件刷新列表
 *
 * Methods（defineExpose）:
 * - init(type, row?): 打开弹窗；type='add' 为新增，type='edit' + row 为编辑
 */
import { ElMessage } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import { computed, reactive, ref } from 'vue';

import { addVirtualUser, updateVirtualUser, type VirtualUserItem } from '@/api/policeExtend/virtualUser';

defineOptions({ name: 'EditVirtualUser' });

const props = defineProps<{ visible: boolean }>();
const emit = defineEmits<{
  (e: 'update:visible', v: boolean): void;
  (e: 'success'): void;
}>();

const dialogVisible = computed({
  get: () => props.visible,
  set: (v) => emit('update:visible', v),
});

const isAdd = ref(true);
const dialogLoading = ref(false);
const formRef = ref<FormInstance>();

const baseForm = (): Partial<VirtualUserItem> => ({
  userName: '',
  contactNumber: '',
  appId: '',
  appSecret: '',
  defaultUser: 0,
  remark: '',
  createdBy: localStorage.getItem('back_user_id') ?? '',
});

const form = reactive<Partial<VirtualUserItem>>(baseForm());

/** 用户名称校验：长度 1-100，禁止特殊字符 */
function validateUserName(_rule: unknown, value: string, callback: (err?: Error) => void): void {
  if (!value) {
    callback(new Error('请输入用户名称'));
    return;
  }
  const reg = /^(?!.*[~`!@#$%^&*()\-=+{[\]}\\|;:'",.<>/?]).{1,100}$/;
  if (!reg.test(value)) {
    callback(new Error('姓名长度不能超过100个字符，禁止输入特殊字符'));
    return;
  }
  callback();
}

/** 通讯号码校验：非必填，填写时只能为数字 */
function validateContactNumber(_rule: unknown, value: string, callback: (err?: Error) => void): void {
  if (value && !/^[0-9]+$/.test(value)) {
    callback(new Error('通讯号码只能为数字'));
    return;
  }
  callback();
}

const rules: FormRules = {
  userName: [{ required: true, validator: validateUserName, trigger: ['blur', 'change'] }],
  contactNumber: [{ validator: validateContactNumber, trigger: ['blur', 'change'] }],
  appId: [
    { required: true, message: '请输入应用ID', trigger: 'blur' },
    { pattern: /.{8,100}/, message: '8~100 位字符', trigger: 'blur' },
  ],
  appSecret: [
    { required: true, message: '请输入应用密钥', trigger: 'blur' },
    { pattern: /.{8,200}/, message: '8~200 位字符', trigger: 'blur' },
  ],
};

async function submitForm(): Promise<void> {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  dialogLoading.value = true;
  try {
    const isCreate = isAdd.value;
    const result = isCreate ? await addVirtualUser(form as never) : await updateVirtualUser(form as never);
    if (!result || result.code !== 0) {
      ElMessage.error(result?.msg ?? `${isCreate ? '新增' : '编辑'}失败`);
      return;
    }
    ElMessage.success(`${isCreate ? '添加' : '编辑'}成功`);
    emit('success');
    dialogVisible.value = false;
  } finally {
    dialogLoading.value = false;
  }
}

function resetForm(): void {
  Object.assign(form, baseForm());
  delete form.id;
  formRef.value?.resetFields();
}

/** 打开弹窗：type='add' 新增，type='edit' + row 编辑 */
function init(type: 'add' | 'edit', row?: VirtualUserItem): void {
  isAdd.value = type === 'add';
  resetForm();
  if (row) {
    Object.assign(form, row);
    form.createdBy = localStorage.getItem('back_user_id') ?? '';
  }
  dialogVisible.value = true;
}

defineExpose({ init });
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    title="虚拟用户注册"
    width="724px"
    align-center
    append-to-body
    :close-on-click-modal="false"
    @close="resetForm"
  >
    <el-form ref="formRef" :rules="rules" :model="form" label-width="120px">
      <el-form-item label="用户名称" prop="userName">
        <el-input v-model="form.userName" maxlength="100" style="width: 492px" placeholder="请输入用户名称" />
      </el-form-item>
      <el-form-item label="通讯号码" prop="contactNumber">
        <el-input v-model="form.contactNumber" maxlength="40" style="width: 492px" placeholder="请输入通讯号码" />
      </el-form-item>
      <el-form-item label="应用ID" prop="appId">
        <el-input v-model="form.appId" maxlength="100" style="width: 492px" placeholder="请输入应用ID" />
      </el-form-item>
      <el-form-item label="应用密钥" prop="appSecret">
        <el-input
          v-model="form.appSecret"
          maxlength="200"
          show-password
          style="width: 492px"
          placeholder="请输入应用密钥"
        />
      </el-form-item>
      <el-form-item label="是否默认用户" prop="defaultUser">
        <el-radio-group v-model="form.defaultUser">
          <el-radio :value="0">否</el-radio>
          <el-radio :value="1">是</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input
          v-model="form.remark"
          type="textarea"
          :rows="4"
          maxlength="255"
          show-word-limit
          style="width: 492px"
          placeholder="请输入备注"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="dialogLoading" @click="submitForm">确定</el-button>
    </template>
  </el-dialog>
</template>
