<script setup lang="ts">
/**
 * baseData/mapConfig/index.vue - 地图配置管理
 *
 * 功能特性：
 * 1. 两个 Tab：地图管理 / 地图数据
 * 2. 地图管理 Tab：
 *    - 底图文件列表 + 上传底图按钮 + 更新底图按钮
 *    - 地图配置列表 + 新增地图按钮
 *    - 操作：编辑、激活/取消激活、删除、查看配置（弹窗 JSON 展示）
 * 3. 地图数据 Tab：
 *    - 地理编码接口配置（geocode/inversecode/poi 下拉选择）+ 更新按钮
 *    - 行政区划：下载 + 上传（.geojson）
 * 4. 上传底图：el-upload accept=".mbtiles" + auto-upload=false + 手动调 uploadBaseMap
 * 5. 底图上传后：先调 initBaseMap（debounce 500ms）再刷新底图列表
 * 6. 配置查看：el-dialog + <pre> 标签展示 JSON
 */
import { Delete, Edit, Plus, Upload, View } from '@element-plus/icons-vue';
import { useDebounceFn } from '@vueuse/core';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { UploadFile } from 'element-plus';
import { computed, nextTick, onMounted, reactive, ref } from 'vue';

import EditMap from './components/EditMap.vue';
import {
  deleteBaseMap,
  deleteMap,
  initBaseMap,
  selectDivision,
  selectGeo,
  selectListGeo,
  selectPageBaseMap,
  selectPageMap,
  updateDivision,
  updateGeo,
  updateMap,
  uploadBaseMap,
  type BaseMapItem,
  type DivisionItem,
  type GeoConfig,
  type GeoType,
  type MapItem,
} from '@/api/baseData/mapConfig';
import ActionButtons from '@/components/ActionButtons/index.vue';
import { defaultTableFormatter } from '@/components/ProTable/formatter';
import ProTable from '@/components/ProTable/index.vue';
import type { ITableColumn } from '@/components/ProTable/types';
import SectionTitle from '@/components/SectionTitle/index.vue';
import { getServiceFile } from '@/utils';

defineOptions({ name: 'MapConfig' });

// ===== Tab 状态 =====
const activeTab = ref<'1' | '2'>('1');

// ===== 地图管理 Tab：底图文件 =====
const baseMapList = ref<BaseMapItem[]>([]);
const baseMapTotal = ref(0);
const baseMapSearchParams = reactive<Record<string, unknown>>({});
const baseMapTableRef = ref<InstanceType<typeof ProTable>>();

// 底图文件列定义
const baseMapColumns = computed<ITableColumn[]>(() => [
  { prop: 'index', label: '序号', width: 80, align: 'center', slotName: 'index' },
  { prop: 'name', label: '地图文件', minWidth: 200, align: 'center', showOverflowTooltip: true },
  { prop: 'size', label: '文件大小', width: 180, align: 'center' },
  { prop: 'created', label: '上传时间', width: 180, align: 'center' },
  { prop: 'actions', label: '操作', fixed: 'right', width: 200, align: 'center', slotName: 'actions' },
]);

// 底图文件列表搜索区按钮
const baseMapActions = computed(() => [
  { label: '上传底图', type: 'primary' as const, icon: Upload, onClick: handleUploadBaseMap },
  { label: '更新底图', type: 'success' as const, onClick: handleUpdateBaseMap },
]);

// ProTable @response 回调
function handleBaseMapResponse(res: unknown): void {
  baseMapList.value = defaultTableFormatter.getRecords(res) as BaseMapItem[];
  baseMapTotal.value = defaultTableFormatter.getTotal(res);
}

// ===== 地图管理 Tab：地图配置 =====
const mapList = ref<MapItem[]>([]);
const mapTotal = ref(0);
const mapSearchParams = reactive<Record<string, unknown>>({});
const mapTableRef = ref<InstanceType<typeof ProTable>>();

// 地图配置列定义
const mapColumns = computed<ITableColumn[]>(() => [
  { prop: 'name', label: '地图名称', width: 180, align: 'center', showOverflowTooltip: true },
  { prop: 'mapType', label: '地图类型', width: 180, align: 'center' },
  { prop: 'type', label: '地图数据类型', width: 120, align: 'center', slotName: 'type' },
  { prop: 'configuration', label: '配置', width: 120, align: 'center', slotName: 'configuration' },
  { prop: 'activation', label: '激活状态', width: 120, align: 'center', slotName: 'activation' },
  { prop: 'gmtCreated', label: '创建时间', width: 180, align: 'center', showOverflowTooltip: true },
  { prop: 'actions', label: '操作', fixed: 'right', width: 280, align: 'center', slotName: 'actions' },
]);

// 地图配置搜索区按钮
const mapActions = computed(() => [{ label: '新增地图', type: 'primary' as const, icon: Plus, onClick: handleAddMap }]);

function handleMapResponse(res: unknown): void {
  mapList.value = defaultTableFormatter.getRecords(res) as MapItem[];
  mapTotal.value = defaultTableFormatter.getTotal(res);
}

// ===== 上传底图 =====
const uploadRef = ref();
const uploadFileList = ref<UploadFile[]>([]);

/** 选择底图文件回调（auto-upload=false 手动上传） */
function handleFileChange(file: UploadFile): void {
  if (!file.raw) return;
  // 校验文件类型
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext !== 'mbtiles') {
    ElMessage.error('仅支持 .mbtiles 文件');
    uploadFileList.value = [];
    return;
  }
  // 校验文件大小（500MB）
  const size = file.size ?? 0;
  const isLt500M = size / 1024 / 1024 < 500;
  if (!isLt500M) {
    ElMessage.error('文件大小不能超过 500MB');
    uploadFileList.value = [];
    return;
  }
  uploadFileList.value = [file];
  // 直接触发上传
  doUploadBaseMap(file.raw);
}

/** 执行底图上传 */
async function doUploadBaseMap(file: File): Promise<void> {
  const loading = ElMessage({ message: '正在上传底图...', duration: 0, type: 'info' });
  try {
    const res = await uploadBaseMap(file);
    if (res.code === 0) {
      ElMessage.success('上传成功');
      // 上传成功后先调 initBaseMap（debounce 500ms）再刷新底图列表
      handleUpdateBaseMap();
    } else {
      ElMessage.error(res.msg || '上传失败');
    }
  } catch {
    ElMessage.error('上传失败');
  } finally {
    loading.close();
    uploadFileList.value = [];
  }
}

/** 打开底图上传 */
function handleUploadBaseMap(): void {
  // 触发隐藏的 el-upload 点击
  nextTick(() => {
    const input = document.querySelector<HTMLInputElement>('.base-map-upload input[type=file]');
    input?.click();
  });
}

/** 初始化底图（debounce 500ms 后执行），成功后刷新底图列表 */
const handleUpdateBaseMap = useDebounceFn(async () => {
  try {
    const res = await initBaseMap();
    if (res.code === 0) {
      ElMessage.success(res.msg || '更新底图成功');
      baseMapTableRef.value?.refresh();
    } else {
      ElMessage.error(res.msg || '更新底图失败');
    }
  } catch {
    ElMessage.error('更新底图失败');
  }
}, 500);

/** 删除底图文件 */
function handleDeleteBaseMap(row: BaseMapItem): void {
  ElMessageBox.confirm('确认删除吗？', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'info',
  })
    .then(() => {
      deleteBaseMap(row.id)
        .then((res) => {
          if (res.code === 0) {
            ElMessage.success(res.msg || '删除成功');
            baseMapTableRef.value?.refresh();
          } else {
            ElMessage.error(res.msg || '删除失败');
          }
        })
        .catch(() => {});
    })
    .catch(() => {});
}

/** 查看瓦片地址 */
function handleViewTiles(row: BaseMapItem): void {
  profileContent.value = row.tiles ? JSON.stringify(row.tiles, null, 2) : '无';
  profileDialogVisible.value = true;
}

// ===== 地图配置操作 =====
const editMapRef = ref<InstanceType<typeof EditMap>>();

/** 新增地图 */
function handleAddMap(): void {
  editMapRef.value?.open();
}

/** 编辑地图 */
function handleEditMap(row: MapItem): void {
  editMapRef.value?.open(row);
}

/** 激活/取消激活 */
function handleToggleActive(row: MapItem): void {
  const isActivate = row.activation === 0;
  const tip = isActivate ? '确认激活吗？' : '确认取消激活吗？';
  ElMessageBox.confirm(tip, {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'info',
  })
    .then(() => {
      const param: MapItem = { ...row, activation: isActivate ? 1 : 0 };
      updateMap(param)
        .then((res) => {
          if (res.code === 0) {
            ElMessage.success(res.msg || '操作成功');
            mapTableRef.value?.refresh();
          } else {
            ElMessage.error(res.msg || '操作失败');
          }
        })
        .catch(() => {});
    })
    .catch(() => {});
}

/** 删除地图 */
function handleDeleteMap(row: MapItem): void {
  ElMessageBox.confirm('确认删除吗？', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'info',
  })
    .then(() => {
      deleteMap(row.id ?? '')
        .then((res) => {
          if (res.code === 0) {
            ElMessage.success(res.msg || '删除成功');
            mapTableRef.value?.refresh();
          } else {
            ElMessage.error(res.msg || '删除失败');
          }
        })
        .catch(() => {});
    })
    .catch(() => {});
}

/** 查看配置 */
function handleViewConfig(row: MapItem): void {
  try {
    const obj = row.configuration ? JSON.parse(row.configuration) : {};
    profileContent.value = JSON.stringify(obj, null, 2);
  } catch {
    profileContent.value = row.configuration ?? '';
  }
  profileDialogVisible.value = true;
}

// ===== 配置查看弹窗 =====
const profileDialogVisible = ref(false);
const profileContent = ref('');

// ===== 地图数据 Tab：地理编码 =====
const geoForm = reactive<GeoConfig>({
  geocode: '',
  inversecode: '',
  poi: '',
});
const geocodeOptions = ref<string[]>([]);
const inversecodeOptions = ref<string[]>([]);
const poiOptions = ref<string[]>([]);

/** 加载选中的地理编码 */
async function loadGeo(): Promise<void> {
  try {
    const res = await selectGeo();
    if (res.code === 0 && res.data) {
      geoForm.geocode = res.data.geocode ?? '';
      geoForm.inversecode = res.data.inversecode ?? '';
      geoForm.poi = res.data.poi ?? '';
    }
  } catch {
    // 忽略
  }
}

/** 加载地理编码可选项 */
async function loadGeoOptions(type: GeoType): Promise<void> {
  try {
    const res = await selectListGeo({ type });
    if (res.code === 0 && Array.isArray(res.data)) {
      const list = res.data.filter((i) => i);
      if (type === 'geocode') geocodeOptions.value = list;
      else if (type === 'inversecode') inversecodeOptions.value = list;
      else poiOptions.value = list;
    }
  } catch {
    // 忽略
  }
}

/** 更新地理编码接口 */
const handleUpdateGeo = useDebounceFn(async () => {
  try {
    const res = await updateGeo({ ...geoForm });
    if (res.code === 0) {
      ElMessage.success(res.msg || '更新成功');
    } else {
      ElMessage.error(res.msg || '更新失败');
    }
  } catch {
    ElMessage.error('更新失败');
  }
}, 500);

// ===== 地图数据 Tab：行政区划 =====
const divisionName = ref('');

/** 查询行政区划 */
async function loadDivision(): Promise<void> {
  try {
    const res = await selectDivision();
    if (res.code === 0 && res.data) {
      divisionName.value = (res.data as DivisionItem).name ?? '';
    }
  } catch {
    // 忽略
  }
}

/** 下载行政区划（导出 .geojson） */
const handleDownloadDivision = useDebounceFn(async () => {
  try {
    const res = await updateDivision({ nodeId: '0' });
    if (res.code === 0 && res.data) {
      const blob = new Blob([res.data as unknown as ArrayBuffer], { type: 'application/json' });
      const filename = `${divisionName.value || 'division'}.geojson`;
      getServiceFile(blob, filename);
    } else {
      ElMessage.error('下载失败');
    }
  } catch {
    ElMessage.error('下载失败');
  }
}, 500);

/** 上传行政区划（.geojson） */
const divisionUploadRef = ref();
const divisionUploadList = ref<UploadFile[]>([]);

function handleDivisionFileChange(file: UploadFile): void {
  if (!file.raw) return;
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext !== 'geojson') {
    ElMessage.error('仅支持 .geojson 文件');
    divisionUploadList.value = [];
    return;
  }
  const size = file.size ?? 0;
  const isLt500M = size / 1024 / 1024 < 500;
  if (!isLt500M) {
    ElMessage.error('文件大小不能超过 500MB');
    divisionUploadList.value = [];
    return;
  }
  divisionUploadList.value = [file];
  doUploadDivision(file.raw);
}

/** 执行行政区划上传（复用 uploadBaseMap 接口） */
async function doUploadDivision(file: File): Promise<void> {
  const loading = ElMessage({ message: '正在上传...', duration: 0, type: 'info' });
  try {
    const res = await uploadBaseMap(file);
    if (res.code === 0) {
      ElMessage.success('上传成功');
      loadDivision();
    } else {
      ElMessage.error(res.msg || '上传失败');
    }
  } catch {
    ElMessage.error('上传失败');
  } finally {
    loading.close();
    divisionUploadList.value = [];
  }
}

/** 打开行政区划上传 */
function handleUploadDivision(): void {
  nextTick(() => {
    const input = document.querySelector<HTMLInputElement>('.division-upload input[type=file]');
    input?.click();
  });
}

// ===== Tab 切换时按需加载 =====
function handleTabChange(name: string | number): void {
  if (name === '2') {
    loadGeo();
    loadGeoOptions('geocode');
    loadGeoOptions('inversecode');
    loadGeoOptions('poi');
    loadDivision();
  }
}

/** 从 ProTable slot scope 中安全获取 BaseMapItem */
function getBaseMapRow(scope: any): BaseMapItem {
  return (scope?.row as BaseMapItem) ?? ({} as BaseMapItem);
}

/** 从 ProTable slot scope 中安全获取 MapItem */
function getMapRow(scope: any): MapItem {
  return (scope?.row as MapItem) ?? ({} as MapItem);
}

/** 序号列计算 */
function getBaseMapIndex(scope: any): number {
  return scope.$index + 1;
}

onMounted(() => {
  // 初始加载底图文件和地图配置
  // ProTable immediate=true 会自动请求，这里不重复调
});
</script>

<template>
  <div class="app-container">
    <el-card shadow="always" class="card">
      <el-tabs v-model="activeTab" type="card" @tab-change="handleTabChange">
        <el-tab-pane label="地图管理" name="1" />
        <el-tab-pane label="地图数据" name="2" />
      </el-tabs>

      <!-- Tab1: 地图管理 -->
      <div v-show="activeTab === '1'" class="tab-pane">
        <!-- 底图文件列表 -->
        <div class="section">
          <SectionTitle title="底图文件" variant="border" />
          <ProTable
            ref="baseMapTableRef"
            :columns="baseMapColumns"
            :fetch-api="selectPageBaseMap"
            :data="baseMapList"
            :total="baseMapTotal"
            :search-params="baseMapSearchParams"
            @response="handleBaseMapResponse"
          >
            <template #index="scope">
              <span>{{ getBaseMapIndex(scope) }}</span>
            </template>
            <template #actions="scope">
              <ActionButtons
                :buttons="[
                  {
                    type: 'primary',
                    icon: View,
                    label: '瓦片地址',
                    onClick: () => handleViewTiles(getBaseMapRow(scope)),
                  },
                  {
                    type: 'danger',
                    icon: Delete,
                    label: '删除',
                    onClick: () => handleDeleteBaseMap(getBaseMapRow(scope)),
                  },
                ]"
              />
            </template>
          </ProTable>
          <div class="action-bar">
            <el-button type="primary" :icon="Upload" @click="handleUploadBaseMap">上传底图</el-button>
            <el-button type="success" @click="handleUpdateBaseMap">更新底图</el-button>
          </div>
          <!-- 隐藏的 el-upload，用于触发文件选择 -->
          <el-upload
            class="base-map-upload hidden-upload"
            action="#"
            :show-file-list="false"
            :auto-upload="false"
            :on-change="handleFileChange"
            accept=".mbtiles"
            :file-list="uploadFileList"
          >
            <span />
          </el-upload>
        </div>

        <el-divider />

        <!-- 地图配置列表 -->
        <div class="section">
          <SectionTitle title="地图配置" variant="border" />
          <ProTable
            ref="mapTableRef"
            :columns="mapColumns"
            :fetch-api="selectPageMap"
            :data="mapList"
            :total="mapTotal"
            :search-params="mapSearchParams"
            @response="handleMapResponse"
          >
            <template #type="scope">
              {{ getMapRow(scope).type === 0 ? '栅格' : '矢量' }}
            </template>
            <template #configuration="scope">
              <el-button type="primary" link @click="handleViewConfig(getMapRow(scope))"> 查看配置 </el-button>
            </template>
            <template #activation="scope">
              <el-tag :type="getMapRow(scope).activation === 1 ? 'success' : 'info'">
                {{ getMapRow(scope).activation === 1 ? '已激活' : '未激活' }}
              </el-tag>
            </template>
            <template #actions="scope">
              <ActionButtons
                :buttons="[
                  { type: 'primary', icon: Edit, label: '编辑', onClick: () => handleEditMap(getMapRow(scope)) },
                  {
                    type: 'warning',
                    label: '取消激活',
                    visible: getMapRow(scope).activation === 1,
                    onClick: () => handleToggleActive(getMapRow(scope)),
                  },
                  {
                    type: 'success',
                    label: '激活',
                    visible: getMapRow(scope).activation !== 1,
                    onClick: () => handleToggleActive(getMapRow(scope)),
                  },
                  { type: 'danger', icon: Delete, label: '删除', onClick: () => handleDeleteMap(getMapRow(scope)) },
                ]"
              />
            </template>
          </ProTable>
          <div class="action-bar">
            <el-button type="primary" :icon="Plus" @click="handleAddMap">新增地图</el-button>
          </div>
        </div>
      </div>

      <!-- Tab2: 地图数据 -->
      <div v-show="activeTab === '2'" class="tab-pane">
        <!-- 地理编码接口配置 -->
        <div class="section">
          <SectionTitle title="地理编码接口配置" variant="border" />
          <el-form :inline="true" :model="geoForm" label-width="120px" class="geo-form">
            <el-form-item label="地理编码：" style="width: 45%">
              <el-select v-model="geoForm.geocode" placeholder="请选择" style="width: 400px" disabled>
                <el-option v-for="item in geocodeOptions" :key="item" :label="item" :value="item" />
              </el-select>
            </el-form-item>
            <el-form-item label="逆地理编码：" style="width: 45%">
              <el-select v-model="geoForm.inversecode" placeholder="请选择" style="width: 400px">
                <el-option v-for="item in inversecodeOptions" :key="item" :label="item" :value="item" />
              </el-select>
            </el-form-item>
            <el-form-item label="POI搜索：" style="width: 45%">
              <el-select v-model="geoForm.poi" placeholder="请选择" style="width: 400px">
                <el-option v-for="item in poiOptions" :key="item" :label="item" :value="item" />
              </el-select>
            </el-form-item>
            <el-form-item label=" " style="width: 45%">
              <el-button type="primary" @click="handleUpdateGeo">更新接口</el-button>
            </el-form-item>
          </el-form>
        </div>

        <el-divider />

        <!-- 行政区划 -->
        <div class="section">
          <SectionTitle title="行政区划" variant="border" />
          <el-form :inline="true" label-width="120px">
            <el-form-item label=" " style="width: 45%">
              <el-button type="primary" @click="handleDownloadDivision">下载行政区划</el-button>
              <el-button type="primary" :icon="Upload" @click="handleUploadDivision"> 上传行政区划 </el-button>
            </el-form-item>
            <el-form-item label="当前区域：" style="width: 100%">
              <span>{{ divisionName }}</span>
            </el-form-item>
          </el-form>
          <!-- 隐藏的 el-upload，用于触发文件选择 -->
          <el-upload
            class="division-upload hidden-upload"
            action="#"
            :show-file-list="false"
            :auto-upload="false"
            :on-change="handleDivisionFileChange"
            accept=".geojson"
            :file-list="divisionUploadList"
          >
            <span />
          </el-upload>
        </div>
      </div>

      <!-- 编辑弹窗 -->
      <EditMap ref="editMapRef" @success="mapTableRef?.refresh()" />

      <!-- 配置查看弹窗 -->
      <el-dialog v-model="profileDialogVisible" title="配置信息" width="600px" align-center append-to-body>
        <div class="profile-view">
          <pre>{{ profileContent }}</pre>
        </div>
      </el-dialog>
    </el-card>
  </div>
</template>

<style lang="less" scoped>
.card {
  height: 100%;
  overflow-y: auto;
}

.tab-pane {
  padding-top: @spacing-md;
}

.section {
  margin-bottom: @spacing-lg;
}

.action-bar {
  margin-top: @spacing-md;
  padding: @spacing-sm 0;
}

.geo-form {
  width: 100%;
}

.hidden-upload {
  position: absolute;
  width: 0;
  height: 0;
  overflow: hidden;
  opacity: 0;
  pointer-events: none;
}

.profile-view {
  width: 100%;
  max-height: 400px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-all;

  pre {
    margin: 0;
    padding: @spacing-sm;
    background: @color-bg-page;
    border-radius: @radius-md;
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    font-size: 13px;
    line-height: 1.5;
  }
}
</style>
