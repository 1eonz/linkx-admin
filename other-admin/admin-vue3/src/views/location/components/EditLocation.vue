<script setup lang="ts">
/**
 * 位置新增/编辑弹窗
 *
 * Props:
 * - visible: boolean，v-model 控制弹窗显隐
 *
 * Events:
 * - update:visible: 弹窗显隐变化
 * - success: 提交成功，父组件可刷新列表
 *
 * Methods（defineExpose）:
 * - init(row?): 打开弹窗；不传 row 为新增，传 row 为编辑
 */
import { ElMessage } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import { computed, reactive, ref } from 'vue';

import { createLocation, updateLocation, type LocationItem } from '@/api/resource/location';
import OrgTreeSelect from '@/components/OrgTreeSelect/index.vue';

defineOptions({ name: 'EditLocation' });

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

const form = reactive<Partial<LocationItem>>({
  departmentCode: '',
  departmentName: '',
  location: '',
});

/** 经纬度校验：格式 + 范围 */
function validateCoordinates(_rule: unknown, value: string, callback: (err?: Error) => void): void {
  if (!value) {
    callback(new Error('请输入经纬度'));
    return;
  }
  const reg = /^-?((1[0-7]\d|\d{1,2})(\.\d{1,8})?),\s*-?(([0-8]?\d)(\.\d{1,8})?)$/;
  if (!reg.test(value)) {
    callback(new Error('格式应为"经度,纬度"，小数点后保留8位'));
    return;
  }
  const [lngStr, latStr] = value.split(',').map((s) => Number(s.trim()));
  if (lngStr < -180 || lngStr > 180) {
    callback(new Error('经度范围应在-180.000到180.000之间'));
    return;
  }
  if (latStr < -90 || latStr > 90) {
    callback(new Error('纬度范围应在-90.000到90.000之间'));
    return;
  }
  callback();
}

const rules: FormRules = {
  departmentCode: [{ required: true, message: '请选择组织', trigger: ['blur', 'change'] }],
  location: [
    { required: true, message: '请输入经纬度', trigger: ['blur', 'change'] },
    { validator: validateCoordinates, trigger: ['blur', 'change'] },
    { max: 25, message: '坐标位置最多可输入25个字符', trigger: 'blur' },
  ],
};

function handleNodeClick(data: { code?: string; name?: string }): void {
  form.departmentCode = data.code || '';
  form.departmentName = data.name || '';
}

function clearOrganizationType(): void {
  form.departmentCode = '';
  form.departmentName = '';
}

async function submitForm(): Promise<void> {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  dialogLoading.value = true;
  try {
    const isCreate = isAdd.value;
    const result = isCreate
      ? await createLocation({
          departmentCode: form.departmentCode ?? '',
          departmentName: form.departmentName ?? '',
          location: form.location ?? '',
        })
      : await updateLocation({
          id: form.id as string,
          departmentCode: form.departmentCode ?? '',
          departmentName: form.departmentName ?? '',
          location: form.location ?? '',
        });
    if (!result || result.code !== 0) {
      ElMessage.error(result?.msg ?? `${isCreate ? '新增' : '编辑'}失败，请重试`);
      return;
    }
    ElMessage.success(`${isCreate ? '新增' : '编辑'}成功`);
    emit('success');
    dialogVisible.value = false;
  } finally {
    dialogLoading.value = false;
  }
}

function resetForm(): void {
  form.departmentCode = '';
  form.departmentName = '';
  form.location = '';
  delete form.id;
  formRef.value?.resetFields();
}

/** 打开弹窗：不传 row 为新增，传 row 为编辑 */
function init(row?: LocationItem): void {
  isAdd.value = !row;
  resetForm();
  if (row) {
    Object.assign(form, row);
  }
  dialogVisible.value = true;
}

defineExpose({ init });
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    :title="isAdd ? '新增位置' : '编辑位置'"
    width="500px"
    align-center
    append-to-body
    :close-on-click-modal="false"
    @close="resetForm"
  >
    <el-form
      ref="formRef"
      :rules="rules"
      :model="form"
      label-position="left"
      label-width="100px"
      style="width: 380px; margin-left: 20px"
    >
      <el-form-item label="组织名称" prop="departmentCode">
        <OrgTreeSelect
          v-model="form.departmentName as string"
          :is-init-value="true"
          placeholder="请选择组织"
          @clear-val="clearOrganizationType"
          @current-change="handleNodeClick"
        />
      </el-form-item>
      <el-form-item label="经纬度" prop="location">
        <el-input v-model="form.location" placeholder="例如：116.2420,39.5248" maxlength="25" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="dialogLoading" @click="submitForm">确定</el-button>
    </template>
  </el-dialog>
</template>
