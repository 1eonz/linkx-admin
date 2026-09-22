<script setup lang="ts">
/**
 * ColDefaultCoopTab.vue - 默认协同岗 tab
 *
 * 使用 ProTable 受控模式（fetchApi + data + @response）：
 * - searchParams 包含 orgId，由 props 传入
 * - fetchApi 直接指向 pageDefaultCoop
 * - 操作后刷新改为 tableRef.refresh()
 * - defineExpose 暴露 refresh/init
 */
/* global localStorage */
import { Plus } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ref, reactive } from 'vue';

import CoopBindDialog, { type CoopBindDialogInstance } from './CoopBindDialog.vue';
import { creatDefaultCoop, deleteDefaultCoop, pageDefaultCoop } from '@/api/h5/colFunctionManage';
import type { DefaultCoopItem } from '@/api/h5/colFunctionManage';
import { getCollaborationPage } from '@/api/h5/collaboration';
import type { CollaborationItem } from '@/api/h5/collaboration';
import { defaultTableFormatter } from '@/components/ProTable/formatter';
import ProTable from '@/components/ProTable/index.vue';
import type { ITableColumn } from '@/components/ProTable/types';

defineOptions({ name: 'ColDefaultCoopTab' });

interface Props {
  /** 组织 id */
  orgId: string;
}

const props = defineProps<Props>();

// ===== 受控模式状态 =====
const list = ref<DefaultCoopItem[]>([]);
const total = ref(0);
const searchParams = reactive<Record<string, unknown>>({
  orgId: props.orgId,
});

// 组件 ref
const tableRef = ref<InstanceType<typeof ProTable>>();

// 弹窗
const bindDialogRef = ref<CoopBindDialogInstance>();

// 已有默认协同岗 id 列表（用于弹窗中标记 disabled）
const allDefaultList = ref<string[]>([]);
let defaultPageNum = 1;

// ProTable 列配置：少了"默认勾选"列
const columns: ITableColumn[] = [
  { prop: 'name', label: '协同岗名称', minWidth: 140, showOverflowTooltip: true },
  { prop: 'orgName', label: '所属组织', minWidth: 140, showOverflowTooltip: true },
  { prop: 'relatedUserNames', label: '关联人员', minWidth: 140, showOverflowTooltip: true },
  { prop: 'operateTime', label: '操作时间', width: 160, align: 'center' },
  { prop: 'action', label: '操作', width: 150, align: 'center', slotName: 'action' },
];

// ===== ProTable @response 回调 =====
function handleResponse(res: unknown): void {
  list.value = defaultTableFormatter.getRecords(res) as DefaultCoopItem[];
  total.value = defaultTableFormatter.getTotal(res);
}

/** 递归拉取所有已有默认协同岗（用于弹窗中标记 disabled） */
async function getAllFetchDefaultMembers(): Promise<void> {
  try {
    const res = await pageDefaultCoop({
      orgId: props.orgId,
      pageNum: defaultPageNum,
      pageSize: 100,
    });
    const data = res.data as { records?: DefaultCoopItem[]; total?: number | string } | DefaultCoopItem[];
    const records = Array.isArray(data) ? data : (data.records ?? []);
    const totalNum = Array.isArray(data) ? records.length : Number(data.total) || 0;
    const ids = records.map((item) => item.id);
    allDefaultList.value = [...allDefaultList.value, ...ids];
    if (allDefaultList.value.length < totalNum) {
      defaultPageNum++;
      await getAllFetchDefaultMembers();
    }
  } catch {
    ElMessage.error('加载默认协同岗列表失败');
  }
}

// 打开"设置默认协同岗"弹窗
function openBindDialog(): void {
  bindDialogRef.value?.open('default');
}

// 弹窗预加载：清空已有列表，递归拉取全部
async function handleBeforeOpenDefault(): Promise<void> {
  defaultPageNum = 1;
  allDefaultList.value = [];
  await getAllFetchDefaultMembers();
}

// 弹窗：获取列表（依赖反转）
// 注意：default 模式不传 selectionType / selectionId
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
    // default 模式不传 selectionType / selectionId
    selectionType: undefined,
    selectionId: undefined,
    pageNum: params.pageNum,
    pageSize: params.pageSize,
  } as never);
  // 注意：getCollaborationPage 返回直接 {records, total} 结构（无 code/data 包装）
  // 用 defaultTableFormatter 兼容提取，避免 res.data 为 undefined 报错
  const records = (defaultTableFormatter.getRecords(res) as CollaborationItem[]).map((item) => {
    // 已存在的默认协同岗标记 disabled
    if (allDefaultList.value.includes(item.id)) {
      return { ...item, disabled: true } as CollaborationItem;
    }
    return { ...item, disabled: false } as CollaborationItem;
  });
  return {
    records,
    total: defaultTableFormatter.getTotal(res),
  };
}

// 弹窗：提交
async function bindSubmit(selected: CollaborationItem[]): Promise<boolean> {
  try {
    const creator = localStorage.getItem('back_username') ?? '';
    const userIds = selected.map((item) => String(item.id));
    const res = await creatDefaultCoop({ creator, userIds });
    if (!res || res.code !== 0) {
      ElMessage.error(res?.msg ?? '设置失败，请重试');
      return false;
    }
    return true;
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? '设置失败，请重试');
    return false;
  }
}

// 提交成功回调
async function handleBindSubmitted(): Promise<void> {
  tableRef.value?.refresh();
}

// 删除默认协同岗
async function handleDelete(row: DefaultCoopItem): Promise<void> {
  try {
    await ElMessageBox.confirm(`确定将 ${row.name} 从默认协同岗中移除？`, '移除确认', {
      type: 'warning',
      confirmButtonText: '确定移除',
      cancelButtonText: '取消',
    });
  } catch {
    return;
  }
  try {
    const res = await deleteDefaultCoop(row.uid);
    if (res && res.code === 0) {
      ElMessage.success('移除成功');
      tableRef.value?.refresh();
    } else {
      ElMessage.error('移除失败');
    }
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? '移除失败');
  }
}

// 暴露方法给父组件：父组件调用 refresh()/init() 即可触发数据刷新
defineExpose({
  refresh: () => tableRef.value?.refresh(),
  init: () => tableRef.value?.init(),
});

/** 从 ProTable slot scope 中安全获取 DefaultCoopItem */
function getRow(scope: any): DefaultCoopItem {
  return (scope?.row as DefaultCoopItem) ?? ({} as DefaultCoopItem);
}
</script>

<template>
  <div class="level-content-panel">
    <div class="panel-header">
      <span class="panel-title">默认协同岗</span>
      <div class="panel-header__actions">
        <el-button type="primary" :icon="Plus" @click="openBindDialog"> 设置默认协同岗 </el-button>
      </div>
    </div>

    <div class="table-wrap">
      <!--
        ProTable 受控模式：
        - :fetch-api 直接传 pageDefaultCoop（参数结构完全匹配）
        - :search-params 包含 orgId
        - immediate=true（默认）首次自动加载
      -->
      <ProTable
        ref="tableRef"
        :columns="columns"
        :fetch-api="pageDefaultCoop"
        :data="list"
        :total="total"
        :search-params="searchParams"
        :page-sizes="[10, 20, 50]"
        show-index
        index-label="序号"
        :index-width="100"
        row-key="id"
        @response="handleResponse"
      >
        <template #action="scope">
          <el-button type="danger" @click="handleDelete(getRow(scope))"> 删除 </el-button>
        </template>
      </ProTable>
    </div>

    <!-- 设置默认协同岗弹窗 -->
    <CoopBindDialog
      ref="bindDialogRef"
      :fetch-list="bindFetchList"
      :submit="bindSubmit"
      :before-open-default="handleBeforeOpenDefault"
      @submitted="handleBindSubmitted"
    />
  </div>
</template>

<style lang="less" scoped>
.level-content-panel {
  display: flex;
  flex-direction: column;
  background: @color-bg-card;
  overflow: hidden;
  flex: 1;
  min-width: 0;
  margin: @spacing-sm @spacing-sm @spacing-sm 0;
  height: 100%;
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

.table-wrap {
  flex: 1;
  overflow: hidden;
  padding: 0;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
</style>
