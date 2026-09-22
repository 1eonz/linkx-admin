<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { useI18n } from 'vue-i18n';

import type { ThirdAppForm } from '@/api/resource/thirdApp';

defineOptions({ name: 'ThirdPartyDetail' });

const { t } = useI18n({ useScope: 'global' });

const dialogVisible = ref(false);

// thirdAppForm 默认值
const defaultForm = (): Required<ThirdAppForm> => ({
  id: '',
  clientName: '',
  clientId: '',
  clientSecret: '',
  clientType: '',
  tokenTime: '',
  refreshTokenTime: '',
  status: 0,
  remark: '',
});

const thirdAppForm = reactive<Required<ThirdAppForm>>(defaultForm());

const dialogTitle = computed(() => t('index.thirdPartyApp.thirdPartyAppDetail'));

// init(row?) —— 从 row 拷贝字段
function init(row?: ThirdAppForm): void {
  Object.assign(thirdAppForm, defaultForm());
  if (row) {
    thirdAppForm.clientName = row.clientName ?? '';
    thirdAppForm.clientId = row.clientId ?? '';
    thirdAppForm.clientSecret = row.clientSecret ?? '';
    thirdAppForm.clientType = row.clientType ?? '';
    thirdAppForm.tokenTime = row.tokenTime ?? '';
    thirdAppForm.refreshTokenTime = row.refreshTokenTime ?? '';
    thirdAppForm.status = row.status ?? 0;
    thirdAppForm.remark = row.remark ?? '';
  }
  dialogVisible.value = true;
}

// closeDialog → dialogVisible = false
function closeDialog(): void {
  dialogVisible.value = false;
}

defineExpose({ init });
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    :title="dialogTitle"
    :close-on-click-modal="false"
    :destroy-on-close="true"
    append-to-body
    align-center
    @close="closeDialog"
  >
    <div class="detail-wrapper">
      <el-row class="detail-row">
        <el-col :span="12">
          <div>
            <span class="label">应用名称：</span>
            <span class="value">{{ thirdAppForm.clientName }}</span>
          </div>
        </el-col>
        <el-col :span="12">
          <div>
            <span class="label">应用ID：</span>
            <span class="value">{{ thirdAppForm.clientId }}</span>
          </div>
        </el-col>
      </el-row>
      <el-row class="detail-row">
        <el-col :span="12">
          <div>
            <span class="label">应用密钥：</span>
            <span class="value">{{ thirdAppForm.clientSecret }}</span>
          </div>
        </el-col>
        <el-col :span="12">
          <div>
            <span class="label">Token有效期：</span>
            <span class="value">{{ thirdAppForm.tokenTime }}</span>
          </div>
        </el-col>
      </el-row>
      <el-row class="detail-row">
        <el-col :span="12">
          <div>
            <span class="label">Refresh Token有效期：</span>
            <span class="value">{{ thirdAppForm.refreshTokenTime }}</span>
          </div>
        </el-col>
        <el-col :span="12">
          <div>
            <span class="label">状态：</span>
            <el-tag class="status-tag" :type="thirdAppForm.status === 0 ? 'danger' : 'info'">
              {{ thirdAppForm.status === 0 ? '停用' : '启用' }}
            </el-tag>
          </div>
        </el-col>
      </el-row>
      <el-row class="detail-row">
        <el-col :span="12">
          <div>
            <span class="label">备注：</span>
            <span class="value">{{ thirdAppForm.remark }}</span>
          </div>
        </el-col>
      </el-row>
    </div>
    <template #footer>
      <el-button type="primary" @click="closeDialog">{{ t('determine') }}</el-button>
    </template>
  </el-dialog>
</template>

<style lang="less" scoped>
.detail-wrapper {
  :deep(.el-row) {
    text-align: left;
    margin-left: @spacing-sm-plus;
  }
}

.detail-row {
  margin-top: @spacing-md-plus;
}

.label {
  font-weight: bold;
  color: @color-text-secondary;
}

.value {
  margin-left: @spacing-sm-plus;
}

.status-tag {
  margin-left: @spacing-sm-plus;
}
</style>
