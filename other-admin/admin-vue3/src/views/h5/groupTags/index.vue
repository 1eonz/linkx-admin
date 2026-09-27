<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus';
import { LxIcon } from 'lx-ui';
import { onMounted, reactive, ref } from 'vue';

import GroupTagsForm from './GroupTagsForm.vue';
import { getGroupTagIcon } from './iconMap';
import { deleteGroupTag, deleteGroupTags, getGroupTagPage, type GroupTag } from '@/api/h5/groupTags';
import Pagination from '@/components/Pagination/index.vue';

defineOptions({ name: 'GroupTags' });

const formRef = ref<InstanceType<typeof GroupTagsForm>>();
const list = ref<GroupTag[]>([]);
const selected = ref<GroupTag[]>([]);
const loading = ref(false);
const total = ref(0);
const listError = ref('');
const query = reactive({ pageNum: 1, pageSize: 10, name: '' });

function fetchList(): Promise<void> {
  loading.value = true;
  listError.value = '';
  return getGroupTagPage(query)
    .then((response) => {
      if (response.code !== 0) {
        listError.value = response.msg || '查询失败，请重试';
        return;
      }
      list.value = response.data?.records ?? [];
      total.value = response.data?.total ?? 0;
    })
    .catch(() => {
      listError.value = '查询失败，请检查网络后重试';
    })
    .finally(() => {
      loading.value = false;
    });
}

function handleSearch(): void {
  query.pageNum = 1;
  void fetchList();
}

function handleReset(): void {
  query.name = '';
  handleSearch();
}

function handleSelectionChange(rows: GroupTag[]): void {
  selected.value = rows;
}

function openCreate(): void {
  formRef.value?.open('create');
}

function isGroupTag(row: unknown): row is GroupTag {
  return Boolean(row && typeof row === 'object' && 'id' in row && 'name' in row && 'icon' in row && 'color' in row);
}

function openUpdate(row: unknown): void {
  if (!isGroupTag(row)) return;
  formRef.value?.open('update', row.id);
}

function remove(ids: Array<string | number>): Promise<void> {
  const request = ids.length === 1 ? deleteGroupTag(ids[0]) : deleteGroupTags(ids);
  return request
    .then((response) => {
      if (response.code !== 0) {
        ElMessage.error(response.msg || '删除失败，请重试');
        return;
      }
      ElMessage.success('删除成功');
      selected.value = [];
      return fetchList();
    })
    .catch(() => {
      ElMessage.error('删除失败，请检查网络后重试');
    });
}

function confirmDelete(row: unknown): void {
  if (!isGroupTag(row)) return;
  ElMessageBox.confirm(`确定删除标签「${row.name}」？删除后将无法恢复。`, '删除确认', {
    confirmButtonText: '确定删除',
    cancelButtonText: '取消',
    type: 'warning',
    confirmButtonClass: 'el-button--danger',
  })
    .then(() => remove([row.id]))
    .catch(() => undefined);
}

function confirmBatchDelete(): void {
  if (selected.value.length === 0) {
    ElMessage.warning('请先选择要删除的标签');
    return;
  }
  ElMessageBox.confirm('确定要删除选中的标签吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
    confirmButtonClass: 'el-button--danger',
  })
    .then(() => remove(selected.value.map((row) => row.id)))
    .catch(() => undefined);
}

onMounted(fetchList);
</script>

<template>
  <div class="app-container group-tags-page">
    <el-form :model="query" inline @submit.prevent="handleSearch">
      <el-form-item label="标签名称" prop="name">
        <el-input v-model="query.name" clearable placeholder="标签名称" @keyup.enter="handleSearch" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="handleReset">重置</el-button>
        <el-button type="primary" @click="openCreate"><LxIcon name="plus" :size="16" />新增</el-button>
        <el-button type="danger" @click="confirmBatchDelete"><LxIcon name="delete" :size="16" />批量删除</el-button>
      </el-form-item>
    </el-form>

    <el-alert v-if="listError" type="error" :closable="false" show-icon class="list-error">
      <template #default>
        <span>{{ listError }}</span>
        <el-button type="danger" link @click="fetchList">重试</el-button>
      </template>
    </el-alert>

    <el-card>
      <div class="group-tags-table-scroll" role="region" tabindex="0" aria-label="标签列表，可横向滚动查看全部列">
        <el-table v-loading="loading" :data="list" stripe @selection-change="handleSelectionChange">
          <el-table-column type="selection" width="55" />
          <el-table-column label="序号" type="index" width="80" align="center" />
          <el-table-column label="图标" prop="icon" width="100" align="center">
            <template #default="{ row }">
              <LxIcon :name="getGroupTagIcon(row.icon)" :size="20" :style="{ color: row.color }" />
            </template>
          </el-table-column>
          <el-table-column label="标签名称" prop="name" show-overflow-tooltip />
          <el-table-column label="操作" width="180" align="center">
            <template #default="{ row }">
              <el-button type="primary" link @click="openUpdate(row)">
                <LxIcon name="edit" :size="14" />编辑
              </el-button>
              <el-button type="danger" link @click="confirmDelete(row)">
                <LxIcon name="delete" :size="14" />删除
              </el-button>
            </template>
          </el-table-column>
          <template #empty><el-empty description="暂无标签数据" /></template>
        </el-table>
      </div>
      <Pagination
        v-model:page="query.pageNum"
        v-model:limit="query.pageSize"
        :total="total"
        :hidden="total === 0"
        @pagination="fetchList"
      />
    </el-card>

    <GroupTagsForm ref="formRef" @success="fetchList" />
  </div>
</template>

<style lang="less" scoped>
.group-tags-page {
  min-width: 0;
}

.group-tags-table-scroll {
  max-width: 100%;
  overflow-x: auto;
  scrollbar-width: thin;

  &:focus-visible {
    outline: 2px solid var(--el-color-primary);
    outline-offset: 2px;
  }

  :deep(.el-table) {
    min-width: 640px;
  }
}

.list-error {
  margin-bottom: 12px;
}
</style>
