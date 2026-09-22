<script setup lang="ts">
/**
 * colManage.vue - 协同岗管理主页（tab 1）
 *
 * 使用 ProTable 远程模式（受控模式）：
 * - 父组件持有 list（受控），通过 @response 回调拿到完整响应后做字段映射
 * - ProTable 内部自动管理分页 + 竞态取消
 * - 搜索/重置通过 tableRef.init() 触发，删除后通过 tableRef.refresh() 保持当前页
 */
import { Edit, Delete, SwitchButton } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ref, reactive, computed } from 'vue';
import { useI18n } from 'vue-i18n';

import ColForm from './components/ColForm.vue';
import ColSearch from './components/ColSearch.vue';
import OffDutyDialog from './components/OffDutyDialog.vue';
import {
  getCollaborationPage,
  deleteCollaboration,
  delBatchCollaboration,
  getImSyncStatus,
  getOnDutyUsersByPostId,
  syncPostFromIm,
  type CollaborationItem,
} from '@/api/h5/collaboration';
import ActionButtons from '@/components/ActionButtons/index.vue';
import AuthImg from '@/components/AuthImg/index.vue';
import { defaultTableFormatter } from '@/components/ProTable/formatter';
import ProTable from '@/components/ProTable/index.vue';
import type { ITableColumn } from '@/components/ProTable/types';
import { pageLoadingUtils } from '@/utils/pageLoading';

defineOptions({ name: 'ColManage' });

const props = withDefaults(
  defineProps<{
    isAdmin?: boolean;
    orgId?: string;
    departmentCode?: string;
    departmentSyncSign?: boolean;
  }>(),
  {
    isAdmin: false,
    orgId: '',
    departmentCode: '',
    departmentSyncSign: false,
  },
);

const { t } = useI18n({ useScope: 'global' });

// ===== 受控模式状态 =====
// 父组件持有 list/total，通过 @response 回调更新（data 优先展示）
const list = ref<CollaborationItem[]>([]);
const total = ref(0);
// 搜索参数：响应式对象，init/refresh 时由 ProTable 内部读取最新值
const searchParams = reactive<Record<string, unknown>>({});
// 选中项 ID 数组
const multipleSelection = ref<string[]>([]);

// 同步 loading
const syncLoading = ref(false);
// 是否隐藏同步按钮（由 getImSyncStatus 返回控制）
const hiddenSync = ref(false);

// 下岗弹窗
const offDutyDialogVisible = ref(false);
const currentOffDutyPost = ref<CollaborationItem | null>(null);
// 行级 loading Map，key=postId
const listOffDutyLoadingMap = reactive<Record<string, boolean>>({});

// 是否有任何下岗按钮正在 loading
const isAnyOffDutyLoading = computed(() => Object.values(listOffDutyLoadingMap).some((v) => v));

// 组件 ref
const tableRef = ref<InstanceType<typeof ProTable>>();
const searchRef = ref<InstanceType<typeof ColSearch>>();
const formRef = ref<InstanceType<typeof ColForm>>();

// 列定义：13 列 + 操作列
const columns = computed<ITableColumn[]>(() => [
  { prop: 'postName', label: '协同岗名称', minWidth: 120, align: 'center', showOverflowTooltip: true },
  { prop: 'iconUrl', label: '图标', width: 80, align: 'center', slotName: 'iconUrl' },
  { prop: 'type', label: '协同岗类型', minWidth: 120, align: 'center', slotName: 'type' },
  { prop: 'ticketTypeNames', label: '警单类型', minWidth: 120, align: 'center', showOverflowTooltip: true },
  { prop: 'orgName', label: '所属组织', minWidth: 120, align: 'center', showOverflowTooltip: true },
  { prop: 'relatedUserNames', label: '关联人员', minWidth: 120, align: 'center', showOverflowTooltip: true },
  { prop: 'relatedUserIds', label: '关联人数', width: 80, align: 'center', slotName: 'relatedCount' },
  { prop: 'operatorName', label: '操作人员', minWidth: 100, align: 'center' },
  { prop: 'operationType', label: '操作类型', width: 80, align: 'center', slotName: 'operationType' },
  { prop: 'source', label: '数据来源', width: 100, align: 'center', slotName: 'source' },
  { prop: 'updateTime', label: '操作时间', minWidth: 160, align: 'center', sortable: true },
  {
    prop: 'actions',
    label: t('index.operations.operation'),
    fixed: 'right',
    width: 240,
    align: 'center',
    slotName: 'actions',
  },
]);

/** 获取关联人数 */
function getRelatedUserCount(ids: string | string[] | undefined): number {
  if (!ids) return 0;
  if (Array.isArray(ids)) return ids.length;
  return ids.split(',').length;
}

// ===== ProTable @response 回调：受控模式下父组件处理响应 =====
/**
 * 拿到 fetchApi 完整响应，做字段映射后赋值给 list/total
 */
function handleResponse(res: unknown): void {
  const records = defaultTableFormatter.getRecords(res) as CollaborationItem[];
  // policeTicketTypes 字段处理：拼接 tag 字符串，提取 id 数组
  records.forEach((item) => {
    const ticketTypes = (item.policeTicketTypes as Array<{ tag: string; id: string }>) ?? [];
    item.ticketTypeNames = ticketTypes.map((c) => c.tag).join(',');
    item.typeIds = ticketTypes.map((c) => c.id);
  });
  list.value = records;
  total.value = defaultTableFormatter.getTotal(res);
}

// ===== 搜索/重置/分页（由 ProTable 远程模式接管） =====
/**
 * 搜索：ColSearch emit('query', params) 时触发
 * 更新 searchParams + 调用 tableRef.init()（重置到第 1 页）
 */
function handleQuery(params: Record<string, unknown>): void {
  // 清空旧参数，写入新参数（保持响应式引用不变）
  Object.keys(searchParams).forEach((key) => delete searchParams[key]);
  Object.assign(searchParams, params);
  tableRef.value?.init();
}

/**
 * 重置：清空 searchParams + 调用 tableRef.init()
 */
function handleReset(): void {
  Object.keys(searchParams).forEach((key) => delete searchParams[key]);
  tableRef.value?.init();
}

/**
 * 选择变化
 */
function handleSelection(val: CollaborationItem[]): void {
  multipleSelection.value = val.map((item) => item.id);
}

/** 新增/修改：打开表单弹窗 */
function openForm(type: string, row?: CollaborationItem): void {
  formRef.value?.open(type as 'create' | 'update', row);
}

/** 删除：删除成功后调用 refresh() 保持当前页 */
function handleDelete(id: string): void {
  ElMessageBox.confirm(t('index.operations.affirmDeleted'), {
    confirmButtonText: t('determine'),
    cancelButtonText: t('cancel'),
    type: 'info',
  })
    .then(() => {
      deleteCollaboration(id)
        .then((result) => {
          if (result.code === 0) {
            ElMessage.success(t('index.statusTitle.successfullyDelete'));
            // 刷新当前页（保持分页位置）
            tableRef.value?.refresh();
          } else {
            ElMessage.error(result.msg || '');
          }
        })
        .catch(() => {});
    })
    .catch(() => {});
}

/** 批量删除 */
function delBatch(): void {
  if (multipleSelection.value.length === 0) {
    ElMessage.error('未勾选协同岗数据');
    return;
  }
  ElMessageBox.confirm('确定批量删除吗？', {
    confirmButtonText: t('determine'),
    cancelButtonText: t('cancel'),
    type: 'info',
  })
    .then(() => {
      delBatchCollaboration(multipleSelection.value)
        .then((result) => {
          if (result.code === 0) {
            ElMessage.success('批量删除成功');
          } else {
            ElMessage.error(result.msg || '');
          }
          // 刷新当前页
          tableRef.value?.refresh();
        })
        .catch(() => {});
    })
    .catch(() => {});
}

/** 下岗：getOnDutyUsersByPostId → 打开弹窗 */
async function handleOffDuty(row: CollaborationItem): Promise<void> {
  listOffDutyLoadingMap[row.id] = true;
  try {
    const res = await getOnDutyUsersByPostId(row.id);
    if (res.code === 0) {
      const users = (res as unknown as { data?: unknown[] })?.data ?? [];
      if (users.length === 0) {
        // 没人在岗：警告提示，不打开弹窗
        ElMessage.warning(t('index.collaboration.noOnDutyUserTip'));
      } else {
        // 有人：打开弹窗
        currentOffDutyPost.value = row;
        offDutyDialogVisible.value = true;
      }
    } else {
      ElMessage.error(res.msg || t('index.collaboration.queryOnDutyFailed'));
    }
  } catch {
    ElMessage.error(t('index.collaboration.queryOnDutyFailed'));
  } finally {
    listOffDutyLoadingMap[row.id] = false;
  }
}

// 下岗成功后刷新列表（保持当前页）
function handleOffDutySuccess(): void {
  tableRef.value?.refresh();
}

/** 查询同步状态 */
async function getImSyncStatusFunc(): Promise<void> {
  try {
    const { code, data } = await getImSyncStatus({});
    if (code === 0) {
      hiddenSync.value = !!data;
    }
  } catch {
    // 忽略错误
  }
}

/** 同步老的协同岗数据 */
async function syncPostFromImFunc(): Promise<void> {
  if (syncLoading.value) return; // 防止并发
  syncLoading.value = true;
  try {
    const { code } = await syncPostFromIm({});
    if (code === 0) {
      pageLoadingUtils.openPageLoading(() => {
        // 同步完成后刷新当前页
        tableRef.value?.refresh();
      });
      hiddenSync.value = true;
    }
  } finally {
    syncLoading.value = false;
  }
}

/** 从 ProTable slot scope 中安全获取 CollaborationItem */
function getRow(scope: any): CollaborationItem {
  return (scope?.row as CollaborationItem) ?? ({} as CollaborationItem);
}

// 初始化：getImSyncStatusFunc + ProTable immediate=true 自动发起首次请求
getImSyncStatusFunc();
</script>

<template>
  <div class="table-container">
    <!-- 搜索区 -->
    <ColSearch
      ref="searchRef"
      :is-main="true"
      :is-admin="props.isAdmin"
      :org-ids="props.orgId"
      :department-sync-sign="props.departmentSyncSign"
      :hidden-sync="hiddenSync"
      :sync-loading="syncLoading"
      @query="handleQuery"
      @reset="handleReset"
      @open="openForm"
      @sync="syncPostFromImFunc"
      @del-batch="delBatch"
    />

    <!--
      ProTable 远程模式（受控）：
      - :fetch-api 传入 getCollaborationPage，ProTable 内部自动管理请求/分页/竞态取消
      - :data="list" 受控展示（list 优先于 fetchApi 内部数据）
      - :search-params="searchParams" 供 ProTable 在 init/refresh 时读取最新查询条件
      - @response="handleResponse" 拿到完整响应后做字段映射，赋值给 list/total
      - immediate=true（默认）首次自动加载
    -->
    <ProTable
      ref="tableRef"
      :columns="columns"
      :fetch-api="getCollaborationPage"
      :data="list"
      :total="total"
      :search-params="searchParams"
      :show-selection="true"
      :immediate="true"
      @response="handleResponse"
      @selection-change="handleSelection"
    >
      <!-- 图标列：AuthImg 渲染 -->
      <template #iconUrl="scope">
        <AuthImg v-if="getRow(scope).iconUrl" :auth-src="getRow(scope).iconUrl as string" class="head-shot" />
      </template>

      <!-- 协同岗类型：1=人员核查协同岗 else 普通协同岗 -->
      <template #type="scope">
        <span>{{ getRow(scope).type === 1 ? '人员核查协同岗' : '普通协同岗' }}</span>
      </template>

      <!-- 关联人数 -->
      <template #relatedCount="scope">
        <span>{{ getRelatedUserCount(getRow(scope).relatedUserIds as string | string[] | undefined) }}</span>
      </template>

      <!-- 操作类型：1=创建 else 修改 -->
      <template #operationType="scope">
        <span>{{ getRow(scope).operationType === 1 ? '创建' : '修改' }}</span>
      </template>

      <!-- 数据来源：1=历史同步 else 新建数据 -->
      <template #source="scope">
        <span>{{ getRow(scope).source === 1 ? '历史同步' : '新建数据' }}</span>
      </template>

      <!-- 操作列：修改/删除/下岗 -->
      <template #actions="scope">
        <ActionButtons
          :buttons="[
            {
              type: 'primary',
              icon: Edit,
              label: t('index.operations.change'),
              onClick: () => openForm('update', getRow(scope)),
            },
            { type: 'danger', icon: Delete, label: t('delete'), onClick: () => handleDelete(getRow(scope).id) },
            {
              type: 'warning',
              icon: SwitchButton,
              label: t('index.collaboration.offDuty'),
              disabled: isAnyOffDutyLoading || offDutyDialogVisible || listOffDutyLoadingMap[getRow(scope).id],
              onClick: () => handleOffDuty(getRow(scope)),
            },
          ]"
        />
      </template>
    </ProTable>

    <!-- 新增/修改弹窗 -->
    <ColForm
      ref="formRef"
      :is-admin="props.isAdmin"
      :department-code="props.departmentCode"
      :department-sync-sign="props.departmentSyncSign"
      @success="tableRef?.refresh()"
    />

    <!-- 下岗弹窗 -->
    <OffDutyDialog
      v-model:visible="offDutyDialogVisible"
      :post-info="currentOffDutyPost"
      @success="handleOffDutySuccess"
    />
  </div>
</template>

<style lang="less" scoped>
.table-container {
  :deep(.head-shot) {
    width: @avatar-size;
    height: @avatar-size;
    border-radius: @radius-sm;
    object-fit: cover;
  }
}
</style>
