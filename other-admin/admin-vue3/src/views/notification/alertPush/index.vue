<script setup lang="ts">
/**
 * 预警推送（双 tab：任务逾期 + 无人值守）
 *
 * 功能：
 * - 双 tab 切换：任务逾期（classify=1）/ 无人值守（classify=2）
 * - 每个 tab 独立的列表 + 多选 + 分页
 * - 新增/编辑通过 createDialog 调起表单弹窗
 * - 批量删除
 * - 搜索：组织/协同岗名称 + 通知对象类型 + 预警通知对象
 */
import { Plus, Delete, Edit, Search, Refresh } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { computed, onMounted, reactive, ref, watch } from 'vue';

import TaskDueAddForm from './components/TaskDueAddForm.vue';
import TaskDueEditForm from './components/TaskDueEditForm.vue';
import UnattendedAddForm from './components/UnattendedAddForm.vue';
import UnattendedEditForm from './components/UnattendedEditForm.vue';
import {
  createWarningRelation,
  deleteWarningRelation,
  getWarningRelationList,
  updateWarningRelation,
  type TargetType,
  type WarningRelationItem,
} from '@/api/notification/alertPush';
import { createDialog } from '@/utils/createDialog';

defineOptions({ name: 'WarningRelation' });

// ===== 双 Tab 状态 =====
const activeTab = ref<'taskOverdue' | 'unattended'>('taskOverdue');

// 任务逾期列表
const taskOverdueList = ref<WarningRelationItem[]>([]);
const taskOverdueTotal = ref(0);
const multipleSelectionTaskDue = ref<WarningRelationItem[]>([]);

// 无人值守列表
const unattendedList = ref<WarningRelationItem[]>([]);
const unattendedTotal = ref(0);
const multipleSelectionUnattended = ref<WarningRelationItem[]>([]);

// 查询参数
const queryParams = reactive({
  classify: 1 as 1 | 2,
  businessName: '',
  targetType: undefined as TargetType | undefined,
  targetName: '',
});

// 分页
const pagination = reactive({
  pageNum: 1,
  pageSize: 10,
  total: 0,
});

// 列表 loading
const listLoading = ref(false);

// 通知对象类型选项
const targetTypeList = [
  { label: '用户', value: 1 as TargetType },
  { label: '群组', value: 2 as TargetType },
];

// 当前 tab 的多选数组
const currentMultipleSelection = computed(() =>
  activeTab.value === 'taskOverdue' ? multipleSelectionTaskDue.value : multipleSelectionUnattended.value,
);

// ===== 弹窗工厂（createDialog）=====
const taskDueAddDialog = createDialog<Record<string, unknown>>(TaskDueAddForm, {
  title: '添加任务逾期项',
  width: '600px',
});
const taskDueEditDialog = createDialog<Record<string, unknown>>(TaskDueEditForm, {
  title: '编辑任务逾期项',
  width: '600px',
});
const unattendedAddDialog = createDialog<Record<string, unknown>>(UnattendedAddForm, {
  title: '添加无人值守项',
  width: '600px',
});
const unattendedEditDialog = createDialog<Record<string, unknown>>(UnattendedEditForm, {
  title: '编辑无人值守项',
  width: '600px',
});

// ===== 获取列表 =====
function getWarningList(): void {
  listLoading.value = true;
  const params = {
    classify: queryParams.classify,
    businessName: queryParams.businessName,
    targetType: queryParams.targetType,
    targetName: queryParams.targetName,
    pageNum: pagination.pageNum,
    pageSize: pagination.pageSize,
  };
  getWarningRelationList(params)
    .then((res) => {
      const records = res?.data?.records ?? [];
      const total = res?.data?.total ?? 0;
      if (queryParams.classify === 1) {
        taskOverdueList.value = records;
        taskOverdueTotal.value = total;
      } else {
        unattendedList.value = records;
        unattendedTotal.value = total;
      }
      pagination.total = total;
    })
    .catch(() => {})
    .finally(() => {
      listLoading.value = false;
    });
}

// ===== 搜索/重置 =====
function handleSearch(): void {
  pagination.pageNum = 1;
  getWarningList();
}

function handleReset(): void {
  queryParams.businessName = '';
  queryParams.targetType = undefined;
  queryParams.targetName = '';
  pagination.pageNum = 1;
  getWarningList();
}

// ===== 分页 =====
function handleSizeChange(size: number): void {
  pagination.pageSize = size;
  pagination.pageNum = 1;
  getWarningList();
}

function handleCurrentChange(page: number): void {
  pagination.pageNum = page;
  getWarningList();
}

// ===== 多选 =====
function selectionChangeTaskDue(val: WarningRelationItem[]): void {
  multipleSelectionTaskDue.value = val;
}

function selectionChangeUnattended(val: WarningRelationItem[]): void {
  multipleSelectionUnattended.value = val;
}

// ===== 新增 =====
async function handleAdd(): Promise<void> {
  try {
    if (activeTab.value === 'taskOverdue') {
      const result = (await taskDueAddDialog()) as Record<string, unknown>;
      const params = {
        classify: 1 as const,
        businessId: String(result.orgId ?? ''),
        businessName: String(result.orgName ?? ''),
        orgName: String(result.parentOrgName ?? ''),
        targetType: result.targetType as TargetType,
        targetIds: (result.targetId as string[]).join(','),
        targetNames: (result.targetName as string[]) || [],
        idCard: (result.idCard as string[]).join(','),
      };
      createWarningRelation(params)
        .then((res) => {
          if (!res || res.code !== 0) {
            ElMessage.error(res?.msg || '新增失败');
            return;
          }
          ElMessage.success('新增成功');
          getWarningList();
        })
        .catch(() => {});
    } else {
      const result = (await unattendedAddDialog()) as Record<string, unknown>;
      const params = {
        classify: 2 as const,
        businessId: String(result.cooperId ?? ''),
        businessName: String(result.cooperName ?? ''),
        orgName: String(result.belongOrgName ?? ''),
        targetType: result.targetType as TargetType,
        targetIds: (result.targetId as string[]).join(','),
        targetNames: (result.targetName as string[]) || [],
        idCard: (result.idCard as string[]).join(','),
      };
      createWarningRelation(params)
        .then((res) => {
          if (!res || res.code !== 0) {
            ElMessage.error(res?.msg || '新增失败');
            return;
          }
          ElMessage.success('新增成功');
          getWarningList();
        })
        .catch(() => {});
    }
  } catch (e) {
    const err = e as { type?: string };
    if (err?.type !== 'cancel-dialog' && err?.type !== 'close-dialog') {
      console.error(e);
    }
  }
}

// ===== 编辑 =====
async function handleEdit(row: WarningRelationItem): Promise<void> {
  try {
    if (activeTab.value === 'taskOverdue') {
      const result = (await taskDueEditDialog({ props: { initialData: row } })) as Record<string, unknown>;
      const params = {
        classify: 1 as const,
        id: String(result.id ?? row.id),
        businessId: String(result.orgId ?? row.businessId),
        businessName: String(result.orgName ?? row.businessName),
        orgName: String(result.parentOrgName ?? row.orgName),
        targetType: result.targetType as TargetType,
        targetId: String(result.targetId ?? ''),
        targetName: String(result.targetName ?? ''),
        idCard: String(result.idCard ?? ''),
      };
      updateWarningRelation(params)
        .then((res) => {
          if (!res || res.code !== 0) {
            ElMessage.error(res?.msg || '更新失败');
            return;
          }
          ElMessage.success('更新成功');
          getWarningList();
        })
        .catch(() => {});
    } else {
      const result = (await unattendedEditDialog({ props: { initialData: row } })) as Record<string, unknown>;
      const params = {
        classify: 2 as const,
        id: String(result.id ?? row.id),
        businessId: String(result.cooperId ?? row.businessId),
        businessName: String(result.cooperName ?? row.businessName),
        orgName: String(result.belongOrgName ?? row.orgName),
        targetType: result.targetType as TargetType,
        targetId: String(result.targetId ?? ''),
        targetName: String(result.targetName ?? ''),
        idCard: String(result.idCard ?? ''),
      };
      updateWarningRelation(params)
        .then((res) => {
          if (!res || res.code !== 0) {
            ElMessage.error(res?.msg || '更新失败');
            return;
          }
          ElMessage.success('更新成功');
          getWarningList();
        })
        .catch(() => {});
    }
  } catch (e) {
    const err = e as { type?: string };
    if (err?.type !== 'cancel-dialog' && err?.type !== 'close-dialog') {
      console.error(e);
    }
  }
}

// ===== 批量删除 =====
function handleBatchDelete(): void {
  if (currentMultipleSelection.value.length === 0) {
    ElMessage.warning('请先勾选行');
    return;
  }
  ElMessageBox.confirm('确定要删除选中的数据吗？', '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      const ids = currentMultipleSelection.value.map((row) => row.id);
      return deleteWarningRelation(ids);
    })
    .then((res) => {
      if (!res || res.code !== 0) {
        ElMessage.error(res?.msg || '删除失败');
        return;
      }
      ElMessage.success('删除成功');
      // 清空对应多选数组
      if (activeTab.value === 'taskOverdue') {
        multipleSelectionTaskDue.value = [];
      } else {
        multipleSelectionUnattended.value = [];
      }
      getWarningList();
    })
    .catch(() => {});
}

// ===== Tab 切换 =====
watch(activeTab, (newTab) => {
  // 重置分页
  pagination.pageNum = 1;
  pagination.total = 0;
  // 更新 classify
  queryParams.classify = newTab === 'taskOverdue' ? 1 : 2;
  // 清空对方 Tab 的多选
  if (newTab === 'taskOverdue') {
    multipleSelectionUnattended.value = [];
  } else {
    multipleSelectionTaskDue.value = [];
  }
  // 清空搜索字段
  queryParams.businessName = '';
  queryParams.targetType = undefined;
  queryParams.targetName = '';
  getWarningList();
});

// ===== 通知对象类型显示文本 =====
function getTargetTypeText(targetType?: number): string {
  if (targetType === 1) return '用户';
  if (targetType === 2) return '群组';
  return '';
}

/** 从 el-table slot scope 中安全获取 WarningRelationItem */
function getRow(scope: any): WarningRelationItem {
  return (scope?.row as WarningRelationItem) ?? ({} as WarningRelationItem);
}

onMounted(() => {
  getWarningList();
});
</script>

<template>
  <div class="app-container">
    <el-card shadow="always" class="card">
      <el-tabs v-model="activeTab" type="border-card">
        <!-- 任务逾期 Tab -->
        <el-tab-pane label="任务逾期" name="taskOverdue">
          <!-- 搜索区 -->
          <el-form :inline="true" class="search-form" @submit.prevent="handleSearch">
            <el-form-item label="组织名称">
              <el-input
                v-model="queryParams.businessName"
                clearable
                placeholder="组织名称"
                style="width: 200px"
                @keyup.enter="handleSearch"
              />
            </el-form-item>
            <el-form-item label="通知对象类型">
              <el-select v-model="queryParams.targetType" clearable placeholder="通知对象类型" style="width: 150px">
                <el-option v-for="opt in targetTypeList" :key="opt.value" :label="opt.label" :value="opt.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="预警通知对象">
              <el-input
                v-model="queryParams.targetName"
                clearable
                placeholder="预警通知对象"
                style="width: 200px"
                @keyup.enter="handleSearch"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
              <el-button :icon="Refresh" @click="handleReset">重置</el-button>
              <el-button type="primary" :icon="Plus" @click="handleAdd">新增</el-button>
              <el-button type="danger" :icon="Delete" @click="handleBatchDelete">批量删除</el-button>
            </el-form-item>
          </el-form>

          <!-- 表格 -->
          <el-table
            v-loading="listLoading"
            :data="taskOverdueList"
            border
            stripe
            style="width: 100%"
            @selection-change="selectionChangeTaskDue"
          >
            <el-table-column type="selection" width="55" align="center" />
            <el-table-column prop="businessName" label="组织名称" align="center" />
            <el-table-column prop="orgName" label="父组织" align="center" />
            <el-table-column label="通知对象类型" width="150" align="center">
              <template #default="scope">
                <span>{{ getTargetTypeText(getRow(scope).targetType) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="targetName" label="预警通知对象" align="center" />
            <el-table-column label="操作" width="150" align="center" fixed="right">
              <template #default="scope">
                <el-button type="primary" link :icon="Edit" @click="handleEdit(getRow(scope))">编辑</el-button>
              </template>
            </el-table-column>
          </el-table>

          <!-- 分页 -->
          <el-pagination
            v-show="taskOverdueTotal > 0"
            class="pagination"
            :current-page="pagination.pageNum"
            :page-size="pagination.pageSize"
            :total="taskOverdueTotal"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </el-tab-pane>

        <!-- 无人值守 Tab -->
        <el-tab-pane label="无人值守" name="unattended">
          <!-- 搜索区 -->
          <el-form :inline="true" class="search-form" @submit.prevent="handleSearch">
            <el-form-item label="协同岗名称">
              <el-input
                v-model="queryParams.businessName"
                clearable
                placeholder="协同岗名称"
                style="width: 200px"
                @keyup.enter="handleSearch"
              />
            </el-form-item>
            <el-form-item label="通知对象类型">
              <el-select v-model="queryParams.targetType" clearable placeholder="通知对象类型" style="width: 150px">
                <el-option v-for="opt in targetTypeList" :key="opt.value" :label="opt.label" :value="opt.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="预警通知对象">
              <el-input
                v-model="queryParams.targetName"
                clearable
                placeholder="预警通知对象"
                style="width: 200px"
                @keyup.enter="handleSearch"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
              <el-button :icon="Refresh" @click="handleReset">重置</el-button>
              <el-button type="primary" :icon="Plus" @click="handleAdd">新增</el-button>
              <el-button type="danger" :icon="Delete" @click="handleBatchDelete">批量删除</el-button>
            </el-form-item>
          </el-form>

          <!-- 表格 -->
          <el-table
            v-loading="listLoading"
            :data="unattendedList"
            border
            stripe
            style="width: 100%"
            @selection-change="selectionChangeUnattended"
          >
            <el-table-column type="selection" width="55" align="center" />
            <el-table-column prop="businessName" label="协同岗名称" align="center" />
            <el-table-column prop="orgName" label="所属组织" align="center" />
            <el-table-column label="通知对象类型" width="150" align="center">
              <template #default="scope">
                <span>{{ getTargetTypeText(getRow(scope).targetType) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="targetName" label="预警通知对象" align="center" />
            <el-table-column label="操作" width="150" align="center" fixed="right">
              <template #default="scope">
                <el-button type="primary" link :icon="Edit" @click="handleEdit(getRow(scope))">编辑</el-button>
              </template>
            </el-table-column>
          </el-table>

          <!-- 分页 -->
          <el-pagination
            v-show="unattendedTotal > 0"
            class="pagination"
            :current-page="pagination.pageNum"
            :page-size="pagination.pageSize"
            :total="unattendedTotal"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<style lang="less" scoped>
.card {
  height: 100%;
  overflow-y: auto;
}

.search-form {
  margin-bottom: 16px;
}

.pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
