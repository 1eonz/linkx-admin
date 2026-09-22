<script setup lang="ts">
/**
 * GrantConfigDialog - 开放数据授权配置弹窗
 *
 * 功能特性：
 * 1. 控制服务器出向数据的 6 项授权开关（5 项开放数据 + 1 项开放业务数据）
 * 2. 各授权项使用 StatusSwitch，业务值反向映射：grant=1（开放）→ value=0；grant=0（关闭）→ value=1
 * 3. watch visible 变 true 且 serverData.peerId 存在时调用 getServerOpenDataGrant 加载当前授权状态，缺省 0
 * 4. 支持一键「全部开放」「全部关闭」
 * 5. 关闭弹窗时重置授权配置为全 0
 * 6. 提交按钮 loading 联动（由父组件控制）
 *
 * Props:
 * - visible: boolean，v-model 控制弹窗显隐
 * - serverData: ServerItem | null，当前授权的服务器数据
 * - loading: boolean，提交按钮 loading 状态（由父组件控制）
 *
 * Events:
 * - update:visible: 弹窗显隐变化
 * - save: ({ peerId, data }) => void，data 为 OpenDataGrant
 *
 * @example
 * ```vue
 * <GrantConfigDialog v-model:visible="dialogVisible" :server-data="currentServer" :loading="submitLoading" @save="handleSubmit" />
 * ```
 */
import { ElMessage } from 'element-plus';
import { computed, reactive, ref, watch } from 'vue';

import { getServerOpenDataGrant, type OpenDataGrant } from '@/api/nodeManage/openData';
import type { ServerItem } from '@/api/nodeManage/server';
import SectionTitle from '@/components/SectionTitle/index.vue';
import StatusSwitch from '@/components/StatusSwitch/index.vue';

defineOptions({ name: 'GrantConfigDialog' });

interface SubmitPayload {
  peerId: string;
  data: OpenDataGrant;
}

const props = defineProps<{
  visible: boolean;
  serverData: ServerItem | null;
  loading: boolean;
}>();
const emit = defineEmits<{
  (e: 'update:visible', v: boolean): void;
  (e: 'save', payload: SubmitPayload): void;
}>();

const dialogVisible = computed({
  get: () => props.visible,
  set: (v) => emit('update:visible', v),
});

// ===== 授权配置状态 =====
/** 默认授权配置（全 0=关闭） */
function defaultGrantConfig(): OpenDataGrant {
  return {
    users: 0,
    groups: 0,
    msg: 0,
    h5: 0,
    agent: 0,
    coopUser: 0,
  };
}

const grantConfig = reactive<OpenDataGrant>(defaultGrantConfig());
const fetching = ref(false);

/** 开放数据授权字段配置（5 项） */
const openDataFields: Array<{ field: keyof OpenDataGrant; label: string }> = [
  { field: 'users', label: '用户数据' },
  { field: 'groups', label: '群组数据' },
  { field: 'msg', label: '消息数据' },
  { field: 'h5', label: 'H5数据' },
  { field: 'agent', label: '智能体数据' },
];

/** 开放业务数据授权字段配置（1 项） */
const bizDataFields: Array<{ field: keyof OpenDataGrant; label: string }> = [
  { field: 'coopUser', label: '协同岗用户' },
];

/**
 * 获取某字段的 StatusSwitch value（反向映射）
 * grant=1（开放）→ value=0（启用）；grant=0（关闭）→ value=1（禁用）
 */
function getSwitchValue(field: keyof OpenDataGrant): number {
  const grant = grantConfig[field] ?? 0;
  return grant === 1 ? 0 : 1;
}

/** StatusSwitch change 事件：反转回业务 grant 值 */
function handleStatusChange(field: keyof OpenDataGrant, value: number): void {
  // value=0（启用）→ grant=1（开放）；value=1（禁用）→ grant=0（关闭）
  const grant = value === 0 ? 1 : 0;
  Object.assign(grantConfig, { [field]: grant });
}

/** 一键全部开放：所有字段设为 1 */
function handleAllOpen(): void {
  Object.assign(grantConfig, {
    users: 1,
    groups: 1,
    msg: 1,
    h5: 1,
    agent: 1,
    coopUser: 1,
  });
}

/** 一键全部关闭：所有字段设为 0 */
function handleAllClose(): void {
  Object.assign(grantConfig, defaultGrantConfig());
}

/** 重置授权配置为全 0 */
function resetGrantConfig(): void {
  Object.assign(grantConfig, defaultGrantConfig());
}

/** 加载当前授权状态（缺省 0） */
function loadGrant(): void {
  const peerId = props.serverData?.peerId;
  if (!peerId) return;
  fetching.value = true;
  getServerOpenDataGrant(peerId)
    .then((result) => {
      if (!result || result.code !== 0) {
        ElMessage.error(result?.msg || '加载授权配置失败');
        resetGrantConfig();
        return;
      }
      const data = result.data ?? ({} as OpenDataGrant);
      grantConfig.users = data.users ?? 0;
      grantConfig.groups = data.groups ?? 0;
      grantConfig.msg = data.msg ?? 0;
      grantConfig.h5 = data.h5 ?? 0;
      grantConfig.agent = data.agent ?? 0;
      grantConfig.coopUser = data.coopUser ?? 0;
    })
    .catch(() => {
      resetGrantConfig();
    })
    .finally(() => {
      fetching.value = false;
    });
}

/** watch visible 变 true 且 peerId 存在时加载授权状态 */
watch(
  () => props.visible,
  (val) => {
    if (val && props.serverData?.peerId) {
      resetGrantConfig();
      loadGrant();
    }
  },
);

/** 弹窗关闭后重置授权配置 */
function handleDialogClose(): void {
  resetGrantConfig();
}

/** 提交保存：emit save */
function handleSubmit(): void {
  const peerId = props.serverData?.peerId ?? '';
  emit('save', {
    peerId,
    data: { ...grantConfig },
  });
}
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    title="授权配置"
    width="550px"
    align-center
    append-to-body
    :close-on-click-modal="false"
    @close="handleDialogClose"
  >
    <!-- 服务器信息 -->
    <el-descriptions :column="1" border size="large" class="server-info">
      <el-descriptions-item label="IP地址"> {{ serverData?.ip }}:{{ serverData?.port }} </el-descriptions-item>
      <el-descriptions-item label="节点标识">
        {{ serverData?.peerId }}
      </el-descriptions-item>
    </el-descriptions>

    <el-form label-width="120px" size="large">
      <!-- 开放数据授权 -->
      <div v-loading="fetching" class="grant-section">
        <SectionTitle title="开放数据授权" variant="plain" />
        <el-form-item v-for="item in openDataFields" :key="item.field" :label="item.label">
          <StatusSwitch
            :value="getSwitchValue(item.field)"
            normal-text="开放"
            forbidden-text="关闭"
            @change="handleStatusChange(item.field, $event)"
          />
        </el-form-item>
      </div>

      <!-- 开放业务数据授权 -->
      <div v-loading="fetching" class="grant-section">
        <SectionTitle title="开放业务数据授权" variant="plain" />
        <el-form-item v-for="item in bizDataFields" :key="item.field" :label="item.label">
          <StatusSwitch
            :value="getSwitchValue(item.field)"
            normal-text="开放"
            forbidden-text="关闭"
            @change="handleStatusChange(item.field, $event)"
          />
        </el-form-item>
      </div>
    </el-form>

    <template #footer>
      <el-button @click="handleAllOpen">全部开放</el-button>
      <el-button @click="handleAllClose">全部关闭</el-button>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">保存</el-button>
    </template>
  </el-dialog>
</template>

<style lang="less" scoped>
.server-info {
  margin-bottom: 16px;
}

.grant-section {
  margin-bottom: 16px;
}
</style>
