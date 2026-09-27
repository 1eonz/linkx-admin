<script setup lang="ts">
// demo：巡防任务登记 — 基础校验表单（label 上置 + blur/change 触发，错误样式由 LxForm 接管）
// 同时演示：LxForm 内直接写原生 el-form-item，同样获得组件库错误样式（存量迁移零成本）
import { reactive, ref } from 'vue';
import { ElFormItem, ElInput, ElOption, ElSelect } from 'element-plus';
import type { FormRules } from 'element-plus';
import { LxForm, LxFormItem, lxMessage } from '../../../index';
import type { LxFormInstance } from '../../../index';
import 'element-plus/es/components/input/style/css';
import 'element-plus/es/components/select/style/css';

const formRef = ref<LxFormInstance>();

const form = reactive({
  taskName: '',
  grid: '',
  phone: '',
  remark: '',
});

const rules: FormRules = {
  taskName: [
    { required: true, message: '请输入任务名称', trigger: 'blur' },
    { min: 2, max: 20, message: '任务名称长度 2 ~ 20 个字符', trigger: 'blur' },
  ],
  grid: [{ required: true, message: '请选择责任网格', trigger: 'change' }],
  phone: [{ pattern: /^1\d{10}$/, message: '联系电话须为 11 位手机号', trigger: 'blur' }],
};

function onSubmit() {
  formRef
    .value!.validate()
    .then(() => lxMessage.success('巡防任务登记成功'))
    .catch(() => lxMessage.warning('表单校验未通过，请检查标红项'));
}

function onReset() {
  formRef.value!.resetFields();
}
</script>

<template>
  <div style="max-width: 480px">
    <LxForm ref="formRef" :model="form" :rules="rules" label-position="top">
      <LxFormItem label="任务名称" prop="taskName">
        <ElInput v-model="form.taskName" placeholder="如：广场东侧夜间巡防" clearable />
      </LxFormItem>

      <LxFormItem label="责任网格" prop="grid">
        <ElSelect v-model="form.grid" placeholder="选择网格" clearable style="width: 100%">
          <ElOption label="GRID-01 中心商圈" value="grid-01" />
          <ElOption label="GRID-02 关山片区" value="grid-02" />
          <ElOption label="GRID-03 高新园区" value="grid-03" />
        </ElSelect>
      </LxFormItem>

      <!-- 存量兼容：原生 el-form-item 在 LxForm 内同样生效（rules 挂在 form.rules 上） -->
      <ElFormItem label="联系电话" prop="phone">
        <ElInput v-model="form.phone" placeholder="值班民警手机号" clearable />
      </ElFormItem>

      <LxFormItem label="现场备注" prop="remark">
        <ElInput v-model="form.remark" type="textarea" :rows="2" placeholder="选填" />
      </LxFormItem>

      <LxFormItem>
        <div style="display: flex; gap: 8px">
          <button class="demo-btn" type="button" @click="onSubmit">提交校验</button>
          <button class="demo-btn" type="button" @click="onReset">重置</button>
        </div>
      </LxFormItem>
    </LxForm>
  </div>
</template>
