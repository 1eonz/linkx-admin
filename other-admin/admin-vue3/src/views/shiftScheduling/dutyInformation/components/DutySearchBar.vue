<script setup lang="ts">
import { Search, Refresh, Download, Upload as UploadIcon, Delete } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import type { UploadInstance } from 'element-plus';
import { ref, reactive, onMounted, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';

import { uploadDutyInformationFile, type ImportResultData } from '@/api/shiftScheduling';
import { getDutyTypes, type DutyTypeItem } from '@/api/shiftScheduling/dutyType';

defineOptions({ name: 'DutySearchBar' });

defineProps<{
  /** 是否列表视图（仅列表模式显示「批量删除」） */
  showType: 'calendar' | 'list';
}>();

const emit = defineEmits<{
  (e: 'search'): void;
  (e: 'reset'): void;
  /** 列表模式下批量删除 */
  (e: 'batch-delete'): void;
  /** 导入成功后刷新（payload: 导入结果 data） */
  (e: 'import-success', data: ImportResultData): void;
  /** 模板下载 */
  (e: 'template-download'): void;
}>();

const { t } = useI18n({ useScope: 'global' });

// 双向绑定的搜索条件：userId/userName/type/date
const listQuery = reactive({
  userId: '',
  userName: '',
  type: '' as string,
  date: [] as string[],
});

// 排班类型选项 + 分页状态
const dutyTypeOptions = ref<{ label: string; value: string }[]>([]);
const dutyTypePage = reactive({
  pageNum: 1,
  pageSize: 20,
  total: 0,
  hasMore: true,
});
const dutyTypeLoading = ref(false);

const uploadRef = ref<UploadInstance>();

// 分页获取排班类型，支持「加载更多」
async function getDutyTypeOptions(isLoadMore = false): Promise<void> {
  if (dutyTypeLoading.value) return;
  if (isLoadMore && !dutyTypePage.hasMore) return;

  dutyTypeLoading.value = true;
  try {
    const res = await getDutyTypes({
      pageNum: isLoadMore ? dutyTypePage.pageNum + 1 : 1,
      pageSize: dutyTypePage.pageSize,
    });
    const data = res?.data;
    const types = data?.records ?? [];
    const total = data?.total ?? 0;
    const mapped = types.map((item: DutyTypeItem) => ({
      label: `${item.name}(${item.type})`,
      value: item.type,
    }));
    if (isLoadMore) {
      dutyTypeOptions.value = [...dutyTypeOptions.value, ...mapped];
      dutyTypePage.pageNum += 1;
    } else {
      dutyTypeOptions.value = mapped;
      dutyTypePage.pageNum = 1;
    }
    dutyTypePage.total = total;
    dutyTypePage.hasMore = dutyTypeOptions.value.length < total;
  } catch (e) {
    console.error('获取排班类型失败', e);
  } finally {
    dutyTypeLoading.value = false;
  }
}

// 下拉滚动距底部 50px 触发加载更多
function handleDutyTypeScroll(e: Event): void {
  const target = e.target as HTMLElement;
  const { scrollHeight, scrollTop, clientHeight } = target;
  if (scrollHeight - scrollTop - clientHeight < 50) {
    getDutyTypeOptions(true);
  }
}

// 绑定下拉滚动监听（nextTick + setTimeout 等待 popper 渲染完成）
async function bindScrollListener(): Promise<void> {
  await nextTick();
  setTimeout(() => {
    const popper = document.querySelector('.duty-type-select-popper .el-select-dropdown__wrap');
    if (popper) {
      popper.addEventListener('scroll', handleDutyTypeScroll);
    }
  }, 1000);
}

function handleSearch(): void {
  emit('search');
}

function handleReset(): void {
  listQuery.userId = '';
  listQuery.userName = '';
  listQuery.type = '';
  listQuery.date = [];
  emit('reset');
}

function handleBatchDelete(): void {
  emit('batch-delete');
}

// 上传：FormData 上传，解析 res.data.errorMap/successList
async function uploadFileBtn(param: { file: File }): Promise<void> {
  const formData = new FormData();
  formData.append('file', param.file);
  uploadRef.value?.clearFiles();
  uploadDutyInformationFile(formData)
    .then((res) => {
      if (res.code === 0) {
        const data = res?.data;
        if (data?.successList?.length > 0) {
          emit('import-success', data);
        }
        if ((!data?.errorMap || Object.keys(data.errorMap).length === 0) && data?.successList?.length > 0) {
          ElMessage.success('上传成功');
        }
      } else if (res.code === 1) {
        // 整体失败（res.data 直接是 errorMap）
        emit('import-success', { errorMap: res?.data as unknown as Record<string, string[]>, successList: [] });
      } else {
        ElMessage.error(res.msg || '');
      }
    })
    .catch(() => {
      ElMessage.error('上传失败');
    });
}

/** 暴露给父组件读取当前搜索条件 */
defineExpose({
  getQuery: () => ({
    userId: listQuery.userId,
    userName: listQuery.userName,
    type: listQuery.type,
    date: listQuery.date,
  }),
});

onMounted(() => {
  getDutyTypeOptions();
  bindScrollListener();
});
</script>

<template>
  <div class="filter-container">
    <el-input
      v-model="listQuery.userId"
      placeholder="人员ID"
      class="filter-item"
      style="width: 200px"
      clearable
      @keyup.enter="handleSearch"
    />
    <el-input
      v-model="listQuery.userName"
      placeholder="姓名"
      class="filter-item"
      style="width: 200px"
      clearable
      @keyup.enter="handleSearch"
    />
    <el-select
      v-model="listQuery.type"
      placeholder="排班类型"
      class="filter-item"
      style="width: 200px"
      clearable
      popper-class="duty-type-select-popper"
      @change="handleSearch"
    >
      <el-option v-for="item in dutyTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
      <div v-if="dutyTypeLoading" class="duty-type-tip">加载中...</div>
      <div v-else-if="!dutyTypePage.hasMore && dutyTypeOptions.length > 1" class="duty-type-tip">已加载全部</div>
    </el-select>
    <el-date-picker
      v-model="listQuery.date"
      type="daterange"
      range-separator="-"
      start-placeholder="开始日期"
      end-placeholder="结束日期"
      class="filter-item"
      value-format="YYYY-MM-DD"
      style="display: inline-flex; align-items: center"
      @change="handleSearch"
    />
    <el-button class="filter-item" type="primary" :icon="Search" @click="handleSearch">
      {{ t('index.operations.search') }}
    </el-button>
    <el-button class="filter-item" type="primary" :icon="Refresh" @click="handleReset"> 重置 </el-button>
    <!-- 模板下载：由父组件实现（emit 'template-download'） -->
    <el-button class="filter-item" type="primary" :icon="Download" @click="$emit('template-download')">
      模板下载
    </el-button>
    <el-upload
      ref="uploadRef"
      class="filter-item"
      action="#"
      accept=".xlsx,.xls,.csv"
      :http-request="uploadFileBtn"
      :show-file-list="false"
    >
      <el-button type="primary" :icon="UploadIcon">导入</el-button>
    </el-upload>
    <el-button v-if="showType === 'list'" class="filter-item" type="danger" :icon="Delete" @click="handleBatchDelete">
      {{ t('index.operations.batchRemove') }}
    </el-button>
  </div>
</template>

<style lang="less" scoped>
.filter-container {
  padding-bottom: 10px;

  .filter-item {
    display: inline-block;
    vertical-align: middle;
    margin-bottom: 10px;
    margin-left: 10px;

    &:first-child {
      margin-left: 0;
    }
  }

  // 确保 el-select 清除按钮可见
  :deep(.el-select) {
    .el-input__icon {
      &.el-select__caret {
        &.is-show-close {
          display: inline-block !important;
          visibility: visible !important;
          opacity: 1 !important;
        }
      }
    }
  }
}

.duty-type-tip {
  padding: 10px;
  text-align: center;
  color: @color-info;
  font-size: @font-size-md;
}
</style>
