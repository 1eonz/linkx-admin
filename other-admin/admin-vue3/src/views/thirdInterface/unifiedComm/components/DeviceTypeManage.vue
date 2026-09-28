<script setup lang="ts">
import { Edit, Plus } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import type { UploadFile } from 'element-plus';
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue';

import {
  getDeviceTypeList,
  updateDeviceType,
  updateDeviceTypeIsShow,
  uploadDeviceTypeIcon,
  type DeviceTypeItem,
} from '@/api/thirdInterface/unifiedComm';
import AuthImg from '@/components/AuthImg/index.vue';

defineOptions({ name: 'DeviceTypeManage' });

const list = ref<DeviceTypeItem[]>([]);
const loading = ref(false);
const dialogVisible = ref(false);
const submitting = ref(false);
const imageUrl = ref('');
const previewObjectUrl = ref('');
const togglingIds = ref<string[]>([]);
const form = reactive<{ id: string; icon: string; iconUri: string }>({ id: '', icon: '', iconUri: '' });

function getRow(scope: { row?: unknown }): DeviceTypeItem {
  return (scope.row ?? {}) as DeviceTypeItem;
}

function formatDateTime(value?: string): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function loadList(): Promise<void> {
  loading.value = true;
  return getDeviceTypeList()
    .then((res) => {
      if (res.code === 0) list.value = (res.data as DeviceTypeItem[]) ?? [];
      else ElMessage.error(res.msg ?? '获取设备类型列表失败');
    })
    .catch(() => {
      ElMessage.error('获取设备类型列表失败');
    })
    .finally(() => {
      loading.value = false;
    });
}

function handleShowChange(row: DeviceTypeItem): Promise<void> | void {
  if (togglingIds.value.includes(row.id)) return;
  const previous = row.isShow === 1 ? 0 : 1;
  togglingIds.value.push(row.id);
  return updateDeviceTypeIsShow(row.id, row.isShow)
    .then((res) => {
      if (res.code !== 0) {
        row.isShow = previous;
        ElMessage.error(res.msg ?? '修改失败');
        return;
      }
      ElMessage.success('修改成功');
    })
    .catch(() => {
      row.isShow = previous;
      ElMessage.error('修改失败');
    })
    .finally(() => {
      togglingIds.value = togglingIds.value.filter((id) => id !== row.id);
    });
}

function openEdit(row: DeviceTypeItem): void {
  if (previewObjectUrl.value) URL.revokeObjectURL(previewObjectUrl.value);
  previewObjectUrl.value = '';
  Object.assign(form, { id: row.id, icon: row.icon ?? '', iconUri: row.iconUri ?? '' });
  imageUrl.value = row.iconUri ?? '';
  dialogVisible.value = true;
}

function validateImage(file: File): boolean {
  if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
    ElMessage.error('图片只能是 jpg/png/gif 格式');
    return false;
  }
  if (file.size / 1024 / 1024 >= 5) {
    ElMessage.error('图片大小不能超过 5MB');
    return false;
  }
  return true;
}

function handleImageChange(file: UploadFile): Promise<void> | void {
  if (submitting.value || !file.raw || !validateImage(file.raw)) return;
  const previousImageUrl = form.iconUri;
  if (previewObjectUrl.value) URL.revokeObjectURL(previewObjectUrl.value);
  imageUrl.value = URL.createObjectURL(file.raw);
  previewObjectUrl.value = imageUrl.value;
  submitting.value = true;
  return uploadDeviceTypeIcon(file.raw)
    .then((res) => {
      if (res.code !== 0) {
        imageUrl.value = previousImageUrl;
        ElMessage.error(res.msg ?? '上传失败');
        return;
      }
      const result = res.data ?? {};
      form.icon = result.filePath ?? '';
      form.iconUri = result.fileUrl ?? '';
      ElMessage.success('上传成功');
    })
    .catch(() => {
      // 上传失败时恢复当前已保存的图标地址，避免把本地临时预览误作可保存文件。
      imageUrl.value = previousImageUrl;
      ElMessage.error('上传失败');
    })
    .finally(() => {
      if (imageUrl.value !== previewObjectUrl.value && previewObjectUrl.value) {
        URL.revokeObjectURL(previewObjectUrl.value);
        previewObjectUrl.value = '';
      }
      submitting.value = false;
    });
}

function clearImage(): void {
  if (previewObjectUrl.value) URL.revokeObjectURL(previewObjectUrl.value);
  previewObjectUrl.value = '';
  imageUrl.value = '';
  form.icon = '';
  form.iconUri = '';
}

function save(): Promise<void> | void {
  if (submitting.value) return;
  submitting.value = true;
  return updateDeviceType({ ...form })
    .then((res) => {
      if (res.code !== 0) {
        ElMessage.error(res.msg ?? '修改失败');
        return;
      }
      ElMessage.success('修改成功');
      dialogVisible.value = false;
      return loadList();
    })
    .catch(() => {
      ElMessage.error('修改失败');
    })
    .finally(() => {
      submitting.value = false;
    });
}

onMounted(loadList);
onBeforeUnmount(() => {
  if (previewObjectUrl.value) URL.revokeObjectURL(previewObjectUrl.value);
});
</script>

<template>
  <div v-loading="loading" class="device-type-manage">
    <el-table :data="list" border stripe row-key="id">
      <el-table-column prop="name" label="设备名称" min-width="160" show-overflow-tooltip />
      <el-table-column label="设备图标" width="130" align="center">
        <template #default="scope">
          <AuthImg
            v-if="getRow(scope).iconUri"
            :auth-src="getRow(scope).iconUri ?? ''"
            :alt="`${getRow(scope).name || '设备'}图标`"
            class="device-icon"
          />
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column prop="gmtCreated" label="创建时间" width="180" align="center"
        ><template #default="scope">{{ formatDateTime(getRow(scope).gmtCreated) }}</template></el-table-column
      >
      <el-table-column prop="gmtLastModified" label="最后修改时间" width="180" align="center"
        ><template #default="scope">{{ formatDateTime(getRow(scope).gmtLastModified) }}</template></el-table-column
      >
      <el-table-column label="是否展示" width="140" align="center">
        <template #default="scope">
          <el-switch
            v-model="getRow(scope).isShow"
            :loading="togglingIds.includes(getRow(scope).id)"
            :disabled="togglingIds.includes(getRow(scope).id)"
            :active-value="1"
            :inactive-value="0"
            active-text="是"
            inactive-text="否"
            @change="handleShowChange(getRow(scope))"
          />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="130" align="center" fixed="right">
        <template #default="scope">
          <el-button type="primary" link :icon="Edit" :disabled="submitting" @click="openEdit(getRow(scope))"
            >编辑图标</el-button
          >
        </template>
      </el-table-column>
    </el-table>

    <el-dialog
      v-model="dialogVisible"
      title="编辑设备图标"
      width="520px"
      append-to-body
      :close-on-click-modal="false"
      :close-on-press-escape="!submitting"
      :show-close="!submitting"
    >
      <el-form label-width="100px">
        <el-form-item label="设备图标">
          <div class="upload-row">
            <img
              v-if="previewObjectUrl && imageUrl === previewObjectUrl"
              :src="imageUrl"
              class="preview-image"
              alt="待保存的设备图标"
            />
            <AuthImg v-else-if="imageUrl" :auth-src="imageUrl" alt="设备图标预览" class="preview-image" />
            <div v-else class="preview-placeholder">无图标</div>
            <el-upload
              action="#"
              :auto-upload="false"
              :show-file-list="false"
              accept=".jpg,.png,.gif"
              :on-change="handleImageChange"
            >
              <el-button :icon="Plus" :loading="submitting">选择图片</el-button>
            </el-upload>
            <el-button v-if="imageUrl" link type="danger" :disabled="submitting" @click="clearImage">移除</el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button :disabled="submitting" @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" :disabled="submitting" @click="save">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="less" scoped>
.device-type-manage {
  padding: 8px 16px;
}
.device-icon {
  width: 40px;
  height: 40px;
  object-fit: contain;
  vertical-align: middle;
}
.upload-row {
  display: flex;
  align-items: center;
  gap: 12px;
}
.preview-image,
.preview-placeholder {
  width: 72px;
  height: 72px;
  border: 1px dashed @color-border;
  object-fit: contain;
}
.preview-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  color: @color-text-placeholder;
}
</style>
