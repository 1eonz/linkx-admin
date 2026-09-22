<script setup lang="ts">
/**
 * AgentConfig - AI 智能体系统设置
 *
 * 功能：
 * - 部署开关（separatedDeploy）+ 分组 AI 服务/前端地址
 * - 审批模式（approvalEnabled）+ 审批子模式 + 外部审批系统 URL
 * - 智能体导入 + 模板下载
 */
import { Upload, Download } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import type { FormInstance, FormRules, UploadRawFile } from 'element-plus';
import { computed, nextTick, onMounted, reactive, ref } from 'vue';

import {
  downloadAiagentTemplate,
  getAiagentSettings,
  getDeploySettings,
  importAiagent,
  updateAiagentSettings,
  updateDeploySettings,
  type AiagentSettings,
  type DeploySettings,
} from '@/api/thirdInterface/agentInterface';

defineOptions({ name: 'AgentConfig' });

const emit = defineEmits<{
  /** 部署模式变化（separatedDeploy + groupAiFrontendHost），父组件用于决定是否拦截 Tab 切换 */
  (e: 'deploy-mode-change', payload: { separatedDeploy: boolean; groupAiFrontendHost: string }): void;
  /** 智能体导入成功，父组件用于刷新 AgentManage 列表 */
  (e: 'import-success'): void;
}>();

/**
 * 获取前端 host 地址
 *
 * 安全读取 deployForm.groupAiFrontendHost，当其为 null/undefined 时回退为空字符串，
 * 避免在事件回传等场景下传递 undefined。
 *
 * @returns 前端 host 地址（可能为空字符串）
 */
function getFrontendHost(): string {
  return deployForm.groupAiFrontendHost ?? '';
}

// ===== 部署配置 =====
const deployRef = ref<FormInstance>();
const deployLoading = ref(false);
const deploySaving = ref(false);
const deployForm = reactive<DeploySettings>({
  separatedDeploy: false,
  groupAiHost: '',
  groupAiFrontendHost: '',
});

const deployRules: FormRules = {
  groupAiHost: [{ required: true, message: '请输入 AI 服务地址', trigger: 'blur' }],
  groupAiFrontendHost: [
    {
      required: true,
      validator: (_rule, value, callback) => {
        if (deployForm.separatedDeploy && !value) {
          callback(new Error('分离部署时前端地址必填'));
          return;
        }
        callback();
      },
      trigger: 'blur',
    },
  ],
};

// ===== 审批配置 =====
const approvalRef = ref<FormInstance>();
const approvalLoading = ref(false);
const approvalSaving = ref(false);
const approvalForm = reactive<AiagentSettings>({
  approvalEnabled: false,
  approvalSubMode: 0,
  approvalSystemUrl: '',
});

const approvalRules: FormRules = {
  approvalSystemUrl: [
    {
      validator: (_rule, value, callback) => {
        if (approvalForm.approvalEnabled && approvalForm.approvalSubMode === 1 && !value) {
          callback(new Error('外部审批模式必填 URL'));
          return;
        }
        callback();
      },
      trigger: 'blur',
    },
  ],
};

// ===== 导入/导出 =====
const importLoading = ref(false);
const importRef = ref<HTMLInputElement | null>(null);

const importBtnDisabled = computed(() => importLoading.value);

/**
 * 加载部署配置数据
 *
 * 调用 getDeploySettings 获取服务端配置，回填 deployForm 表单，
 * 并通过 deploy-mode-change 事件通知父组件当前部署模式（用于 Tab 切换拦截）。
 *
 * @returns Promise，无返回值
 */
async function fetchDeploy(): Promise<void> {
  deployLoading.value = true;
  try {
    const res = await getDeploySettings();
    if (res?.code === 0 && res.data) {
      Object.assign(deployForm, res.data);
      // 通知父组件当前部署模式，父组件用于 beforeLeave 拦截
      emit('deploy-mode-change', {
        separatedDeploy: deployForm.separatedDeploy,
        groupAiFrontendHost: getFrontendHost(),
      });
    }
  } catch (e) {
    console.error('[AgentConfig] 加载部署配置失败', e);
  } finally {
    deployLoading.value = false;
  }
}

/**
 * 加载审批配置数据
 *
 * 调用 getAiagentSettings 获取服务端审批配置，回填 approvalForm 表单。
 *
 * @returns Promise，无返回值
 */
async function fetchApproval(): Promise<void> {
  approvalLoading.value = true;
  try {
    const res = await getAiagentSettings();
    if (res?.code === 0 && res.data) {
      Object.assign(approvalForm, res.data);
    }
  } catch (e) {
    console.error('[AgentConfig] 加载审批配置失败', e);
  } finally {
    approvalLoading.value = false;
  }
}

/**
 * 保存部署配置
 *
 * 先进行表单校验，通过后调用 updateDeploySettings 提交表单数据，
 * 成功后提示并通过 deploy-mode-change 事件通知父组件部署模式变化。
 *
 * @returns Promise，无返回值
 */
async function saveDeploy(): Promise<void> {
  const valid = await deployRef.value?.validate().catch(() => false);
  if (!valid) return;
  deploySaving.value = true;
  try {
    const res = await updateDeploySettings(deployForm);
    if (res?.code !== 0) {
      ElMessage.error(res?.msg ?? '保存部署配置失败');
      return;
    }
    ElMessage.success('部署配置保存成功');
    // 通知父组件部署模式变化
    emit('deploy-mode-change', {
      separatedDeploy: deployForm.separatedDeploy,
      groupAiFrontendHost: getFrontendHost(),
    });
  } finally {
    deploySaving.value = false;
  }
}

/**
 * 保存审批配置
 *
 * 先进行表单校验，通过后调用 updateAiagentSettings 提交表单数据，成功后提示用户。
 *
 * @returns Promise，无返回值
 */
async function saveApproval(): Promise<void> {
  const valid = await approvalRef.value?.validate().catch(() => false);
  if (!valid) return;
  approvalSaving.value = true;
  try {
    const res = await updateAiagentSettings(approvalForm);
    if (res?.code !== 0) {
      ElMessage.error(res?.msg ?? '保存审批配置失败');
      return;
    }
    ElMessage.success('审批配置保存成功');
  } finally {
    approvalSaving.value = false;
  }
}

// ===== 模板下载 =====
/**
 * 下载导入模板
 *
 * 调用 downloadAiagentTemplate 拉取智能体导入模板文件，并给出下载成功/失败提示。
 *
 * @returns Promise，无返回值
 */
async function handleDownloadTemplate(): Promise<void> {
  try {
    await downloadAiagentTemplate();
    ElMessage.success('模板下载成功');
  } catch (e) {
    ElMessage.error('模板下载失败');
    console.error(e);
  }
}

// ===== 文件导入 =====
/**
 * 触发文件选择
 *
 * 程序化触发隐藏 input 的点击事件，唤起系统文件选择框。
 */
function triggerImport(): void {
  importRef.value?.click();
}

/**
 * 文件选择变化处理
 *
 * 从 input change 事件中取出用户选择的文件，调用 importAiagent 上传导入，
 * 成功后触发 import-success 事件通知父组件刷新列表，无论成功失败均清空 input 值以便重复导入同一文件。
 *
 * @param e input change 事件对象
 * @returns Promise，无返回值
 */
async function handleFileChange(e: Event): Promise<void> {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;
  if (importLoading.value) return;
  importLoading.value = true;
  try {
    const res = await importAiagent(file as UploadRawFile as unknown as File);
    if (res?.code !== 0) {
      ElMessage.error(res?.msg ?? '导入失败');
      return;
    }
    ElMessage.success('导入成功');
    // 通知父组件刷新 AgentManage 列表
    emit('import-success');
  } catch (e) {
    console.error(e);
    ElMessage.error('导入失败');
  } finally {
    importLoading.value = false;
    // 清空 input 值以便重复导入同一文件
    target.value = '';
  }
}

onMounted(() => {
  fetchDeploy();
  fetchApproval();
  nextTick(() => {
    // 触发 ref 注入
  });
});
</script>

<template>
  <div v-loading="deployLoading || approvalLoading" class="agent-config">
    <el-form ref="deployRef" :model="deployForm" :rules="deployRules" label-width="160px" class="config-form">
      <el-divider content-position="left">部署配置</el-divider>
      <el-form-item label="分离部署">
        <el-switch v-model="deployForm.separatedDeploy" />
        <span class="form-tip">开启后 AI 服务与前端使用不同地址</span>
      </el-form-item>
      <el-form-item label="AI 服务地址" prop="groupAiHost">
        <el-input v-model="deployForm.groupAiHost" placeholder="如 http://192.168.1.10:8080" style="max-width: 480px" />
      </el-form-item>
      <el-form-item v-if="deployForm.separatedDeploy" label="AI 前端地址" prop="groupAiFrontendHost">
        <el-input
          v-model="deployForm.groupAiFrontendHost"
          placeholder="如 http://192.168.1.10"
          style="max-width: 480px"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :loading="deploySaving" @click="saveDeploy">保存部署配置</el-button>
      </el-form-item>
    </el-form>

    <el-form ref="approvalRef" :model="approvalForm" :rules="approvalRules" label-width="160px" class="config-form">
      <el-divider content-position="left">审批配置</el-divider>
      <el-form-item label="启用审批">
        <el-switch v-model="approvalForm.approvalEnabled" inline-prompt />
      </el-form-item>
      <template v-if="approvalForm.approvalEnabled">
        <el-form-item label="审批子模式">
          <el-radio-group v-model="approvalForm.approvalSubMode">
            <el-radio :value="0">系统内置</el-radio>
            <el-radio :value="1">外部系统</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="approvalForm.approvalSubMode === 1" label="外部审批系统 URL" prop="approvalSystemUrl">
          <el-input
            v-model="approvalForm.approvalSystemUrl"
            placeholder="如 http://approval.example.com"
            style="max-width: 480px"
          />
        </el-form-item>
      </template>
      <el-form-item>
        <el-button type="primary" :loading="approvalSaving" @click="saveApproval"> 保存审批配置 </el-button>
      </el-form-item>
    </el-form>

    <el-divider content-position="left">智能体导入</el-divider>
    <div class="import-actions">
      <el-button type="primary" :icon="Upload" :loading="importLoading" @click="triggerImport"> 导入智能体 </el-button>
      <el-button :icon="Download" @click="handleDownloadTemplate">下载模板</el-button>
      <input ref="importRef" type="file" accept=".xlsx,.xls" style="display: none" @change="handleFileChange" />
    </div>
  </div>
</template>

<style lang="less" scoped>
.agent-config {
  padding: 8px 16px;

  .config-form {
    max-width: 720px;
  }

  .form-tip {
    margin-left: 12px;
    color: @color-text-secondary;
    font-size: 12px;
  }

  .import-actions {
    display: flex;
    gap: 12px;
    padding: 12px 0;
  }
}
</style>
