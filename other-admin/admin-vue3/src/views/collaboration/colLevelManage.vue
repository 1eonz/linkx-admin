<script setup lang="ts">
/**
 * colLevelManage.vue - 协同岗层级管理
 *
 * ProTable 主体采用受控模式（fetchApi + data + @response）：
 * - fetchApi 统一封装为 fetchMembersApi，根据搜索条件动态切换两个后端 API
 *   - 有 name/startTime/endTime 任一 → 走 getCoopLevelMembersBySearch
 *   - 否则 → 走 getCoopLevelMembers(levelId, ...)
 * - list/total 由 handleResponse 赋值
 * - searchParams 含 levelId + 搜索条件，分页由 ProTable 内部管理
 * - immediate=false，等节点点击后才触发
 * - 节点点击/搜索/重置/删除/挂靠后 → tableRef.init() / tableRef.refresh()
 */
import { CircleClose, Plus, Search } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { computed, nextTick, onMounted, reactive, ref } from 'vue';

import CoopBindDialog, { type CoopBindDialogInstance } from './components/CoopBindDialog.vue';
import CoopLevelTree from './components/CoopLevelTree.vue';
import type { CoopTreeNode } from './components/CoopLevelTree.vue';
import SplitDivider from './components/SplitDivider.vue';
import { getCollaborationPage, queryUserByIdCard } from '@/api/h5/collaboration';
import type { CollaborationItem } from '@/api/h5/collaboration';
import {
  createCoopLevel,
  deleteCoopLevel,
  deleteCoopLevelMembers,
  getCoopLevelChildren,
  getCoopLevelMembers,
  getCoopLevelMembersBySearch,
  updateCoopLevel,
  updateCoopLevelMembers,
} from '@/api/h5/coopLevel';
import type { CoopLevelMember, CoopLevelNode } from '@/api/h5/coopLevel';
import { defaultTableFormatter } from '@/components/ProTable/formatter';
import ProTable from '@/components/ProTable/index.vue';
import type { ITableColumn } from '@/components/ProTable/types';
import { getIdCardNum } from '@/utils/auth';

defineOptions({ name: 'ColLevelManage' });

const LEFT_DEFAULT = 260;

const leftWidth = ref(LEFT_DEFAULT);

// 当前选中节点
const currentNode = ref<CoopLevelNode | null>(null);

// 用户信息（非管理员时用于查询参数 orgId）
const departmentId = ref('');
const idCardNum = getIdCardNum();

// ===== 受控模式状态 =====
const memberList = ref<CoopLevelMember[]>([]);
const memberTotal = ref(0);
// 搜索参数：levelId + 搜索条件，分页由 ProTable 内部管理
const searchParams = reactive<Record<string, unknown>>({
  levelId: '',
  name: '',
  startTime: '',
  endTime: '',
});

// 组件 ref
const tableRef = ref<InstanceType<typeof ProTable>>();

// 挂靠弹窗 ref
const bindDialogRef = ref<CoopBindDialogInstance>();

// 标题：选中节点显示节点名
const panelTitle = computed(() => (currentNode.value ? `「${currentNode.value.name}」下的协同岗` : '协同岗列表'));

// ProTable 列配置
const columns: ITableColumn[] = [
  { prop: 'name', label: '协同岗名称', minWidth: 140, showOverflowTooltip: true },
  { prop: 'orgName', label: '所属组织', minWidth: 140, showOverflowTooltip: true },
  { prop: 'relatedUserNames', label: '关联人员', minWidth: 140, showOverflowTooltip: true },
  { prop: 'operateTime', label: '操作时间', width: 160, align: 'center' },
  { prop: 'action', label: '操作', width: 150, align: 'center', slotName: 'action' },
];

// 非管理员：通过身份证查用户部门
async function getUserInfoByIdCard(): Promise<void> {
  try {
    const userRes = await queryUserByIdCard({ idCard: idCardNum });
    const userDepartments = userRes?.data?.userDepartments as
      Array<{ departmentId: string; departmentCode: string }> | undefined;
    if (userDepartments?.length) {
      departmentId.value = userDepartments[0].departmentId;
    }
  } catch {
    // 忽略错误
  }
}

// ===== ProTable fetchApi：根据搜索条件动态切换后端 API =====
/**
 * 统一的 fetchApi：根据是否有搜索条件切换接口
 * - 有 name/startTime/endTime 任一 → 走 getCoopLevelMembersBySearch
 * - 否则 → 走 getCoopLevelMembers(levelId, ...)
 * 参数结构由 ProTable 的 buildParams 构造：{ ...searchParams, pageNum, pageSize }
 */
async function fetchMembersApi(params: Record<string, unknown>): Promise<unknown> {
  const levelId = String(searchParams.levelId ?? '');
  const hasSearch = Boolean(searchParams.name || searchParams.startTime || searchParams.endTime);
  const pageNum = Number(params.pageNum ?? 1);
  const pageSize = Number(params.pageSize ?? 10);

  if (hasSearch) {
    return getCoopLevelMembersBySearch({
      pageNum,
      pageSize,
      orgId: departmentId.value,
      name: String(searchParams.name ?? ''),
      levelId,
      startTime: String(searchParams.startTime ?? ''),
      endTime: String(searchParams.endTime ?? ''),
    });
  }
  return getCoopLevelMembers(levelId, {
    pageNum,
    pageSize,
    orgId: departmentId.value,
  });
}

// ===== ProTable @response 回调 =====
function handleResponse(res: unknown): void {
  memberList.value = defaultTableFormatter.getRecords(res) as CoopLevelMember[];
  memberTotal.value = defaultTableFormatter.getTotal(res);
}

// 搜索（触发 ProTable.init：重置到第 1 页 + 用最新 searchParams）
function handleMemberSearch(): void {
  tableRef.value?.init();
}

function handleMemberSearchReset(): void {
  searchParams.name = '';
  searchParams.startTime = '';
  searchParams.endTime = '';
  tableRef.value?.init();
}

// 节点点击：清空搜索条件 + init
function handleNodeClick(data: CoopTreeNode): void {
  currentNode.value = data as CoopLevelNode;
  // 重置搜索条件
  searchParams.name = '';
  searchParams.startTime = '';
  searchParams.endTime = '';
  searchParams.levelId = data.id;
  // 切换节点后重置到第 1 页
  // 注意：currentNode 由 null → 有值 会触发 v-if 渲染 ProTable
  // 首次点击时 tableRef.value 还是 undefined（ProTable 尚未挂载），需 nextTick 等渲染完成
  nextTick(() => {
    tableRef.value?.init();
  });
}

// 节点删除：清空右侧表格
function handleNodeDeleted(): void {
  currentNode.value = null;
  memberList.value = [];
  memberTotal.value = 0;
  searchParams.levelId = '';
}

// 节点新增/编辑提交：CoopLevelTree 的依赖反转回调
async function handleNodeSubmit(
  type: 'create' | 'edit',
  name: string,
  parentData: CoopTreeNode | null,
  editData: CoopTreeNode | null,
): Promise<boolean> {
  try {
    if (type === 'create') {
      const parentId = parentData ? parentData.id : 0;
      const res = await createCoopLevel({ name, parentId });
      if (!res || res.code !== 0) {
        ElMessage.error(res?.msg ?? '创建失败，请重试');
        return false;
      }
      ElMessage.success('层级创建成功');
      return true;
    } else if (editData) {
      const res = await updateCoopLevel(editData.id, { name });
      if (!res || res.code !== 0) {
        ElMessage.error(res?.msg ?? '更新失败，请重试');
        return false;
      }
      ElMessage.success('层级更新成功');
      editData.name = name;
      // 同步更新当前选中节点显示
      if (currentNode.value && currentNode.value.id === editData.id) {
        currentNode.value = { ...currentNode.value, name };
      }
      return true;
    }
    return false;
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? '操作失败，请重试');
    return false;
  }
}

// 移除成员
async function handleUnbindMember(row: CoopLevelMember): Promise<void> {
  try {
    await ElMessageBox.confirm(`确定将「${row.name}」从当前层级移除？`, '移除确认', {
      type: 'warning',
      confirmButtonText: '确定移除',
      cancelButtonText: '取消',
    });
  } catch {
    return;
  }
  try {
    await deleteCoopLevelMembers([String(row.uid)]);
    ElMessage.success('移除成功');
    tableRef.value?.refresh();
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? '移除失败');
  }
}

/** 从 ProTable slot scope 中安全获取 CoopLevelMember */
function getRow(scope: any): CoopLevelMember {
  return (scope?.row as CoopLevelMember) ?? ({} as CoopLevelMember);
}

// 打开挂靠弹窗
function openBindDialog(): void {
  if (!currentNode.value) return;
  bindDialogRef.value?.open('bind', currentNode.value.id);
}

// 挂靠弹窗：获取协同岗列表（依赖反转）
async function bindFetchList(params: {
  pageNum: number;
  pageSize: number;
  postName?: string;
  selectionType?: string;
  selectionId?: string;
}): Promise<{ records: CollaborationItem[]; total: number | string }> {
  const res = await getCollaborationPage({
    type: 0,
    orgId: departmentId.value,
    postName: params.postName,
    // 层级管理场景固定使用 coopLevel
    selectionType: 'coopLevel',
    selectionId: params.selectionId,
    pageNum: params.pageNum,
    pageSize: params.pageSize,
  } as never);
  // 注意：getCollaborationPage 返回直接 {records, total} 结构（无 code/data 包装）
  // 用 defaultTableFormatter 兼容提取，避免 res.data 为 undefined 报错
  return {
    records: defaultTableFormatter.getRecords(res) as CollaborationItem[],
    total: defaultTableFormatter.getTotal(res),
  };
}

// 挂靠弹窗：提交（依赖反转）
async function bindSubmit(selected: CollaborationItem[]): Promise<boolean> {
  if (!currentNode.value) return false;
  try {
    const postIds = selected.map((r) => String(r.id));
    const res = await updateCoopLevelMembers(currentNode.value.id, postIds);
    if (!res || res.code !== 0) {
      ElMessage.error(res?.msg ?? '挂靠失败，请重试');
      return false;
    }
    return true;
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? '挂靠失败，请重试');
    return false;
  }
}

// 挂靠成功回调：刷新右侧表格
function handleBindSubmitted(): void {
  tableRef.value?.refresh();
}

onMounted(() => {
  getUserInfoByIdCard();
});
</script>

<template>
  <div class="col-level-manage">
    <!-- 左侧：层级树 -->
    <CoopLevelTree
      business-name="level"
      :fetch-children="getCoopLevelChildren"
      :create-node="createCoopLevel"
      :update-node="updateCoopLevel"
      :delete-node="deleteCoopLevel"
      :on-submit="handleNodeSubmit"
      @node-click="handleNodeClick"
      @node-deleted="handleNodeDeleted"
    />

    <!-- 分割线 -->
    <SplitDivider v-model="leftWidth" />

    <!-- 右侧：协同岗列表 -->
    <div class="level-content-panel">
      <div class="panel-header">
        <span class="panel-title">{{ panelTitle }}</span>
        <div class="panel-header__actions">
          <div class="search-wrap">
            <el-input
              v-model="searchParams.name as string"
              placeholder="搜索协同岗名称"
              clearable
              style="width: 160px; margin-right: 6px"
            />
            <el-date-picker
              v-model="searchParams.startTime as string"
              type="date"
              placeholder="开始时间"
              clearable
              style="width: 160px; margin-right: 6px"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
            />
            <el-date-picker
              v-model="searchParams.endTime as string"
              type="date"
              placeholder="结束时间"
              clearable
              style="width: 160px; margin-right: 10px"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
            />
            <el-button type="primary" :icon="Search" @click="handleMemberSearch">搜索</el-button>
            <el-button type="info" :icon="CircleClose" @click="handleMemberSearchReset"> 重置 </el-button>
          </div>
          <el-button v-if="currentNode" type="primary" :icon="Plus" @click="openBindDialog"> 挂靠协同岗 </el-button>
        </div>
      </div>

      <!-- 未选中层级占位 -->
      <div v-if="!currentNode" class="empty-placeholder">
        <el-empty description="请在左侧选择一个层级" />
      </div>

      <!-- 已选中层级 -->
      <template v-else>
        <div class="table-wrap">
          <ProTable
            ref="tableRef"
            :columns="columns"
            :fetch-api="fetchMembersApi"
            :data="memberList"
            :total="memberTotal"
            :search-params="searchParams"
            :page-sizes="[10, 20, 50]"
            :immediate="false"
            show-index
            index-label="序号"
            :index-width="100"
            row-key="id"
            @response="handleResponse"
          >
            <template #action="scope">
              <el-button type="danger" @click="handleUnbindMember(getRow(scope))"> 删除 </el-button>
            </template>
          </ProTable>
        </div>
      </template>
    </div>

    <!-- 挂靠协同岗弹窗 -->
    <CoopBindDialog
      ref="bindDialogRef"
      :fetch-list="bindFetchList"
      :submit="bindSubmit"
      @submitted="handleBindSubmitted"
    />
  </div>
</template>

<style lang="less" scoped>
.col-level-manage {
  display: flex;
  height: 100%;
  overflow: hidden;
  background: @color-bg-card;
  border-radius: @radius-md;
}

.level-content-panel {
  display: flex;
  flex-direction: column;
  background: @color-bg-card;
  overflow: hidden;
  flex: 1;
  min-width: 0;
  margin: @spacing-sm @spacing-sm @spacing-sm 0;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: @panel-header-height;
  padding: 0 14px;
  border-bottom: 1px solid @color-border-panel;
  flex-shrink: 0;
  background: @color-bg-card;

  &__actions {
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }
}

.panel-title {
  font-size: @font-size-md;
  font-weight: 600;
  color: @color-text-primary;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.search-wrap {
  display: flex;
  margin-right: 12px;
  align-items: center;
}

.empty-placeholder {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.table-wrap {
  flex: 1;
  overflow: hidden;
  padding: 0;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
</style>
