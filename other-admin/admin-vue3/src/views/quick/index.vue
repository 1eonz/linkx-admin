<script setup lang="ts">
import { Plus, Edit, Delete } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox, ElTree } from 'element-plus';
import type { FormInstance, FormItemRule } from 'element-plus';
import { ref, reactive, watch } from 'vue';

import { labelDetail, labelList, labelSave, labelDelete, labelBatchDelete, type LabelItem } from '@/api/h5/quick';
import { useUserStore } from '@/store/modules/useUserStore';

defineOptions({ name: 'Quick' });

const userStore = useUserStore();

// tab：1=标签查看 / 2=标签编辑
const activeName = ref('1');

// ============= 标签查看（树形扁平化展示） =============
const lookList = ref<LabelItem[]>([]);
const lookLoading = ref(false);

// ============= 标签编辑（el-tree） =============
const treeData = ref<LabelItem[]>([]);
const treeLoading = ref(false);
const checkedKeys = ref<Array<string | number>>([]);

// 标签类型选项
const typeArr = [
  { id: 0, name: '普通标签' },
  { id: 1, name: '人员核查' },
];
// license 控制：AICollaborationAuth 为 true 时隐藏「人员核查」
const typeArrByLicense = () => {
  if (userStore.licenseAuth?.AICollaborationAuth) {
    return typeArr.filter((item) => item.name !== '人员核查');
  }
  return typeArr;
};

const scopeArr = [
  { id: 0, name: '全部' },
  { id: 1, name: '一键建群' },
  { id: 2, name: '职能建群' },
];

// ============= 新增/修改弹窗 =============
const formRef = ref<FormInstance>();
const treeRef = ref<InstanceType<typeof ElTree>>();
const dialogVisible = ref(false);
const dialogTitle = ref('新增');
const formType = ref<'create' | 'update'>('create');
const formLoading = ref(false);
const parent = ref<LabelItem | null>(null);

const defaultForm = () => ({
  id: '',
  name: '',
  type: 0,
  scope: 1,
  icon: 'fas fa-home',
  color: 'rgba(64, 158, 255, 0.8)',
  parentId: '',
  level: 0,
});

const formData = reactive(defaultForm());
const maxlength = ref(10);

// 表单校验规则
const rules: Record<string, FormItemRule[]> = {
  name: [{ required: true, message: '标签名称不能为空', trigger: 'blur' }],
  type: [{ required: true, message: '标签类型不能为空', trigger: 'change' }],
  scope: [{ required: true, message: '标签作用域不能为空', trigger: 'change' }],
  icon: [{ required: true, message: '图标不能为空', trigger: 'change' }],
  color: [{ required: true, message: '颜色不能为空', trigger: 'change' }],
};

// isTypeDisabled / isScopeDisabled
function isTypeDisabled(): boolean {
  if (formType.value === 'create' && parent.value) return true;
  if (formType.value === 'update') return true;
  return false;
}

function isScopeDisabled(): boolean {
  if (formType.value === 'create' && parent.value) return true;
  if (formType.value === 'update') return true;
  return false;
}

// 根据层级动态调整 maxlength
function getMaxLength(type: 'create' | 'update', data?: LabelItem): void {
  const level = Number(data?.level ?? 0);
  if (type === 'create') {
    if (level === 0) maxlength.value = 10;
    else if (level === 1) maxlength.value = 5;
    else if (level === 2) maxlength.value = 6;
  } else {
    if (level === 0 || level === 1) maxlength.value = 10;
    else if (level === 2) maxlength.value = 5;
    else maxlength.value = 6;
  }
}

// 重置表单
function resetForm(): void {
  Object.assign(formData, defaultForm());
  parent.value = null;
}

// open 方法
async function open(type: 'create' | 'update', data?: LabelItem, title?: string): Promise<void> {
  dialogVisible.value = true;
  dialogTitle.value = title ?? (type === 'create' ? '新增' : '修改');
  formType.value = type;
  resetForm();
  getMaxLength(type, data);
  if (data) {
    // 调用 labelDetail 拉取详情
    try {
      const res = await labelDetail(data.id);
      const detail = (res as unknown as { data?: LabelItem })?.data;
      if (!detail) return;
      if (type === 'create') {
        // 新增子标签：继承父标签的 type 和 scope
        parent.value = data;
        formData.type = data.type ?? 0;
        formData.scope = data.scope ?? 1;
      } else {
        // 修改
        formData.id = data.id;
        formData.name = detail.name ?? '';
        formData.icon = detail.icon ?? 'fas fa-home';
        formData.color = detail.color ?? 'rgba(64, 158, 255, 0.8)';
        formData.parentId = detail.parentId ?? '';
        formData.level = detail.level ?? 0;
        formData.type = detail.type ?? 0;
        formData.scope = detail.scope ?? 1;
      }
    } catch {
      // 忽略
    }
  } else {
    // 顶级新增
    formData.type = 0;
    formData.icon = 'fas fa-home';
    formData.color = 'rgba(64, 158, 255, 0.8)';
  }
}

// 提交：create 和 update 都调用 labelSave
async function handleRequest(): Promise<void> {
  if (!formRef.value) return;
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) return;
  formLoading.value = true;
  try {
    const param: Record<string, unknown> = { ...formData };
    if (parent.value) {
      param.parentId = parent.value.id;
      param.level = (parent.value.level ?? 0) + 1;
    }
    const res = await labelSave(param as never);
    if (res.code === 0) {
      ElMessage.success(formType.value === 'create' ? '新增成功' : '修改成功');
      dialogVisible.value = false;
      getList();
    } else {
      ElMessage.error(res.msg || '');
    }
  } finally {
    formLoading.value = false;
  }
}

// 删除单个标签
function handleDelete(data: LabelItem): void {
  ElMessageBox.confirm('确认删除吗？', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'info',
  })
    .then(() => {
      labelDelete(data.id)
        .then((res) => {
          if (res.code === 0) {
            ElMessage.success('删除成功');
            getList();
          } else {
            ElMessage.error(res.msg || '');
          }
        })
        .catch(() => {});
    })
    .catch(() => {});
}

// 批量删除
function handleBatchDelete(): void {
  if (checkedKeys.value.length === 0) {
    ElMessage.error('请勾选要删除的标签');
    return;
  }
  ElMessageBox.confirm('确认批量删除吗？', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'info',
  })
    .then(() => {
      labelBatchDelete(checkedKeys.value.map((k) => String(k)))
        .then((res) => {
          if (res.code === 0) {
            ElMessage.success('批量删除成功');
            checkedKeys.value = [];
            getList();
          } else {
            ElMessage.error(res.msg || '');
          }
        })
        .catch(() => {});
    })
    .catch(() => {});
}

// tree 选中变化（el-tree 的 check 事件签名：data + CheckedInfo）
// 直接同步 checkedKeys 为当前所有选中节点
function handleCheckChange(): void {
  // 通过 el-tree 实例获取所有选中节点的 key
  checkedKeys.value = treeRef.value?.getCheckedKeys() ?? [];
}

// 获取列表
async function getList(): Promise<void> {
  if (activeName.value === '1') {
    lookLoading.value = true;
    try {
      const res = await labelList();
      lookList.value = (res as unknown as { data?: LabelItem[] })?.data ?? [];
    } finally {
      lookLoading.value = false;
    }
  } else {
    treeLoading.value = true;
    try {
      const res = await labelList();
      treeData.value = (res as unknown as { data?: LabelItem[] })?.data ?? [];
    } finally {
      treeLoading.value = false;
    }
  }
}

// watch activeName
watch(activeName, () => getList());

// 首次加载
getList();
</script>

<template>
  <div class="app-container">
    <el-card shadow="always" class="card">
      <el-tabs v-model="activeName">
        <!-- 标签查看（树形扁平化列表） -->
        <el-tab-pane label="标签查看" name="1">
          <el-table v-loading="lookLoading" :data="lookList" stripe border style="width: 100%">
            <el-table-column label="标签名称" prop="name" align="center" />
            <el-table-column label="标签类型" align="center">
              <template #default="{ row }">
                <span>{{ row.type === 1 ? '人员核查' : '普通标签' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="标签作用域" align="center">
              <template #default="{ row }">
                <span>{{ scopeArr.find((s) => s.id === row.scope)?.name ?? '-' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="图标" align="center">
              <template #default="{ row }">
                <i :class="row.icon" :style="{ color: row.color }" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" align="center">
              <template #default="scope">
                <el-button
                  v-if="!(scope.row as LabelItem).children || (scope.row as LabelItem).children!.length === 0"
                  type="primary"
                  link
                  :icon="Edit"
                  @click="open('update', scope.row as LabelItem)"
                >
                  编辑
                </el-button>
                <el-button type="danger" link :icon="Delete" @click="handleDelete(scope.row as LabelItem)">
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- 标签编辑（树形） -->
        <el-tab-pane label="标签编辑" name="2">
          <div v-loading="treeLoading" class="tree-container">
            <div class="tree-toolbar">
              <el-button type="primary" :icon="Plus" @click="open('create')">新增标签</el-button>
              <el-button type="danger" :icon="Delete" @click="handleBatchDelete">批量删除</el-button>
            </div>
            <ElTree
              ref="treeRef"
              :data="treeData"
              show-checkbox
              default-expand-all
              node-key="id"
              :check-strictly="true"
              @check="handleCheckChange"
            >
              <template #default="{ data }">
                <span class="tree-node">
                  <i :class="data.icon" :style="{ color: data.color, marginRight: '6px' }" />
                  <span>{{ data.name }}</span>
                  <span class="tree-node-actions">
                    <el-button type="primary" link :icon="Plus" @click.stop="open('create', data, '新增子标签')" />
                    <el-button type="primary" link :icon="Edit" @click.stop="open('update', data)" />
                    <el-button type="danger" link :icon="Delete" @click.stop="handleDelete(data)" />
                  </span>
                </span>
              </template>
            </ElTree>
          </div>
        </el-tab-pane>
      </el-tabs>

      <!-- 新增/修改弹窗 -->
      <el-dialog
        v-model="dialogVisible"
        :title="dialogTitle"
        :close-on-click-modal="false"
        :destroy-on-close="true"
        append-to-body
        width="500px"
        align-center
      >
        <el-form ref="formRef" :model="formData" :rules="rules" label-width="100px" label-position="right">
          <el-form-item label="标签名称" prop="name">
            <el-input v-model="formData.name" :maxlength="maxlength" show-word-limit placeholder="请输入标签名称" />
          </el-form-item>
          <el-form-item label="标签类型" prop="type">
            <el-select
              v-model="formData.type"
              :disabled="isTypeDisabled()"
              placeholder="请选择标签类型"
              style="width: 100%"
            >
              <el-option v-for="item in typeArrByLicense()" :key="item.id" :label="item.name" :value="item.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="标签作用域" prop="scope">
            <el-select
              v-model="formData.scope"
              :disabled="isScopeDisabled()"
              placeholder="请选择标签作用域"
              style="width: 100%"
            >
              <el-option v-for="item in scopeArr" :key="item.id" :label="item.name" :value="item.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="图标" prop="icon">
            <el-input v-model="formData.icon" placeholder="请输入图标类名（如 fas fa-home）" />
          </el-form-item>
          <el-form-item label="颜色" prop="color">
            <el-color-picker v-model="formData.color" />
            <el-input v-model="formData.color" style="width: 200px; margin-left: 10px" placeholder="颜色值" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="formLoading" @click="handleRequest">确定</el-button>
        </template>
      </el-dialog>
    </el-card>
  </div>
</template>

<style lang="less" scoped>
.card {
  height: 100%;
  overflow-y: auto;
}

.tree-container {
  .tree-toolbar {
    margin-bottom: 16px;
    display: flex;
    gap: 8px;
  }

  .tree-node {
    display: flex;
    align-items: center;
    flex: 1;

    .tree-node-actions {
      margin-left: 12px;
      display: none;
    }

    &:hover .tree-node-actions {
      display: inline-flex;
    }
  }
}
</style>
