<script setup lang="ts">
import type { FormInstance } from 'element-plus';
import { computed, reactive, ref, watch } from 'vue';

import type { ClientItem } from '@/api/nodeManage/client';
defineOptions({ name: 'RejectDialog' });
const props = defineProps<{ visible: boolean; clientData: ClientItem | null; loading?: boolean }>();
const emit = defineEmits<{ (e: 'update:visible', value: boolean): void; (e: 'submit', payload: { peerId: string; desc: string }): void }>();
const dialogVisible = computed({ get: () => props.visible, set: (value: boolean) => emit('update:visible', value) });
const formRef = ref<FormInstance>();
const form = reactive({ desc: '' });
const busy = ref(false);
const clientLabel = computed(() => props.clientData?.name || props.clientData?.remark || props.clientData?.ip || '-');
function submit(): void {
  if (busy.value || props.loading) return;
  const peerId = props.clientData?.peerId;
  if (peerId) { busy.value = true; emit('submit', { peerId, desc: form.desc.trim() }); }
}
watch(() => props.loading, (value) => { if (!value) busy.value = false; });
watch(dialogVisible, (value) => { if (value) form.desc = ''; });
</script>
<template>
  <el-dialog v-model="dialogVisible" title="拒绝客户端" width="500px" append-to-body :close-on-click-modal="false">
    <p class="warning">拒绝后，该客户端将无法与本机进行数据通信。</p>
    <el-form ref="formRef" :model="form" label-width="80px">
      <el-form-item label="客户端"><span>{{ clientLabel }}</span></el-form-item>
      <el-form-item label="拒绝理由"><el-input v-model="form.desc" type="textarea" :rows="4" maxlength="200" show-word-limit placeholder="请输入拒绝理由" /></el-form-item>
    </el-form>
    <template #footer><el-button @click="dialogVisible = false">取消</el-button><el-button type="danger" :loading="loading" @click="submit">确认拒绝</el-button></template>
  </el-dialog>
</template>
<style lang="less" scoped>.warning { color: @color-warning; }</style>
