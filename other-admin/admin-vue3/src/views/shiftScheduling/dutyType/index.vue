<script setup lang="ts">
/**
 * 排班类型管理
 *
 * 功能：
 * - 分页查询排班类型列表（按名称模糊搜索）
 * - 新增/编辑排班类型（仅 name 字段，max 100）
 * - 删除排班类型（type=0 的内置默认类型受保护，不可删）
 */
import { Plus, Edit, Delete } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import { computed, reactive, ref } from 'vue';

import {
  createDutyType,
  deleteDutyType,
  getDutyTypes,
  updateDutyType,
  type DutyTypeItem,
} from '@/api/shiftScheduling/dutyType';
import ActionButtons from '@/components/ActionButtons/index.vue';
import { defaultTableFormatter } from '@/components/ProTable/formatter';
import ProTable from '@/components/ProTable/index.vue';
import type { ITableColumn } from '@/components/ProTable/types';
import SearchBar from '@/components/SearchBar/index.vue';

defineOptions({ name: 'DutyType' });

// ===== 受控模式状态 =====
const list = ref<DutyTypeItem[]>([]);
const total = ref(0);
const searchParams = reactive<Record<string, unknown>>({
  name: '',
});

const tableRef = ref<InstanceType<typeof ProTable>>();

// ===== 列定义 =====
const columns: ITableColumn[] = [
  { prop: 'name', label: '排班类型名称', minWidth: 150, showOverflowTooltip: true },
  { prop: 'type', label: '排班类型标识', width: 120, align: 'center' },
  { prop: 'gmtCreated', label: '创建时间', width: 180, align: 'center' },
  { prop: 'operation', label: '操作', width: 200, align: 'center', slotName: 'operation' },
];

// ===== 搜索区按钮 =====
const actions = computed(() => [
  { key: 'create', label: '新增', type: 'primary' as const, icon: Plus, onClick: handleCreate },
]);

// ===== 弹窗状态 =====
const dialogVisible = ref(false);
const dialogStatus = ref<'create' | 'update'>('create');
const dialogLoading = ref(false);
const dataFormRef = ref<FormInstance>();
const temp = reactive<Partial<DutyTypeItem>>({});

const rules: FormRules = {
  name: [
    { required: true, message: '请输入排班类型名称', trigger: 'blur' },
    { max: 100, message: '最多 100 个字符', trigger: 'blur' },
  ],
};

// ===== ProTable @response 回调 =====
function handleResponse(res: unknown): void {
  list.value = defaultTableFormatter.getRecords(res) as DutyTypeItem[];
  total.value = defaultTableFormatter.getTotal(res);
}

// ===== 搜索/重置 =====
function handleSearch(): void {
  tableRef.value?.init();
}

function handleReset(): void {
  searchParams.name = '';
  tableRef.value?.init();
}

// ===== 新增 =====
function handleCreate(): void {
  resetTemp();
  dialogStatus.value = 'create';
  dialogVisible.value = true;
}

// ===== 编辑 =====
function handleUpdate(row: DutyTypeItem): void {
  resetTemp();
  Object.assign(temp, row);
  dialogStatus.value = 'update';
  dialogVisible.value = true;
}

// ===== 提交（新增/编辑） =====
async function submitForm(): Promise<void> {
  const valid = await dataFormRef.value?.validate().catch(() => false);
  if (!valid) return;
  dialogLoading.value = true;
  try {
    const isCreate = dialogStatus.value === 'create';
    const result = isCreate
      ? await createDutyType({ name: temp.name ?? '' })
      : await updateDutyType(temp.type as string, { name: temp.name ?? '' });
    if (!result || result.code !== 0) {
      ElMessage.error(result?.msg ?? `${isCreate ? '创建' : '更新'}失败，请重试`);
      return;
    }
    ElMessage.success(`${isCreate ? '创建' : '更新'}成功`);
    // 关闭弹窗并重置表单
    dialogVisible.value = false;
    resetTemp();
    dataFormRef.value?.resetFields();
    tableRef.value?.refresh();
  } finally {
    dialogLoading.value = false;
  }
}

/** 关闭弹窗时重置表单和校验状态 */
function handleDialogClose(): void {
  resetTemp();
  dataFormRef.value?.resetFields();
}

// ===== 删除 =====
function handleDelete(row: DutyTypeItem): void {
  ElMessageBox.confirm(`确定删除排班类型「${row.name}」？删除后将无法恢复。`, '删除确认', {
    confirmButtonText: '确定删除',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => deleteDutyType(row.type))
    .then(({ code, msg }) => {
      if (code !== 0) {
        ElMessage.error(msg || '删除失败，请重试');
        return;
      }
      ElMessage.success('删除成功');
      tableRef.value?.refresh();
    })
    .catch(() => {});
}

// ===== 工具函数 =====
function resetTemp(): void {
  Object.keys(temp).forEach((k) => delete (temp as Record<string, unknown>)[k]);
}

/** 从 ProTable slot scope 中安全获取 DutyTypeItem */
function getRow(scope: any): DutyTypeItem {
  return (scope?.row as DutyTypeItem) ?? ({} as DutyTypeItem);
}

/** 弹窗打开后清除校验状态 */
function handleDialogOpen(): void {
  dataFormRef.value?.clearValidate();
}
</script>

<template>
  <div class="app-container">
    <el-card shadow="always" class="card">
      <SearchBar
        v-model:search-key="searchParams.name as string"
        placeholder="排班类型名称"
        :actions="actions"
        @search="handleSearch"
        @reset="handleReset"
      />

      <ProTable
        ref="tableRef"
        :columns="columns"
        :fetch-api="getDutyTypes"
        :data="list"
        :total="total"
        :search-params="searchParams"
        @response="handleResponse"
      >
        <template #operation="scope">
          <ActionButtons
            :buttons="[
              { type: 'primary', icon: Edit, label: '编辑', onClick: () => handleUpdate(getRow(scope)) },
              {
                type: 'danger',
                icon: Delete,
                label: '删除',
                visible: getRow(scope).type !== 0,
                onClick: () => handleDelete(getRow(scope)),
              },
            ]"
          />
        </template>
      </ProTable>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogStatus === 'create' ? '新增排班类型' : '编辑排班类型'"
      width="500px"
      align-center
      append-to-body
      @open="handleDialogOpen"
      @close="handleDialogClose"
    >
      <el-form
        ref="dataFormRef"
        :rules="rules"
        :model="temp"
        label-position="left"
        label-width="120px"
        style="width: 400px; margin-left: 20px"
      >
        <el-form-item label="排班类型名称" prop="name">
          <el-input v-model="temp.name" placeholder="请输入排班类型名称" maxlength="100" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="dialogLoading" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="less" scoped>
.card {
  height: 100%;
  overflow-y: auto;
}
</style>
