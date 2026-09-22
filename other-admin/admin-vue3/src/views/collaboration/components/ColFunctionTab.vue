<script setup lang="ts">
/**
 * ColFunctionTab.vue - 职能管理 tab（左侧职能树 + 右侧协同岗列表）
 *
 * 使用 ProTable 受控模式（fetchApi + data + @response）：
 * - searchParams 包含 levelId + orgId，由 currentNode 切换时更新
 * - fetchApi 包装：根据 levelId 调用 getFunctionaldeptsMembers
 * - currentNode 为 null 时不发请求（ProTable 渲染空状态）
 * - 操作后刷新改为 tableRef.refresh()
 */
/* global localStorage */
import { Plus } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { computed, ref, reactive } from 'vue';

import CoopBindDialog, { type CoopBindDialogInstance } from './CoopBindDialog.vue';
import CoopLevelTree from './CoopLevelTree.vue';
import type { CoopTreeNode } from './CoopLevelTree.vue';
import SplitDivider from './SplitDivider.vue';
import {
  checkedFunctionaldeptsMembers,
  createFunctionaldepts,
  deleteFunctionaldepts,
  deleteFunctionaldeptsMembers,
  getFunctionaldeptsChildren,
  getFunctionaldeptsMembers,
  updateFunctionaldepts,
  updateFunctionaldeptsMembers,
} from '@/api/h5/colFunctionManage';
import type { FunctionalDeptMember, FunctionalDeptNode } from '@/api/h5/colFunctionManage';
import { getCollaborationPage } from '@/api/h5/collaboration';
import type { CollaborationItem } from '@/api/h5/collaboration';
import { defaultTableFormatter } from '@/components/ProTable/formatter';
import ProTable from '@/components/ProTable/index.vue';
import type { ITableColumn } from '@/components/ProTable/types';

defineOptions({ name: 'ColFunctionTab' });

interface Props {
  /** 组织 id（由父组件传入） */
  orgId: string;
  /** 是否管理员 */
  isAdmin?: boolean;
}

const props = defineProps<Props>();

const LEFT_DEFAULT = 260;
const leftWidth = ref(LEFT_DEFAULT);

const currentNode = ref<FunctionalDeptNode | null>(null);

// ===== 受控模式状态 =====
const memberList = ref<FunctionalDeptMember[]>([]);
const memberTotal = ref(0);
// 搜索参数：levelId + orgId（levelId 由 currentNode 切换时写入）
const searchParams = reactive<Record<string, unknown>>({
  levelId: '',
  orgId: props.orgId,
});

// 组件 ref
const tableRef = ref<InstanceType<typeof ProTable>>();

// 开关禁用（修改期间）
const isDisabled = ref(false);

// 挂靠弹窗
const bindDialogRef = ref<CoopBindDialogInstance>();

const panelTitle = computed(() => (currentNode.value ? `「${currentNode.value.name}」下的协同岗` : '协同岗列表'));

// ProTable 列配置
const columns: ITableColumn[] = [
  { prop: 'name', label: '协同岗名称', minWidth: 140, showOverflowTooltip: true },
  { prop: 'orgName', label: '所属组织', minWidth: 140, showOverflowTooltip: true },
  { prop: 'relatedUserNames', label: '关联人员', minWidth: 140, showOverflowTooltip: true },
  { prop: 'checked', label: '默认勾选', width: 140, align: 'center', slotName: 'checked' },
  { prop: 'operateTime', label: '操作时间', width: 160, align: 'center' },
  { prop: 'action', label: '操作', width: 150, align: 'center', slotName: 'action' },
];

// ===== fetchApi 包装：调用 getFunctionaldeptsMembers，需要 levelId + orgId + 分页 =====
async function fetchMembersApi(params: Record<string, unknown>): Promise<unknown> {
  const levelId = params.levelId as string;
  if (!levelId) {
    return { records: [], total: 0 };
  }
  // 调用 getFunctionaldeptsMembers，将 levelId 从 params 中剥离
  const { levelId: _levelId, orgId: _orgId, pageNum, pageSize, ...rest } = params;
  return getFunctionaldeptsMembers(levelId, {
    orgId: props.orgId,
    pageNum,
    pageSize,
    ...rest,
  } as never);
}

// ===== ProTable @response 回调 =====
function handleResponse(res: unknown): void {
  memberList.value = defaultTableFormatter.getRecords(res) as FunctionalDeptMember[];
  memberTotal.value = defaultTableFormatter.getTotal(res);
}

// 默认勾选切换
async function handleMemberCheckChange(row: FunctionalDeptMember): Promise<void> {
  if (!currentNode.value) return;
  const data = [
    {
      id: row.uid,
      checked: row.checked ?? 0,
      sort: 1,
      updater: localStorage.getItem('back_username') ?? '',
      postName: row.name,
      departmentName: currentNode.value.name,
    },
  ];
  try {
    isDisabled.value = true;
    const res = await checkedFunctionaldeptsMembers(data);
    if (res && res.code === 0) {
      ElMessage.success('修改成功');
      tableRef.value?.refresh();
    } else {
      ElMessage.error('修改失败');
    }
  } catch {
    ElMessage.error('修改失败');
  } finally {
    isDisabled.value = false;
  }
}

// 节点点击：更新 searchParams.levelId + 调用 tableRef.init()
function handleNodeClick(data: CoopTreeNode): void {
  currentNode.value = data as FunctionalDeptNode;
  searchParams.levelId = data.id;
  // 节点切换：重置到第 1 页 + 用最新 levelId 请求
  tableRef.value?.init();
}

// 节点删除：清空右侧
function handleNodeDeleted(): void {
  currentNode.value = null;
  searchParams.levelId = '';
  memberList.value = [];
  memberTotal.value = 0;
}

// 节点新增/编辑提交：CoopLevelTree 的依赖反转回调
async function handleNodeSubmit(
  type: 'create' | 'edit',
  name: string,
  parentData: CoopTreeNode | null,
  editData: CoopTreeNode | null,
): Promise<boolean> {
  try {
    const creator = localStorage.getItem('back_username') ?? '';
    if (type === 'create') {
      const parentId = parentData ? parentData.id : 0;
      const res = await createFunctionaldepts({ name, parentId, creator });
      if (!res || res.code !== 0) {
        ElMessage.error(res?.msg ?? '创建失败，请重试');
        return false;
      }
      ElMessage.success('职能创建成功');
      return true;
    } else if (editData) {
      const res = await updateFunctionaldepts(editData.id, { name });
      if (!res || res.code !== 0) {
        ElMessage.error(res?.msg ?? '更新失败，请重试');
        return false;
      }
      ElMessage.success('职能更新成功');
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
async function handleUnbindMember(row: FunctionalDeptMember): Promise<void> {
  if (!currentNode.value) return;
  try {
    await ElMessageBox.confirm(`确定将「${row.name}」从当前职能移除？`, '移除确认', {
      type: 'warning',
      confirmButtonText: '确定移除',
      cancelButtonText: '取消',
    });
  } catch {
    return;
  }
  try {
    await deleteFunctionaldeptsMembers([
      {
        id: row.uid,
        postName: row.name,
        departmentName: currentNode.value.name,
      },
    ]);
    ElMessage.success('移除成功');
    tableRef.value?.refresh();
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? '移除失败');
  }
}

// 打开挂靠弹窗
function openBindDialog(): void {
  if (!currentNode.value) return;
  bindDialogRef.value?.open('bind', currentNode.value.id);
}

// 挂靠弹窗：获取列表（依赖反转）
// 注意：selectionType 由本函数决定为 'functionalDepartment'（职能管理场景）
async function bindFetchList(params: {
  pageNum: number;
  pageSize: number;
  postName?: string;
  selectionType?: string;
  selectionId?: string;
}): Promise<{ records: CollaborationItem[]; total: number | string }> {
  const res = await getCollaborationPage({
    orgId: props.orgId,
    postName: params.postName,
    // 职能管理场景固定使用 functionalDepartment
    selectionType: 'functionalDepartment',
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

// 挂靠弹窗：提交
async function bindSubmit(selected: CollaborationItem[]): Promise<boolean> {
  if (!currentNode.value) return false;
  try {
    const creator = localStorage.getItem('back_username') ?? '';
    const updater = creator;
    const selecteds = selected.map((item) => ({
      userId: String(item.id),
      checked: 0,
      sort: 1,
      creator,
      updater,
    }));
    const res = await updateFunctionaldeptsMembers(currentNode.value.id, selecteds);
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

// 挂靠成功回调
async function handleBindSubmitted(): Promise<void> {
  tableRef.value?.refresh();
}

/** 从 ProTable slot scope 中安全获取 FunctionalDeptMember */
function getRow(scope: any): FunctionalDeptMember {
  return (scope?.row as FunctionalDeptMember) ?? ({} as FunctionalDeptMember);
}
</script>

<template>
  <div class="col-level-manage">
    <!-- 左侧：职能树 -->
    <CoopLevelTree
      business-name="function"
      :fetch-children="getFunctionaldeptsChildren"
      :create-node="createFunctionaldepts"
      :update-node="updateFunctionaldepts"
      :delete-node="deleteFunctionaldepts"
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
        <div v-if="currentNode" class="panel-header__actions">
          <el-button type="primary" :icon="Plus" @click="openBindDialog"> 挂靠协同岗 </el-button>
        </div>
      </div>

      <!-- 未选中职能占位 -->
      <div v-if="!currentNode" class="empty-placeholder">
        <el-empty description="请在左侧选择一个职能" />
      </div>

      <!-- 已选中职能 -->
      <template v-else>
        <div class="table-wrap">
          <!--
            ProTable 受控模式：
            - :fetch-api 包装 getFunctionaldeptsMembers，从 params 提取 levelId
            - :search-params 包含 levelId + orgId，节点切换时更新
            - immediate=false 避免未选中节点时发起请求；节点点击时手动 init()
          -->
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
            <template #checked="scope">
              <el-switch
                v-model="getRow(scope).checked"
                :disabled="isDisabled"
                inline-prompt
                :active-value="1"
                :inactive-value="0"
                active-text="是"
                inactive-text="否"
                @change="handleMemberCheckChange(getRow(scope))"
              />
            </template>
            <template #action="scope">
              <el-button type="danger" @click="handleUnbindMember(getRow(scope))"> 删除 </el-button>
            </template>
          </ProTable>
        </div>
      </template>
    </div>

    <!-- 挂靠弹窗 -->
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
