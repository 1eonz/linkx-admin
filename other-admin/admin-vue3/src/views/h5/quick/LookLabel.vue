<script setup lang="ts">
/**
 * LookLabel - 标签查看
 *
 * 标签查看组件：
 * - 左侧：标签树（el-tree，一次性拉取 labelList，default-expand-all）
 * - 右侧：选中标签节点下的警员列表（ProTable 展示模式）
 *   选中节点后调用 labelDetail 获取该标签关联的组织+警员，
 *   将 orgUsers 展平为警员行列表展示。
 * - 顶部搜索：警员姓名（前端过滤）
 *
 * 注：三级表格 + 查看关联弹窗，这里按任务要求简化为「树 + 警员列表」。
 */
import { Search } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import type ElTree from 'element-plus/es/components/tree/index';
import { computed, onMounted, ref } from 'vue';

import { labelDetail, labelList, type LabelItem } from '@/api/h5/quick';
import ProTable from '@/components/ProTable/index.vue';
import type { ITableColumn } from '@/components/ProTable/types';

defineOptions({ name: 'LookLabel' });

// ===== 标签树 =====
const treeRef = ref<InstanceType<typeof ElTree>>();
const treeLoading = ref(false);
const treeData = ref<LabelItem[]>([]);
const treeProps = { label: 'name', children: 'children' };

/** 当前选中的标签节点 */
const currentNode = ref<LabelItem | null>(null);

// ===== 警员列表 =====
interface PoliceRow {
  orgId: string;
  orgName: string;
  userId: string;
  name: string;
  [key: string]: unknown;
}

const policeList = ref<PoliceRow[]>([]);
const policeTotal = ref(0);
const policeLoading = ref(false);
/** 警员姓名搜索关键字（前端过滤） */
const searchName = ref('');

// 当前页（展示模式前端分页）
const page = ref(1);
const limit = ref(10);

// ===== 列定义 =====
const columns: ITableColumn[] = [
  { prop: 'orgName', label: '组织名称', minWidth: 180, showOverflowTooltip: true },
  { prop: 'name', label: '警员姓名', minWidth: 140, showOverflowTooltip: true },
  { prop: 'userId', label: '警员ID', minWidth: 140, showOverflowTooltip: true },
];

// 右侧标题
const panelTitle = computed(() => (currentNode.value ? `「${currentNode.value.name}」下的警员` : '警员列表'));

// 按姓名过滤后的警员列表
const filteredPolice = computed(() => {
  const keyword = searchName.value.trim();
  if (!keyword) return policeList.value;
  return policeList.value.filter((item) =>
    String(item.name ?? '')
      .toLowerCase()
      .includes(keyword.toLowerCase()),
  );
});

// 当前页展示数据
const pagedPolice = computed(() => {
  const start = (page.value - 1) * limit.value;
  return filteredPolice.value.slice(start, start + limit.value);
});

// ===== 拉取标签树 =====
async function fetchTree(): Promise<void> {
  treeLoading.value = true;
  try {
    const res = await labelList();
    treeData.value = (res.data ?? []) as LabelItem[];
  } catch {
    ElMessage.error('加载标签树失败');
  } finally {
    treeLoading.value = false;
  }
}

// ===== 节点点击：加载警员列表 =====
async function handleNodeClick(data: LabelItem): Promise<void> {
  currentNode.value = data;
  searchName.value = '';
  page.value = 1;
  if (!data.id) {
    policeList.value = [];
    policeTotal.value = 0;
    return;
  }
  policeLoading.value = true;
  try {
    const res = await labelDetail(String(data.id));
    const detail = res.data as Record<string, unknown> | undefined;
    policeList.value = flattenOrgUsers(detail);
    policeTotal.value = policeList.value.length;
  } catch {
    ElMessage.error('加载警员列表失败');
    policeList.value = [];
    policeTotal.value = 0;
  } finally {
    policeLoading.value = false;
  }
}

/**
 * 将 labelDetail 返回的 orgUsers 对象展平为警员行数组。
 * orgUsers 结构：
 *   { [orgId]: { orgName, userIds: [{ id/name/... }, ...] } }
 */
function flattenOrgUsers(detail: Record<string, unknown> | undefined): PoliceRow[] {
  const result: PoliceRow[] = [];
  if (!detail) return result;
  const orgUsers = detail.orgUsers as
    Record<string, { orgName?: string; userIds?: Array<{ id?: string; name?: string }> }> | undefined;
  if (!orgUsers) return result;
  Object.keys(orgUsers).forEach((orgId) => {
    const org = orgUsers[orgId];
    const orgName = org?.orgName ?? '';
    const userIds = org?.userIds ?? [];
    userIds.forEach((user) => {
      result.push({
        orgId,
        orgName,
        userId: String(user.id ?? ''),
        name: String(user.name ?? ''),
      });
    });
  });
  return result;
}

// ===== 搜索 / 重置 =====
function handleSearch(): void {
  page.value = 1;
}

function handleReset(): void {
  searchName.value = '';
  page.value = 1;
}

// 分页变化
function handlePagination(p: { page: number; limit: number }): void {
  page.value = p.page;
  limit.value = p.limit;
}

onMounted(() => {
  fetchTree();
});

// 暴露给父组件（便于扩展）
defineExpose({ getList: fetchTree });

// 树节点点击回调（el-tree @node-click 透传 data）
function onNodeClick(data: unknown): void {
  handleNodeClick(data as LabelItem);
}
</script>

<template>
  <div class="look-label">
    <!-- 左侧：标签树 -->
    <div class="tree-panel">
      <div class="panel-header">
        <span class="panel-title">标签树</span>
      </div>
      <div v-loading="treeLoading" class="tree-body">
        <el-tree
          ref="treeRef"
          :data="treeData"
          :props="treeProps"
          node-key="id"
          default-expand-all
          highlight-current
          :expand-on-click-node="false"
          empty-text="暂无标签数据"
          @node-click="onNodeClick"
        />
      </div>
    </div>

    <!-- 右侧：警员列表 -->
    <div class="list-panel">
      <div class="panel-header">
        <span class="panel-title">{{ panelTitle }}</span>
      </div>

      <!-- 顶部搜索 -->
      <div class="search-bar">
        <el-input
          v-model="searchName"
          placeholder="请输入警员姓名"
          clearable
          style="width: 240px"
          :prefix-icon="Search"
          @keyup.enter="handleSearch"
          @clear="handleSearch"
        />
        <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>

      <ProTable
        v-model:page="page"
        v-model:limit="limit"
        :columns="columns"
        :data="pagedPolice"
        :loading="policeLoading"
        :total="filteredPolice.length"
        show-index
        index-label="序号"
        :index-width="80"
        @pagination="handlePagination"
      >
        <template #empty>
          <span>{{ currentNode ? '该标签下暂无关联警员' : '请先在左侧选择标签节点' }}</span>
        </template>
      </ProTable>
    </div>
  </div>
</template>

<style lang="less" scoped>
.look-label {
  display: flex;
  gap: 12px;
  height: calc(100vh - 220px);
  min-height: 400px;
}

.tree-panel {
  display: flex;
  flex-direction: column;
  width: 280px;
  flex-shrink: 0;
  background: @color-bg-card;
  border: 1px solid @color-border-panel;
  border-radius: @radius-md;
  overflow: hidden;
}

.list-panel {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: @color-bg-card;
  border: 1px solid @color-border-panel;
  border-radius: @radius-md;
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  height: 40px;
  padding: 0 14px;
  border-bottom: 1px solid @color-border-panel;
  flex-shrink: 0;
  background: @color-bg-card;
}

.panel-title {
  font-size: @font-size-md;
  font-weight: 600;
  color: @color-text-primary;
}

.tree-body {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  flex-shrink: 0;
}

:deep(.el-tree-node__content) {
  height: 32px;
  line-height: 32px;
  border-radius: @radius-xs;
}

:deep(.el-tree-node.is-current > .el-tree-node__content) {
  background: @color-primary-light-9;
  color: @color-primary;
  font-weight: 600;
}
</style>
