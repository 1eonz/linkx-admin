<script setup lang="ts">
/**
 * IcpServerConfig - ICP 服务器配置表单
 *
 * 功能：
 * - 服务配置：协议/IP/端口/WSS URL/账号密码
 * - 节点配置：关联组织（部门树）/摄像头层级
 * - 通过 el-dialog 弹窗选择组织/摄像头根节点（el-tree 单选）
 */
import { ElMessage } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue';

import {
  getIcpCameraSelectTree,
  getIcpDeptSelectTree,
  getServerConfig,
  updateServerConfig,
  type IcpProtocol,
  type IcpServerConfig,
  type IcpTreeNode,
} from '@/api/thirdInterface/unifiedComm';

defineOptions({ name: 'IcpServerConfig' });

// ===== 表单 =====
const formRef = ref<FormInstance>();
const submitting = ref(false);
const loading = ref(false);

const baseForm = (): IcpServerConfig => ({
  id: '',
  protocol: 5,
  ip: '',
  port: 22,
  wssUrl: '',
  username: '',
  password: '',
  departmentId: '',
  departmentName: '',
  cameraLevelId: '',
  cameraLevelName: '',
  environment: 0,
  status: 1,
  remark: '',
});

const form = reactive<IcpServerConfig>(baseForm());

const protocolOptions: Array<{ value: IcpProtocol; label: string }> = [
  { value: 1, label: 'SSH' },
  { value: 2, label: 'RDP' },
  { value: 3, label: 'Telnet' },
  { value: 4, label: 'VNC' },
  { value: 5, label: 'HTTP' },
  { value: 6, label: '其他' },
];

const rules: FormRules = {
  ip: [
    { required: true, message: '请输入 IP 地址', trigger: 'blur' },
    {
      pattern: /^((25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(25[0-5]|2[0-4]\d|1?\d?\d)$|^$/,
      message: 'IP 格式不正确',
      trigger: 'blur',
    },
  ],
  port: [{ required: true, message: '请输入端口', trigger: 'blur' }],
  wssUrl: [{ required: true, message: '请输入 WSS 地址', trigger: 'blur' }],
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
};

// ===== 树选择弹窗 =====
const treeDialogVisible = ref(false);
const treeDialogTitle = ref('');
const treeDialogType = ref<'dept' | 'camera'>('dept');
const treeData = ref<IcpTreeNode[]>([]);
const treeLoading = ref(false);
const treeFilter = ref('');

watch(treeFilter, (val) => {
  treeRef.value?.filter(val);
});

function filterNode(value: string, data: any): boolean {
  if (!value) return true;
  return data.label?.includes(value) ?? false;
}

const filterNodeMethod = filterNode as never;

const treeProps = { label: 'label', children: 'children' };
const treeRef = ref();
const selectedTreeNode = ref<IcpTreeNode | null>(null);

const dialogTitle = computed(() => (treeDialogType.value === 'dept' ? '选择组织' : '选择摄像头层级'));

// ===== 加载服务器配置 =====
async function fetchConfig(): Promise<void> {
  loading.value = true;
  try {
    const res = await getServerConfig();
    if (res?.code === 0 && res.data) {
      Object.assign(form, res.data);
    }
  } catch (e) {
    console.error('[IcpServerConfig] 加载服务器配置失败', e);
  } finally {
    loading.value = false;
  }
}

// ===== 加载树数据 =====
async function loadTreeData(): Promise<void> {
  treeLoading.value = true;
  try {
    if (treeDialogType.value === 'dept') {
      const res = await getIcpDeptSelectTree();
      treeData.value = (res?.data as IcpTreeNode[]) ?? [];
    } else {
      const res = await getIcpCameraSelectTree();
      treeData.value = (res?.data as IcpTreeNode[]) ?? [];
    }
  } catch (e) {
    console.error('[IcpServerConfig] 加载树数据失败', e);
  } finally {
    treeLoading.value = false;
  }
}

/** 打开树选择弹窗 */
function openTreeDialog(type: 'dept' | 'camera'): void {
  treeDialogType.value = type;
  treeDialogTitle.value = type === 'dept' ? '选择组织' : '选择摄像头层级';
  treeFilter.value = '';
  selectedTreeNode.value = null;
  treeDialogVisible.value = true;
  nextTick(() => {
    loadTreeData();
  });
}

function handleTreeNodeClick(data: IcpTreeNode): void {
  selectedTreeNode.value = data;
}

function confirmTreeSelect(): void {
  if (!selectedTreeNode.value) {
    ElMessage.warning('请选择一个节点');
    return;
  }
  if (treeDialogType.value === 'dept') {
    form.departmentId = selectedTreeNode.value.id;
    form.departmentName = selectedTreeNode.value.label;
  } else {
    form.cameraLevelId = selectedTreeNode.value.id;
    form.cameraLevelName = selectedTreeNode.value.label;
  }
  treeDialogVisible.value = false;
}

function clearDept(): void {
  form.departmentId = '';
  form.departmentName = '';
}

function clearCamera(): void {
  form.cameraLevelId = '';
  form.cameraLevelName = '';
}

// ===== 提交保存 =====
async function handleSubmit(): Promise<void> {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  submitting.value = true;
  try {
    const res = await updateServerConfig(form);
    if (res?.code !== 0) {
      ElMessage.error(res?.msg ?? '保存失败');
      return;
    }
    ElMessage.success('保存成功');
  } finally {
    submitting.value = false;
  }
}

onMounted(() => {
  fetchConfig();
});
</script>

<template>
  <div v-loading="loading" class="icp-server-config">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="120px" class="config-form">
      <el-divider content-position="left">服务配置</el-divider>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="协议" prop="protocol">
            <el-select v-model="form.protocol" placeholder="请选择协议" style="width: 100%">
              <el-option v-for="opt in protocolOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="IP 地址" prop="ip">
            <el-input v-model="form.ip" placeholder="如 192.168.1.100" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="端口" prop="port">
            <el-input-number v-model="form.port" :min="1" :max="65535" controls-position="right" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="WSS 地址" prop="wssUrl">
            <el-input v-model="form.wssUrl" placeholder="如 wss://192.168.1.100/ws" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="用户名" prop="username">
            <el-input v-model="form.username" placeholder="请输入用户名" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="密码" prop="password">
            <el-input v-model="form.password" type="password" show-password placeholder="请输入密码" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">更新服务配置</el-button>
      </el-form-item>

      <el-divider content-position="left">节点配置</el-divider>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="关联组织">
            <el-input
              :model-value="form.departmentName"
              placeholder="请选择组织"
              readonly
              style="width: calc(100% - 96px)"
            >
              <template #append>
                <el-button @click="openTreeDialog('dept')">选择</el-button>
                <el-button v-if="form.departmentId" @click="clearDept">清除</el-button>
              </template>
            </el-input>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="摄像头层级">
            <el-input
              :model-value="form.cameraLevelName"
              placeholder="请选择摄像头层级"
              readonly
              style="width: calc(100% - 96px)"
            >
              <template #append>
                <el-button @click="openTreeDialog('camera')">选择</el-button>
                <el-button v-if="form.cameraLevelId" @click="clearCamera">清除</el-button>
              </template>
            </el-input>
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">更新节点配置</el-button>
      </el-form-item>
    </el-form>

    <!-- 树选择弹窗 -->
    <el-dialog
      v-model="treeDialogVisible"
      :title="dialogTitle"
      width="480px"
      align-center
      append-to-body
      :close-on-click-modal="false"
    >
      <div v-loading="treeLoading" class="tree-select-modal">
        <el-input v-model="treeFilter" placeholder="搜索节点" clearable size="default" style="margin-bottom: 8px" />
        <div class="tree-container">
          <el-tree
            ref="treeRef"
            :data="treeData"
            :props="treeProps"
            node-key="id"
            highlight-current
            :expand-on-click-node="false"
            :filter-node-method="filterNodeMethod"
            default-expand-all
            @node-click="handleTreeNodeClick"
          />
        </div>
      </div>
      <template #footer>
        <el-button @click="treeDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmTreeSelect">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="less" scoped>
.icp-server-config {
  padding: 8px 16px;

  .config-form {
    max-width: 920px;
  }

  .tree-select-modal {
    .tree-container {
      max-height: 360px;
      overflow-y: auto;
      border: 1px solid var(--el-border-color-lighter, #e4e7ed);
      border-radius: 4px;
      padding: 8px;
    }
  }
}
</style>
