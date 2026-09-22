<script setup lang="ts">
/**
 * TypeEdit - 警单类型编辑弹窗
 *
 * 功能特性：
 * 1. 仅一个 tag 字段
 * 2. 支持新增/编辑两种模式（由 type 区分）
 *
 * @example 父组件调用
 * ```vue
 * <TypeEdit ref="editRef" @success="refresh" />
 * editRef.value?.open('create')
 * editRef.value?.open('update', row)
 * ```
 *
 * Props: 无
 *
 * Events:
 * - success: 提交成功后触发，父组件刷新列表
 */
import { ElMessage } from 'element-plus';
import type { FormInstance, FormItemRule } from 'element-plus';
import { computed, nextTick, reactive, ref } from 'vue';

import {
  savePolicetickettype,
  updatePolicetickettype,
  type PoliceticketTypeItem,
} from '@/api/thirdInterface/policeReport';

defineOptions({ name: 'TypeEdit' });

const emit = defineEmits<{
  (e: 'success'): void;
}>();

// ===== 弹窗状态 =====
const dialogVisible = ref(false);
const dialogTitle = ref('新增类型');
const formType = ref<'create' | 'update'>('create');
const submitLoading = ref(false);

const formRef = ref<FormInstance>();

// ===== 表单数据 =====
const defaultForm: Partial<PoliceticketTypeItem> = {
  id: undefined,
  tag: '',
};

const formData = reactive<Partial<PoliceticketTypeItem>>({ ...defaultForm });

// ===== 校验规则 =====
const rules = computed<Record<string, FormItemRule[]>>(() => ({
  tag: [{ required: true, message: '请输入类型标签', trigger: 'blur' }],
}));

// ===== 表单重置 =====
function resetForm(): void {
  Object.keys(formData).forEach((k) => delete (formData as Record<string, unknown>)[k]);
  Object.assign(formData, { ...defaultForm });
}

// ===== 弹窗打开 =====
function open(type: 'create' | 'update', row?: PoliceticketTypeItem): void {
  resetForm();
  dialogVisible.value = true;
  dialogTitle.value = type === 'create' ? '新增类型' : '编辑类型';
  formType.value = type;
  if (row) {
    Object.assign(formData, row);
  }
  nextTick(() => formRef.value?.clearValidate());
}

defineExpose({ open });

// ===== 提交 =====
async function handleSubmit(): Promise<void> {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) {
    ElMessage.warning('必填字段未填写');
    return;
  }
  submitLoading.value = true;
  try {
    const isCreate = formType.value === 'create';
    const payload = { ...formData };
    const res = isCreate
      ? await savePolicetickettype({ tag: formData.tag ?? '' })
      : await updatePolicetickettype(payload);
    if (res.code === 0) {
      ElMessage.success(isCreate ? '新增成功' : '修改成功');
      dialogVisible.value = false;
      emit('success');
    } else {
      ElMessage.error(res.msg ?? (isCreate ? '新增失败' : '修改失败'));
    }
  } finally {
    submitLoading.value = false;
  }
}

/** 弹窗打开后清除校验状态 */
function handleDialogOpen(): void {
  nextTick(() => formRef.value?.clearValidate());
}
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    :title="dialogTitle"
    width="500px"
    align-center
    append-to-body
    @open="handleDialogOpen"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-position="left"
      label-width="100px"
      class="dialog-form"
    >
      <el-form-item label="类型标签" prop="tag">
        <el-input v-model="formData.tag as string" placeholder="请输入类型标签" maxlength="64" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
    </template>
  </el-dialog>
</template>

<style lang="less" scoped>
.dialog-form {
  width: 380px;
  margin-left: 20px;
}
</style>
