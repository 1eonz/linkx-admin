<script setup lang="ts">
/**
 * TicketDetail - 警单详情弹窗
 *
 * 功能特性：
 * 1. 使用 el-descriptions 展示警单 6 项核心字段
 * 2. 父组件通过 ref + open(id) 调用，内部调用 getPoliceticketById 拉取详情
 * 3. 加载中显示 loading 遮罩
 *
 * @example 父组件调用
 * ```vue
 * <TicketDetail ref="detailRef" />
 * detailRef.value?.open(row.id)
 * ```
 *
 * Props: 无
 */
import { ElMessage } from 'element-plus';
import { ref } from 'vue';

import { getPoliceticketById, type PoliceticketItem } from '@/api/thirdInterface/policeReport';

defineOptions({ name: 'TicketDetail' });

// ===== 弹窗状态 =====
const dialogVisible = ref(false);
const loading = ref(false);
const detail = ref<PoliceticketItem | null>(null);

/** 打开详情弹窗，根据 id 拉取详情 */
async function open(id: string): Promise<void> {
  dialogVisible.value = true;
  loading.value = true;
  detail.value = null;
  try {
    const res = await getPoliceticketById(id);
    if (res.code === 0) {
      detail.value = res.data;
    } else {
      ElMessage.error(res.msg ?? '获取详情失败');
    }
  } catch {
    ElMessage.error('获取详情失败');
  } finally {
    loading.value = false;
  }
}

defineExpose({ open });
</script>

<template>
  <el-dialog v-model="dialogVisible" title="警单详情" width="640px" align-center append-to-body>
    <el-descriptions v-if="detail" v-loading="loading" :column="2" border>
      <el-descriptions-item label="警单编号">
        {{ detail.code ?? '-' }}
      </el-descriptions-item>
      <el-descriptions-item label="警单名称">
        {{ detail.name ?? '-' }}
      </el-descriptions-item>
      <el-descriptions-item label="标签">
        {{ detail.tag ?? '-' }}
      </el-descriptions-item>
      <el-descriptions-item label="来源">
        {{ detail.source ?? '-' }}
      </el-descriptions-item>
      <el-descriptions-item label="关联协同岗">
        {{ detail.origin ?? '-' }}
      </el-descriptions-item>
      <el-descriptions-item label="创建时间">
        {{ detail.createTime ?? '-' }}
      </el-descriptions-item>
      <el-descriptions-item label="警单内容" :span="2">
        {{ detail.content ?? '-' }}
      </el-descriptions-item>
    </el-descriptions>
    <div v-else-if="loading" v-loading="true" style="height: 120px" />
    <template #footer>
      <el-button type="primary" @click="dialogVisible = false">关闭</el-button>
    </template>
  </el-dialog>
</template>

<style lang="less" scoped></style>
