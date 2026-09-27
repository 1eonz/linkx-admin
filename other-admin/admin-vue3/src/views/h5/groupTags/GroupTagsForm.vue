<script setup lang="ts">
import { ElMessage } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import { LxIcon } from 'lx-ui';
import { nextTick, reactive, ref } from 'vue';

import { getGroupTagIcon } from './iconMap';
import { createGroupTag, getGroupTag, updateGroupTag, type GroupTag } from '@/api/h5/groupTags';

defineOptions({ name: 'GroupTagsForm' });

const emit = defineEmits<{
  (event: 'success'): void;
}>();

const defaultForm = {
  name: '',
  icon: 'fas fa-user',
  color: 'rgba(64, 158, 255, 0.8)',
};

const iconList = [
  'fas fa-home',
  'fas fa-user',
  'fas fa-users',
  'fas fa-cog',
  'fas fa-tags',
  'fas fa-tag',
  'fas fa-bell',
  'fas fa-calendar',
  'fas fa-map-marker-alt',
  'fas fa-phone',
  'fas fa-camera',
  'fas fa-image',
  'fas fa-folder',
  'fas fa-link',
  'fas fa-lock',
  'fas fa-star',
  'fas fa-check',
  'fas fa-edit',
  'fas fa-trash',
  'fas fa-download',
  'fas fa-upload',
];

const visible = ref(false);
const title = ref('新增');
const mode = ref<'create' | 'update'>('create');
const loading = ref(false);
const submitting = ref(false);
const formRef = ref<FormInstance>();
const iconSearch = ref('');
const formData = reactive<Partial<GroupTag>>({ ...defaultForm });

const rules: FormRules = {
  name: [{ required: true, message: '标签名称不能为空', trigger: 'blur' }],
  icon: [{ required: true, message: '图标不能为空', trigger: 'change' }],
  color: [{ required: true, message: '颜色不能为空', trigger: 'change' }],
};

function resetForm(): void {
  Object.keys(formData).forEach((key) => {
    delete formData[key as keyof GroupTag];
  });
  Object.assign(formData, defaultForm);
  iconSearch.value = '';
}

function selectIcon(icon: string): void {
  formData.icon = icon;
  formRef.value?.clearValidate('icon');
}

function open(type: 'create' | 'update', id?: string | number): Promise<void> {
  mode.value = type;
  title.value = type === 'create' ? '新增' : '修改';
  resetForm();
  visible.value = true;

  if (type !== 'update' || id === undefined) return Promise.resolve();

  loading.value = true;
  return getGroupTag(id)
    .then((response) => {
      if (response.code !== 0) {
        ElMessage.error(response.msg || '获取标签失败');
        visible.value = false;
        return;
      }
      Object.assign(formData, response.data);
    })
    .catch(() => {
      visible.value = false;
      ElMessage.error('获取标签失败，请重试');
    })
    .finally(() => {
      loading.value = false;
    });
}

async function submit(): Promise<void> {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;

  submitting.value = true;
  const isCreate = mode.value === 'create';
  const payload = {
    name: String(formData.name ?? ''),
    icon: String(formData.icon ?? ''),
    color: String(formData.color ?? ''),
  };
  const request = isCreate
    ? createGroupTag(payload)
    : updateGroupTag({ id: formData.id as string | number, ...payload });
  return request
    .then((response) => {
      if (response.code !== 0) {
        ElMessage.error(response.msg || '保存失败，请重试');
        return;
      }
      ElMessage.success(isCreate ? '新增成功' : '修改成功');
      visible.value = false;
      emit('success');
    })
    .catch(() => {
      ElMessage.error('保存失败，请重试');
    })
    .finally(() => {
      submitting.value = false;
    });
}

function handleOpen(): void {
  nextTick(() => formRef.value?.clearValidate());
}

defineExpose({ open });
</script>

<template>
  <el-dialog v-model="visible" :title="title" width="750px" align-center append-to-body @open="handleOpen">
    <el-form ref="formRef" v-loading="loading" :model="formData" :rules="rules" label-width="100px">
      <el-form-item label="标签名称" prop="name">
        <el-input v-model="formData.name" maxlength="6" show-word-limit placeholder="请输入标签名称" />
      </el-form-item>
      <el-form-item label="图标" prop="icon">
        <el-popover placement="bottom-start" trigger="click" width="400px">
          <div class="icon-selector">
            <el-input v-model="iconSearch" placeholder="搜索图标" size="small" />
            <div class="icon-list">
              <button
                v-for="icon in iconList.filter((item) => item.includes(iconSearch.toLowerCase()))"
                :key="icon"
                type="button"
                class="icon-item"
                :class="{ active: formData.icon === icon }"
                @click="selectIcon(icon)"
              >
                <LxIcon :name="getGroupTagIcon(icon)" :size="18" />
                <span>{{ icon }}</span>
              </button>
            </div>
          </div>
          <template #reference>
            <el-input v-model="formData.icon" readonly placeholder="请选择图标">
              <template #prefix><LxIcon :name="getGroupTagIcon(formData.icon || 'fas fa-user')" :size="16" /></template>
            </el-input>
          </template>
        </el-popover>
      </el-form-item>
      <el-form-item label="颜色" prop="color">
        <div class="color-row">
          <el-color-picker v-model="formData.color" show-alpha />
          <el-input v-model="formData.color" placeholder="颜色值" />
        </div>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="submit">确定</el-button>
    </template>
  </el-dialog>
</template>

<style lang="less" scoped>
.icon-selector {
  max-height: 300px;
  overflow-y: auto;
}

.icon-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding-top: 8px;
}

.icon-item {
  display: flex;
  width: calc(33.333% - 4px);
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font-size: 12px;
}

.icon-item:hover,
.icon-item.active {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

.color-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
</style>
