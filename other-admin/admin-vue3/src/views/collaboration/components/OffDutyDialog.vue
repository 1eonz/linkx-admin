<script setup lang="ts">
import { Refresh, SwitchButton } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ref, reactive, watch, computed } from 'vue';
import { useI18n } from 'vue-i18n';

import {
  getOnDutyUsersByPostId,
  offDutyUser,
  getLastNum,
  type OnDutyUser,
  type CollaborationItem,
} from '@/api/h5/collaboration';

defineOptions({ name: 'OffDutyDialog' });

const props = defineProps<{
  /** 弹窗显隐（v-model） */
  visible: boolean;
  /** 当前操作的协同岗对象 */
  postInfo: CollaborationItem | null;
}>();

const emit = defineEmits<{
  (e: 'update:visible', v: boolean): void;
  (e: 'success'): void;
}>();

const { t } = useI18n({ useScope: 'global' });

// 数据
const onDutyUsers = ref<OnDutyUser[]>([]);
const loading = ref(false);
// 行级下岗按钮 loading Map，key=userId
const btnLoadingMap = reactive<Record<string, boolean>>({});

// 弹窗标题：在岗人员列表 - {postName}
const dialogTitle = computed(() => {
  const prefix = t('index.collaboration.onDutyUserList');
  return props.postInfo?.postName ? `${prefix} - ${props.postInfo.postName}` : prefix;
});

// 内部 visible（v-model 双向绑定）
const innerVisible = computed({
  get: () => props.visible,
  set: (v: boolean) => emit('update:visible', v),
});

// watch visible，开启时加载在岗人员
watch(
  () => props.visible,
  (val) => {
    if (val && props.postInfo) {
      fetchOnDutyUsers();
    }
  },
);

/** 查询在岗人员 */
async function fetchOnDutyUsers(notTips = false): Promise<void> {
  if (!props.postInfo) return;
  loading.value = true;
  try {
    const res = await getOnDutyUsersByPostId(props.postInfo.id);
    if (res.code === 0) {
      const data = (res as unknown as { data?: OnDutyUser[] })?.data ?? [];
      onDutyUsers.value = data;
      // 没人在岗了，关闭弹窗并通知父组件
      if (onDutyUsers.value.length === 0 && props.visible) {
        innerVisible.value = false;
        if (!notTips) {
          ElMessage.info(t('index.collaboration.noOnDutyUserNow'));
        }
      }
    } else {
      ElMessage.error(res.msg || t('index.collaboration.queryOnDutyFailed'));
    }
  } catch {
    ElMessage.error(t('index.collaboration.queryOnDutyFailed'));
  } finally {
    loading.value = false;
  }
}

// 刷新
function handleRefresh(): void {
  fetchOnDutyUsers();
}

/** 单个下岗：getLastNum 判断是否最后一人 → 二次确认 → doOffDuty */
async function handleConfirmOffDuty(user: OnDutyUser): Promise<void> {
  btnLoadingMap[user.userId] = true;
  let isLast = false;
  try {
    const res = await getLastNum(user.id);
    // lastPeopleNum === 1 → 最后一个人员，使用特殊提示
    isLast = res.code === 0 && (res as unknown as { data?: { lastPeopleNum?: number } })?.data?.lastPeopleNum === 1;
  } catch {
    // 接口失败：用默认提示
  } finally {
    btnLoadingMap[user.userId] = false;
  }

  const messageKey = isLast ? 'index.collaboration.confirmLastOffDuty' : 'index.collaboration.confirmOffDuty';
  ElMessageBox.confirm(t(messageKey, { name: user.name }), t('index.statusTitle.tips'), {
    confirmButtonText: t('determine'),
    cancelButtonText: t('cancel'),
    type: 'warning',
  })
    .then(() => doOffDuty(user))
    .catch(() => {});
}

/** 实际下岗请求 */
async function doOffDuty(user: OnDutyUser): Promise<void> {
  if (!props.postInfo) return;
  btnLoadingMap[user.userId] = true;
  try {
    const res = await offDutyUser({
      userId: user.id,
      userName: user.name,
      postId: props.postInfo.id,
      postName: props.postInfo.postName,
    });
    if (res.code === 0) {
      ElMessage.success(t('index.collaboration.offDutySuccess'));
      await fetchOnDutyUsers(true);
      emit('success');
    } else {
      ElMessage.error(res.msg || t('index.collaboration.offDutyFailed'));
    }
  } catch {
    ElMessage.error(t('index.collaboration.offDutyFailed'));
  } finally {
    btnLoadingMap[user.userId] = false;
  }
}

/** 关闭弹窗 */
function handleClose(): void {
  onDutyUsers.value = [];
  Object.keys(btnLoadingMap).forEach((k) => delete btnLoadingMap[k]);
  emit('update:visible', false);
}
</script>

<template>
  <el-dialog
    v-model="innerVisible"
    :title="dialogTitle"
    width="800px"
    align-center
    :close-on-click-modal="false"
    :destroy-on-close="true"
    append-to-body
    @close="handleClose"
  >
    <div class="off-duty-dialog-content">
      <!-- 刷新按钮 -->
      <div class="dialog-toolbar">
        <el-button :icon="Refresh" :loading="loading" @click="handleRefresh">
          {{ t('index.collaboration.refresh') }}
        </el-button>
      </div>

      <!-- 在岗人员列表 -->
      <el-table :data="onDutyUsers" max-height="400">
        <el-table-column :label="t('index.collaboration.name')" prop="name" align="center" />
        <el-table-column :label="t('index.collaboration.idCard')" prop="idCard" align="center" />
        <el-table-column :label="t('index.collaboration.orgName')" prop="departmentName" align="center" />
        <el-table-column :label="t('index.collaboration.orgCode')" prop="departmentCode" align="center" />
        <el-table-column :label="t('index.collaboration.operation')" width="100" align="center">
          <template #default="scope">
            <el-button
              type="danger"
              link
              :icon="SwitchButton"
              :loading="btnLoadingMap[(scope.row as OnDutyUser).userId]"
              @click="handleConfirmOffDuty(scope.row as OnDutyUser)"
            >
              {{ t('index.collaboration.offDuty') }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 底部统计 -->
      <div v-if="onDutyUsers.length > 0" class="dialog-footer-info">
        {{ t('index.collaboration.totalOnDuty', { count: onDutyUsers.length }) }}
      </div>

      <!-- 空状态 -->
      <div v-if="!loading && onDutyUsers.length === 0" class="dialog-empty">
        {{ t('index.collaboration.noOnDutyUser') }}
      </div>
    </div>
  </el-dialog>
</template>

<style lang="less" scoped>
.off-duty-dialog-content {
  .dialog-toolbar {
    margin-bottom: 12px;
  }

  .dialog-footer-info {
    margin-top: 12px;
    text-align: right;
    color: @color-text-regular;
    font-size: @font-size-md;
  }

  .dialog-empty {
    padding: 40px 0;
    text-align: center;
    color: @color-info;
    font-size: @font-size-md;
  }
}
</style>
