﻿<script setup lang="ts">
/**
 * EditForm - 标签新增/编辑弹窗
 *
 * 标签新增/编辑弹窗：
 * - 支持新增（create）/ 编辑（update）两种模式
 * - 字段：标签名称、标签类型、标签作用域、图标、颜色
 * - 新增下级标签时继承父标签的类型/作用域（不可改）
 * - 编辑时类型/作用域不可改
 * - 提交调用 labelSave（新增和修改共用 save 接口，按是否有 id 区分）
 *
 * @example 父组件调用
 * ```vue
 * <EditForm ref="formRef" @success="refresh" />
 * formRef.value?.open('create', parentData)
 * formRef.value?.open('update', editData)
 * ```
 */
import { ElMessage } from 'element-plus';
import type { FormInstance, FormItemRule } from 'element-plus';
import { computed, nextTick, reactive, ref } from 'vue';

import { labelDetail, labelSave, type LabelItem } from '@/api/h5/quick';

defineOptions({ name: 'TagEditForm' });

const emit = defineEmits<{
  /** 保存成功后触发 */
  success: [];
}>();

// ===== 弹窗状态 =====
const dialogVisible = ref(false);
const dialogTitle = ref('新增');
const formType = ref<'create' | 'update'>('create');
const formLoading = ref(false);
const submitLoading = ref(false);

const formRef = ref<FormInstance>();

// ===== 表单数据 =====
const defaultForm: Partial<LabelItem> = {
  id: undefined,
  name: undefined,
  type: 0,
  scope: 1,
  icon: 'fas fa-home',
  color: 'rgba(64, 158, 255, 0.8)',
  parentId: 0,
  level: 1,
};

const formData = reactive<Partial<LabelItem>>({ ...defaultForm });

/** 父节点（新增下级时用于继承类型/作用域） */
const parentData = ref<LabelItem | null>(null);

// 标签类型
const typeArr = [
  { id: 0, name: '普通标签' },
  { id: 1, name: '人员核查' },
];

// 标签作用域
const scopeArr = [
  { id: 0, name: '全部' },
  { id: 1, name: '一键建群' },
  { id: 2, name: '职能建群' },
];

// 常用图标列表
const iconList = [
  'fas fa-home',
  'fas fa-user',
  'fas fa-users',
  'fas fa-cog',
  'fas fa-tags',
  'fas fa-tag',
  'fas fa-star',
  'fas fa-bell',
  'fas fa-envelope',
  'fas fa-calendar',
  'fas fa-clock',
  'fas fa-phone',
  'fas fa-mobile-alt',
  'fas fa-search',
  'fas fa-shopping-cart',
  'fas fa-store',
  'fas fa-check',
  'fas fa-times',
  'fas fa-plus',
  'fas fa-minus',
  'fas fa-edit',
  'fas fa-trash',
  'fas fa-save',
  'fas fa-download',
  'fas fa-upload',
  'fas fa-file',
  'fas fa-folder',
  'fas fa-folder-open',
  'fas fa-copy',
  'fas fa-link',
  'fas fa-lock',
  'fas fa-key',
  'fas fa-book',
  'fas fa-bookmark',
  'fas fa-camera',
  'fas fa-image',
  'fas fa-video',
  'fas fa-music',
  'fas fa-database',
  'fas fa-server',
  'fas fa-cloud',
  'fas fa-sun',
  'fas fa-moon',
  'fas fa-car',
  'fas fa-bus',
  'fas fa-plane',
  'fas fa-ship',
  'fas fa-bicycle',
  'fas fa-coffee',
  'fas fa-utensils',
  'fas fa-gift',
  'fas fa-box',
  'fas fa-archive',
  'fas fa-truck',
  'fas fa-cube',
  'fas fa-recycle',
  'fas fa-broom',
  'fas fa-eye',
  'fas fa-brain',
  'fas fa-heart',
  'fas fa-robot',
  'fas fa-microchip',
  'fas fa-shield-alt',
  'fas fa-flag',
  'fas fa-anchor',
  'fas fa-bullhorn',
  'fas fa-headset',
  'fas fa-globe',
  'fas fa-map',
  'fas fa-building',
  'fas fa-hospital',
  'fas fa-graduation-cap',
  'fas fa-school',
  'fas fa-university',
];

const iconSearch = ref('');

const filteredIcons = computed(() => {
  const keyword = iconSearch.value.trim().toLowerCase();
  if (!keyword) return iconList;
  return iconList.filter((icon) => icon.toLowerCase().includes(keyword));
});

const rules = computed<Record<string, FormItemRule[]>>(() => ({
  name: [{ required: true, message: '标签名称不能为空', trigger: 'blur' }],
  type: [{ required: true, message: '请选择标签类型', trigger: 'change' }],
  scope: [{ required: true, message: '请选择标签作用域', trigger: 'change' }],
  icon: [{ required: true, message: '请选择图标', trigger: 'change' }],
  color: [{ required: true, message: '请选择颜色', trigger: 'change' }],
}));

// 新增下级标签时禁用类型选择（继承父标签）
const isTypeDisabled = computed(() => {
  if (formType.value === 'create' && parentData.value) return true;
  if (formType.value === 'update') return true;
  return false;
});

// 新增子标签 / 编辑时禁用作用域
const isScopeDisabled = computed(() => {
  if (formType.value === 'create' && parentData.value) return true;
  if (formType.value === 'update') return true;
  return false;
});

/**
 * 重置表单：清空 formData 字段并恢复默认值，清空父节点引用与图标搜索关键字
 */
function resetForm(): void {
  Object.keys(formData).forEach((k) => delete (formData as Record<string, unknown>)[k]);
  Object.assign(formData, { ...defaultForm });
  parentData.value = null;
  iconSearch.value = '';
}

/**
 * 选择图标：将选中的图标写入 formData.icon
 *
 * @param icon 选中的图标 class 字符串
 */
function selectIcon(icon: string): void {
  formData.icon = icon;
}

/**
 * 打开弹窗：mode=create 新增 / mode=update 编辑
 * 新增下级标签时传入 parentData 用于继承父标签的类型/作用域；编辑时拉取详情回显
 *
 * @param type 模式：'create' 新增 / 'update' 编辑
 * @param data 新增下级时为父标签数据；编辑时为待编辑的标签数据
 * @returns Promise<void>
 */
async function open(type: 'create' | 'update', data: LabelItem | null): Promise<void> {
  resetForm();
  dialogVisible.value = true;
  dialogTitle.value = type === 'create' ? '新增' : '修改';
  formType.value = type;

  if (data) {
    if (type === 'create') {
      // 新增下级标签：继承父标签的类型和作用域
      parentData.value = data;
      formData.type = data.type ?? 0;
      formData.scope = data.scope ?? 1;
    } else {
      // 编辑：拉取详情回显
      formLoading.value = true;
      try {
        const res = await labelDetail(String(data.id));
        const detail = res.data as Record<string, unknown> | undefined;
        formData.id = data.id;
        formData.name = data.name;
        formData.icon = data.icon || 'fas fa-home';
        formData.color = data.color || 'rgba(64, 158, 255, 0.8)';
        formData.parentId = data.parentId;
        formData.level = data.level;
        formData.type = (detail?.type as number) ?? data.type ?? 0;
        formData.scope = (detail?.scope as number) ?? data.scope ?? 1;
      } finally {
        formLoading.value = false;
      }
    }
  }
}

defineExpose({ open });

/**
 * 提交表单：先做表单校验，新增下级标签时设置 parentId 与 level，
 * 再调用 labelSave 接口（新增/修改共用），成功后关闭弹窗并触发 success 事件
 *
 * @returns Promise<void>
 */
async function handleSubmit(): Promise<void> {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) {
    ElMessage.warning('必填字段未填写');
    return;
  }
  submitLoading.value = true;
  try {
    const payload: Partial<LabelItem> = { ...formData };
    // 新增下级标签：设置 parentId 和 level
    if (formType.value === 'create' && parentData.value) {
      payload.parentId = parentData.value.id;
      payload.level = (parentData.value.level ?? 0) + 1;
    }
    const res = await labelSave(payload);
    if (res.code === 0) {
      ElMessage.success(formType.value === 'create' ? '新增成功' : '修改成功');
      dialogVisible.value = false;
      emit('success');
    } else {
      ElMessage.error(res.msg ?? (formType.value === 'create' ? '新增失败' : '修改失败'));
    }
  } finally {
    submitLoading.value = false;
  }
}

/** 弹窗打开后清除校验状态 */
function handleDialogOpen(): void {
  // el-form clearValidate 需在下一帧执行
  nextTick(() => formRef.value?.clearValidate());
}
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    :title="dialogTitle"
    width="750px"
    align-center
    append-to-body
    @open="handleDialogOpen"
  >
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="rules"
      label-position="left"
      label-width="120px"
      class="dialog-form"
    >
      <el-form-item label="标签名称" prop="name">
        <el-input v-model="formData.name as string" :maxlength="20" show-word-limit placeholder="请输入标签名称" />
      </el-form-item>

      <el-form-item label="标签类型" prop="type">
        <el-select
          v-model="formData.type as number"
          placeholder="请选择标签类型"
          :disabled="isTypeDisabled"
          style="width: 100%"
        >
          <el-option v-for="item in typeArr" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
      </el-form-item>

      <el-form-item label="标签作用域" prop="scope">
        <el-select
          v-model="formData.scope as number"
          placeholder="请选择标签作用域"
          :disabled="isScopeDisabled"
          style="width: 100%"
        >
          <el-option v-for="item in scopeArr" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
      </el-form-item>

      <el-form-item label="图标" prop="icon">
        <el-popover placement="bottom-start" trigger="click" width="400">
          <div class="icon-selector">
            <div class="icon-search">
              <el-input v-model="iconSearch" placeholder="搜索图标" size="small" />
            </div>
            <div class="icon-list">
              <div
                v-for="icon in filteredIcons"
                :key="icon"
                class="icon-item"
                :class="{ active: formData.icon === icon }"
                @click="selectIcon(icon)"
              >
                <i :class="icon" class="icon-glyph" />
                <span class="icon-name">{{ icon }}</span>
              </div>
              <div v-if="filteredIcons.length === 0" class="no-icons">未找到相关图标</div>
            </div>
          </div>
          <template #reference>
            <el-input v-model="formData.icon as string" placeholder="请选择图标" readonly>
              <template #prefix>
                <i :class="formData.icon || 'fas fa-home'" />
              </template>
            </el-input>
          </template>
        </el-popover>
      </el-form-item>

      <el-form-item label="颜色" prop="color">
        <div class="color-row">
          <el-color-picker v-model="formData.color as string" show-alpha />
          <el-input v-model="formData.color as string" placeholder="颜色值" style="width: 200px; margin-left: 10px" />
        </div>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
    </template>
  </el-dialog>
</template>

<style lang="less" scoped>
.dialog-form {
  width: 600px;
  margin-left: 20px;
}

.icon-selector {
  max-height: 300px;
  overflow-y: auto;
}

.icon-search {
  padding: 10px;
  border-bottom: 1px solid @color-border-light;
}

.icon-list {
  display: flex;
  flex-wrap: wrap;
  padding: 10px;
}

.icon-item {
  width: 33.33%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px;
  cursor: pointer;
  border-radius: 4px;
}

.icon-item:hover {
  background-color: @color-bg-table-row-hover;
}

.icon-item.active {
  background-color: @color-primary-light-9;
  color: @color-primary;
}

.icon-glyph {
  font-size: 20px;
}

.icon-name {
  font-size: 12px;
  margin-top: 5px;
  text-align: center;
  word-break: break-all;
}

.no-icons {
  width: 100%;
  text-align: center;
  padding: 20px;
  color: @color-text-secondary;
}

.color-row {
  display: flex;
  align-items: center;
}
</style>
