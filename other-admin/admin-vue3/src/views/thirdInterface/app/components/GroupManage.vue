<script setup lang="ts">
/**
 * GroupManage - 应用分类管理
 *
 * 设计说明：
 * 1. 接口只传 { type: 1 }，后端返回数组（非分页结构）
 * 2. 使用 ProTable + SearchBar 与 AppManage 保持一致的交互风格
 * 3. 新增/编辑通过内嵌 GroupForm 弹窗（同时维护 createGroup/updateGroup）
 * 4. 删除二次确认
 */
import { Plus, Edit, Delete } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { FormInstance, FormItemRule } from 'element-plus';
import { computed, nextTick, reactive, ref } from 'vue';

import {
  createGroup,
  deleteGroup,
  getAppList,
  getGroupPage,
  updateGroup,
  type AppGroup,
  type AppItem,
} from '@/api/thirdInterface/app';
import ActionButtons from '@/components/ActionButtons/index.vue';
import ProTable from '@/components/ProTable/index.vue';
import type { ITableColumn } from '@/components/ProTable/types';
import SearchBar from '@/components/SearchBar/index.vue';

defineOptions({ name: 'GroupManage' });

// ===== 搜索参数 =====
const searchParams = reactive<Record<string, unknown>>({
  name: '',
});

// ===== ProTable ref =====
const tableRef = ref<InstanceType<typeof ProTable>>();

// ===== GroupForm 内嵌弹窗状态 =====
const groupDialogVisible = ref(false);
const groupDialogTitle = ref('新增分类');
const groupFormType = ref<'create' | 'update'>('create');
const groupSubmitLoading = ref(false);
const groupFormRef = ref<FormInstance>();
/** 应用列表 loading（选择应用下拉） */
const appLoading = ref(false);
/** 可选择的应用列表（status===0 && type!==3） */
const appList = ref<Array<Pick<AppItem, 'id' | 'name'>>>([]);

const defaultGroupForm: Partial<AppGroup> = {
  id: undefined,
  name: undefined,
  sort: 0,
  type: 2,
  appIds: [],
};

const groupForm = reactive<Partial<AppGroup>>({ ...defaultGroupForm });

const groupRules = computed<Record<string, FormItemRule[]>>(() => ({
  name: [{ required: true, message: '请输入分类名称', trigger: 'blur' }],
  sort: [{ required: true, message: '请输入排序值', trigger: 'blur' }],
  // 选择应用必填
  appIds: [
    {
      required: true,
      type: 'array',
      message: '请选择应用',
      trigger: 'change',
    },
  ],
}));

const searchPlaceholder = computed(() => '请输入分类名称');

const actions = computed(() => [{ label: '新增分类', type: 'primary' as const, icon: Plus, onClick: handleCreate }]);

// 列定义：序号/分类名称/绑定应用/排序值/创建时间/操作
const columns = computed<ITableColumn[]>(() => [
  { prop: 'name', label: '分类名称', minWidth: 200, align: 'center', showOverflowTooltip: true },
  {
    prop: 'appList',
    label: '绑定应用',
    minWidth: 200,
    align: 'center',
    slotName: 'appList',
    className: 'app-list-cell',
  },
  { prop: 'sort', label: '排序值', width: 100, align: 'center' },
  { prop: 'gmtCreated', label: '创建时间', width: 180, align: 'center', showOverflowTooltip: true },
  {
    prop: 'actions',
    label: '操作',
    fixed: 'right',
    width: 200,
    align: 'center',
    slotName: 'actions',
  },
]);

/**
 * fetchApi 包装：将后端返回的数组包装成 ProTable 兼容的分页结构
 * @param params 搜索参数 + 分页参数
 * @returns 包装后的响应 { code, data: { records, total } }
 */
async function fetchGroupList(params: Record<string, unknown>): Promise<{
  code: number;
  data: { records: AppGroup[]; total: number };
}> {
  const res = await getGroupPage({ type: 1 });
  let records = res.data ?? [];
  // 前端按 name 关键字过滤（后端不支持 name 参数）
  const keyword = (params.name as string) ?? '';
  if (keyword) {
    records = records.filter((item) => item.name?.includes(keyword));
  }
  return {
    code: res.code ?? 0,
    data: { records, total: records.length },
  };
}

// ===== 搜索/重置 =====
function handleSearch(): void {
  tableRef.value?.init();
}

function handleReset(): void {
  searchParams.name = '';
  tableRef.value?.init();
}

// ===== GroupForm 操作 =====
function resetGroupForm(): void {
  Object.keys(groupForm).forEach((k) => delete (groupForm as Record<string, unknown>)[k]);
  Object.assign(groupForm, { ...defaultGroupForm });
}

/**
 * 获取应用列表
 * 拉取已上架且非前置应用的应用：status === 0 && type !== 3
 */
async function fetchAppList(): Promise<void> {
  appLoading.value = true;
  try {
    const res = await getAppList({ pageNum: 1, pageSize: 100 });
    const records =
      (res?.data?.records as AppItem[] | undefined) ?? (Array.isArray(res?.data) ? (res?.data as AppItem[]) : []);
    appList.value = records
      .filter((item) => item.status === 0 && item.type !== 3)
      .map((item) => ({ id: item.id, name: item.name }));
  } catch {
    appList.value = [];
  } finally {
    appLoading.value = false;
  }
}

async function handleCreate(): Promise<void> {
  resetGroupForm();
  groupFormType.value = 'create';
  groupDialogTitle.value = '新增分类';
  // 打开弹窗前先加载应用列表
  await fetchAppList();
  groupDialogVisible.value = true;
  nextTick(() => groupFormRef.value?.clearValidate());
}

async function handleUpdate(row: AppGroup): Promise<void> {
  resetGroupForm();
  groupFormType.value = 'update';
  groupDialogTitle.value = '编辑分类';
  Object.assign(groupForm, {
    id: row.id,
    name: row.name,
    sort: row.sort,
    type: row.type,
    appIds: row.appIds ?? (row.appList ?? []).map((a) => a.id),
  });
  // 打开弹窗前先加载应用列表
  await fetchAppList();
  groupDialogVisible.value = true;
  nextTick(() => groupFormRef.value?.clearValidate());
}

async function handleGroupSubmit(): Promise<void> {
  const valid = await groupFormRef.value?.validate().catch(() => false);
  if (!valid) {
    ElMessage.warning('必填字段未填写');
    return;
  }
  groupSubmitLoading.value = true;
  try {
    const isCreate = groupFormType.value === 'create';
    const payload = { ...groupForm };
    const res = isCreate ? await createGroup(payload) : await updateGroup(payload);
    if (res.code === 0) {
      ElMessage.success(isCreate ? '新增成功' : '修改成功');
      groupDialogVisible.value = false;
      tableRef.value?.refresh();
    } else {
      ElMessage.error(res.msg ?? (isCreate ? '新增失败' : '修改失败'));
    }
  } finally {
    groupSubmitLoading.value = false;
  }
}

function handleDelete(row: AppGroup): void {
  ElMessageBox.confirm(`确认删除分类「${row.name}」吗？`, '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      deleteGroup(row.id)
        .then((result) => {
          if (result.code === 0) {
            ElMessage.success('删除成功');
            tableRef.value?.refresh();
          } else {
            ElMessage.error(result.msg ?? '删除失败');
          }
        })
        .catch(() => {});
    })
    .catch(() => {});
}

/** 从 ProTable slot scope 中安全获取 AppGroup */
function getRow(scope: any): AppGroup {
  return (scope?.row as AppGroup) ?? ({} as AppGroup);
}
</script>

<template>
  <div class="group-manage">
    <SearchBar :placeholder="searchPlaceholder" :actions="actions" @search="handleSearch" @reset="handleReset">
      <template #filters>
        <el-input
          v-model="searchParams.name as string"
          :placeholder="searchPlaceholder"
          class="filter-item"
          style="width: 220px"
          clearable
          @keyup.enter="handleSearch"
        />
      </template>
    </SearchBar>

    <ProTable
      ref="tableRef"
      :columns="columns"
      :fetch-api="fetchGroupList"
      :search-params="searchParams"
      show-index
      index-label="序号"
      :index-width="80"
    >
      <!-- 绑定应用列 -->
      <template #appList="scope">
        <template v-if="getRow(scope).appList?.length">
          <el-tag v-for="app in getRow(scope).appList" :key="app.id" class="app-tag" type="info">
            {{ app.name }}
          </el-tag>
        </template>
        <span v-else class="empty-text">-</span>
      </template>

      <!-- 操作列 -->
      <template #actions="scope">
        <ActionButtons
          :buttons="[
            { type: 'primary', icon: Edit, label: '编辑', onClick: () => handleUpdate(getRow(scope)) },
            { type: 'danger', icon: Delete, label: '删除', onClick: () => handleDelete(getRow(scope)) },
          ]"
        />
      </template>
    </ProTable>

    <!-- GroupForm 内嵌弹窗 -->
    <el-dialog v-model="groupDialogVisible" :title="groupDialogTitle" width="520px" align-center append-to-body>
      <el-form
        ref="groupFormRef"
        :model="groupForm"
        :rules="groupRules"
        label-position="left"
        label-width="100px"
        class="group-form"
      >
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="groupForm.name as string" placeholder="请输入分类名称" maxlength="32" />
        </el-form-item>
        <el-form-item label="排序值" prop="sort">
          <el-input-number v-model="groupForm.sort as number" :min="0" controls-position="right" class="sort-input" />
        </el-form-item>
        <!-- 选择应用 -->
        <el-form-item label="选择应用" prop="appIds">
          <el-select
            v-model="groupForm.appIds as string[]"
            multiple
            filterable
            collapse-tags
            collapse-tags-tooltip
            placeholder="请选择应用"
            style="width: 100%"
            :loading="appLoading"
          >
            <el-option v-for="app in appList" :key="app.id" :label="app.name" :value="app.id" />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="groupDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="groupSubmitLoading" @click="handleGroupSubmit"> 确定 </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="less" scoped>
.group-manage {
  width: 100%;
}

.filter-item {
  display: inline-block;
  vertical-align: middle;
}

.app-tag {
  margin: 2px 4px 2px 0;
  white-space: nowrap;
}

// 绑定应用列：tag 自动换行，单元格高度自适应
:deep(.app-list-cell) {
  .cell {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    line-height: 1.6;
  }
}

.empty-text {
  color: @color-text-placeholder;
}

.group-form {
  width: 420px;
  margin-left: 20px;
}

// 排序值输入框：与同行其他输入框对齐
// 修复 controls-position=right 下：
// 1. 增减按钮顶部 border 缺失
// 2. 输入框 hover 蓝色 box-shadow 被按钮覆盖
// 注意：.sort-input 本身就是 .el-input-number，用 & 引用自身
:deep(.sort-input.el-input-number) {
  width: 100%;
  border: 1px solid @color-border;
  border-radius: @radius-sm;
  overflow: hidden;
  transition: border-color @transition-duration ease;

  &:hover {
    border-color: @color-primary;
  }
  &.is-focus {
    border-color: @color-primary;
    box-shadow: 0 0 0 3px fade(@color-primary, 12%);
  }

  // 增减按钮：加 border-left 分隔
  .el-input-number__increase,
  .el-input-number__decrease {
    border-left: 1px solid @color-border;
    background-color: @color-bg-table-header;
    border-radius: 0;

    &:hover {
      background-color: fade(@color-primary, 8%);
      color: @color-primary;
    }
  }

  // 输入框 wrapper：去除自身 box-shadow（由容器统一处理 border）
  .el-input__wrapper {
    box-shadow: none !important;
    border-radius: 0;
  }
}
</style>
