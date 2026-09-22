<script setup lang="ts">
/**
 * baseData/thirdParty/index.vue - 三方应用管理
 */
import { Plus, View, Edit, Delete } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ref, reactive, computed, markRaw } from 'vue';
import { useI18n } from 'vue-i18n';

import ThirdPartyDetail from './components/thirdPartyDetail.vue';
import ThirdPartyEdit from './components/thirdPartyEdit.vue';
import { collaborationList, collaborationDelete, type ThirdAppItem } from '@/api/resource/thirdApp';
import ActionButtons from '@/components/ActionButtons/index.vue';
import { defaultTableFormatter } from '@/components/ProTable/formatter';
import ProTable from '@/components/ProTable/index.vue';
import type { ITableColumn } from '@/components/ProTable/types';
import SearchBar from '@/components/SearchBar/index.vue';

defineOptions({ name: 'ThirdParty' });

const { t } = useI18n({ useScope: 'global' });

// ===== 受控模式状态 =====
const list = ref<ThirdAppItem[]>([]);
const total = ref(0);
const searchParams = reactive<Record<string, unknown>>({
  clientName: '',
});

// 组件 ref
const tableRef = ref<InstanceType<typeof ProTable>>();

// 用于序号列计算（ProTable 内部 currentPage）
const currentPage = ref(1);
const currentLimit = ref(10);

// 列定义：序号/应用名称/应用ID/应用密钥/应用状态/操作列
const columns = computed<ITableColumn[]>(() => [
  { prop: 'index', label: t('index.list.Index'), width: 60, align: 'center', slotName: 'index' },
  {
    prop: 'clientName',
    label: t('index.list.thirdPartyApp'),
    minWidth: 100,
    align: 'center',
    showOverflowTooltip: true,
  },
  {
    prop: 'clientId',
    label: t('index.list.thirdPartyAppID'),
    minWidth: 100,
    align: 'center',
    showOverflowTooltip: true,
  },
  {
    prop: 'clientSecret',
    label: t('index.list.thirdPartyAppSecret'),
    minWidth: 100,
    align: 'center',
    slotName: 'clientSecret',
  },
  { prop: 'status', label: t('index.list.thirdPartyAppStatus'), minWidth: 60, align: 'center', slotName: 'status' },
  {
    prop: 'actions',
    label: t('index.operations.operation'),
    fixed: 'right',
    width: 280,
    align: 'center',
    slotName: 'actions',
  },
]);

// 搜索区按钮：仅新增
const actions = computed(() => [
  { label: t('index.operations.Added'), type: 'primary' as const, icon: markRaw(Plus), onClick: handleCreate },
]);

const searchPlaceholder = computed(() => t('index.list.thirdPartyApp'));

// 弹窗 ref
const thirdEditRef = ref<InstanceType<typeof ThirdPartyEdit>>();
const thirdDetailRef = ref<InstanceType<typeof ThirdPartyDetail>>();

// ===== ProTable @response 回调 =====
function handleResponse(res: unknown): void {
  list.value = defaultTableFormatter.getRecords(res) as ThirdAppItem[];
  total.value = defaultTableFormatter.getTotal(res);
}

// ===== ProTable @loading-change 监听内部分页 =====
function handleLoadingChange(_loading: boolean): void {
  // 通过 ProTable ref 读取内部当前页码/条数，用于序号列计算
  // 注意：ProTable expose 没有直接暴露 page/limit，使用 v-model:page/limit 替代方案
}

// ===== 搜索/重置 =====
function handleSearch(): void {
  tableRef.value?.init();
}

function handleReset(): void {
  searchParams.clientName = '';
  tableRef.value?.init();
}

// 新增
function handleCreate(): void {
  thirdEditRef.value?.init();
}

// 修改
function handleUpdate(row: ThirdAppItem): void {
  thirdEditRef.value?.init(row);
}

// 详情
function handleView(row: ThirdAppItem): void {
  thirdDetailRef.value?.init(row);
}

// 删除
function handleDelete(row: ThirdAppItem): void {
  ElMessageBox.confirm(t('index.operations.affirmDeleted'), {
    confirmButtonText: t('determine'),
    cancelButtonText: t('cancel'),
    type: 'info',
  })
    .then(() => {
      collaborationDelete(row.id)
        .then((result) => {
          if (result.code === 0) {
            ElMessage.success(t('index.statusTitle.successfullyDelete'));
          } else {
            ElMessage.error(result.msg || '');
          }
          tableRef.value?.refresh();
        })
        .catch(() => {});
    })
    .catch(() => {});
}

/** 从 ProTable slot scope 中安全获取 ThirdAppItem */
function getRow(scope: any): ThirdAppItem {
  return (scope?.row as ThirdAppItem) ?? ({} as ThirdAppItem);
}

// 序号列计算：scope.$index 是当前页内索引（0-based），需要 +1
function getIndex(scope: any): number {
  return scope.$index + 1;
}
</script>

<template>
  <div class="app-container">
    <el-card shadow="always" class="card">
      <!-- 复用 SearchBar -->
      <SearchBar :placeholder="searchPlaceholder" :actions="actions" @search="handleSearch" @reset="handleReset">
        <template #filters>
          <el-input
            v-model="searchParams.clientName as string"
            :placeholder="t('index.list.thirdPartyApp')"
            class="filter-item"
            style="width: 200px"
            clearable
            @keyup.enter="handleSearch"
          />
        </template>
      </SearchBar>

      <ProTable
        ref="tableRef"
        :columns="columns"
        :fetch-api="collaborationList"
        :data="list"
        :total="total"
        :search-params="searchParams"
        @response="handleResponse"
        @loading-change="handleLoadingChange"
      >
        <!-- 序号列：从 1 开始自增 -->
        <template #index="scope">
          <span>{{ getIndex(scope) }}</span>
        </template>

        <!-- 应用密钥列：password + show-password + disabled -->
        <template #clientSecret="scope">
          <el-input :model-value="getRow(scope).clientSecret" type="password" show-password disabled />
        </template>

        <!-- 状态列：0→danger 红色「停用」，1→默认色「启用」 -->
        <template #status="scope">
          <el-tag :type="getRow(scope).status === 1 ? 'info' : 'danger'">
            {{ getRow(scope).status === 1 ? t('index.list.AppOpen') : t('index.list.AppClose') }}
          </el-tag>
        </template>

        <!-- 操作列：详情/修改/删除 -->
        <template #actions="scope">
          <ActionButtons
            :buttons="[
              {
                type: 'primary',
                icon: View,
                label: t('index.operations.particulars'),
                onClick: () => handleView(getRow(scope)),
              },
              {
                type: 'primary',
                icon: Edit,
                label: t('index.operations.change'),
                onClick: () => handleUpdate(getRow(scope)),
              },
              { type: 'danger', icon: Delete, label: t('delete'), onClick: () => handleDelete(getRow(scope)) },
            ]"
          />
        </template>
      </ProTable>
    </el-card>

    <ThirdPartyEdit ref="thirdEditRef" @success="tableRef?.refresh()" />
    <ThirdPartyDetail ref="thirdDetailRef" />
  </div>
</template>

<style lang="less" scoped>
.card {
  height: 100%;
  overflow-y: auto;
}

.filter-item {
  display: inline-block;
  vertical-align: middle;
}
</style>
