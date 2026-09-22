<script setup lang="ts">
/**
 * 虚拟用户管理
 *
 * 功能：
 * - 查询虚拟用户列表（按用户名称模糊搜索，后端返回数组非分页）
 * - 新增/编辑虚拟用户（含用户名、通讯号码、appId/appSecret、是否默认、备注）
 * - 删除虚拟用户（删除后绑定该账号的智能体将无法收发消息）
 */
import { Plus, Edit, Delete, Search, Refresh } from '@element-plus/icons-vue';
import dayjs from 'dayjs';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ref } from 'vue';

import EditVirtualUser from './EditVirtualUser.vue';
import { deleteVirtualUser, getVirtualUserList, type VirtualUserItem } from '@/api/policeExtend/virtualUser';
import ActionButtons from '@/components/ActionButtons/index.vue';

defineOptions({ name: 'VirtualUser' });

// 列表状态
const list = ref<VirtualUserItem[]>([]);
const listLoading = ref(false);
const searchForm = ref<{ userName: string }>({ userName: '' });

const editRef = ref<InstanceType<typeof EditVirtualUser>>();

/** 应用密钥脱敏：前4位 + **** + 后4位 */
function maskSecret(secret?: string): string {
  if (!secret) return '-';
  if (secret.length <= 8) return '********';
  return `${secret.slice(0, 4)}****${secret.slice(-4)}`;
}

/** 格式化创建时间 */
function formatTime(time?: string): string {
  if (!time) return '';
  return dayjs(time).format('YYYY-MM-DD HH:mm:ss');
}

/** 从 el-table slot scope 中安全获取 VirtualUserItem */
function getRow(scope: any): VirtualUserItem {
  return (scope?.row as VirtualUserItem) ?? ({} as VirtualUserItem);
}

// 查询列表
async function fetchData(): Promise<void> {
  listLoading.value = true;
  try {
    const res = await getVirtualUserList({ userName: searchForm.value.userName });
    list.value = (res?.data as VirtualUserItem[]) ?? [];
  } catch {
    // 忽略
  } finally {
    listLoading.value = false;
  }
}

// 搜索
function handleSearch(): void {
  fetchData();
}

// 重置
function handleReset(): void {
  searchForm.value.userName = '';
  fetchData();
}

// 新增
function handleAdd(): void {
  editRef.value?.init('add');
}

// 编辑
function handleEdit(row: VirtualUserItem): void {
  editRef.value?.init('edit', row);
}

// 删除
function handleDelete(row: VirtualUserItem): void {
  ElMessageBox.confirm('删除后该账号绑定的智能体将无法在群里收发消息！', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => deleteVirtualUser(row.id))
    .then((result) => {
      if (!result || result.code !== 0) {
        ElMessage.error(result?.msg || '删除失败');
        return;
      }
      ElMessage.success('删除成功');
      fetchData();
    })
    .catch(() => {});
}

// 弹窗状态
const dialogVisible = ref(false);

// 弹窗提交成功
function handleSuccess(): void {
  fetchData();
}

fetchData();
</script>

<template>
  <div class="app-container">
    <el-card shadow="always" class="card">
      <!-- 搜索区 -->
      <el-form :inline="true" class="search-form" @submit.prevent="handleSearch">
        <el-form-item label="用户名称">
          <el-input
            v-model="searchForm.userName"
            clearable
            placeholder="用户名称"
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
          <el-button type="primary" :icon="Plus" @click="handleAdd">新建</el-button>
        </el-form-item>
      </el-form>

      <el-table
        v-loading="listLoading"
        :data="list"
        border
        stripe
        fit
        row-key="id"
        highlight-current-row
        style="width: 100%"
      >
        <el-table-column type="index" label="序号" width="80" align="center" />
        <el-table-column prop="userName" label="用户名称" width="150" />
        <el-table-column prop="contactNumber" label="通讯号码" width="150" />
        <el-table-column prop="appId" label="应用ID" width="200" show-overflow-tooltip />
        <el-table-column label="应用密钥" width="200" show-overflow-tooltip>
          <template #default="scope">
            <span>{{ maskSecret(getRow(scope).appSecret) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="是否默认用户" width="120" align="center">
          <template #default="scope">
            <span>{{ getRow(scope).defaultUser ? '是' : '否' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" width="180" show-overflow-tooltip />
        <el-table-column label="创建时间" width="180" align="center">
          <template #default="scope">
            <span>{{ formatTime(getRow(scope).createdAt) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right" align="center">
          <template #default="scope">
            <ActionButtons
              :buttons="[
                { type: 'primary', icon: Edit, label: '编辑', onClick: () => handleEdit(getRow(scope)) },
                { type: 'danger', icon: Delete, label: '删除', onClick: () => handleDelete(getRow(scope)) },
              ]"
            />
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <EditVirtualUser ref="editRef" v-model:visible="dialogVisible" @success="handleSuccess" />
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
</style>
