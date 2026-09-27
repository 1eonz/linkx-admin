<script setup lang="ts">
// demo：编辑节点信息 — LxDialog + LxForm columns=2 双列表单弹窗
// 演示业务最大惯用法：init 打开 + 回显 + nextTick(clearValidate) 清残留校验 + validate + loading 提交
// 视觉源：stitch _26 节点管理表单弹窗（672px max-w-2xl 双列 grid）
import { nextTick, reactive, ref } from 'vue';
import { ElInput, ElOption, ElSelect } from 'element-plus';
import type { FormRules } from 'element-plus';
import { LxDialog, LxForm, LxFormItem, lxMessage } from '../../../index';
import type { LxFormInstance } from '../../../index';
import 'element-plus/es/components/input/style/css';
import 'element-plus/es/components/select/style/css';

const visible = ref(false);
const loading = ref(false);
const formRef = ref<LxFormInstance>();

const defaults = () => ({ code: '', name: '', grid: '', remark: '' });
const form = reactive(defaults());

const rules: FormRules = {
  code: [
    { required: true, message: '请输入节点编码', trigger: 'blur' },
    {
      pattern: /^[A-Z][A-Z0-9_]*$/,
      message: '节点编码格式不合规，须以大写字母与下划线组成',
      trigger: 'blur',
    },
  ],
  name: [{ required: true, message: '请输入节点名称', trigger: 'blur' }],
  grid: [{ required: true, message: '请选择所属网格', trigger: 'change' }],
};

/** 打开弹窗：重置数据 + nextTick 清残留校验（回显数据不触发校验的惯用法） */
function open() {
  Object.assign(form, defaults());
  visible.value = true;
  nextTick(() => formRef.value?.clearValidate());
}

function onConfirm() {
  formRef
    .value!.validate()
    .then(() => {
      loading.value = true;
      // 业务在此发请求（P7：组件零请求依赖）
      setTimeout(() => {
        loading.value = false;
        visible.value = false;
        lxMessage.success('节点信息已保存');
      }, 800);
    })
    .catch(() => {});
}
</script>

<template>
  <div>
    <button class="demo-btn" type="button" @click="open">编辑节点信息</button>

    <LxDialog
      v-model="visible"
      title="编辑节点信息"
      icon="server"
      confirm-text="保存"
      :loading="loading"
      @confirm="onConfirm"
    >
      <LxForm ref="formRef" :model="form" :rules="rules" :columns="2">
        <LxFormItem label="节点编码 (Node Code)" prop="code">
          <ElInput v-model="form.code" placeholder="如 NODE_01" clearable />
        </LxFormItem>

        <LxFormItem label="节点名称" prop="name">
          <ElInput v-model="form.name" placeholder="部署点位名称" clearable />
        </LxFormItem>

        <LxFormItem label="所属网格" prop="grid">
          <ElSelect v-model="form.grid" placeholder="选择网格" clearable style="width: 100%">
            <ElOption label="GRID-01 中心商圈" value="grid-01" />
            <ElOption label="GRID-02 关山片区" value="grid-02" />
            <ElOption label="GRID-03 高新园区" value="grid-03" />
          </ElSelect>
        </LxFormItem>

        <LxFormItem label="接入协议">
          <ElSelect placeholder="默认国密 SLA 通道" clearable style="width: 100%">
            <ElOption label="国密 SLA" value="sla" />
            <ElOption label="视频级联 GB28181" value="gb28181" />
          </ElSelect>
        </LxFormItem>

        <!-- 通栏字段：span="full"（stitch 弹窗 col-span-2 规格） -->
        <LxFormItem label="备注" prop="remark" span="full">
          <ElInput v-model="form.remark" type="textarea" :rows="2" placeholder="选填" />
        </LxFormItem>
      </LxForm>
    </LxDialog>
  </div>
</template>
