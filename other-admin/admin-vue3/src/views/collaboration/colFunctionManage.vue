<script setup lang="ts">
import { ref } from 'vue';

import ColDefaultCoopTab from './components/ColDefaultCoopTab.vue';
import ColFunctionTab from './components/ColFunctionTab.vue';

defineOptions({ name: 'ColFunctionManage' });

interface Props {
  /** 组织 id（由父组件 index.vue 传入） */
  orgId: string;
  /** 是否管理员 */
  isAdmin?: boolean;
}

const props = defineProps<Props>();

const activeName = ref<'1' | '2'>('1');

// tab2 用 v-if 懒加载，切换到 tab2 时 ColDefaultCoopTab 的 ProTable immediate=true
// 会自动发起首次请求，无需手动 init
</script>

<template>
  <div class="tab-contanier">
    <el-tabs v-model="activeName">
      <el-tab-pane label="职能管理" name="1">
        <ColFunctionTab v-if="activeName === '1'" :org-id="props.orgId" :is-admin="props.isAdmin" />
      </el-tab-pane>
      <el-tab-pane label="默认协同岗" name="2">
        <ColDefaultCoopTab v-if="activeName === '2'" :org-id="props.orgId" />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style lang="less" scoped>
.tab-contanier {
  display: flex;
  height: 100%;
  overflow: hidden;
  background: @color-bg-card;
}

// el-tabs 撑满卡片内容区
:deep(.el-tabs) {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  // 标签头固定高度
  .el-tabs__header {
    flex-shrink: 0;
    margin: 0;
    padding: 0 16px;
    border-bottom: 1px solid @color-border;
  }

  // 内容区占满剩余高度
  .el-tabs__content {
    flex: 1;
    min-height: 0;
    overflow: hidden;

    .el-tab-pane {
      height: 100%;
      overflow: hidden;
    }
  }
}
</style>
