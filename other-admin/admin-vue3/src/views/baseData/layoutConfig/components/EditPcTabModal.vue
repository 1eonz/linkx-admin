<script setup lang="ts">
/**
 * EditPcTabModal - PC 端页签新增/编辑弹窗
 *
 * 功能特性：
 * 1. 字段：name、url、order、openWay（switch：0=iframe 嵌入 / 1=弹窗）
 * 2. 名称重复校验：传入 existNames 时校验不重复（编辑时排除自身原始名称）
 * 3. 通过 props.initialData 在 setup 时初始化回显数据
 * 4. 通过 emit('ok', form) 返回 PcNavTab，由 createDialog 统一关闭弹窗
 *
 * @example 父组件调用（配合 createDialog）
 * ```ts
 * const dialog = createDialog(EditPcTabModal, { title: 'PC 页签编辑', width: '600px' });
 * // 新增
 * const result = await dialog({ props: { existNames: names } });
 * // 编辑
 * const result = await dialog({ props: { initialData: row, existNames: names.filter((n) => n !== row.name) } });
 * ```
 *
 * Props:
 * - initialData?: PcNavTab，编辑模式时回显的数据
 * - existNames?: string[]，已存在的名称列表（用于重复校验）
 *
 * Events:
 * - ok: 表单校验通过时触发，参数 PcNavTab
 * - cancel: 点击取消按钮时触发
 */
import type { FormInstance, FormRules } from 'element-plus';
import { reactive, ref } from 'vue';

import type { PcNavTab } from '@/api/baseData/layoutConfig';

defineOptions({ name: 'EditPcTabModal' });

const props = defineProps<{
  initialData?: PcNavTab;
  existNames?: string[];
}>();

const emit = defineEmits<{
  (e: 'ok', data: PcNavTab): void;
  (e: 'cancel'): void;
}>();

const formRef = ref<FormInstance>();
const submitting = ref(false);

/** 表单数据 */
interface PcTabForm {
  name: string;
  url: string;
  order: number;
  openWay: 0 | 1;
}

const defaultForm = (): PcTabForm => ({
  name: '',
  url: '',
  order: 1,
  openWay: 0,
});

/** 根据 props.initialData 初始化表单 */
function initForm(): PcTabForm {
  const form = defaultForm();
  if (props.initialData) {
    form.name = props.initialData.name;
    form.url = props.initialData.url;
    form.order = props.initialData.order;
    form.openWay = props.initialData.openWay;
  }
  return form;
}

const formData = reactive<PcTabForm>(initForm());

/** 编辑模式下原始名称，用于重复校验时排除自身 */
const originalName = ref<string>(props.initialData?.name ?? '');

/** 名称重复校验 */
function validateName(_rule: unknown, value: string, callback: (err?: Error) => void): void {
  if (!value || value.length === 0) {
    callback(new Error('请输入页签名称'));
    return;
  }
  const others = (props.existNames ?? []).filter((n) => n !== originalName.value);
  if (others.includes(value)) {
    callback(new Error('页签名称已存在，请更换'));
    return;
  }
  callback();
}

const rules: FormRules<PcTabForm> = {
  name: [{ required: true, validator: validateName, trigger: ['change', 'blur'] }],
  url: [{ required: true, message: '请输入跳转 URL', trigger: ['change', 'blur'] }],
  order: [{ required: true, message: '请输入排序值', trigger: 'blur' }],
};

/** 取消 */
function handleCancel(): void {
  emit('cancel');
}

/** 提交：校验通过后构造 PcNavTab 并 emit ok */
function handleSubmit(): void {
  if (!formRef.value) return;
  formRef.value
    .validate()
    .then(() => {
      submitting.value = true;
      const payload: PcNavTab = {
        name: formData.name,
        url: formData.url,
        order: formData.order,
        openWay: formData.openWay,
      };
      emit('ok', payload);
    })
    .catch(() => {
      // 校验失败，不处理
    })
    .finally(() => {
      submitting.value = false;
    });
}
</script>

<template>
  <div class="edit-pc-tab-modal">
    <el-form ref="formRef" :model="formData" :rules="rules" label-width="120px" style="width: 500px" size="large">
      <el-form-item label="页签名称" prop="name">
        <el-input v-model.trim="formData.name" placeholder="请输入页签名称" />
      </el-form-item>
      <el-form-item label="跳转 URL" prop="url">
        <el-input v-model.trim="formData.url" placeholder="请输入跳转 URL" />
      </el-form-item>
      <el-form-item label="排序" prop="order">
        <el-input-number v-model="formData.order" :min="0" :max="999" />
      </el-form-item>
      <el-form-item label="打开方式" prop="openWay">
        <el-switch
          v-model="formData.openWay"
          :active-value="1"
          :inactive-value="0"
          active-text="弹窗"
          inactive-text="iframe 嵌入"
          inline-prompt
        />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" :loading="submitting" :disabled="submitting" @click="handleSubmit"> 确定 </el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<style lang="less" scoped>
.edit-pc-tab-modal {
  display: flex;
  justify-content: center;
  padding: 16px 0;
}
</style>
