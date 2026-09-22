<script setup lang="ts">
/* global console */
/**
 * AppsManageDetailModal - 可调用应用详情弹窗
 *
 * 南向应用详情弹窗：
 * 1. open(row) 接收行数据，调用 getCallableAppDetail(row.id) 获取详情
 * 2. 使用 el-descriptions 分组展示：基本信息/接口配置/数据库配置/字段映射配置/其他信息
 * 3. parsedMapperList 解析 row.mapper JSON，兼容数组和对象两种结构
 */
import { computed, ref } from 'vue';

import { getCallableAppDetail, type CallableApp } from '@/api/thirdInterface/southInterface';

defineOptions({ name: 'AppsManageDetailModal' });

// ===== 弹窗状态 =====
const dialogVisible = ref(false);
const loading = ref(false);
const row = ref<CallableApp>({} as CallableApp);

// ===== 数据刷新周期映射 =====
const periodMap: Record<number, string> = {
  30: '30min',
  60: '1h',
  360: '6h',
  720: '12h',
  1440: '24h',
};

// ===== 数据库类型映射 =====
const dbTypeMap: Record<number, string> = {
  1: 'MySQL',
  2: 'Oracle',
  3: 'PostgreSQL',
  4: 'SQL Server',
};

/**
 * 获取数据库类型显示文本
 *
 * 将数据库类型编码（1/2/3/4）转换为对应的名称（MySQL/Oracle/PostgreSQL/SQL Server）。
 * 入参兼容数字、字符串、空值；无法识别时原样返回字符串形式。
 *
 * @param dbType 数据库类型编码（1:MySQL 2:Oracle 3:PostgreSQL 4:SQL Server），允许 number/string/null/undefined
 * @returns 数据库类型显示文本；入参为空返回 '-'，未匹配返回入参的字符串形式
 */
function getDbTypeLabel(dbType: unknown): string {
  if (dbType === null || dbType === undefined || dbType === '') return '-';
  const num = Number(dbType);
  return dbTypeMap[num] ?? String(dbType);
}

/** 基本信息列表 */
const basicInfoList = computed(() => [
  { label: '名称', value: row.value.name || '-' },
  { label: '所属系统', value: row.value.systemName || '-' },
  { label: '系统编码', value: row.value.systemCode || '-' },
  {
    label: '应用类型',
    value: row.value.type === 1 ? 'RESTful接口' : row.value.type === 2 ? '数据库' : '-',
  },
  {
    label: '展示范围',
    value: row.value.scope === 0 ? '全部' : row.value.scope === 1 ? 'PC端' : row.value.scope === 2 ? '移动端' : '-',
  },
  { label: '唯一标识字段', value: row.value.uniqueId || '-' },
  {
    label: '数据刷新周期',
    value: periodMap[Number(row.value.period)] ?? '-',
  },
  { label: 'IP', value: (row.value.ip as string) || '-' },
  {
    label: '端口',
    value: row.value.port !== undefined && row.value.port !== null ? String(row.value.port) : '-',
  },
]);

/** 接口配置列表（仅 type===1 时显示） */
const interfaceInfoList = computed(() => {
  // 类型字段做 Number 转换以兼容字符串/数字存储
  const pagenationType = Number(row.value.pagenationType);
  const pageParamLocation = Number(row.value.pageParamLocation);
  return [
    { label: '访问协议', value: (row.value.protocol as string) || '-' },
    { label: '请求方式', value: (row.value.method as string) || '-' },
    { label: '接口 URI', value: (row.value.uri as string) || '-' },
    { label: '请求头', value: (row.value.reqHeader as string) || '-' },
    { label: '请求体', value: (row.value.reqBody as string) || '-' },
    { label: '请求参数', value: (row.value.reqParam as string) || '-' },
    {
      label: '是否分页',
      value: row.value.pagenation === 1 ? '是' : '否',
    },
    {
      label: '分页类型',
      value: pagenationType === 1 ? '页码模式' : pagenationType === 2 ? '偏移模式' : '-',
    },
    {
      label: '分页参数类型',
      value: pageParamLocation === 1 ? 'Body 参数' : 'Query 参数',
    },
    { label: '页码字段', value: (row.value.pageFieldName as string) || '-' },
    { label: '每页条数字段', value: (row.value.pageSizeFieldName as string) || '-' },
    { label: '响应数据路径', value: (row.value.responseDataPath as string) || '-' },
  ];
});

/** 数据库配置列表（仅 type===2 时显示） */
const databaseInfoList = computed(() => [
  { label: '数据库类型', value: getDbTypeLabel(row.value.dbType) },
  { label: '账号', value: (row.value.account as string) || '-' },
  { label: '表名/视图名', value: (row.value.dataName as string) || '-' },
  { label: '数据库名', value: (row.value.databaseName as string) || '-' },
]);

/** 解析 mapper JSON，兼容数组和对象两种结构 */
const parsedMapperList = computed<{ key: string; value: string }[]>(() => {
  const mapper = row.value.mapper;
  if (!mapper) return [];
  try {
    const parsed = JSON.parse(mapper);
    if (Array.isArray(parsed)) {
      return parsed.map((item: Record<string, unknown>) => ({
        key: (item.key as string) ?? (item.source as string) ?? '-',
        value: (item.value as string) ?? (item.target as string) ?? '-',
      }));
    }
    if (typeof parsed === 'object' && parsed !== null) {
      return Object.entries(parsed).map(([key, value]) => ({
        key,
        value: typeof value === 'object' ? JSON.stringify(value) : String(value),
      }));
    }
    return [];
  } catch {
    return [];
  }
});

/**
 * 打开详情弹窗
 *
 * 显示弹窗并清空当前数据，随后调用 getAppDetail 异步拉取最新详情。
 * 调用后弹窗处于 loading 状态，直到详情请求完成。
 *
 * @param rowData 当前行数据，仅使用其 id 字段发起详情请求
 * @returns 无返回值（Promise<void>）
 */
async function open(rowData: CallableApp): Promise<void> {
  dialogVisible.value = true;
  row.value = {} as CallableApp;
  await getAppDetail(rowData.id);
}

defineExpose({
  /** 打开详情弹窗，传入 row 数据 */
  open,
});

/**
 * 获取应用详情数据
 *
 * 调用后端 getCallableAppDetail 接口拉取详情，code===0 时填充 row，否则清空 row。
 * 异常或失败时同样回退为空对象，避免上一条数据残留。
 *
 * @param id 应用 ID
 * @returns 无返回值（Promise<void>）
 */
async function getAppDetail(id: string): Promise<void> {
  try {
    loading.value = true;
    const res = await getCallableAppDetail(id);
    const { data, code, msg } = res || {};
    if (code === 0) {
      row.value = (data as CallableApp) ?? ({} as CallableApp);
    } else {
      row.value = {} as CallableApp;
      if (msg) {
        console.error(msg);
      }
    }
  } catch {
    row.value = {} as CallableApp;
  } finally {
    loading.value = false;
  }
}

/**
 * 关闭弹窗
 *
 * 仅关闭弹窗 visible 状态，不重置 row 数据（下次 open 会重新拉取）。
 *
 * @returns 无返回值
 */
function handleClose(): void {
  dialogVisible.value = false;
}
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    title="应用详情"
    width="800px"
    align-center
    append-to-body
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div v-loading="loading" class="detail-content">
      <!-- 基本信息 -->
      <el-descriptions class="custom-descriptions" title="基本信息" :column="2" border>
        <el-descriptions-item v-for="item in basicInfoList" :key="item.label" :label="item.label">
          {{ item.value }}
        </el-descriptions-item>
      </el-descriptions>

      <!-- 接口配置（type===1 时显示） -->
      <el-descriptions
        v-if="row.type === 1"
        class="custom-descriptions desc-section"
        title="接口配置"
        :column="2"
        border
      >
        <el-descriptions-item v-for="item in interfaceInfoList" :key="item.label" :label="item.label">
          {{ item.value }}
        </el-descriptions-item>
      </el-descriptions>

      <!-- 数据库配置（type===2 时显示） -->
      <el-descriptions
        v-if="row.type === 2"
        class="custom-descriptions desc-section"
        title="数据库配置"
        :column="2"
        border
      >
        <el-descriptions-item v-for="item in databaseInfoList" :key="item.label" :label="item.label">
          {{ item.value }}
        </el-descriptions-item>
      </el-descriptions>

      <!-- 字段映射配置（parsedMapperList.length > 0 时显示） -->
      <el-descriptions
        v-if="parsedMapperList.length > 0"
        class="custom-descriptions desc-section"
        title="字段映射配置"
        :column="2"
        border
      >
        <el-descriptions-item v-for="(item, index) in parsedMapperList" :key="index" :label="item.value">
          {{ item.key }}
        </el-descriptions-item>
      </el-descriptions>

      <!-- 其他信息 -->
      <el-descriptions class="custom-descriptions desc-section" title="其他信息" :column="2" border>
        <el-descriptions-item label="创建时间" :span="2">
          {{ row.gmtCreated || '-' }}
        </el-descriptions-item>
      </el-descriptions>
    </div>

    <template #footer>
      <el-button @click="handleClose">关闭</el-button>
    </template>
  </el-dialog>
</template>

<style lang="less" scoped>
.detail-content {
  max-height: 70vh;
  overflow-y: auto;
  overflow-x: hidden;
  word-wrap: break-word;
  word-break: break-all;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: @color-border;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-track {
    background-color: @color-bg-page;
  }
}

.desc-section {
  margin-top: 20px;
}

:deep(.el-descriptions) {
  .el-descriptions__table.is-bordered {
    table-layout: fixed;
  }

  .el-descriptions__label.el-descriptions__cell.is-bordered-label {
    width: 200px;
  }

  .el-descriptions__cell {
    word-break: break-all;

    .el-descriptions__content {
      display: inline-block;
      max-width: 100%;
      overflow-wrap: break-word;
      word-wrap: break-word;
      word-break: break-all;
    }
  }
}
</style>
