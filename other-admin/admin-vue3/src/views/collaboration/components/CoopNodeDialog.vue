<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus';
import { reactive, ref, useTemplateRef } from 'vue';

defineOptions({ name: 'CoopNodeDialog' });

/** 节点数据（复用树节点的最小结构） */
interface NodeData {
  id: string;
  name: string;
  [key: string]: unknown;
}

export interface CoopNodeDialogInstance {
  open: (type: 'create' | 'edit', data: NodeData | null) => void;
}

const props = defineProps<{
  /** 弹窗标题（根据 create/edit 自动切换） */
  title: (type: 'create' | 'edit') => string;
  /** 名称字段标签 */
  nameLabel: string;
  /** 名称占位提示 */
  namePlaceholder: string;
  /** 父节点字段标签 */
  parentLabel: string;
  /**
   * 提交回调（替代 emit，因为需要 await 返回值）
   * 返回 true 表示成功（关闭弹窗），false 表示失败（保持弹窗）
   */
  onSubmit: (
    type: 'create' | 'edit',
    name: string,
    parentData: NodeData | null,
    editData: NodeData | null,
  ) => Promise<boolean>;
}>();

const visible = ref(false);
const loading = ref(false);
const type = ref<'create' | 'edit'>('create');
const parentData = ref<NodeData | null>(null);
const editData = ref<NodeData | null>(null);
const form = reactive({ name: '' });

const formRef = useTemplateRef<FormInstance>('formRef');

const rules: FormRules = {
  name: [
    { required: true, message: '请输入名称', trigger: 'blur' },
    { max: 32, message: '最多 32 个字符', trigger: 'blur' },
  ],
};

/** 父组件调用：打开弹窗 */
function open(openType: 'create' | 'edit', data: NodeData | null): void {
  type.value = openType;
  visible.value = true;

  if (openType === 'create') {
    parentData.value = data;
    editData.value = null;
    form.name = '';
  } else {
    parentData.value = null;
    editData.value = data;
    form.name = data?.name ?? '';
  }
}

function resetForm(): void {
  form.name = '';
  parentData.value = null;
  editData.value = null;
  formRef.value?.clearValidate();
}

async function submit(): Promise<void> {
  try {
    await formRef.value?.validate();
  } catch {
    return;
  }

  loading.value = true;
  try {
    const ok = await props.onSubmit(type.value, form.name, parentData.value, editData.value);
    if (ok) {
      visible.value = false;
    }
  } finally {
    loading.value = false;
  }
}

defineExpose({ open });
</script>

<template>
  <el-dialog v-model="visible" :title="title(type)" width="420px" align-center append-to-body @close="resetForm">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
      <el-form-item :label="nameLabel" prop="name">
        <el-input v-model="form.name" :placeholder="namePlaceholder" maxlength="32" show-word-limit />
      </el-form-item>
      <el-form-item v-if="type === 'create' && parentData" :label="parentLabel">
        <el-input :model-value="parentData.name" disabled />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="loading" @click="submit">确定</el-button>
    </template>
  </el-dialog>
</template>
