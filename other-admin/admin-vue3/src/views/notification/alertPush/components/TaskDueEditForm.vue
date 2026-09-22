<script setup lang="ts">
/**
 * TaskDueEditForm - 任务逾期预警关系编辑表单
 *
 * 功能特性：
 * 1. 组织名称和父组织 disabled 不可编辑
 * 2. 通知对象类型支持用户/群组两种切换
 * 3. 通知对象使用 SelectPagination 单选，根据类型自动切换 API 与参数
 * 4. 初始化时根据 initialData 构造 targetMap 用于 SelectPagination 回显
 * 5. 通过 emit('ok', form) 返回表单数据，由 createDialog 统一关闭弹窗
 *
 * @example 基础用法（配合 createDialog）
 * ```vue
 * <TaskDueEditForm :initial-data="row" @ok="handleSubmit" @cancel="handleCancel" />
 * ```
 *
 * Props:
 * - initialData: WarningRelationItem，待编辑的预警关系行数据
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
import { computed, reactive, ref } from 'vue';

import { queryGroupInfo, queryUserInfo, type TargetType, type WarningRelationItem } from '@/api/notification/alertPush';
import SelectPagination from '@/components/SelectPagination/index.vue';

defineOptions({ name: 'TaskDueEditForm' });

const props = defineProps<{
  /** 待编辑的预警关系行数据 */
  initialData: WarningRelationItem;
}>();

const emit = defineEmits<{
  (e: 'ok', data: Record<string, unknown>): void;
  (e: 'cancel'): void;
}>();

interface TaskDueEditForm {
  /** 组织 ID */
  orgId: string;
  /** 组织名称 */
  orgName: string;
  /** 父组织名称 */
  parentOrgName: string;
  /** 通知对象类型：1=用户，2=群组 */
  targetType: TargetType;
  /** 通知对象 ID（单选） */
  targetId: string;
  /** 通知对象名称 */
  targetName: string;
  /** 通知对象身份证号 */
  idCard: string;
}

const formRef = ref<FormInstance>();
const submitting = ref(false);

/** 深拷贝 initialData 防止污染原数据 */
const initData = JSON.parse(JSON.stringify(props.initialData)) as WarningRelationItem;

const form = reactive<TaskDueEditForm>({
  orgId: String(initData.businessId ?? ''),
  orgName: String(initData.businessName ?? ''),
  parentOrgName: String(initData.orgName ?? ''),
  targetType: (initData.targetType ?? 1) as TargetType,
  targetId: String(initData.targetId ?? ''),
  targetName: String(initData.targetName ?? ''),
  idCard: String(initData.idCard ?? ''),
});

/** SelectPagination 回显映射 */
const targetMap = computed<Record<string, { name: string; idCard?: string }>>(() => {
  if (!form.targetId) return {};
  return {
    [form.targetId]: { name: form.targetName, idCard: form.idCard || undefined },
  };
});

const rules: FormRules<TaskDueEditForm> = {
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

/** 切换通知对象类型：清空已选 */
function handleTargetTypeChange(): void {
  form.targetId = '';
  form.targetName = '';
  form.idCard = '';
}

/** 通知对象变化：填充名称与身份证号 */
function handleTargetChange(ids: string[], items: Record<string, unknown>[]): void {
  const item = items[0] || {};
  form.targetName = String(item.name ?? '');
  form.idCard = String(item.idCard ?? '');
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
  <div class="task-due-edit-form">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="120px" style="width: 500px" size="large">
      <el-form-item label="组织名称" prop="orgName">
        <el-input v-model="form.orgName" disabled />
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
          :api="targetApi"
          :init-params="getTargetInitParams()"
          :trans="form.targetType === 2 ? { to: 'id', from: 'groupId' } : undefined"
          :value-map="targetMap"
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
.task-due-edit-form {
  display: flex;
  justify-content: center;
  padding: 16px 0;
}
</style>
