<script setup lang="ts">
/**
 * EditMap - 地图新增/编辑弹窗
 *
 * 功能特性：
 * 1. 新增/编辑模式（由是否传入 row 决定）
 * 2. 表单字段：name（必填，禁止特殊字符）/ mapType / type / activation
 * 3. configuration 字段用 el-input textarea 替代第三方 JSON 编辑器
 * 4. configTemplateChange：根据 mapType 点击按钮填入对应模板
 * 5. 提交时 JSON.stringify(configuration) 后调用 createMap/updateMap
 *
 * @example 父组件调用
 * ```vue
 * <EditMap ref="editMapRef" @success="refresh" />
 * // 新增
 * editMapRef.value?.open()
 * // 编辑
 * editMapRef.value?.open(row)
 * ```
 *
 * Props: 无
 *
 * Events:
 * - success: 提交成功后触发
 *
 * Methods:
 * - open(row?: MapItem): 打开弹窗
 */
import { ElMessage } from 'element-plus';
import type { FormInstance, FormItemRule } from 'element-plus';
import { computed, nextTick, reactive, ref } from 'vue';

import { createMap, updateMap, type MapItem } from '@/api/baseData/mapConfig';

defineOptions({ name: 'EditMap' });

const emit = defineEmits<{
  (e: 'success'): void;
}>();

// ===== 弹窗状态 =====
const dialogVisible = ref(false);
const dialogTitle = ref('新增');
const isAdd = ref(true);
const submitLoading = ref(false);
const formRef = ref<FormInstance>();

// ===== 表单数据 =====
const defaultForm = (): MapItem => ({
  id: undefined,
  name: '',
  mapType: '',
  type: 0,
  activation: 1,
  configuration: '',
});

const formData = reactive<MapItem>(defaultForm());

/** 地图类型可选项 */
const mapTypeOptions: string[] = ['AMap', 'Arcgis', 'BMap', 'MineMap', 'MapAbc', 'OpenLayers'];

/** 地图数据类型可选项 */
const mapDataTypeOptions = [
  { name: '栅格', value: 0 as const },
  { name: '矢量', value: 1 as const },
];

/** 配置模板按钮可选项 */
const mapServerTypes = ['xyz', 'wmts', 'wms', 'vector'];

/** 通用 base 字段（地图中心/缩放/坐标系等） */
const base = {
  center: [117.330139, 31.734559],
  zoom: 12,
  minZoom: 8,
  maxZoom: 16,
  projection: 'EPSG:3857',
};

/** 名称特殊字符校验正则（包含中英文标点） */
const nameSpecialPattern = /[`~!@#$^&*()=|{}':;',\\[\].<>《》/?~！@#￥……&*（）——|{}【】‘；：”“'。，、？]/;

/** 名称校验：必填 + 禁止特殊字符 */
function validateName(_rule: unknown, value: string, callback: (err?: Error) => void): void {
  if (!value || value.length === 0) {
    callback(new Error('名称不能为空'));
  } else if (nameSpecialPattern.test(value)) {
    callback(new Error('名称不能包含特殊字符'));
  } else {
    callback();
  }
}

const rules = computed<Record<string, FormItemRule[]>>(() => ({
  name: [{ required: true, validator: validateName, trigger: 'change' }],
  type: [{ required: true, message: '请选择', trigger: 'change' }],
}));

/** 弹窗标题（新增/编辑） */
function handleDialogTitle(): void {
  dialogTitle.value = isAdd.value ? '新增地图' : '编辑地图';
}

// ===== mapType 变更时填入对应模板 =====
function mapTypeChange(val: string): void {
  switch (val) {
    case 'MapAbc': {
      formData.configuration = JSON.stringify({
        ...base,
        mapKey: 'ec85d3648154874552835438ac6a02b2',
        poiUrl: '/gss/geocode/v2',
        city: '贵阳',
        searchUrl: '/as/search/poi',
        trafficUrl: 'http://121.36.99.212:18883/amptraffic?t={z}-{x}-{y}',
        trafficTime: 5,
        rasterUrl: 'https://webst03.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}',
      });
      break;
    }
    case 'MineMap': {
      formData.configuration = JSON.stringify({
        ...base,
        rasterUrl: 'https://services.minedata.cn/service/data/satellite?x={x}&y={y}&z={z}',
        trafficTime: 5,
        trafficUrl: '',
        mapKey: 'ebd4af226c75a32abd5fc4b879b0da92',
        mapCss: 'https://minemap.minedata.cn/minemapapi/v2.1.1/minemap.css',
        dataDomainUrl: 'https://minemap.minedata.cn',
        domainUrl: 'https://minemap.minedata.cn',
        editJs: 'https://minemap.minedata.cn/minemapapi/minemap-plugins/edit/minemap-edit.js',
        mapJs: 'https://minemap.minedata.cn/minemapapi/v2.1.1/minemap.js',
        serverDomainUrl: 'https://sd-data.minedata.cn',
        serviceUrl: 'https://service.minedata.cn/service',
        solution: '11003,11001',
        spriteUrl: 'https://minemap.minedata.cn/minemapapi/v2.1.1/sprite/sprite',
        style: 'https://service.minedata.cn/map/solu/style',
        templateJs: 'https://minemap.minedata.cn/minemapapi/minemap-plugins/template/template.js',
        turfJs: 'https://minemap.minedata.cn/minemapapi/minemap-CDN/turf/turf.min.js',
        utilJs: 'https://minemap.minedata.cn/minemapapi/minemap-plugins/2d-util/minemap-util.js',
        coordType: '02',
        projection: 'MERCATOR',
        city: '贵阳',
      });
      break;
    }
    case 'AMap': {
      formData.configuration = JSON.stringify({
        ...base,
        mapKey: 'ebd4af226c75a32abd5fc4b879b0da92',
      });
      break;
    }
    case 'BMap': {
      formData.configuration = JSON.stringify({
        ...base,
        mapKey: 'ebd4af226c75a32abd5fc4b879b0da92',
        BMAPGL_STATIC_URL: '',
        BMAPGL_STYLE_URL: '',
        BMAPGL_URL: '',
        TRAFFIC_URL: '',
      });
      break;
    }
    case 'Arcgis': {
      formData.configuration = JSON.stringify({ ...base, mapKey: '' });
      break;
    }
    case 'OpenLayers': {
      formData.configuration = JSON.stringify({});
      break;
    }
    default: {
      formData.configuration = '';
      break;
    }
  }
}

/** 数据类型变更时清空 configuration */
function mapDataTypeChange(): void {
  formData.configuration = '';
}

/** 点击配置模板按钮填入对应模板 */
function configTemplateChange(temp: string): void {
  const templates: Record<string, Record<string, unknown>> = {
    xyz: {
      ...base,
      server: 'XYZ',
      url: 'https://10.28.54.81:30013/offlinemap/api/tilesets/Hongkong-Mapbox-streets-satellite_zoom_13.mbtiles/{z}/{x}/{-y}.png',
    },
    wmts: {
      ...base,
      server: 'WMTS',
      xml: 'https://10.28.15.57:8443/iserver/services/map-China100/wmts100',
      layer: 'China',
      matrixSet: 'EPSG:3857',
    },
    wms: {
      ...base,
      server: 'wms',
      url: '',
      LAYERS: '',
      XYZmaxZoom: 14,
    },
    vector: {
      ...base,
      server: 'vector',
      url: 'http://10.28.54.127:10101/api/tilesets/Chengdu.mbtiles/{z}/{x}/{-y}.pbf',
    },
  };
  const tpl = templates[temp];
  if (tpl) {
    formData.configuration = JSON.stringify(tpl, null, 2);
  }
}

// ===== 弹窗打开 =====
function open(row?: MapItem): void {
  isAdd.value = !row;
  Object.assign(formData, defaultForm());
  if (row) {
    formData.id = row.id;
    formData.name = row.name;
    formData.mapType = row.mapType;
    formData.type = row.type;
    formData.activation = row.activation;
    // 编辑回显：将字符串格式化为可读 JSON
    try {
      formData.configuration = row.configuration ? JSON.stringify(JSON.parse(row.configuration), null, 2) : '';
    } catch {
      formData.configuration = row.configuration ?? '';
    }
  }
  handleDialogTitle();
  dialogVisible.value = true;
  nextTick(() => {
    formRef.value?.clearValidate();
  });
}

defineExpose({ open });

// ===== 提交 =====
async function handleSubmit(): Promise<void> {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) {
    ElMessage.warning('必填字段未填写');
    return;
  }
  // 校验 configuration 是否为合法 JSON
  let configurationStr = formData.configuration ?? '';
  if (configurationStr) {
    try {
      // 紧凑序列化，去除空白
      configurationStr = JSON.stringify(JSON.parse(configurationStr));
    } catch {
      ElMessage.error('配置 JSON 格式错误');
      return;
    }
  }
  submitLoading.value = true;
  try {
    const payload: MapItem = {
      ...formData,
      configuration: configurationStr,
    };
    if (isAdd.value) {
      delete payload.id;
    }
    const res = isAdd.value ? await createMap(payload) : await updateMap(payload);
    if (res.code === 0) {
      ElMessage.success(res.msg || (isAdd.value ? '新增成功' : '修改成功'));
      dialogVisible.value = false;
      emit('success');
    } else {
      ElMessage.error(res.msg || (isAdd.value ? '新增失败' : '修改失败'));
    }
  } finally {
    submitLoading.value = false;
  }
}

/** 关闭弹窗 */
function handleDialogClosed(): void {
  Object.assign(formData, defaultForm());
  formRef.value?.resetFields();
}
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    :title="dialogTitle"
    :close-on-click-modal="false"
    :destroy-on-close="true"
    append-to-body
    width="800px"
    align-center
    top="5vh"
    @closed="handleDialogClosed"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-position="left"
      label-width="150px"
      class="edit-map-form"
    >
      <el-form-item label="地图名称：" prop="name">
        <el-input v-model.trim="formData.name" class="edit-input" placeholder="请输入名称" />
      </el-form-item>
      <el-form-item label="地图类型：" prop="mapType">
        <el-select
          v-model="formData.mapType"
          class="filter-item"
          style="width: 300px"
          placeholder="请选择"
          @change="mapTypeChange"
        >
          <el-option v-for="item in mapTypeOptions" :key="item" :label="item" :value="item" />
        </el-select>
      </el-form-item>
      <el-form-item label="地图数据类型：" prop="type">
        <el-select
          v-model="formData.type"
          class="filter-item"
          style="width: 300px"
          placeholder="请选择"
          @change="mapDataTypeChange"
        >
          <el-option v-for="item in mapDataTypeOptions" :key="item.value" :label="item.name" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="激活状态：" prop="activation">
        <el-switch
          v-model="formData.activation"
          active-text="激活"
          inline-prompt
          inactive-text="未激活"
          :active-value="1"
          :inactive-value="0"
        />
      </el-form-item>
      <el-form-item label="配置：" class="avatar-item">
        <div class="config-actions">
          <el-button
            v-for="item in mapServerTypes"
            :key="item"
            size="small"
            type="primary"
            link
            @click="configTemplateChange(item)"
          >
            {{ item }}
          </el-button>
        </div>
        <el-input
          v-model="formData.configuration"
          type="textarea"
          :rows="12"
          placeholder="请输入配置 JSON，或点击上方按钮填入模板"
          class="config-textarea"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="submitLoading" @click="handleSubmit">
        {{ isAdd ? '创建' : '修改' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<style lang="less" scoped>
.edit-map-form {
  margin-left: 30px;
}

.edit-input {
  width: 350px;
}

.filter-item {
  display: inline-block;
  vertical-align: middle;
}

.avatar-item {
  margin-top: 20px;

  :deep(.el-form-item__content) {
    margin-left: 0 !important;
  }
}

.config-actions {
  margin-bottom: @spacing-sm;
}

.config-textarea {
  width: 100%;

  :deep(.el-textarea__inner) {
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    font-size: 13px;
  }
}
</style>
