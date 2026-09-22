<script setup lang="ts">
/**
 * UnattendedAddForm - 无人值守预警关系新增表单
 *
 * 功能特性：
 * 1. 协同岗通过 el-select 选择，mounted 时拉取协同岗列表
 * 2. 选中协同岗后自动带出所属组织
 * 3. 通知对象类型支持用户/群组两种切换（默认用户）
 * 4. 通知对象使用 SelectPagination 多选，根据类型自动切换 API 与参数
 * 5. 通过 emit('ok', form) 返回表单数据，由 createDialog 统一关闭弹窗
 *
 * @example 基础用法（配合 createDialog）
 * ```vue
 * <UnattendedAddForm @ok="handleSubmit" @cancel="handleCancel" />
 * ```
 *
 * Props: 无
 *
 * Events:
 * - ok: 表单校验通过时触发，参数 form（含 cooperId/cooperName/belongOrgId/belongOrgName/targetType/targetId/targetName/idCard 等字段）
 * - cancel: 点击取消按钮时触发
 *
 * Slots: 无
 *
 * Methods: 无
 */
import type { FormInstance, FormRules } from 'element-plus';
import { onMounted, reactive, ref } from 'vue';

import { getCollaborationPage, type CollaborationItem } from '@/api/h5/collaboration';
import { queryGroupInfo, queryUserInfo, type TargetType } from '@/api/notification/alertPush';
import SelectPagination from '@/components/SelectPagination/index.vue';

defineOptions({ name: 'UnattendedAddForm' });

const emit = defineEmits<{
  (e: 'ok', data: Record<string, unknown>): void;
  (e: 'cancel'): void;
}>();

interface UnattendedForm {
  /** 协同岗 ID */
  cooperId: string;
  /** 协同岗名称 */
  cooperName: string;
  /** 所属组织 ID */
  belongOrgId: string;
  /** 所属组织名称 */
  belongOrgName: string;
  /** 通知对象类型：1=用户，2=群组 */
  targetType: TargetType;
  /** 通知对象 ID 列表（多选） */
  targetId: string[];
  /** 通知对象名称列表 */
  targetName: string[];
  /** 通知对象身份证号列表 */
  idCard: string[];
}

const formRef = ref<FormInstance>();
const submitting = ref(false);
const cooperationList = ref<CollaborationItem[]>([]);

const form = reactive<UnattendedForm>({
  cooperId: '',
  cooperName: '',
  belongOrgId: '',
  belongOrgName: '',
  targetType: 1,
  targetId: [],
  targetName: [],
  idCard: [],
});

const rules: FormRules<UnattendedForm> = {
  cooperId: [{ required: true, message: '请选择协同岗名称', trigger: 'change' }],
  targetType: [{ required: true, message: '请选择预警通知对象类型', trigger: 'change' }],
  targetId: [{ required: true, message: '请选择预警通知对象', trigger: 'change' }],
};

/** 通知对象下拉的 API */
const targetApi = form.targetType === 1 ? queryUserInfo : queryGroupInfo;

/** 通知对象下拉的初始化参数 */
function getTargetInitParams(): Record<string, unknown> {
  if (form.targetType === 1) {
    return { deptId: form.belongOrgId, includeChildren: 1 };
  }
  return { type: 2, key: 3 };
}

/** mounted 加载协同岗列表 */
onMounted(() => {
  loadCooperationList();
});

/** 加载协同岗列表 */
function loadCooperationList(): void {
  getCollaborationPage({ pageNum: 1, pageSize: 100 })
    .then((res) => {
      cooperationList.value = (res?.data?.records ?? []) as CollaborationItem[];
    })
    .catch(() => {
      cooperationList.value = [];
    });
}

/** 选协同岗：带出名称和所属组织 */
function handleCooperChange(cooperId: string): void {
  const target = cooperationList.value.find((i) => i.id === cooperId);
  if (target) {
    form.cooperName = String(target.postName ?? '');
    form.belongOrgId = String(target.orgId ?? '');
    form.belongOrgName = String(target.orgName ?? '');
  } else {
    form.cooperName = '';
    form.belongOrgId = '';
    form.belongOrgName = '';
  }
}

/** 清空通知对象相关字段 */
function clearTarget(): void {
  form.targetId = [];
  form.targetName = [];
  form.idCard = [];
}

/** 切换通知对象类型：清空已选 */
function handleTargetTypeChange(): void {
  clearTarget();
}

/** 通知对象变化：填充名称与身份证号 */
function handleTargetChange(ids: string[], items: Record<string, unknown>[]): void {
  form.targetName = items.map((i) => String(i.name ?? ''));
  form.idCard = items.map((i) => String(i.idCard ?? '')).filter(Boolean);
}

/** 取消 */
function handleCancel(): void {
  emit('cancel');
}

/** 提交：校验通过后 emit ok */
function handleSubmit(): void {
  if (!formRef.value) return;
  formRef.value
    .validate()
    .then(() => {
      submitting.value = true;
      emit('ok', { ...form });
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
  <div class="unattended-add-form">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="120px" style="width: 500px" size="large">
      <el-form-item label="协同岗名称" prop="cooperId">
        <el-select
          v-model="form.cooperId"
          placeholder="请选择协同岗名称"
          style="width: 100%"
          @change="handleCooperChange"
        >
          <el-option v-for="item in cooperationList" :key="item.id" :label="item.postName" :value="item.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="所属组织" prop="belongOrgName">
        <el-input v-model="form.belongOrgName" disabled placeholder="-" />
      </el-form-item>
      <el-form-item label="通知对象类型" prop="targetType">
        <el-radio-group v-model="form.targetType" @change="handleTargetTypeChange">
          <el-radio :value="1">用户</el-radio>
          <el-radio :value="2">群组</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="预警通知对象" prop="targetId">
        <SelectPagination
          v-model="form.targetId"
          multiple
          :api="targetApi"
          :init-params="getTargetInitParams()"
          :trans="form.targetType === 2 ? { to: 'id', from: 'groupId' } : undefined"
          placeholder="请选择预警通知对象"
          @change="handleTargetChange"
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
.unattended-add-form {
  display: flex;
  justify-content: center;
  padding: 16px 0;
}
</style>
