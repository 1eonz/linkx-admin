<script setup lang="ts">
/**
 * AppManage - 应用管理列表
 *
 * 功能特性：
 * 1. ProTable 受控模式 + SearchBar 搜索栏
 * 2. 应用图标列使用 AuthImg 鉴权图片组件
 * 3. 上架状态切换：el-switch + updateStatus 接口
 * 4. 新增/编辑调用 AppForm 弹窗，删除二次确认
 *
 * @example 父组件用法
 * ```vue
 * <AppManage />
 * ```
 */
import { Plus, Edit, Delete } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { computed, reactive, ref } from 'vue';

import AppForm from './AppForm.vue';
import { deleteInfo, getInfoPage, updateStatus, type AppItem, type AppStatus } from '@/api/thirdInterface/app';
import ActionButtons from '@/components/ActionButtons/index.vue';
import AuthImg from '@/components/AuthImg/index.vue';
import { defaultTableFormatter } from '@/components/ProTable/formatter';
import ProTable from '@/components/ProTable/index.vue';
import type { ITableColumn } from '@/components/ProTable/types';
import SearchBar from '@/components/SearchBar/index.vue';

defineOptions({ name: 'AppManage' });

// ===== 受控模式状态 =====
const list = ref<AppItem[]>([]);
const total = ref(0);
const searchParams = reactive<Record<string, unknown>>({
  name: '',
});

// 组件 ref
const tableRef = ref<InstanceType<typeof ProTable>>();
const formRef = ref<InstanceType<typeof AppForm>>();

// 上架状态切换 loading 防抖（按 id 记录）
const statusLoadingMap = reactive<Record<string, boolean>>({});

// 列定义：序号/应用图标/应用名称/应用链接·包名(packageName)/跳转参数(params)/应用ID(appId)/应用类型/应用展示范围(scopeList)/业务区域(zone)/配置前置应用(prerequisite)/创建时间/上架(switch)/操作
// 所有列均设置 min-width，避免表格宽度不足时列被挤压隐藏
const columns = computed<ITableColumn[]>(() => [
  { prop: 'icon', label: '应用图标', width: 100, align: 'center', slotName: 'icon' },
  { prop: 'name', label: '应用名称', width: 150, align: 'center', showOverflowTooltip: true },
  { prop: 'packageName', label: '应用链接/包名', minWidth: 160, align: 'center', showOverflowTooltip: true },
  { prop: 'params', label: '跳转参数', minWidth: 140, align: 'center', showOverflowTooltip: true },
  { prop: 'appId', label: '应用ID', minWidth: 120, align: 'center', showOverflowTooltip: true },
  { prop: 'type', label: '应用类型', width: 80, align: 'center', slotName: 'type' },
  { prop: 'scopeList', label: '应用展示范围', width: 120, align: 'center', slotName: 'scopeList' },
  { prop: 'zone', label: '业务区域', width: 80, align: 'center', slotName: 'zone' },
  { prop: 'prerequisite', label: '配置前置应用', width: 80, align: 'center', slotName: 'prerequisite' },
  { prop: 'createTime', label: '创建时间', width: 180, align: 'center', showOverflowTooltip: true },
  { prop: 'status', label: '上架', width: 100, align: 'center', slotName: 'status' },
  {
    prop: 'actions',
    label: '操作',
    fixed: 'right',
    width: 200,
    align: 'center',
    slotName: 'actions',
  },
]);

// 搜索区按钮：新增
const actions = computed(() => [{ label: '新增', type: 'primary' as const, icon: Plus, onClick: handleCreate }]);

const searchPlaceholder = computed(() => '请输入应用名称');

// ===== ProTable @response 回调 =====
function handleResponse(res: unknown): void {
  // packageName 字段在响应中不存在，根据 type 计算后端实际显示的值
  // type !== 0（H5 应用）显示 packageAndroid；type === 0 显示 url
  const records = defaultTableFormatter.getRecords(res) as AppItem[];
  list.value = records.map((item) => ({
    ...item,
    packageName: item.type !== 0 ? item.packageAndroid : item.url,
  }));
  total.value = defaultTableFormatter.getTotal(res);
}

// ===== 搜索/重置 =====
function handleSearch(): void {
  tableRef.value?.init();
}

function handleReset(): void {
  searchParams.name = '';
  tableRef.value?.init();
}

// 新增
function handleCreate(): void {
  formRef.value?.open('create');
}

// 编辑
function handleUpdate(row: AppItem): void {
  formRef.value?.open('update', row.id);
}

// 上架状态切换
// active-value=0（上架）、inactive-value=1（下架）
// 完全使用 before-change 钩子处理：弹确认 + 调 API，成功才返回 true 让 switch 切换
// 不使用 @change，避免数据初始化 / refresh 时 v-model 值变化误触发 API
async function handleStatusBeforeChange(row: AppItem, newStatus: AppStatus): Promise<boolean> {
  // status===0 为上架，否则为下架
  const text = newStatus === 0 ? '上架' : '下架';
  const appName = row?.name ?? '';

  // 1. 弹二次确认
  try {
    await ElMessageBox.confirm(`确认要${text}"${appName}"应用吗?`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info',
    });
  } catch {
    // 用户取消：不切换
    return false;
  }

  // 2. 调用接口
  statusLoadingMap[row.id] = true;
  try {
    const res = await updateStatus({ id: row.id, status: newStatus });
    if (res.code === 0) {
      ElMessage.success(`${text}成功`);
      // 调用 refresh 重新拉取列表，保证数据与服务端一致
      // 注意：refresh 会导致 v-model 值变化，但因为不使用 @change，不会触发 API
      tableRef.value?.refresh();
      return true;
    }
    // 接口返回业务错误（code !== 0）：http 拦截器已弹错误提示，此处不再重复
    // 但若 res.msg 有值且与拦截器不同，可补充提示
    if (res.msg && !res.msg.includes('请求失败')) {
      ElMessage.error(res.msg);
    }
    return false;
  } catch {
    // 网络异常等：http 拦截器已弹错误提示，此处不再重复
    return false;
  } finally {
    statusLoadingMap[row.id] = false;
  }
}

// 删除
function handleDelete(row: AppItem): void {
  ElMessageBox.confirm('确认删除应用吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'info',
  })
    .then(() => {
      deleteInfo(row.id)
        .then((result) => {
          if (result.code === 0) {
            ElMessage.success('删除成功');
            tableRef.value?.refresh();
          } else {
            ElMessage.error(result.msg ?? '删除失败');
          }
        })
        .catch(() => {});
    })
    .catch(() => {});
}

/** 是否为官方应用（不显示删除按钮） */
function isOfficial(row: AppItem): boolean {
  return row.official === 1;
}

// ===== 类型映射 =====
const typeMap: Record<number, string> = {
  0: 'H5应用',
  1: 'App应用',
  3: '前置应用',
};

const zoneMap: Record<number, string> = {
  1: '一类区',
  2: '二类区',
  3: '三类区',
};

// 配置前置应用：是否有前置应用
const hasPreAppMap: Record<string, string> = {
  true: '是',
  false: '否',
};

// 应用展示范围 scope 值 → 名称
const scopeMap: Record<number, string> = {
  1: '鸿蒙移动端',
  2: '安卓移动端',
  4: 'PC浏览器',
  8: 'PC桌面端',
};

/** 格式化应用展示范围 */
function formatScope(scopeList?: Array<{ id: number; name: string }> | number[]): string {
  if (!Array.isArray(scopeList) || scopeList.length === 0) return '';
  // 兼容 [{id,name}] 形式，scopeMap 按 id 映射
  const ids = scopeList.map((item) => (typeof item === 'number' ? item : (item as { id: number }).id));
  return ids
    .map((id) => scopeMap[id as number])
    .filter(Boolean)
    .join('、');
}

/** 从 ProTable slot scope 中安全获取 AppItem */
function getRow(scope: any): AppItem {
  return (scope?.row as AppItem) ?? ({} as AppItem);
}
</script>

<template>
  <div class="app-manage">
    <SearchBar :placeholder="searchPlaceholder" :actions="actions" @search="handleSearch" @reset="handleReset">
      <template #filters>
        <el-input
          v-model="searchParams.name as string"
          :placeholder="searchPlaceholder"
          class="filter-item"
          style="width: 220px"
          clearable
          @keyup.enter="handleSearch"
        />
      </template>
    </SearchBar>

    <ProTable
      ref="tableRef"
      :columns="columns"
      :fetch-api="getInfoPage"
      :data="list"
      :total="total"
      :search-params="searchParams"
      show-index
      index-label="序号"
      :index-width="80"
      @response="handleResponse"
    >
      <!-- 应用图标列：AuthImg 鉴权渲染 -->
      <template #icon="scope">
        <AuthImg v-if="getRow(scope).icon" :auth-src="getRow(scope).icon as string" class="app-icon" />
        <span v-else class="app-icon-empty">-</span>
      </template>

      <!-- 应用类型列 -->
      <template #type="scope">
        <el-tag>{{ typeMap[getRow(scope).type] ?? '-' }}</el-tag>
      </template>

      <!-- 应用展示范围列：scopeList 转文本 -->
      <template #scopeList="scope">
        {{ formatScope(getRow(scope).scopeList) }}
      </template>

      <!-- 业务区域列：前置应用（type=3）不显示业务区域 -->
      <template #zone="scope">
        {{ getRow(scope).type === 3 ? '-' : (zoneMap[getRow(scope).zone] ?? '-') }}
      </template>

      <!-- 配置前置应用列 -->
      <template #prerequisite="scope">
        {{ hasPreAppMap[String(Boolean(getRow(scope).prerequisite))] ?? '-' }}
      </template>

      <!-- 上架状态列：active-value=0（上架）/ inactive-value=1（下架） -->
      <!-- 仅使用 before-change：弹确认 + 调 API，成功才返回 true 让 switch 切换 -->
      <!-- 不使用 @change：避免数据初始化 / refresh 时 v-model 值变化误触发 API -->
      <template #status="scope">
        <el-switch
          v-model="getRow(scope).status"
          :loading="statusLoadingMap[getRow(scope).id]"
          active-text="上架"
          inactive-text="下架"
          inline-prompt
          :active-value="0"
          :inactive-value="1"
          :before-change="() => handleStatusBeforeChange(getRow(scope), getRow(scope).status === 0 ? 1 : 0)"
        />
      </template>

      <!-- 操作列：官方应用（official=1）不显示删除按钮 -->
      <template #actions="scope">
        <ActionButtons
          :buttons="[
            { type: 'primary', icon: Edit, label: '编辑', onClick: () => handleUpdate(getRow(scope)) },
            {
              type: 'danger',
              icon: Delete,
              label: '删除',
              onClick: () => handleDelete(getRow(scope)),
              visible: !isOfficial(getRow(scope)),
            },
          ]"
        />
      </template>
    </ProTable>

    <AppForm ref="formRef" @success="tableRef?.refresh()" />
  </div>
</template>

<style lang="less" scoped>
.app-manage {
  width: 100%;
}

.filter-item {
  display: inline-block;
  vertical-align: middle;
}

.app-icon {
  width: 40px;
  height: 40px;
  object-fit: cover;
  border-radius: 4px;
}

.app-icon-empty {
  display: inline-block;
  color: @color-text-placeholder;
}
</style>
