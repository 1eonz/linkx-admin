<script setup lang="ts">
import { Delete, Edit, Plus, View } from '@element-plus/icons-vue';
import type { FormInstance, FormRules } from 'element-plus';
import { ElMessage, ElMessageBox } from 'element-plus';
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue';

import type { NorthboundAppForm, NorthboundAppItem, NorthboundAppListQuery } from '@/api/resource/thirdApp';
import {
  collaborationDelete,
  northboundAppCreate,
  northboundAppList,
  northboundAppUpdate,
} from '@/api/resource/thirdApp';
import ActionButtons from '@/components/ActionButtons/index.vue';
import SearchBar from '@/components/SearchBar/index.vue';

defineOptions({ name: 'NorthboundInterfaceManagement' });

const query = reactive<NorthboundAppListQuery>({ pageNum: 1, pageSize: 10, systemName: '' });
const rows = ref<NorthboundAppItem[]>([]);
const total = ref(0);
const loading = ref(false);
const listRequestId = ref(0);
const formRef = ref<FormInstance>();
const editVisible = ref(false);
const detailVisible = ref(false);
const saving = ref(false);
const editing = ref(false);
const detailRow = ref<NorthboundAppItem | null>(null);

function defaultForm(): NorthboundAppForm {
  return {
    systemName: '',
    clientId: '',
    clientSecret: '',
    clientType: '',
    tokenTime: -1,
    refreshTokenTime: -1,
    status: 1,
    expired: '',
    remark: '',
  };
}

const form = reactive<NorthboundAppForm>(defaultForm());
const formRules: FormRules = {
  systemName: [
    { required: true, message: '请输入应用名称', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        callback(value === form.clientId ? new Error('应用名称不能与应用 ID 相同') : undefined);
      },
      trigger: 'blur',
    },
  ],
  clientId: [
    { required: true, message: '请输入应用 ID', trigger: 'blur' },
    { min: 8, message: '应用 ID 长度不能小于 8 位', trigger: 'blur' },
    { pattern: /^[a-zA-Z\d]+$/, message: '应用 ID 只能包含英文字母和数字', trigger: 'blur' },
  ],
  clientSecret: [
    { required: true, message: '请输入应用密钥', trigger: 'blur' },
    { min: 8, message: '应用密钥长度不能小于 8 位', trigger: 'blur' },
    { max: 16, message: '应用密钥长度不能超过 16 位', trigger: 'blur' },
  ],
  tokenTime: [
    { required: true, message: '请输入 Token 有效期', trigger: 'blur' },
    { pattern: /^-?\d+$/, message: 'Token 有效期必须为整数', trigger: 'blur' },
  ],
  refreshTokenTime: [
    { required: true, message: '请输入 RefreshToken 有效期', trigger: 'blur' },
    { pattern: /^-?\d+$/, message: 'RefreshToken 有效期必须为整数', trigger: 'blur' },
  ],
};

const searchActions = computed(() => [
  {
    label: '新增',
    type: 'primary' as const,
    icon: Plus,
    onClick: openCreate,
  },
]);

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

function isNorthboundAppItem(value: unknown): value is NorthboundAppItem {
  if (!value || typeof value !== 'object') return false;
  return (
    'id' in value &&
    typeof value.id === 'string' &&
    'systemName' in value &&
    typeof value.systemName === 'string' &&
    'clientId' in value &&
    typeof value.clientId === 'string' &&
    'clientSecret' in value &&
    typeof value.clientSecret === 'string' &&
    'tokenTime' in value &&
    (typeof value.tokenTime === 'number' || typeof value.tokenTime === 'string') &&
    'refreshTokenTime' in value &&
    (typeof value.refreshTokenTime === 'number' || typeof value.refreshTokenTime === 'string') &&
    'status' in value &&
    typeof value.status === 'number'
  );
}

function getNorthboundAppItem(value: unknown): NorthboundAppItem {
  if (!isNorthboundAppItem(value)) throw new Error('北向接入行数据格式错误');
  return value;
}

function loadList(): Promise<void> {
  const requestId = ++listRequestId.value;
  loading.value = true;
  return northboundAppList(query)
    .then((result) => {
      if (requestId !== listRequestId.value) return;
      if (result.code !== 0) throw new Error(result.msg || '读取北向接入列表失败');
      rows.value = result.data?.records ?? [];
      total.value = result.data?.total ?? 0;
    })
    .catch((error: unknown) => {
      if (requestId === listRequestId.value) ElMessage.error(getErrorMessage(error, '读取北向接入列表失败'));
    })
    .finally(() => {
      if (requestId === listRequestId.value) loading.value = false;
    });
}

function handleSearch(): void {
  query.pageNum = 1;
  void loadList();
}

function handleReset(): void {
  query.systemName = '';
  query.pageNum = 1;
  void loadList();
}

function handlePageSizeChange(): void {
  query.pageNum = 1;
  void loadList();
}

function openCreate(): void {
  editing.value = false;
  Object.assign(form, defaultForm());
  editVisible.value = true;
}

function openEdit(row: NorthboundAppItem): void {
  editing.value = true;
  Object.assign(form, defaultForm(), row);
  editVisible.value = true;
}

function openDetail(row: NorthboundAppItem): void {
  detailRow.value = row;
  detailVisible.value = true;
}

async function submitForm(): Promise<void> {
  if (saving.value || !formRef.value) return;
  try {
    await formRef.value.validate();
  } catch {
    return;
  }

  saving.value = true;
  const isEditing = editing.value;
  const request = isEditing ? northboundAppUpdate(form) : northboundAppCreate(form);
  return request
    .then((result) => {
      if (result.code !== 0) throw new Error(result.msg || '保存北向接入失败');
      ElMessage.success(isEditing ? '修改成功' : '新增成功');
      editVisible.value = false;
      return loadList();
    })
    .catch((error: unknown) => {
      ElMessage.error(getErrorMessage(error, '保存北向接入失败'));
    })
    .finally(() => {
      saving.value = false;
    });
}

async function deleteRow(row: NorthboundAppItem): Promise<void> {
  try {
    await ElMessageBox.confirm(`确认删除“${row.systemName}”吗？`, '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });
  } catch {
    return;
  }

  return collaborationDelete(row.id)
    .then((result) => {
      if (result.code !== 0) throw new Error(result.msg || '删除北向接入失败');
      ElMessage.success('删除成功');
      if (rows.value.length === 1 && query.pageNum > 1) query.pageNum -= 1;
      return loadList();
    })
    .catch((error: unknown) => {
      ElMessage.error(getErrorMessage(error, '删除北向接入失败'));
    });
}

function getRowIndex(index: number): number {
  return (query.pageNum - 1) * query.pageSize + index + 1;
}

onMounted(() => void loadList());
onBeforeUnmount(() => {
  listRequestId.value += 1;
});
</script>

<template>
  <section class="app-container northbound-page">
    <el-card shadow="never" class="northbound-card">
      <SearchBar :placeholder="'应用名称'" :actions="searchActions" @search="handleSearch" @reset="handleReset">
        <template #filters>
          <el-input
            v-model="query.systemName"
            class="name-filter"
            clearable
            placeholder="应用名称"
            @keyup.enter="handleSearch"
          />
        </template>
      </SearchBar>

      <div class="table-scroll">
        <el-table v-loading="loading" :data="rows" row-key="id" stripe border class="northbound-table">
          <el-table-column label="序号" width="66" align="center">
            <template #default="scope">{{ getRowIndex(scope.$index) }}</template>
          </el-table-column>
          <el-table-column prop="systemName" label="应用名称" min-width="170" show-overflow-tooltip />
          <el-table-column prop="clientId" label="应用 ID" min-width="180" show-overflow-tooltip />
          <el-table-column label="应用密钥" width="180" align="center">
            <template #default="scope">
              <el-input :model-value="scope.row.clientSecret" type="password" show-password disabled />
            </template>
          </el-table-column>
          <el-table-column label="状态" width="90" align="center">
            <template #default="scope">
              <el-tag :type="scope.row.status === 1 ? 'success' : 'info'">
                {{ scope.row.status === 1 ? '启用' : '停用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="expired" label="过期时间" min-width="165" show-overflow-tooltip />
          <el-table-column prop="grantTime" label="授权时间" min-width="165" show-overflow-tooltip />
          <el-table-column prop="grantUserName" label="授权人" min-width="115" show-overflow-tooltip />
          <el-table-column prop="gmtCreated" label="创建时间" min-width="165" show-overflow-tooltip />
          <el-table-column label="操作" fixed="right" width="220" align="center">
            <template #default="scope">
              <ActionButtons
                :buttons="[
                  {
                    type: 'primary',
                    icon: View,
                    label: '详情',
                    onClick: () => openDetail(getNorthboundAppItem(scope.row)),
                  },
                  {
                    type: 'primary',
                    icon: Edit,
                    label: '修改',
                    onClick: () => openEdit(getNorthboundAppItem(scope.row)),
                  },
                  {
                    type: 'danger',
                    icon: Delete,
                    label: '删除',
                    onClick: () => deleteRow(getNorthboundAppItem(scope.row)),
                  },
                ]"
              />
            </template>
          </el-table-column>
          <template #empty>
            <el-empty description="暂无北向接入应用" />
          </template>
        </el-table>
      </div>

      <el-pagination
        v-model:current-page="query.pageNum"
        v-model:page-size="query.pageSize"
        class="northbound-pagination"
        :page-sizes="[10, 20, 50]"
        :total="total"
        background
        layout="total, sizes, prev, pager, next, jumper"
        @current-change="loadList"
        @size-change="handlePageSizeChange"
      />
    </el-card>

    <el-dialog
      v-model="editVisible"
      :title="editing ? '修改北向接入' : '新增北向接入'"
      :close-on-click-modal="!saving"
      :close-on-press-escape="!saving"
      class="northbound-dialog"
      @closed="Object.assign(form, defaultForm())"
    >
      <el-form ref="formRef" :model="form" :rules="formRules" label-position="top">
        <el-form-item label="应用名称" prop="systemName">
          <el-input v-model="form.systemName" autocomplete="off" />
        </el-form-item>
        <el-form-item label="应用 ID" prop="clientId">
          <el-input v-model="form.clientId" autocomplete="off" />
        </el-form-item>
        <el-form-item label="应用密钥" prop="clientSecret">
          <el-input v-model="form.clientSecret" type="password" show-password autocomplete="new-password" />
        </el-form-item>
        <div class="form-grid">
          <el-form-item label="Token 有效期（小时）" prop="tokenTime">
            <el-input v-model="form.tokenTime" type="number" />
          </el-form-item>
          <el-form-item label="RefreshToken 有效期（天）" prop="refreshTokenTime">
            <el-input v-model="form.refreshTokenTime" type="number" />
          </el-form-item>
        </div>
        <el-form-item label="状态" prop="status">
          <el-switch
            v-model="form.status"
            active-text="启用"
            inactive-text="停用"
            :active-value="1"
            :inactive-value="0"
          />
        </el-form-item>
        <el-form-item label="过期时间" prop="expired">
          <el-date-picker
            v-model="form.expired"
            type="datetime"
            value-format="YYYY-MM-DD HH:mm:ss"
            placeholder="选择过期时间"
            class="full-width"
          />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" :rows="3" maxlength="255" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button :disabled="saving" @click="editVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailVisible" title="北向接入详情" class="northbound-dialog">
      <el-descriptions v-if="detailRow" :column="2" border>
        <el-descriptions-item label="应用名称">{{ detailRow.systemName }}</el-descriptions-item>
        <el-descriptions-item label="应用 ID">{{ detailRow.clientId }}</el-descriptions-item>
        <el-descriptions-item label="应用密钥">
          <el-input :model-value="detailRow.clientSecret" type="password" show-password readonly />
        </el-descriptions-item>
        <el-descriptions-item label="Token 有效期">{{ detailRow.tokenTime }} 小时</el-descriptions-item>
        <el-descriptions-item label="RefreshToken 有效期">{{ detailRow.refreshTokenTime }} 天</el-descriptions-item>
        <el-descriptions-item label="状态">{{ detailRow.status === 1 ? '启用' : '停用' }}</el-descriptions-item>
        <el-descriptions-item label="过期时间">{{ detailRow.expired || '-' }}</el-descriptions-item>
        <el-descriptions-item label="授权时间">{{ detailRow.grantTime || '-' }}</el-descriptions-item>
        <el-descriptions-item label="授权人">{{ detailRow.grantUserName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ detailRow.gmtCreated || '-' }}</el-descriptions-item>
        <el-descriptions-item label="修改时间">{{ detailRow.gmtModified || '-' }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ detailRow.remark || '-' }}</el-descriptions-item>
      </el-descriptions>
      <template #footer><el-button type="primary" @click="detailVisible = false">关闭</el-button></template>
    </el-dialog>
  </section>
</template>

<style lang="less" scoped>
.northbound-page,
.northbound-card {
  min-width: 0;
  height: 100%;
}

.table-scroll {
  max-width: 100%;
  overflow-x: auto;
}

.northbound-table {
  min-width: 1320px;
}

.name-filter {
  width: 220px;
  max-width: 100%;
}

.northbound-pagination {
  justify-content: flex-end;
  margin-top: 16px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.full-width {
  width: 100%;
}

@media (max-width: 640px) {
  .form-grid {
    grid-template-columns: minmax(0, 1fr);
    gap: 0;
  }

  .northbound-pagination {
    justify-content: flex-start;
    overflow-x: auto;
  }
}
</style>
