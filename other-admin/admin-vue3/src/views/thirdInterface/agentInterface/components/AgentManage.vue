<script setup lang="ts">
/**
 * AgentManage - AI 智能体管理列表
 *
 * 功能：
 * - ProTable 受控模式分页（pageNo/pageSize）
 * - 分类筛选下拉
 * - AuthImg 渲染头像
 * - 优先级 el-tag
 * - 编辑/删除按钮
 * - 新增/编辑通过子组件 AgentManageEditModal
 * - 创建分类弹窗
 */
import { Edit, Delete, Plus } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { computed, onMounted, reactive, ref } from 'vue';

import AgentManageEditModal from './AgentManageEditModal.vue';
import {
  deleteAiagent,
  deleteCategory,
  getAgentFileList,
  getAiagentPage,
  queryCategory,
  type AgentCategory,
  type AgentFileItem,
  type AiagentItem,
} from '@/api/thirdInterface/agentInterface';
import AuthImg from '@/components/AuthImg/index.vue';
import { defaultTableFormatter } from '@/components/ProTable/formatter';
import ProTable from '@/components/ProTable/index.vue';
import type { ITableColumn } from '@/components/ProTable/types';
import SearchBar from '@/components/SearchBar/index.vue';

defineOptions({ name: 'AgentManage' });

// ===== 受控模式状态 =====
const list = ref<AiagentItem[]>([]);
const total = ref(0);
const searchParams = reactive<Record<string, unknown>>({
  name: '',
  categoryId: '',
});
const tableRef = ref<InstanceType<typeof ProTable>>();

// 分类列表
const categoryList = ref<AgentCategory[]>([]);
// 文件接口列表（用于编辑弹窗下拉）
const fileList = ref<AgentFileItem[]>([]);

// 弹窗
const editRef = ref<InstanceType<typeof AgentManageEditModal>>();
const editVisible = ref(false);

// 新建分类弹窗
const categoryDialogVisible = ref(false);
const newCategoryName = ref('');
const categorySubmitting = ref(false);

// 优先级 tag 类型映射
function getPriorityTagType(priority: number): 'danger' | 'warning' | 'info' {
  if (priority === 0) return 'danger';
  if (priority === 1) return 'warning';
  return 'info';
}

function getPriorityText(priority: number): string {
  if (priority === 0) return '高';
  if (priority === 1) return '中';
  return '低';
}

const columns = computed<ITableColumn[]>(() => [
  { prop: 'name', label: '智能体名称', minWidth: 140, showOverflowTooltip: true },
  { prop: 'avatarUrl', label: '头像', width: 80, align: 'center', slotName: 'avatarUrl' },
  { prop: 'categoryName', label: '分类', minWidth: 120, showOverflowTooltip: true },
  { prop: 'url', label: '调用 URL', minWidth: 200, showOverflowTooltip: true },
  { prop: 'priority', label: '优先级', width: 90, align: 'center', slotName: 'priority' },
  {
    prop: 'isRestricted',
    label: '可见范围',
    width: 100,
    align: 'center',
    slotName: 'isRestricted',
  },
  {
    prop: 'actions',
    label: '操作',
    fixed: 'right',
    width: 180,
    align: 'center',
    slotName: 'actions',
  },
]);

const actions = computed(() => [{ label: '新增', type: 'primary' as const, icon: Plus, onClick: handleCreate }]);

const searchPlaceholder = computed(() => '智能体名称');

// ===== ProTable fetch 适配 =====
// ProTable 默认 pageNum/pageSize，此处通过 page-num-field="pageNo" 转换为 pageNo
async function fetchList(params: Record<string, unknown>): Promise<unknown> {
  return getAiagentPage({
    pageNo: Number(params.pageNo ?? 1),
    pageSize: Number(params.pageSize ?? 10),
    name: String(searchParams.name ?? ''),
    categoryId: String(searchParams.categoryId ?? ''),
  });
}

function handleResponse(res: unknown): void {
  list.value = defaultTableFormatter.getRecords(res) as AiagentItem[];
  total.value = defaultTableFormatter.getTotal(res);
}

function handleSearch(): void {
  tableRef.value?.init();
}

function handleReset(): void {
  searchParams.name = '';
  searchParams.categoryId = '';
  tableRef.value?.init();
}

/** 从 ProTable slot scope 中安全获取 AiagentItem */
function getRow(scope: any): AiagentItem {
  return (scope?.row as AiagentItem) ?? ({} as AiagentItem);
}

// ===== 新增/编辑 =====
function handleCreate(): void {
  editVisible.value = true;
  editRef.value?.init('add', undefined, categoryList.value, fileList.value);
}

function handleEdit(row: AiagentItem): void {
  editVisible.value = true;
  editRef.value?.init('edit', row, categoryList.value, fileList.value);
}

function handleEditSuccess(): void {
  tableRef.value?.refresh();
}

// ===== 删除 =====
function handleDelete(row: AiagentItem): void {
  ElMessageBox.confirm(`确定删除智能体「${row.name}」？`, '删除确认', {
    confirmButtonText: '确定删除',
    cancelButtonText: '取消',
    type: 'warning',
    confirmButtonClass: 'el-button--danger',
  })
    .then(async () => {
      try {
        const res = await deleteAiagent(row.id);
        if (!res || res.code !== 0) {
          ElMessage.error(res?.msg ?? '删除失败');
          return;
        }
        ElMessage.success('删除成功');
        tableRef.value?.refresh();
      } catch (e) {
        ElMessage.error((e as Error)?.message ?? '删除失败');
      }
    })
    .catch(() => {});
}

// ===== 新建分类 =====
function openCategoryDialog(): void {
  newCategoryName.value = '';
  categoryDialogVisible.value = true;
}

async function handleAddCategory(): Promise<void> {
  if (!newCategoryName.value.trim()) {
    ElMessage.warning('请输入分类名称');
    return;
  }
  // 简化版：本地添加（实际项目可调用接口）
  categorySubmitting.value = true;
  try {
    categoryList.value.push({ name: newCategoryName.value.trim() });
    ElMessage.success('分类已添加');
    categoryDialogVisible.value = false;
  } finally {
    categorySubmitting.value = false;
  }
}

async function handleDeleteCategory(cat: AgentCategory): Promise<void> {
  if (!cat.id) {
    categoryList.value = categoryList.value.filter((c) => c !== cat);
    return;
  }
  try {
    await ElMessageBox.confirm(`确定删除分类「${cat.name}」？`, '删除确认', {
      type: 'warning',
    });
    const res = await deleteCategory(cat.id);
    if (!res || res.code !== 0) {
      ElMessage.error(res?.msg ?? '删除失败');
      return;
    }
    ElMessage.success('删除成功');
    categoryList.value = categoryList.value.filter((c) => c.id !== cat.id);
  } catch {
    // 取消
  }
}

// ===== 加载分类/文件接口列表 =====
async function loadCategoryList(): Promise<void> {
  try {
    const res = await queryCategory();
    if (res?.code === 0) {
      categoryList.value = (res?.data as AgentCategory[]) ?? [];
    }
  } catch (e) {
    console.error(e);
  }
}

async function loadFileList(): Promise<void> {
  try {
    const res = await getAgentFileList();
    if (res?.code === 0) {
      fileList.value = (res?.data as AgentFileItem[]) ?? [];
    }
  } catch (e) {
    console.error(e);
  }
}

onMounted(() => {
  loadCategoryList();
  loadFileList();
});
</script>

<template>
  <div class="agent-manage">
    <SearchBar :placeholder="searchPlaceholder" :actions="actions" @search="handleSearch" @reset="handleReset">
      <template #filters>
        <el-input
          v-model="searchParams.name as string"
          placeholder="智能体名称"
          class="filter-item"
          style="width: 200px"
          clearable
          @keyup.enter="handleSearch"
        />
        <el-select
          v-model="searchParams.categoryId as string"
          placeholder="分类"
          clearable
          class="filter-item"
          style="width: 180px"
        >
          <el-option
            v-for="cat in categoryList"
            :key="cat.id ?? cat.name"
            :label="cat.name"
            :value="cat.id ?? cat.name"
          />
        </el-select>
      </template>
    </SearchBar>

    <div class="category-bar">
      <span class="label">分类管理：</span>
      <el-tag
        v-for="cat in categoryList"
        :key="cat.id ?? cat.name"
        closable
        class="cat-tag"
        @close="handleDeleteCategory(cat)"
      >
        {{ cat.name }}
      </el-tag>
      <el-button :icon="Plus" size="small" link @click="openCategoryDialog">新建分类</el-button>
    </div>

    <ProTable
      ref="tableRef"
      :columns="columns"
      :fetch-api="fetchList"
      :data="list"
      :total="total"
      :search-params="searchParams"
      page-num-field="pageNo"
      page-size-field="pageSize"
      @response="handleResponse"
    >
      <template #avatarUrl="scope">
        <AuthImg v-if="getRow(scope).avatarUrl" :auth-src="getRow(scope).avatarUrl" class="row-avatar" />
        <span v-else>-</span>
      </template>
      <template #priority="scope">
        <el-tag :type="getPriorityTagType(getRow(scope).priority)">
          {{ getPriorityText(getRow(scope).priority) }}
        </el-tag>
      </template>
      <template #isRestricted="scope">
        <el-tag :type="getRow(scope).isRestricted === 1 ? 'warning' : 'success'">
          {{ getRow(scope).isRestricted === 1 ? '受限' : '全员' }}
        </el-tag>
      </template>
      <template #actions="scope">
        <el-button type="primary" link :icon="Edit" @click="handleEdit(getRow(scope))">编辑</el-button>
        <el-button type="danger" link :icon="Delete" @click="handleDelete(getRow(scope))">删除</el-button>
      </template>
    </ProTable>

    <AgentManageEditModal ref="editRef" v-model:visible="editVisible" @success="handleEditSuccess" />

    <el-dialog
      v-model="categoryDialogVisible"
      title="新建分类"
      width="360px"
      align-center
      append-to-body
      :close-on-click-modal="false"
    >
      <el-input v-model="newCategoryName" placeholder="请输入分类名称" />
      <template #footer>
        <el-button @click="categoryDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="categorySubmitting" @click="handleAddCategory">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="less" scoped>
.agent-manage {
  padding: 8px 16px;

  .filter-item {
    margin-right: 8px;
  }

  .category-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 0 12px;
    flex-wrap: wrap;

    .label {
      font-size: 13px;
      color: #606266;
    }

    .cat-tag {
      cursor: default;
    }
  }
}

.row-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  vertical-align: middle;
}
</style>
