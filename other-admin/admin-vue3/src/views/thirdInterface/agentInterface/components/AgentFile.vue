<script setup lang="ts">
/**
 * AgentFile - AI 智能体文件接口列表
 *
 * 功能：
 * - el-table 无分页（后端返回完整数组）
 * - 新增/编辑/删除（行内操作）
 * - 字段：name/method/ip/port/uri/header/query/body/reponseFileFiled/desc
 */
import { Plus, Edit, Delete, Search, Refresh } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import { computed, onMounted, reactive, ref } from 'vue';

import {
  createAgentFile,
  deleteAgentFile,
  getAgentFileList,
  updateAgentFile,
  type AgentFileItem,
  type HttpMethod,
} from '@/api/thirdInterface/agentInterface';
import ActionButtons from '@/components/ActionButtons/index.vue';

defineOptions({ name: 'AgentFile' });

// ===== 列表状态 =====
const list = ref<AgentFileItem[]>([]);
const listLoading = ref(false);
const searchForm = ref<{ name: string }>({ name: '' });

// ===== 弹窗 =====
const dialogVisible = ref(false);
const dialogLoading = ref(false);
const dialogType = ref<'add' | 'edit'>('add');
const formRef = ref<FormInstance>();

const baseForm = (): Partial<AgentFileItem> => ({
  name: '',
  method: 'GET',
  ip: '',
  port: 80,
  uri: '',
  header: '',
  query: '',
  body: '',
  reponseFileFiled: '',
  desc: '',
});

const form = reactive<Partial<AgentFileItem>>(baseForm());

const httpMethodOptions: HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE'];

const dialogTitle = computed(() => (dialogType.value === 'add' ? '新增文件接口' : '编辑文件接口'));

const rules: FormRules = {
  name: [{ required: true, message: '请输入接口名称', trigger: 'blur' }],
  method: [{ required: true, message: '请选择 HTTP 方法', trigger: 'change' }],
  ip: [
    {
      required: true,
      validator: (_rule, value, callback) => {
        if (!value) {
          callback(new Error('请输入 IP'));
          return;
        }
        const reg = /^((25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(25[0-5]|2[0-4]\d|1?\d?\d)$/;
        if (!reg.test(value)) {
          callback(new Error('IP 格式不正确'));
          return;
        }
        callback();
      },
      trigger: 'blur',
    },
  ],
  port: [{ required: true, message: '请输入端口', trigger: 'blur' }],
  uri: [{ required: true, message: '请输入 URI', trigger: 'blur' }],
};

// ===== 工具函数 =====
function getRow(scope: any): AgentFileItem {
  return (scope?.row as AgentFileItem) ?? ({} as AgentFileItem);
}

// ===== 加载列表 =====
async function fetchData(): Promise<void> {
  listLoading.value = true;
  try {
    const res = await getAgentFileList();
    if (res?.code === 0) {
      list.value = (res?.data as AgentFileItem[]) ?? [];
    } else {
      ElMessage.error(res?.msg ?? '加载失败');
    }
  } catch (e) {
    console.error(e);
  } finally {
    listLoading.value = false;
  }
}

function handleSearch(): void {
  fetchData();
}

function handleReset(): void {
  searchForm.value.name = '';
  fetchData();
}

// ===== 新增/编辑 =====
function handleCreate(): void {
  dialogType.value = 'add';
  Object.assign(form, baseForm());
  dialogVisible.value = true;
}

function handleEdit(row: AgentFileItem): void {
  dialogType.value = 'edit';
  Object.assign(form, baseForm(), row);
  dialogVisible.value = true;
}

async function submitForm(): Promise<void> {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  dialogLoading.value = true;
  try {
    const isCreate = dialogType.value === 'add';
    const result = isCreate ? await createAgentFile(form) : await updateAgentFile(form);
    if (!result || result.code !== 0) {
      ElMessage.error(result?.msg ?? `${isCreate ? '新增' : '编辑'}失败`);
      return;
    }
    ElMessage.success(`${isCreate ? '添加' : '编辑'}成功`);
    dialogVisible.value = false;
    fetchData();
  } finally {
    dialogLoading.value = false;
  }
}

// ===== 删除 =====
function handleDelete(row: AgentFileItem): void {
  ElMessageBox.confirm(`确定删除文件接口「${row.name}」？`, '删除确认', {
    confirmButtonText: '确定删除',
    cancelButtonText: '取消',
    type: 'warning',
    confirmButtonClass: 'el-button--danger',
  })
    .then(async () => {
      try {
        const res = await deleteAgentFile(row.id);
        if (!res || res.code !== 0) {
          ElMessage.error(res?.msg ?? '删除失败');
          return;
        }
        ElMessage.success('删除成功');
        fetchData();
      } catch (e) {
        ElMessage.error((e as Error)?.message ?? '删除失败');
      }
    })
    .catch(() => {});
}

onMounted(() => {
  fetchData();
});
</script>

<template>
  <div class="agent-file">
    <el-form :inline="true" class="search-form" @submit.prevent="handleSearch">
      <el-form-item label="接口名称">
        <el-input
          v-model="searchForm.name"
          clearable
          placeholder="接口名称"
          style="width: 200px"
          @keyup.enter="handleSearch"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
        <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        <el-button type="primary" :icon="Plus" @click="handleCreate">新增</el-button>
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
      <el-table-column type="index" label="序号" width="60" align="center" />
      <el-table-column prop="name" label="名称" min-width="140" show-overflow-tooltip />
      <el-table-column prop="method" label="请求方式" width="100" align="center">
        <template #default="scope">
          <el-tag :type="getRow(scope).method === 'GET' ? 'info' : 'warning'">
            {{ getRow(scope).method }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="ip" label="IP" min-width="120" show-overflow-tooltip />
      <el-table-column prop="port" label="端口" width="90" align="center" />
      <el-table-column prop="uri" label="路径" min-width="140" show-overflow-tooltip />
      <el-table-column prop="header" label="Header参数" min-width="150" align="center" show-overflow-tooltip />
      <el-table-column prop="query" label="Query参数" min-width="150" align="center" show-overflow-tooltip />
      <el-table-column prop="body" label="Body参数" min-width="150" align="center" show-overflow-tooltip />
      <el-table-column prop="reponseFileFiled" label="文件标识字段" min-width="120" show-overflow-tooltip />
      <el-table-column prop="desc" label="描述" min-width="160" show-overflow-tooltip />
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

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="640px"
      align-center
      append-to-body
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
        <el-form-item label="接口名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入接口名称" />
        </el-form-item>
        <el-form-item label="HTTP 方法" prop="method">
          <el-select v-model="form.method" placeholder="请选择" style="width: 100%">
            <el-option v-for="m in httpMethodOptions" :key="m" :label="m" :value="m" />
          </el-select>
        </el-form-item>
        <el-row :gutter="12">
          <el-col :span="14">
            <el-form-item label="IP 地址" prop="ip">
              <el-input v-model="form.ip" placeholder="如 192.168.1.100" />
            </el-form-item>
          </el-col>
          <el-col :span="10">
            <el-form-item label="端口" prop="port">
              <el-input-number
                v-model="form.port"
                :min="1"
                :max="65535"
                controls-position="right"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="URI 路径" prop="uri">
          <el-input v-model="form.uri" placeholder="如 /api/file/upload" />
        </el-form-item>
        <el-form-item label="请求头（JSON）">
          <el-input
            v-model="form.header"
            type="textarea"
            :rows="2"
            placeholder='如 {"Content-Type": "application/json"}'
          />
        </el-form-item>
        <el-form-item label="查询参数（JSON）">
          <el-input v-model="form.query" type="textarea" :rows="2" placeholder='如 {"key": "value"}' />
        </el-form-item>
        <el-form-item label="请求体（JSON）">
          <el-input v-model="form.body" type="textarea" :rows="2" placeholder='如 {"file": "test.txt"}' />
        </el-form-item>
        <el-form-item label="响应文件字段">
          <el-input v-model="form.reponseFileFiled" placeholder="如 data.url" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.desc" type="textarea" :rows="2" placeholder="请输入描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="dialogLoading" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="less" scoped>
.agent-file {
  padding: 8px 16px;

  .search-form {
    margin-bottom: 12px;
  }
}
</style>
