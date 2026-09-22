<script setup lang="ts">
/* global localStorage */
import { ref, onMounted, onBeforeUnmount } from 'vue';

import ColEditRecord from './colEditRecord.vue';
import ColFunctionManage from './colFunctionManage.vue';
import ColLevelManage from './colLevelManage.vue';
import ColManage from './colManage.vue';
import ColOnOffRecord from './colOnOffRecord.vue';
import { getGlobalsList } from '@/api/dictionary/globals';
import { queryUserByIdCard } from '@/api/h5/collaboration';
import { getIsAdmin, getIdCardNum } from '@/utils/auth';
import { pageLoadingUtils } from '@/utils/pageLoading';

defineOptions({ name: 'Collaboration' });

const isAdmin = getIsAdmin();
const idCardNum = getIdCardNum();

// 5 个 tab：1=协同岗管理 / 2=协同岗层级管理（受 SHOW_331_FEATURE 控制）/ 3=编辑记录 / 4=上下岗记录 / 5=职能部门管理
const activeName = ref('1');
const isShow331Feature = ref(false);

// 传给子组件的 props
const orgIds = ref('');
const departmentCode = ref('');
const departmentId = ref('');
const departmentSyncSign = ref(false);

// 全局开关判断：SHOW_331_FEATURE 控制是否显示「协同岗层级管理」tab
async function fetchGlobalsList(): Promise<void> {
  try {
    const res = await getGlobalsList();
    const list = (res as unknown as { data?: Array<{ name: string; value: unknown }> })?.data ?? [];
    const show331Item = list.find((item) => item.name === 'SHOW_331_FEATURE');
    isShow331Feature.value = show331Item?.value === 'true' || show331Item?.value === true;
  } catch {
    // 忽略错误
  }
}

// 读取 localStorage.globalConfig.DEPARTMENT_SYNC_SIGN 决定组织树加载方式
function readDepartmentSyncSign(): void {
  try {
    const globalConfig = JSON.parse(localStorage.getItem('globalConfig') ?? '{}');
    departmentSyncSign.value =
      globalConfig?.DEPARTMENT_SYNC_SIGN === 'true' || globalConfig?.DEPARTMENT_SYNC_SIGN === true;
  } catch {
    departmentSyncSign.value = false;
  }
}

// 非管理员：通过身份证查询所属部门
async function getUserOrgNameByIdCardNum(): Promise<void> {
  if (isAdmin) return;
  try {
    const userRes = await queryUserByIdCard({ idCard: idCardNum });
    const userDepartments =
      (userRes?.data?.userDepartments as Array<{ departmentId: string; departmentCode: string }>) ?? [];
    if (userDepartments.length > 0) {
      departmentCode.value = userDepartments[0].departmentCode;
      departmentId.value = userDepartments[0].departmentId;
    }
  } catch {
    // 忽略错误
  }
}

// 非管理员：orgIds 设为本用户 departmentId（只查本级）
function computeOrgIds(): void {
  if (!isAdmin) {
    orgIds.value = departmentId.value;
  }
}

onMounted(async () => {
  fetchGlobalsList();
  readDepartmentSyncSign();
  if (!isAdmin) {
    await getUserOrgNameByIdCardNum();
  }
  computeOrgIds();
});

onBeforeUnmount(() => {
  // 关闭同步轮询（防止内存泄漏）
  pageLoadingUtils.closePageLoading();
});
</script>

<template>
  <div class="app-container collaboration-wrap">
    <el-card shadow="always" class="card">
      <el-tabs v-model="activeName">
        <!-- 协同岗管理 -->
        <el-tab-pane label="协同岗管理" name="1">
          <ColManage
            v-if="activeName === '1' && (!isAdmin ? orgIds : true)"
            :is-admin="isAdmin"
            :org-id="orgIds"
            :department-code="departmentCode"
            :department-sync-sign="departmentSyncSign"
          />
        </el-tab-pane>

        <!-- 协同岗层级管理（受 SHOW_331_FEATURE 控制） -->
        <el-tab-pane v-if="isShow331Feature" label="协同岗层级管理" name="2">
          <ColLevelManage v-if="activeName === '2' && (!isAdmin ? orgIds : true)" />
        </el-tab-pane>

        <!-- 职能部门管理 -->
        <el-tab-pane label="职能部门管理" name="5">
          <ColFunctionManage
            v-if="activeName === '5' && (!isAdmin ? orgIds : true)"
            :org-id="orgIds"
            :is-admin="isAdmin"
          />
        </el-tab-pane>

        <!-- 协同岗编辑记录 -->
        <el-tab-pane label="协同岗编辑记录" name="3">
          <ColEditRecord
            v-if="activeName === '3'"
            :is-admin="isAdmin"
            :org-id="orgIds"
            :department-code="departmentCode"
            :department-sync-sign="departmentSyncSign"
          />
        </el-tab-pane>

        <!-- 协同岗上下岗记录 -->
        <el-tab-pane label="协同岗上下岗记录" name="4">
          <ColOnOffRecord
            v-if="activeName === '4'"
            :is-admin="isAdmin"
            :org-id="orgIds"
            :department-code="departmentCode"
            :department-sync-sign="departmentSyncSign"
          />
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<style lang="less" scoped>
// 协同岗模块容器：撑满 app-main 剩余空间
.collaboration-wrap {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 16px;

  .card {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;

    :deep(.el-card__body) {
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      padding: 12px 16px;
    }

    :deep(.el-tabs) {
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
      overflow: hidden;

      .el-tabs__header {
        flex-shrink: 0;
        margin: 0 0 @spacing-sm 0;
      }

      .el-tabs__content {
        flex: 1;
        min-height: 0;
        overflow: hidden;

        .el-tab-pane {
          height: 100%;
        }
      }
    }
  }
}
</style>
