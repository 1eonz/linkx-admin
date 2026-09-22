<script setup lang="ts">
/**
 * ClientDetailDrawer - 客户端详情抽屉
 *
 * 功能特性：
 * 1. 展示客户端基本信息（9 项）、授权信息（3 项）、连接信息（2 项）
 * 2. 概览区块可折叠（el-collapse，默认折叠）
 * 3. 数据概览：6 个统计卡片 + 协同岗列表（ProTable 不分页）
 * 4. watch visible 变 true 且 peerId 存在时并行调用 getOpenDataStatistic + searchCoopData
 * 5. 两个接口都返回空时显示「暂无数据，请检查连接状态及是否授权」
 * 6. 关闭抽屉时清空 statisticData 和 businessData
 * 7. 「刷新」按钮重新加载全部数据
 *
 * Props:
 * - visible: boolean，v-model 控制抽屉显隐
 * - clientData: ClientItem | null，当前客户端数据
 *
 * Events:
 * - update:visible: 抽屉显隐变化
 *
 * @example
 * ```vue
 * <ClientDetailDrawer v-model:visible="drawerVisible" :client-data="currentClient" />
 * ```
 */
import { Refresh } from '@element-plus/icons-vue';
import { computed, ref, watch } from 'vue';

import ConnectionStatusDot from '../../components/ConnectionStatusDot.vue';
import type { ClientItem } from '@/api/nodeManage/client';
import {
  getOpenDataStatistic,
  searchCoopData,
  type CoopDataItem,
  type OpenDataStatistic,
} from '@/api/nodeManage/openData';
import MetricCard from '@/components/MetricCard/index.vue';
import ProTable from '@/components/ProTable/index.vue';
import type { ITableColumn } from '@/components/ProTable/types';
import SectionTitle from '@/components/SectionTitle/index.vue';

defineOptions({ name: 'ClientDetailDrawer' });

const props = defineProps<{
  visible: boolean;
  clientData: ClientItem | null;
}>();
const emit = defineEmits<{
  (e: 'update:visible', v: boolean): void;
}>();

const drawerVisible = computed({
  get: () => props.visible,
  set: (v) => emit('update:visible', v),
});

// ===== 概览折叠状态 =====
const activeCollapse = ref<string[]>([]);

// ===== 统计数据 =====
const statisticData = ref<OpenDataStatistic>({});
// ===== 协同岗列表数据 =====
const businessData = ref<CoopDataItem[]>([]);

const loading = ref(false);

// ===== 协同岗列表列定义 =====
const coopColumns: ITableColumn[] = [
  { prop: 'postName', label: '协同岗名称', minWidth: 120, showOverflowTooltip: true },
  { prop: 'id', label: '协同岗标识', width: 180, showOverflowTooltip: true },
  { prop: 'orgName', label: '所属组织', minWidth: 120, showOverflowTooltip: true },
  { prop: 'relatedUserNames', label: '关联人员', minWidth: 150, showOverflowTooltip: true },
  { prop: 'relatedUserCount', label: '关联人数', width: 100, align: 'center', slotName: 'relatedUserCount' },
];

// ===== 计算属性 =====
/** 抽屉标题：备注 || IP */
const drawerTitle = computed(() => {
  const data = props.clientData;
  if (!data) return '客户端详情';
  return `客户端详情 - ${data.remark || data.ip || ''}`;
});

/** 两个接口都返回空时显示空提示 */
const isEmpty = computed(() => {
  const stat = statisticData.value;
  const hasStat =
    stat.users?.coopUserCount ||
    stat.groups?.coopGroupCount ||
    stat.groups?.normalGroupCount ||
    stat.msg?.coopMsg ||
    stat.h5?.count ||
    stat.agent?.count;
  return !hasStat && businessData.value.length === 0;
});

/** 授权状态文案与类型 */
const grantStatusInfo = computed(() => {
  const data = props.clientData;
  if (!data) return { text: '未授权', type: 'info' as const };
  if (data.grant === 1 && !data.expired) return { text: '已授权', type: 'success' as const };
  if (data.expired) return { text: '已过期', type: 'danger' as const };
  return { text: '未授权', type: 'info' as const };
});

/** 授权有效期至（时间戳格式化） */
const expiredInText = computed(() => {
  const v = props.clientData?.expiredIn;
  if (v == null) return '-';
  // 时间戳（毫秒）转可读字符串
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? '-' : d.toLocaleString();
});

// ===== 数据加载 =====
/** 并行加载统计 + 协同岗数据 */
function loadAllData(): void {
  const peerId = props.clientData?.peerId;
  if (!peerId) return;
  loading.value = true;
  Promise.all([getOpenDataStatistic(peerId), searchCoopData(peerId, {})])
    .then(([statRes, coopRes]) => {
      // 统计数据
      if (statRes && statRes.code === 0) {
        statisticData.value = statRes.data ?? {};
      } else {
        statisticData.value = {};
      }
      // 协同岗数据
      if (coopRes && coopRes.code === 0) {
        businessData.value = Array.isArray(coopRes.data) ? coopRes.data : [];
      } else {
        businessData.value = [];
      }
    })
    .catch(() => {
      statisticData.value = {};
      businessData.value = [];
    })
    .finally(() => {
      loading.value = false;
    });
}

/** watch visible 变 true 且 peerId 存在时加载 */
watch(
  () => props.visible,
  (val) => {
    if (val && props.clientData?.peerId) {
      loadAllData();
    }
  },
);

/** 关闭抽屉时清空数据 */
function handleDrawerClose(): void {
  statisticData.value = {};
  businessData.value = [];
  activeCollapse.value = [];
}

/** 刷新按钮 */
function handleRefresh(): void {
  loadAllData();
}

/** 从 ProTable slot scope 中安全获取 CoopDataItem */
function getRow(scope: any): CoopDataItem {
  return (scope?.row as CoopDataItem) ?? ({} as CoopDataItem);
}

/** 计算关联人数（兼容数组或逗号分隔字符串） */
function getRelatedUserCount(row: CoopDataItem): number {
  const ids = row.relatedUserIds;
  if (Array.isArray(ids)) return ids.length;
  if (typeof ids === 'string' && ids.trim() !== '') {
    return ids.split(',').filter((s) => s.trim() !== '').length;
  }
  return 0;
}
</script>

<template>
  <el-drawer v-model="drawerVisible" :title="drawerTitle" direction="rtl" size="600px" @close="handleDrawerClose">
    <div v-loading="loading" class="client-detail">
      <!-- 概览区块（可折叠） -->
      <el-collapse v-model="activeCollapse" class="overview-collapse">
        <el-collapse-item name="overview">
          <template #title>
            <div class="overview-title">
              <span class="overview-label">概览</span>
              <span v-if="clientData?.ip" class="overview-ip">{{ clientData.ip }}</span>
              <ConnectionStatusDot
                v-if="clientData"
                :status="clientData.status"
                :status-desc="clientData.statusDesc"
                :show-text="false"
              />
            </div>
          </template>

          <!-- 基本信息（9 项，2 列） -->
          <div class="info-section">
            <SectionTitle title="基本信息" variant="plain" />
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">节点标识</span>
                <el-tooltip :content="clientData?.peerId || '-'" placement="top" :disabled="!clientData?.peerId">
                  <span class="info-value">{{ clientData?.peerId || '-' }}</span>
                </el-tooltip>
              </div>
              <div class="info-item">
                <span class="info-label">节点名称</span>
                <el-tooltip :content="clientData?.name || '-'" placement="top" :disabled="!clientData?.name">
                  <span class="info-value">{{ clientData?.name || '-' }}</span>
                </el-tooltip>
              </div>
              <div class="info-item">
                <span class="info-label">IP地址</span>
                <el-tooltip :content="clientData?.ip || '-'" placement="top" :disabled="!clientData?.ip">
                  <span class="info-value">{{ clientData?.ip || '-' }}</span>
                </el-tooltip>
              </div>
              <div class="info-item">
                <span class="info-label">端口</span>
                <span class="info-value">{{ clientData?.port ?? '-' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">授权人</span>
                <el-tooltip
                  :content="clientData?.grantUserName || '-'"
                  placement="top"
                  :disabled="!clientData?.grantUserName"
                >
                  <span class="info-value">{{ clientData?.grantUserName || '-' }}</span>
                </el-tooltip>
              </div>
              <div class="info-item">
                <span class="info-label">授权时间</span>
                <el-tooltip :content="clientData?.grantTime || '-'" placement="top" :disabled="!clientData?.grantTime">
                  <span class="info-value">{{ clientData?.grantTime || '-' }}</span>
                </el-tooltip>
              </div>
              <div class="info-item">
                <span class="info-label">备注</span>
                <el-tooltip :content="clientData?.remark || '-'" placement="top" :disabled="!clientData?.remark">
                  <span class="info-value">{{ clientData?.remark || '-' }}</span>
                </el-tooltip>
              </div>
              <div class="info-item">
                <span class="info-label">标签</span>
                <el-tooltip :content="clientData?.tag || '-'" placement="top" :disabled="!clientData?.tag">
                  <span class="info-value">{{ clientData?.tag || '-' }}</span>
                </el-tooltip>
              </div>
              <div class="info-item">
                <span class="info-label">创建时间</span>
                <el-tooltip
                  :content="clientData?.gmtCreated || '-'"
                  placement="top"
                  :disabled="!clientData?.gmtCreated"
                >
                  <span class="info-value">{{ clientData?.gmtCreated || '-' }}</span>
                </el-tooltip>
              </div>
            </div>
          </div>

          <!-- 授权信息（3 项） -->
          <div class="info-section">
            <SectionTitle title="授权信息" variant="plain" />
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">授权状态</span>
                <el-tag :type="grantStatusInfo.type" size="small">{{ grantStatusInfo.text }}</el-tag>
              </div>
              <div class="info-item">
                <span class="info-label">有效期至</span>
                <span class="info-value">{{ expiredInText }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">会话ID</span>
                <el-tooltip :content="clientData?.session || '-'" placement="top" :disabled="!clientData?.session">
                  <span class="info-value">{{ clientData?.session || '-' }}</span>
                </el-tooltip>
              </div>
            </div>
          </div>

          <!-- 连接信息（2 项） -->
          <div class="info-section">
            <SectionTitle title="连接信息" variant="plain" />
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">连接状态</span>
                <ConnectionStatusDot
                  v-if="clientData"
                  :status="clientData.status"
                  :status-desc="clientData.statusDesc"
                />
                <span v-else>-</span>
              </div>
              <div class="info-item">
                <span class="info-label">最后活跃</span>
                <span class="info-value">{{ clientData?.lastSeen || '-' }}</span>
              </div>
            </div>
          </div>
        </el-collapse-item>
      </el-collapse>

      <!-- 数据概览区块 -->
      <div class="data-overview">
        <SectionTitle title="数据概览" variant="plain">
          <template #extra>
            <el-button type="primary" link :icon="Refresh" :loading="loading" @click="handleRefresh"> 刷新 </el-button>
          </template>
        </SectionTitle>

        <!-- 空数据提示 -->
        <el-empty v-if="isEmpty" description="暂无数据，请检查连接状态及是否授权" />

        <template v-else>
          <!-- 统计卡片（6 个，使用 MetricCard 组件） -->
          <div class="stat-cards metric-grid">
            <MetricCard title="协同岗用户" :value="statisticData.users?.coopUserCount ?? 0" />
            <MetricCard title="协同岗群组" :value="statisticData.groups?.coopGroupCount ?? 0" />
            <MetricCard title="普通群组" :value="statisticData.groups?.normalGroupCount ?? 0" />
            <MetricCard title="协同岗消息" :value="statisticData.msg?.coopMsg ?? 0" />
            <MetricCard title="H5数量" :value="statisticData.h5?.count ?? 0" />
            <MetricCard title="智能体数量" :value="statisticData.agent?.count ?? 0" />
          </div>

          <!-- 协同岗列表 -->
          <div class="coop-list">
            <div class="coop-list-title">协同岗列表</div>
            <ProTable :columns="coopColumns" :data="businessData" :show-pagination="false" size="large" row-key="id">
              <!-- 关联人数列 -->
              <template #relatedUserCount="scope">
                {{ getRelatedUserCount(getRow(scope)) }}
              </template>
            </ProTable>
          </div>
        </template>
      </div>
    </div>
  </el-drawer>
</template>

<style lang="less" scoped>
.client-detail {
  padding: 0 4px;
}

.overview-collapse {
  margin-bottom: 16px;

  .overview-title {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
  }

  .overview-label {
    color: var(--el-text-color-primary);
  }

  .overview-ip {
    color: var(--el-text-color-regular);
    font-weight: 400;
  }
}

.info-section {
  margin-bottom: 16px;

  .info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px 16px;
  }

  .info-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }

  .info-label {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  .info-value {
    font-size: 13px;
    color: var(--el-text-color-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.data-overview {
  .stat-cards {
    // 使用 metric-grid 提供网格布局（reset.less 中定义）
    // 旧 .stat-card 样式已移除，改用 MetricCard 组件
    margin-bottom: 16px;
  }

  .coop-list {
    .coop-list-title {
      margin-bottom: 8px;
      font-size: 13px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }
  }
}
</style>
