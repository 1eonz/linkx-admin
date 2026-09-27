<script setup lang="ts">
/**
 * PcConfig - PC 端页签设置
 *
 * 功能特性：
 * 1. 从系统配置 PC_NAV_CUSTOM 读取 JSON 数组（PcNavTab[]）
 * 2. el-table 展示（name/url/order/openWay/操作）
 * 3. 新增/编辑/删除（createDialog + EditPcTabModal）
 * 4. 保存：每次新增/编辑/删除立即调用 setSystemConfig 保存
 */
import { Plus, Edit, Delete } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { onMounted, ref } from 'vue';

import EditPcTabModal from './EditPcTabModal.vue';
import { getSystemConfig, setSystemConfig, type PcNavTab, type SystemConfigItem } from '@/api/baseData/layoutConfig';
import ActionButtons from '@/components/ActionButtons/index.vue';
import SectionTitle from '@/components/SectionTitle/index.vue';
import { createDialog } from '@/utils/createDialog';

defineOptions({ name: 'PcConfig' });

/** PC_NAV_CUSTOM 配置 key */
const PC_NAV_CUSTOM_KEY = 'PC_NAV_CUSTOM';

const loading = ref(false);
/** 单次操作 loading（新增/编辑/删除时） */
const operating = ref(false);
const configReady = ref(false);
const loadError = ref(false);
const configMissing = ref(false);
const loadErrorMessage = ref('PC 端配置加载失败，请重试。');

/** PC_NAV_CUSTOM 配置项 ID（运行时从 getSystemConfig 获取） */
const pcNavConfigId = ref<string>('');

/** PC 页签列表 */
const tabList = ref<PcNavTab[]>([]);

// createDialog 弹窗工厂
const pcTabDialog = createDialog<PcNavTab>(EditPcTabModal, {
  title: 'PC 页签编辑',
  width: '600px',
});

/** 加载系统配置 */
function loadConfig(): Promise<boolean> {
  loading.value = true;
  configReady.value = false;
  loadError.value = false;
  configMissing.value = false;
  return getSystemConfig()
    .then((res) => {
      if (res.code !== 0 || !Array.isArray(res.data)) {
        throw new Error(res.msg || '系统配置响应无效');
      }
      const item = (res.data as SystemConfigItem[]).find((c) => c.key === PC_NAV_CUSTOM_KEY);
      if (!item) {
        pcNavConfigId.value = '';
        tabList.value = [];
        configMissing.value = true;
        return false;
      }
      const parsedTabs = parseTabList(item.value);
      if (!parsedTabs) {
        throw new Error('PC_NAV_CUSTOM 配置格式无效');
      }
      if (item) {
        pcNavConfigId.value = item.id;
        tabList.value = parsedTabs;
      }
      configReady.value = true;
      return true;
    })
    .catch(() => {
      loadError.value = true;
      loadErrorMessage.value = 'PC 端配置加载失败，请重试。';
      ElMessage.error('加载 PC 端配置失败');
      return false;
    })
    .finally(() => {
      loading.value = false;
    });
}

/** 解析 PC_NAV_CUSTOM 值为 PcNavTab 数组 */
function parseTabList(value: string): PcNavTab[] | null {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed) || parsed.some((item) => !item || typeof item !== 'object' || Array.isArray(item))) {
      return null;
    }
    const tabs = parsed.map((item) => {
      const tab = item as Record<string, unknown>;
      return {
        name: String(tab.name ?? ''),
        url: String(tab.url ?? ''),
        order: Number(tab.order ?? 0),
        openWay: (tab.openWay === 1 ? 1 : 0) as 0 | 1,
      };
    });
    if (tabs.some((tab) => !Number.isFinite(tab.order))) return null;
    return tabs;
  } catch {
    return null;
  }
}

/** 获取已存在名称（编辑时排除自身） */
function getExistNames(exclude?: PcNavTab): string[] {
  return tabList.value.filter((t) => t !== exclude).map((t) => t.name);
}

/** 保存配置到后端（按 order 升序排序后保存） */
function saveConfig(newList: PcNavTab[], successTip: string): Promise<void> {
  if (!configReady.value || !pcNavConfigId.value) {
    ElMessage.error('PC_NAV_CUSTOM 配置项 ID 缺失，无法保存');
    return Promise.resolve();
  }
  operating.value = true;
  // 按 order 升序排序后再保存
  const sortedList = [...newList].sort((a, b) => a.order - b.order);
  return setSystemConfig({ id: pcNavConfigId.value, value: JSON.stringify(sortedList) })
    .then((res) => {
      if (res.code === 0) {
        tabList.value = sortedList;
        return loadConfig().then((refreshed) => {
          if (refreshed) {
            ElMessage.success(successTip);
          } else {
            loadErrorMessage.value = '保存成功，但刷新 PC 端配置失败，请点击重试确认当前状态。';
            ElMessage.warning('保存成功，但刷新配置失败');
          }
        });
      } else {
        ElMessage.error(res.msg || '保存失败');
      }
    })
    .catch(() => {
      ElMessage.error('保存失败');
    })
    .finally(() => {
      operating.value = false;
    });
}

/** 新增页签：立即保存 */
async function handleAdd(): Promise<void> {
  if (!configReady.value || operating.value || loading.value) return;
  let result: PcNavTab;
  try {
    result = await pcTabDialog({
      props: { existNames: getExistNames() },
    });
  } catch (e) {
    const err = e as { type?: string };
    if (err?.type !== 'cancel-dialog' && err?.type !== 'close-dialog') {
      console.error(e);
    }
    return;
  }
  // 名称重复校验
  if (tabList.value.some((t) => t.name === result.name)) {
    ElMessage.warning('页签名称已存在，请使用其他名称');
    return;
  }
  return saveConfig([...tabList.value, result], '新增页签成功');
}

/** 编辑页签：立即保存 */
async function handleEdit(row: PcNavTab): Promise<void> {
  if (!configReady.value || operating.value || loading.value) return;
  const idx = tabList.value.findIndex((t) => t === row);
  if (idx < 0) return;
  let result: PcNavTab;
  try {
    result = await pcTabDialog({
      props: { initialData: row, existNames: getExistNames(row) },
    });
  } catch (e) {
    const err = e as { type?: string };
    if (err?.type !== 'cancel-dialog' && err?.type !== 'close-dialog') {
      console.error(e);
    }
    return;
  }
  // 名称重复校验（排除当前编辑项）
  if (tabList.value.some((t, i) => i !== idx && t.name === result.name)) {
    ElMessage.warning('页签名称已存在，请使用其他名称');
    return;
  }
  const newList = [...tabList.value];
  newList[idx] = result;
  return saveConfig(newList, '编辑页签成功');
}

/** 删除页签：立即保存 */
function handleDelete(row: PcNavTab): void {
  if (!configReady.value || operating.value || loading.value) return;
  ElMessageBox.confirm('确定要删除该页签吗？', '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      const newList = tabList.value.filter((t) => t !== row);
      return saveConfig(newList, '删除页签成功');
    })
    .catch(() => {});
}

/** 仅把含完整页签字段的表格行传入操作回调。 */
function isPcNavTab(value: unknown): value is PcNavTab {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.name === 'string' &&
    typeof row.url === 'string' &&
    Number.isFinite(Number(row.order)) &&
    (row.openWay === 0 || row.openWay === 1)
  );
}

function getRow(scope: unknown): PcNavTab {
  if (!scope || typeof scope !== 'object' || !('row' in scope) || !isPcNavTab(scope.row)) {
    return { name: '', url: '', order: 0, openWay: 0 };
  }
  return scope.row;
}

onMounted(loadConfig);
</script>

<template>
  <div v-loading="loading" class="pc-config">
    <!-- 标题 -->
    <SectionTitle title="自定义页签" variant="border" />

    <div v-if="loadError" class="load-error" role="alert">
      {{ loadErrorMessage }}
      <el-button link type="primary" :disabled="loading" @click="loadConfig">重试</el-button>
    </div>
    <div v-if="configMissing" class="load-error" role="alert">
      未找到 PC_NAV_CUSTOM 配置项，无法编辑。
      <el-button link type="primary" :disabled="loading" @click="loadConfig">重新加载</el-button>
    </div>

    <!-- 操作区：移除独立的"保存配置"按钮，新增/编辑/删除即时保存 -->
    <div class="actions-bar">
      <el-button
        type="primary"
        :icon="Plus"
        :loading="operating"
        :disabled="!configReady || loading || operating"
        @click="handleAdd"
      >
        新增页签
      </el-button>
    </div>

    <el-table :data="tabList" border stripe style="width: 100%">
      <el-table-column type="index" label="序号" width="60" align="center" />
      <el-table-column prop="name" label="页签名称" min-width="120" align="center" show-overflow-tooltip />
      <el-table-column prop="url" label="跳转 URL" min-width="200" align="center" show-overflow-tooltip />
      <el-table-column prop="order" label="排序" width="100" align="center" />
      <el-table-column label="打开方式" width="140" align="center">
        <template #default="scope">
          <el-tag :type="getRow(scope).openWay === 1 ? 'warning' : 'info'">
            {{ getRow(scope).openWay === 1 ? '弹窗' : 'iframe 嵌入' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180" align="center" fixed="right">
        <template #default="scope">
          <ActionButtons
            :buttons="[
              {
                type: 'primary',
                icon: Edit,
                label: '编辑',
                disabled: !configReady || loading || operating,
                onClick: () => handleEdit(getRow(scope)),
              },
              {
                type: 'danger',
                icon: Delete,
                label: '删除',
                disabled: !configReady || loading || operating,
                onClick: () => handleDelete(getRow(scope)),
              },
            ]"
          />
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<style lang="less" scoped>
.pc-config {
  padding: 20px;
  min-height: 400px;

  .actions-bar {
    padding-bottom: 16px;
  }

  .load-error {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
    color: var(--el-color-danger);
  }
}
</style>
