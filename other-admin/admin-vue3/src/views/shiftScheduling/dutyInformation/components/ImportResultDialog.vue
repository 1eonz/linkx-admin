<script setup lang="ts">
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

defineOptions({ name: 'ImportResultDialog' });

const props = defineProps<{
  /** 错误明细 map：{ 行号: [错误信息] }；为空对象时不显示 */
  errorMap: Record<string, string[]>;
}>();

const { t } = useI18n({ useScope: 'global' });

const visible = ref(false);

watch(
  () => props.errorMap,
  (val) => {
    if (val && Object.keys(val).length > 0) {
      visible.value = true;
    }
  },
);

// 拼接错误信息为 "第X行错误1，错误2<br/>"
function formatErrorHtml(errorData: Record<string, string[]>): string {
  let errorText = '';
  for (const lineNum in errorData) {
    if (Object.prototype.hasOwnProperty.call(errorData, lineNum)) {
      const errArr = errorData[lineNum];
      const errMsgStr = errArr.join('，');
      errorText += `第${lineNum}行${errMsgStr}<br/>`;
    }
  }
  return errorText;
}

function closeDialog(): void {
  visible.value = false;
}

defineExpose({ visible });
</script>

<template>
  <el-dialog
    v-model="visible"
    title="导入失败"
    :close-on-click-modal="false"
    :destroy-on-close="true"
    append-to-body
    align-center
    @close="closeDialog"
  >
    <div class="import-error-content" v-html="formatErrorHtml(errorMap)" />
    <template #footer>
      <el-button type="primary" @click="closeDialog">{{ t('determine') }}</el-button>
    </template>
  </el-dialog>
</template>

<style lang="less" scoped>
:deep(.el-dialog) {
  width: @dialog-width-md !important;
  min-width: @dialog-width-md;
}

.import-error-content {
  max-height: 50vh;
  overflow-y: auto;
  line-height: @line-height-loose;
  color: @color-danger;
}
</style>
