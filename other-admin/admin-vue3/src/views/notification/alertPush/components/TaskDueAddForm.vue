<script setup lang="ts">
/**
 * TaskDueAddForm - 任务逾期预警关系新增表单
 *
 * 功能特性：
 * 1. 组织名称使用 OrgTreeSelect 懒加载选择，选中后自动带出父组织
 * 2. 通知对象类型支持用户/群组两种切换（默认用户）
 * 3. 通知对象使用 SelectPagination 多选，根据类型自动切换 API 与参数
 * 4. 切换组织/类型时自动清空已选通知对象
 * 5. 通过 emit('ok', form) 返回表单数据，由 createDialog 统一关闭弹窗
 *
 * @example 基础用法（配合 createDialog）
 * ```vue
 * <TaskDueAddForm @ok="handleSubmit" @cancel="handleCancel" />
 * ```
 *
 * Props: 无
 *
 * Events:
 * - ok: 表单校验通过时触发，参数 form（含 orgId/orgName/parentOrgName/targetType/targetId/targetName/idCard 等字段）
 * - cancel: 点击取消按钮时触发
 *
 * Slots: 无
 *
 * Methods: 无
 */
import type { FormInstance, FormRules } from 'element-plus';
import { reactive, ref } from 'vue';

import type { DepartmentNode } from '@/api/h5/collaboration';
import { queryGroupInfo, queryUserInfo, type TargetType } from '@/api/notification/alertPush';
import OrgTreeSelect from '@/components/OrgTreeSelect/index.vue';
import SelectPagination from '@/components/SelectPagination/index.vue';

defineOptions({ name: 'TaskDueAddForm' });

const emit = defineEmits<{
  (e: 'ok', data: Record<string, unknown>): void;
  (e: 'cancel'): void;
}>();

interface TaskDueForm {
  /** 组织 ID */
  orgId: string;
  /** 组织名称 */
  orgName: string;
  /** 组织编码 */
  orgCode: string;
  /** 父组织 ID */
  parentOrgId: string;
  /** 父组织名称 */
  parentOrgName: string;
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

const form = reactive<TaskDueForm>({
  orgId: '',
  orgName: '',
  orgCode: '',
  parentOrgId: '',
  parentOrgName: '',
  targetType: 1,
  targetId: [],
  targetName: [],
  idCard: [],
});

const rules: FormRules<TaskDueForm> = {
  orgName: [{ required: true, message: '请选择组织名称', trigger: 'change' }],
  targetType: [{ required: true, message: '请选择预警通知对象类型', trigger: 'change' }],
  targetId: [{ required: true, message: '请选择预警通知对象', trigger: 'change' }],
};

/** 通知对象下拉的 API */
const targetApi = form.targetType === 1 ? queryUserInfo : queryGroupInfo;

/** 通知对象下拉的初始化参数 */
function getTargetInitParams(): Record<string, unknown> {
  if (form.targetType === 1) {
    return { deptId: form.orgId, includeChildren: 1 };
  }
  return { type: 2, key: 3 };
}

/** 选组织节点：带出父组织，并在用户模式下清空通知对象 */
function handleOrgChange(data: DepartmentNode): void {
  const parent = data as unknown as { parentId?: string; parentName?: string };
  form.orgId = String(data.id ?? '');
  form.orgCode = String(data.code ?? '');
  form.orgName = String(data.name ?? '');
  form.parentOrgId = String(parent?.parentId ?? '');
  form.parentOrgName = String(parent?.parentName ?? '');
  if (form.targetType === 1) {
    clearTarget();
  }
}

/** 清空组织 */
function handleClearOrg(): void {
  form.orgId = '';
  form.orgName = '';
  form.orgCode = '';
  form.parentOrgId = '';
  form.parentOrgName = '';
  if (form.targetType === 1) {
    clearTarget();
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
  <div class="task-due-add-form">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="120px" style="width: 500px" size="large">
      <el-form-item label="组织名称" prop="orgName">
        <OrgTreeSelect
          v-model="form.orgName"
          :lazy="true"
          width="100%"
          placeholder="请选择组织名称"
          @current-change="handleOrgChange"
          @clear-val="handleClearOrg"
        />
      </el-form-item>
      <el-form-item label="父组织" prop="parentOrgName">
        <el-input v-model="form.parentOrgName" disabled placeholder="-" />
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
.task-due-add-form {
  display: flex;
  justify-content: center;
  padding: 16px 0;
}
</style>
