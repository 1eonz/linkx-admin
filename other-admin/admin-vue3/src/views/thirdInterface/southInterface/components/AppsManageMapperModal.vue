<script setup lang="ts">
/**
 * AppsManageMapperModal - 字段映射配置弹窗
 *
 * 字段映射弹窗：
 * 1. 列表式交互（顶部添加/清空按钮 + 列表项输入 + 上移/下移/删除）
 * 2. open(type, row) 接收 type 和 row，从 row.mapper 解析 JSON 数组回显
 * 3. handleSave 时 validateData 校验：空值/重复/正则
 * 4. emit('save', { mapper, mapperList, type, id, row }) 给父组件处理
 * 5. 不使用 ElForm 和校验规则，用 ElMessage.warning 提示错误
 */
import { ArrowDown, ArrowUp, Delete, Right } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ref } from 'vue';

import type { CallableApp } from '@/api/thirdInterface/southInterface';

defineOptions({ name: 'AppsManageMapperModal' });

// 字段名正则：字母/下划线开头，仅含字母、数字、下划线
const KEY_REGEX = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

interface MapperItem {
  key: string;
  value: string;
}

const emit = defineEmits<{
  (
    e: 'save',
    payload: {
      mapper: string;
      mapperList: MapperItem[];
      type: string;
      id?: string;
      row?: CallableApp;
    },
  ): void;
}>();

/** 创建空映射项 */
function createMapperItem(key = '', value = ''): MapperItem {
  return { key, value };
}

// ===== 弹窗状态 =====
const dialogVisible = ref(false);
const mapperList = ref<MapperItem[]>([]);
const currentRow = ref<CallableApp | null>(null);
const currentType = ref<string>('');

// ===== 从当前行解析 mapper 字段回显 =====
function initMapperData(): void {
  let parsed: unknown = [];
  try {
    parsed = JSON.parse((currentRow.value?.mapper as string) ?? '[]');
  } catch {
    parsed = [];
  }
  if (Array.isArray(parsed)) {
    mapperList.value = parsed.map((item: Record<string, unknown>) => ({
      key: (item.key as string) ?? '',
      value: (item.value as string) ?? '',
    }));
  } else {
    mapperList.value = [];
  }
}

// ===== 添加映射 =====
function handleAdd(): void {
  mapperList.value.push(createMapperItem());
}

// ===== 删除单个映射 =====
function handleRemove(index: number): void {
  mapperList.value.splice(index, 1);
}

// ===== 清空所有映射（带确认） =====
function handleReset(): void {
  ElMessageBox.confirm('确定要清空所有映射配置吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      mapperList.value = [];
    })
    .catch(() => {});
}

// ===== 上移/下移 =====
function swapItems(indexA: number, indexB: number): void {
  const temp = mapperList.value[indexA];
  mapperList.value[indexA] = mapperList.value[indexB];
  mapperList.value[indexB] = temp;
}

function handleMoveUp(index: number): void {
  if (index > 0) swapItems(index, index - 1);
}

function handleMoveDown(index: number): void {
  if (index < mapperList.value.length - 1) swapItems(index, index + 1);
}

// ===== 字段名失焦：自动 trim + 唯一性/格式校验提示 =====
function handleKeyBlur(index: number): void {
  const item = mapperList.value[index];
  if (!item.key || !item.key.trim()) return;
  const trimmedKey = item.key.trim();

  const isDuplicate = mapperList.value.some((other, idx) => idx !== index && other.key === trimmedKey);
  if (isDuplicate) {
    ElMessage.warning(`字段名 "${trimmedKey}" 已存在，请使用唯一的字段名`);
  }
  if (!KEY_REGEX.test(trimmedKey)) {
    ElMessage.warning('字段名只能包含字母、数字、下划线，且不能以数字开头');
  }
  item.key = trimmedKey;
}

// ===== 字段含义失焦：自动 trim =====
function handleValueBlur(index: number): void {
  const item = mapperList.value[index];
  if (item.value) {
    item.value = item.value.trim();
  }
}

// ===== 保存前全量校验：空值/重复/格式 =====
function validateData(): boolean {
  if (mapperList.value.length === 0) {
    ElMessage.warning('请至少添加一个字段映射');
    return false;
  }

  const keys = new Set<string>();
  for (let i = 0; i < mapperList.value.length; i++) {
    const item = mapperList.value[i];
    const trimmedKey = (item.key || '').trim();
    const trimmedValue = (item.value || '').trim();
    const rowNum = i + 1;

    if (!trimmedKey) {
      ElMessage.warning(`第 ${rowNum} 行的字段名不能为空`);
      return false;
    }
    if (!trimmedValue) {
      ElMessage.warning(`第 ${rowNum} 行的字段含义不能为空`);
      return false;
    }
    if (keys.has(trimmedKey)) {
      ElMessage.warning(`字段名 "${trimmedKey}" 重复，请使用唯一的字段名`);
      return false;
    }
    if (!KEY_REGEX.test(trimmedKey)) {
      ElMessage.warning(`字段名 "${trimmedKey}" 格式错误，只能包含字母、数字、下划线，且不能以数字开头`);
      return false;
    }
    keys.add(trimmedKey);
  }
  return true;
}

// ===== 保存：emit 给父组件处理 =====
function handleSave(): void {
  if (!validateData()) return;
  const payload: {
    mapper: string;
    mapperList: MapperItem[];
    type: string;
    id?: string;
    row?: CallableApp;
  } = {
    mapper: mapperList.value.length > 0 ? JSON.stringify(mapperList.value) : '',
    mapperList: mapperList.value,
    type: currentType.value,
  };
  if (currentRow.value) {
    payload.id = currentRow.value.id;
    payload.row = currentRow.value;
  }
  emit('save', payload);
  dialogVisible.value = false;
}

// ===== 关闭弹窗并重置内部状态 =====
function handleClose(): void {
  dialogVisible.value = false;
  resetData();
}

// ===== 重置内部状态，防止弹窗间数据残留 =====
function resetData(): void {
  mapperList.value = [];
  currentRow.value = null;
  currentType.value = '';
}

// ===== 供父组件通过 ref 调用，打开弹窗并回显当前行的映射数据 =====
function open(type: string, row: CallableApp): void {
  currentType.value = type;
  currentRow.value = row;
  dialogVisible.value = true;
  initMapperData();
}

defineExpose({ open });
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    title="字段映射配置"
    width="800px"
    align-center
    append-to-body
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="mapper-container">
      <!-- 顶部操作栏 -->
      <div class="mapper-header">
        <el-button type="primary" @click="handleAdd">添加映射</el-button>
        <el-button plain :disabled="mapperList.length === 0" @click="handleReset"> 清空所有 </el-button>
        <span class="mapper-tip"> 提示：字段名(key)用于展示字段，字段含义(value)用于展示字段的列标题 </span>
      </div>

      <!-- 映射列表 -->
      <div v-if="mapperList.length > 0" class="mapper-list">
        <div v-for="(item, index) in mapperList" :key="index" class="mapper-item">
          <div class="mapper-item-fields">
            <el-input
              v-model="item.key"
              placeholder="请输入"
              size="default"
              maxlength="100"
              show-word-limit
              @blur="handleKeyBlur(index)"
            >
              <template #prepend>字段名</template>
            </el-input>

            <el-icon class="arrow-icon"><Right /></el-icon>

            <el-input
              v-model="item.value"
              placeholder="请输入"
              size="default"
              maxlength="100"
              show-word-limit
              @blur="handleValueBlur(index)"
            >
              <template #prepend>字段含义</template>
            </el-input>
          </div>

          <div class="mapper-item-actions">
            <el-button plain circle type="primary" :disabled="index === 0" @click="handleMoveUp(index)">
              <el-icon><ArrowUp /></el-icon>
            </el-button>
            <el-button
              plain
              circle
              type="primary"
              :disabled="index === mapperList.length - 1"
              @click="handleMoveDown(index)"
            >
              <el-icon><ArrowDown /></el-icon>
            </el-button>
            <el-button plain circle type="danger" @click="handleRemove(index)">
              <el-icon><Delete /></el-icon>
            </el-button>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <el-empty
        v-if="mapperList.length === 0"
        description="暂无映射配置，请点击添加映射"
        :image-size="80"
        class="mapper-empty"
      />
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style lang="less" scoped>
.mapper-container {
  display: flex;
  flex-direction: column;
  height: 500px;
}

.mapper-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e4e7ed;
  flex-wrap: wrap;
  gap: 8px;

  .mapper-tip {
    font-size: 12px;
    color: #a9a9af;
    margin-left: auto;
    align-self: flex-end;
  }
}

.mapper-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  gap: 4px;
  flex-direction: column;
  padding-right: 8px;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: #dcdfe6;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background-color: #c0c4cc;
  }
}

.mapper-item {
  display: flex;
  align-items: center;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.3s;

  &:hover {
    background-color: #f9fbff;
  }

  .mapper-item-fields {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 12px;

    :deep(.el-input-group__prepend) {
      width: 70px;
      justify-content: center;
    }
  }

  .arrow-icon {
    color: #909399;
    font-size: 20px;
    flex-shrink: 0;
  }

  .mapper-item-actions {
    display: flex;
    flex-shrink: 0;
    margin-left: 16px;
    gap: 4px;

    // link 按钮：图标更大更清晰，hover 高亮
    :deep(.el-button.is-link) {
      padding: 4px;
      height: auto;

      .el-icon {
        font-size: 18px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      &:hover .el-icon {
        transform: scale(1.1);
      }

      &.is-disabled .el-icon {
        opacity: 0.4;
      }
    }
  }
}

.mapper-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
