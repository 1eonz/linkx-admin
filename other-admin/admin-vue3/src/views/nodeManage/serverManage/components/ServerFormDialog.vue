<script setup lang="ts">
/**
 * ServerFormDialog - 服务器节点新增/编辑弹窗
 *
 * 功能特性：
 * 1. 支持新增/编辑两种模式（init(type, row?)）
 * 2. ip 编辑时禁用，port 始终禁用（固定 30017）
 * 3. 表单校验通过后 emit submit({ status, data })，由父组件调用 API
 * 4. 提交按钮 loading 联动（closeLoading 由父组件在 API 完成后调用）
 *
 * Props:
 * - visible: boolean，v-model 控制弹窗显隐
 *
 * Events:
 * - update:visible: 弹窗显隐变化
 * - submit: ({ status, data }) => void，status='create'|'update'，data 为 ServerPayload
 *
 * Methods（defineExpose）:
 * - init(type, row?): 打开弹窗；type='create' 新增清空 form，type='update' 填充 row
 * - closeLoading(): 关闭提交按钮 loading（供父组件在 API 失败后调用）
 *
 * @example
 * ```vue
 * <ServerFormDialog ref="formDialogRef" v-model:visible="dialogVisible" @submit="handleSubmit" />
 * ```
 */
import type { FormInstance, FormRules } from 'element-plus';
import { computed, reactive, ref } from 'vue';

import type { ServerItem, ServerPayload } from '@/api/nodeManage/server';

defineOptions({ name: 'ServerFormDialog' });

type SubmitStatus = 'create' | 'update';

interface SubmitPayload {
  status: SubmitStatus;
  data: ServerPayload;
}

/** 暴露给父组件的实例类型 */
export interface ServerFormDialogInstance {
  init: (type: SubmitStatus, row?: ServerItem) => void;
  closeLoading: () => void;
}

const props = defineProps<{ visible: boolean }>();
const emit = defineEmits<{
  (e: 'update:visible', v: boolean): void;
  (e: 'submit', payload: SubmitPayload): void;
}>();

const dialogVisible = computed({
  get: () => props.visible,
  set: (v) => emit('update:visible', v),
});

const formRef = ref<FormInstance>();
const submitLoading = ref(false);
const formType = ref<SubmitStatus>('create');

/** 默认表单值（port 固定 30017） */
function defaultForm(): ServerPayload {
  return {
    ip: '',
    port: 30017,
    name: '',
    tag: '',
    remark: '',
  };
}

const form = reactive<ServerPayload>(defaultForm());

const isEdit = computed(() => formType.value === 'update');

const rules: FormRules = {
  ip: [
    { required: true, message: '请输入 IP 地址', trigger: 'blur' },
    { max: 50, message: 'IP 地址最多可输入 50 个字符', trigger: 'blur' },
  ],
  port: [{ required: true, message: '请输入端口', trigger: 'blur' }],
  name: [{ max: 255, message: '节点名称最多可输入 255 个字符', trigger: 'blur' }],
  tag: [{ max: 255, message: '标签最多可输入 255 个字符', trigger: 'blur' }],
  remark: [{ max: 255, message: '备注最多可输入 255 个字符', trigger: 'blur' }],
};

/** 重置表单数据和校验状态 */
function resetForm(): void {
  Object.assign(form, defaultForm());
  formRef.value?.resetFields();
}

/**
 * 打开弹窗
 * @param type 'create' 新增清空 form；'update' 填充 row
 * @param row 编辑时传入的行数据
 */
function init(type: SubmitStatus, row?: ServerItem): void {
  formType.value = type;
  submitLoading.value = false;
  resetForm();
  if (type === 'update' && row) {
    Object.assign(form, {
      ip: row.ip,
      port: row.port,
      name: row.name ?? '',
      tag: row.tag ?? '',
      remark: row.remark ?? '',
    });
  }
  dialogVisible.value = true;
}

/** 关闭提交按钮 loading（供父组件在 API 失败后调用） */
function closeLoading(): void {
  submitLoading.value = false;
}

/** 弹窗关闭后重置表单和 loading */
function handleDialogClose(): void {
  submitLoading.value = false;
  resetForm();
}

/** 提交表单：校验通过后 emit submit */
function handleSubmit(): void {
  formRef.value
    ?.validate()
    .then(() => {
      submitLoading.value = true;
      emit('submit', {
        status: formType.value,
        data: { ...form },
      });
    })
    .catch(() => {});
}

defineExpose({ init, closeLoading });
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    :title="isEdit ? '编辑服务器' : '新增服务器'"
    width="500px"
    align-center
    append-to-body
    :close-on-click-modal="false"
    @close="handleDialogClose"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="80px" size="large">
      <el-form-item label="IP" prop="ip">
        <el-input v-model="form.ip" placeholder="请输入 IP 地址" maxlength="50" :disabled="isEdit" />
      </el-form-item>
      <el-form-item label="端口" prop="port">
        <el-input v-model="form.port" maxlength="10" disabled />
      </el-form-item>
      <el-form-item label="名称" prop="name">
        <el-input v-model="form.name" placeholder="请输入节点名称" maxlength="255" />
      </el-form-item>
      <el-form-item label="标签" prop="tag">
        <el-input v-model="form.tag" placeholder="请输入标签" maxlength="255" />
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input v-model="form.remark" placeholder="请输入备注" maxlength="255" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
    </template>
  </el-dialog>
</template>
