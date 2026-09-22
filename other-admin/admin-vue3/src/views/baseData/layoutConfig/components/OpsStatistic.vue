<script setup lang="ts">
/**
 * OpsStatistic - 运维统计
 *
 * 功能特性：
 * 1. 日期范围选择器（datetimerange）
 * 2. 日期跨度限制：起始时间与结束时间相差不超过 ±1 年（同月日）
 * 3. 导出按钮 → exportLoginStatistic → Blob 下载为 Excel 文件
 * 4. 错误兜底：若返回的是 JSON 错误体（非 ArrayBuffer），解析后提示错误信息
 */
import { Download } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { ref } from 'vue';

import { exportLoginStatistic } from '@/api/baseData/layoutConfig';
import SectionTitle from '@/components/SectionTitle/index.vue';
import { getServiceFile } from '@/utils';

defineOptions({ name: 'OpsStatistic' });

/** 日期范围（[startTime, endTime]） */
const dateRange = ref<[string, string] | []>([]);

const exporting = ref(false);

/** 日期禁用函数：限制选择范围内的日期跨度不超过 1 年 */
function disabledDate(current: Date): boolean {
  if (!dateRange.value || dateRange.value.length < 1) {
    return false;
  }
  const [start] = dateRange.value;
  if (!start) return false;
  const startMs = new Date(start).getTime();
  const currentMs = current.getTime();
  const oneYearMs = 365 * 24 * 60 * 60 * 1000;
  // 当前日期与起始日期相差超过 1 年则禁用
  return currentMs < startMs - oneYearMs || currentMs > startMs + oneYearMs;
}

/** 校验日期范围 */
function validateDateRange(): { startTime: string; endTime: string } | null {
  if (!dateRange.value || dateRange.value.length !== 2) {
    ElMessage.warning('请选择日期范围');
    return null;
  }
  const [startTime, endTime] = dateRange.value;
  if (!startTime || !endTime) {
    ElMessage.warning('请选择完整的日期范围');
    return null;
  }
  // 校验跨度不超过 1 年（同月日 ±1 年）
  const start = new Date(startTime);
  const end = new Date(endTime);
  const diffMs = Math.abs(end.getTime() - start.getTime());
  const oneYearMs = 365 * 24 * 60 * 60 * 1000;
  if (diffMs > oneYearMs) {
    ElMessage.warning('日期跨度不能超过 1 年');
    return null;
  }
  return {
    startTime: formatDateTime(startTime),
    endTime: formatDateTime(endTime),
  };
}

/** 格式化日期时间为 YYYY-MM-DD HH:mm:ss */
function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  const pad = (n: number): string => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(
    d.getMinutes(),
  )}:${pad(d.getSeconds())}`;
}

/** 导出登录统计数据 */
async function handleExport(): Promise<void> {
  const params = validateDateRange();
  if (!params) return;
  exporting.value = true;
  try {
    const res = await exportLoginStatistic(params);
    // 错误兜底：若返回的是 JSON 错误体（非 ArrayBuffer 或 ArrayBuffer 解析为 JSON）
    if (res.code !== 0) {
      // 注意：responseType: arraybuffer 时，错误响应也是 ArrayBuffer，需要尝试解析为 JSON
      const errMsg = parseArrayBufferError(res.data);
      ElMessage.error(errMsg || res.msg || '导出失败');
      return;
    }
    const buffer = res.data;
    if (!buffer) {
      ElMessage.error('导出数据为空');
      return;
    }
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const filename = `登录统计_${params.startTime}_${params.endTime}.xlsx`;
    getServiceFile(blob, filename);
    ElMessage.success('导出成功');
  } catch {
    ElMessage.error('导出失败');
  } finally {
    exporting.value = false;
  }
}

/** 尝试将 ArrayBuffer 解析为 JSON 错误体（仅用于错误兜底） */
function parseArrayBufferError(buffer: unknown): string {
  if (!buffer) return '';
  try {
    if (buffer instanceof ArrayBuffer) {
      const text = new TextDecoder().decode(buffer);
      const json = JSON.parse(text) as { msg?: string; message?: string };
      return json.msg || json.message || '';
    }
  } catch {
    // 不是 JSON，忽略
  }
  return '';
}
</script>

<template>
  <div class="ops-statistic">
    <div class="section">
      <SectionTitle title="登录日活统计导出" variant="border" />
      <el-form :inline="true" label-width="100px">
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="dateRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
            :disabled-date="disabledDate"
            style="width: 380px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Download" :loading="exporting" :disabled="exporting" @click="handleExport">
            导出
          </el-button>
        </el-form-item>
      </el-form>
      <el-alert
        type="info"
        :closable="false"
        show-icon
        title="日期跨度限制：起始时间与结束时间相差不超过 1 年（同月日 ±1 年）"
        style="max-width: 600px; margin-top: 8px"
      />
    </div>
  </div>
</template>

<style lang="less" scoped>
.ops-statistic {
  padding: 16px 0;
}
</style>
