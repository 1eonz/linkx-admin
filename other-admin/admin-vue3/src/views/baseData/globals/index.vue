<script setup lang="ts">
import { Plus, Edit, Delete, MagicStick } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';

import GlobalsConfig from './components/globalsConfig.vue';
import { getGlobalsList, deleteGlobals, updateGlobals, type GlobalsItem } from '@/api/dictionary/globals';
import ActionButtons from '@/components/ActionButtons/index.vue';
import ProTable from '@/components/ProTable/index.vue';
import type { ITableColumn } from '@/components/ProTable/types';
import { hasBtnPermission } from '@/composables/usePermission';

defineOptions({ name: 'Globals' });

// useScope: 'global' 确保使用全局 messages（避免找不到 key 显示原始 key）
const { t } = useI18n({ useScope: 'global' });

// 列表状态
const list = ref<GlobalsItem[]>([]);
const listLoading = ref(false);

// 列定义
const columns = computed<ITableColumn[]>(() => [
  {
    prop: 'remarkEn',
    label: t('index.list.ConfigurationItem'),
    minWidth: 100,
    align: 'center',
    showOverflowTooltip: true,
  },
  {
    prop: 'name',
    label: t('index.list.ConfigurationParameters'),
    minWidth: 120,
    align: 'center',
    showOverflowTooltip: true,
  },
  {
    prop: 'value',
    label: t('index.operations.configurationValue'),
    minWidth: 120,
    align: 'center',
    showOverflowTooltip: true,
  },
  { prop: 'remark', label: t('index.list.remarks'), minWidth: 100, align: 'center', showOverflowTooltip: true },
  { prop: 'status', label: t('index.list.condition'), minWidth: 60, align: 'center', slotName: 'status' },
  {
    prop: 'actions',
    label: t('index.operations.operation'),
    fixed: 'right',
    width: 200,
    align: 'center',
    slotName: 'actions',
  },
]);

// 权限
const canCreate = computed(() => hasBtnPermission('/admin/globals/create'));
const canUpdate = computed(() => hasBtnPermission('/admin/globals/update'));
const canDelete = computed(() => hasBtnPermission('/admin/globals/delete'));

// 弹窗 ref
const configRef = ref<InstanceType<typeof GlobalsConfig>>();

// 列表中不展示的配置项
const BLACK_LIST = [
  'H5URL',
  'SHOW_331_FEATURE',
  'ICP_SDKSERVER_WS_URI',
  'ICP_ACCOUNT',
  'ICP_PASSWORD',
  'ICP_SDKSERVER_HTTP_HOST',
  'title',
  'FILE_STORAGE_IM',
  'GUANGTIE_430_FEATURE_SWITCH',
  'DBPATH',
  'AI_SEPARATED_DEPLOY',
  'GROUP_AI_FRONTEND_HOST',
];

// 获取列表
function getList(): void {
  listLoading.value = true;
  getGlobalsList()
    .then(({ data }) => {
      list.value = (data as GlobalsItem[])?.filter((item) => !BLACK_LIST.includes(item.name)) ?? [];
    })
    .catch(() => {})
    .finally(() => {
      listLoading.value = false;
    });
}

// 新增
function handleCreate(): void {
  configRef.value?.open();
}

// 修改
function handleUpdate(row: GlobalsItem): void {
  configRef.value?.open(row);
}

// 删除
function handleDelete(row: GlobalsItem): void {
  ElMessageBox.confirm(t('index.operations.affirmDeleted'), {
    confirmButtonText: t('determine'),
    cancelButtonText: t('cancel'),
    type: 'info',
  })
    .then(() => {
      deleteGlobals(row.id)
        .then((result) => {
          if (result.data === 'success') {
            ElMessage.success(result.msg || '');
          } else {
            ElMessage.error(result.msg || '');
          }
          getList();
        })
        .catch(() => {});
    })
    .catch(() => {});
}

// 恢复
function resuming(row: GlobalsItem): void {
  const params = { ...row, status: 0 };
  updateGlobals(params)
    .then((result) => {
      if (result.code === 0) {
        getList();
      } else {
        ElMessage.error(t('index.statusTitle.enabledSucceed'));
      }
    })
    .catch(() => {});
}

/** 从 ProTable slot scope 中安全获取 GlobalsItem */

function getRow(scope: any): GlobalsItem {
  return (scope?.row as GlobalsItem) ?? ({} as GlobalsItem);
}

onMounted(getList);
</script>

<template>
  <div class="app-container">
    <el-card shadow="always" class="card">
      <!-- 顶部「新增」按钮 -->
      <div class="actions-bar">
        <el-button v-if="canCreate" type="primary" :icon="Plus" @click="handleCreate">
          {{ t('index.operations.Added') }}
        </el-button>
      </div>

      <ProTable :columns="columns" :data="list" :loading="listLoading" :show-pagination="false">
        <!-- 状态列：el-tag success/danger -->
        <template #status="scope">
          <el-tag :type="getRow(scope).status === 0 ? 'success' : 'danger'">
            {{ getRow(scope).status === 0 ? t('index.list.normal') : t('index.list.forbidden') }}
          </el-tag>
        </template>

        <!-- 操作列：编辑/删除/恢复 三态 -->
        <template #actions="scope">
          <ActionButtons
            :buttons="[
              {
                type: 'primary',
                icon: Edit,
                label: t('index.operations.redact'),
                visible: canUpdate,
                onClick: () => handleUpdate(getRow(scope)),
              },
              {
                type: 'danger',
                icon: Delete,
                label: t('delete'),
                visible: getRow(scope).status === 0 && canDelete,
                onClick: () => handleDelete(getRow(scope)),
              },
              {
                type: 'warning',
                icon: MagicStick,
                label: t('index.operations.restore'),
                visible: getRow(scope).status !== 0 && canUpdate,
                onClick: () => resuming(getRow(scope)),
              },
            ]"
          />
        </template>
      </ProTable>
    </el-card>

    <GlobalsConfig ref="configRef" @refresh="getList" />
  </div>
</template>

<style lang="less" scoped>
.card {
  height: 100%;
  overflow-y: auto;
}

.actions-bar {
  padding-bottom: @spacing-md;
}
</style>
