﻿<script setup lang="ts">
/**
 * AppsManageEditModal - 可调用应用编辑弹窗（两步表单）
 *
 * 南向应用编辑弹窗：
 * 1. 第一步：基础表单（名称/所属系统/系统编码自动生成/唯一标识/应用类型/展示范围/协议/IP/端口/URI/方法/请求头/请求体/请求参数/分页配置/数据库配置/数据刷新周期）
 * 2. 第二步：字段映射（mapperList 列表 + 添加/删除/上移下移/校验）
 * 3. 提交时 buildSubmitData 拼接所有字段 + mapper JSON.stringify
 */
import { Bottom, Delete, Right, Top } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { FormInstance, FormItemRule } from 'element-plus';
import { computed, nextTick, reactive, ref } from 'vue';

import { createCallableApp, getCallableAppDetail, updateCallableApp } from '@/api/thirdInterface/southInterface';

defineOptions({ name: 'AppsManageEditModal' });

const emit = defineEmits<{
  /** 保存成功后触发 */
  (e: 'success'): void;
}>();

// ===== 弹窗状态 =====
const dialogVisible = ref(false);
const dialogTitle = ref('新增');
const formType = ref<'create' | 'update'>('create');
const formLoading = ref(false);
const submitLoading = ref(false);

/** 当前步骤：0-基础表单，1-字段映射 */
const currentStep = ref<0 | 1>(0);

const formRef = ref<FormInstance>();

// ===== 表单默认值 =====
interface FormState {
  /** 记录 ID（编辑时传入，新增时为空） */
  id?: string;
  /** 应用名称 */
  name: string;
  /** 所属系统名称 */
  systemName: string;
  /** 系统编码（自动生成） */
  systemCode: string;
  /** 唯一标识字段 */
  uniqueId: string;
  /** 应用类型（1-RESTful接口、2-数据库） */
  type: number;
  /** 展示范围（1-PC端） */
  scope: number | '';
  /** 服务 IP */
  ip: string;
  /** 服务端口（1-65535） */
  port: string | number;
  /** 数据刷新周期（分钟，5/10/20/30/60/360/720/1440） */
  period: string;
  // HTTP 类型字段
  /** 访问协议（http/https） */
  protocol: string;
  /** 接口 URI 路径 */
  uri: string;
  /** HTTP 请求方式（GET/POST/PUT 等） */
  method: string;
  /** 请求头（JSON 字符串） */
  reqHeader: string;
  /** 请求体（JSON 字符串） */
  reqBody: string;
  /** 请求参数（JSON 字符串） */
  reqParam: string;
  /** 是否分页（0-不支持分页，1-分页） */
  pagenation: number;
  /** 分页参数位置（0-Query参数，1-Body参数） */
  pageParamLocation: number;
  /** 页码字段名 */
  pageFieldName: string;
  /** 每页条数字段名 */
  pageSizeFieldName: string;
  /** 响应数据路径（如 data.list） */
  responseDataPath: string;
  /** 分页类型（1-页码模式，2-偏移模式） */
  pagenationType: number | null;
  /** 时间戳字段标识（用于增量拉取） */
  dateTimeSign: string;
  /** 第一条数据开始时间 */
  dataStartTime: string;
  // 数据库类型字段
  /** 数据库类型（1-MySQL） */
  dbType: number;
  /** 数据库账号 */
  account: string;
  /** 数据库密码 */
  password: string;
  /** 表名/视图名 */
  dataName: string;
  /** 数据库实例名 */
  databaseName: string;
}

const DEFAULT_FORM: FormState = {
  name: '',
  systemName: '',
  systemCode: '',
  uniqueId: '',
  type: 1,
  scope: '',
  ip: '',
  port: '',
  period: '30',
  protocol: '',
  uri: '',
  method: '',
  reqHeader: '',
  reqBody: '',
  reqParam: '',
  pagenation: 0,
  pageParamLocation: 0,
  pageFieldName: '',
  pageSizeFieldName: '',
  responseDataPath: '',
  pagenationType: null,
  dateTimeSign: '',
  dataStartTime: '',
  dbType: 1,
  account: '',
  password: '',
  dataName: '',
  databaseName: '',
};

const formData = reactive<FormState>({ ...DEFAULT_FORM });

// ===== 字段映射列表 =====
interface MapperItem {
  /** 映射键（字段名，用于展示字段） */
  key: string;
  /** 映射值（字段含义，用于展示字段的列标题） */
  value: string;
}

const mapperList = ref<MapperItem[]>([]);

// ===== 选项配置 =====
const periodList = [
  { id: '5', name: '5min' },
  { id: '10', name: '10min' },
  { id: '20', name: '20min' },
  { id: '30', name: '30min' },
  { id: '60', name: '1h' },
  { id: '360', name: '6h' },
  { id: '720', name: '12h' },
  { id: '1440', name: '24h' },
];

const protocolList = [
  { value: 'http', label: 'HTTP (80)', port: 80 },
  { value: 'https', label: 'HTTPS (443)', port: 443 },
];

const methodList = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS', 'CONNECT', 'TRACE'];

const interfaceTypeList = [
  { value: 1, label: 'RESTful接口' },
  { value: 2, label: '数据库' },
];

const scopeList = [{ value: 1, label: 'PC端' }];

const dbTypeList = [{ value: 1, label: 'MySQL' }];

// ===== 校验规则 =====
const IP_REGEX =
  /^(1\d{2}|2[0-4]\d|25[0-5]|[1-9]\d|[1-9])\.(1\d{2}|2[0-4]\d|25[0-5]|[1-9]\d|\d)\.(1\d{2}|2[0-4]\d|25[0-5]|[1-9]\d|\d)\.(1\d{2}|2[0-4]\d|25[0-5]|[1-9]\d|\d)$/;

const KEY_REGEX = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

/**
 * 校验字符串是否为合法 JSON 格式
 *
 * @param _rule Element Plus 校验规则（未使用）
 * @param val 待校验的字符串
 * @param callback 校验回调，校验失败时传入 Error
 * @param fieldName 字段中文名（用于错误提示）
 */
const validateJson = (_rule: unknown, val: string, callback: (err?: Error) => void, fieldName: string): void => {
  if (val && val.trim()) {
    try {
      JSON.parse(val);
      callback();
    } catch {
      callback(new Error(`${fieldName}必须是有效的JSON格式`));
    }
  } else {
    callback();
  }
};

const baseRules = computed<Record<string, FormItemRule[]>>(() => {
  const r: Record<string, FormItemRule[]> = {
    name: [{ required: true, message: '名称不能为空', trigger: 'blur' }],
    systemName: [{ required: true, message: '所属系统不能为空', trigger: 'blur' }],
    systemCode: [{ required: true, message: '系统编码不能为空', trigger: 'blur' }],
    type: [{ required: true, message: '应用类型不能为空', trigger: 'blur' }],
    scope: [{ required: true, message: '展示范围不能为空', trigger: 'blur' }],
    ip: [
      { required: true, message: '访问IP不能为空', trigger: 'blur' },
      { pattern: IP_REGEX, message: '请输入正确的IP地址', trigger: 'blur' },
    ],
    port: [
      { required: true, message: '端口不能为空', trigger: 'blur' },
      { pattern: /^\d+$/, message: '端口必须是正整数', trigger: 'blur' },
      {
        validator: (_rule, val, cb) => {
          const num = Number(val);
          if (num < 1 || num > 65535) {
            cb(new Error('端口号范围是 1-65535'));
          } else {
            cb();
          }
        },
        trigger: 'blur',
      },
    ],
    period: [{ required: true, message: '数据刷新周期不能为空', trigger: 'blur' }],
    uniqueId: [{ required: true, message: '唯一标识字段不能为空', trigger: 'blur' }],
  };
  if (formData.type === 1) {
    r.protocol = [{ required: true, message: '访问协议不能为空', trigger: 'blur' }];
    r.uri = [{ required: true, message: '接口名称不能为空', trigger: 'blur' }];
    r.method = [{ required: true, message: '请求方式不能为空', trigger: 'blur' }];
    r.reqHeader = [
      { required: true, message: '请求头不能为空', trigger: 'blur' },
      {
        validator: (_rule, val, cb) => validateJson(_rule, val, cb, '请求头'),
        trigger: 'blur',
      },
    ];
    r.reqBody = [
      { required: true, message: '请求体不能为空', trigger: 'blur' },
      {
        validator: (_rule, val, cb) => validateJson(_rule, val, cb, '请求体'),
        trigger: 'blur',
      },
    ];
    r.reqParam = [
      { required: true, message: '请求参数不能为空', trigger: 'blur' },
      {
        validator: (_rule, val, cb) => validateJson(_rule, val, cb, '请求参数'),
        trigger: 'blur',
      },
    ];
    r.dateTimeSign = [{ required: true, message: '时间字段标识不能为空', trigger: 'blur' }];
    r.dataStartTime = [{ required: true, message: '第一条数据开始时间不能为空', trigger: 'blur' }];
    r.pagenation = [{ required: true, message: '是否分页不能为空', trigger: 'blur' }];
    if (formData.pagenation === 1) {
      r.pageParamLocation = [{ required: true, message: '分页参数类型不能为空', trigger: 'blur' }];
      r.pageFieldName = [{ required: true, message: '页码字段不能为空', trigger: 'blur' }];
      r.pageSizeFieldName = [{ required: true, message: '每页条数字段不能为空', trigger: 'blur' }];
    }
  } else if (formData.type === 2) {
    r.dataName = [{ required: true, message: '表名/视图名不能为空', trigger: 'blur' }];
    r.dbType = [{ required: true, message: '数据库类型不能为空', trigger: 'blur' }];
    r.databaseName = [{ required: true, message: '数据库名不能为空', trigger: 'blur' }];
    r.account = [{ required: true, message: '数据库账号不能为空', trigger: 'blur' }];
    r.password = [{ required: true, message: '数据库密码不能为空', trigger: 'blur' }];
  }
  return r;
});

// ===== 协议默认端口 =====
const protocolDefaultPort = computed(() => {
  return protocolList.find((item) => item.value === formData.protocol)?.port ?? 8000;
});

// ===== 工具方法 =====
/**
 * 生成系统编码：当前时间戳（10 位秒级）+ 5 位随机数
 *
 * @returns 系统编码字符串（共 15 位）
 */
function generateSystemCode(): string {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const randomNum = Math.floor(Math.random() * 100000)
    .toString()
    .padStart(5, '0');
  return timestamp + randomNum;
}

/**
 * 重置表单到初始状态：恢复默认值并重新生成系统编码、清空字段映射列表、回到第一步
 */
function resetForm(): void {
  Object.assign(formData, { ...DEFAULT_FORM, systemCode: generateSystemCode() });
  formData.id = undefined;
  mapperList.value = [];
  currentStep.value = 0;
}

// ===== 弹窗打开 =====
/**
 * 打开弹窗
 *
 * @param type 操作类型：'create'-新增，'update'-编辑
 * @param row 编辑模式下传入的行数据（含 id）；新增模式下不传
 */
async function open(type: 'create' | 'update', row?: { id: string }): Promise<void> {
  dialogTitle.value = type === 'create' ? '新增' : '修改';
  formType.value = type;
  currentStep.value = 0;
  formLoading.value = true;

  if (type === 'create') {
    Object.assign(formData, { ...DEFAULT_FORM, systemCode: generateSystemCode() });
    formData.id = undefined;
    mapperList.value = [];
    formLoading.value = false;
    dialogVisible.value = true;
  } else if (row?.id) {
    dialogVisible.value = true;
    formLoading.value = false;
    await getDetail(row.id);
  }
  nextTick(() => formRef.value?.clearValidate());
}

/**
 * 暴露给父组件的方法
 *
 * - open: 打开弹窗，传入 'create' 为新增模式，传入 'update' + row 为编辑模式
 */
defineExpose({ open });

// ===== 获取详情（字段映射） =====
/**
 * 拉取应用详情并填充表单
 *
 * @param id 应用记录 ID
 */
async function getDetail(id: string): Promise<void> {
  formLoading.value = true;
  try {
    const res = await getCallableAppDetail(id);
    const data = res?.data as Record<string, unknown> | undefined;
    if (data) {
      Object.assign(formData, {
        ...DEFAULT_FORM,
        id: data.id as string,
        name: (data.name as string) ?? '',
        systemName: (data.systemName as string) ?? '',
        systemCode: (data.systemCode as string) ?? '',
        uniqueId: (data.uniqueId as string) ?? '',
        type: (data.type as number) ?? 1,
        scope: (data.scope as number) ?? '',
        ip: (data.ip as string) ?? '',
        port: (data.port as string | number) ?? '',
        period: String(data.period ?? '30'),
      });

      if (data.type === 1) {
        formData.protocol = (data.protocol as string) ?? '';
        formData.uri = (data.uri as string) ?? '';
        formData.method = (data.method as string) ?? '';
        formData.reqHeader = (data.reqHeader as string) ?? '{}';
        formData.reqBody = (data.reqBody as string) ?? '{}';
        formData.reqParam = (data.reqParam as string) ?? '{}';
        formData.pagenation = (data.pagenation as number) ?? 0;
        formData.pageParamLocation = (data.pageParamLocation as number) ?? 0;
        formData.pageFieldName = (data.pageFieldName as string) ?? '';
        formData.pageSizeFieldName = (data.pageSizeFieldName as string) ?? '';
        formData.responseDataPath = (data.responseDataPath as string) ?? '';
        formData.pagenationType = (data.pagenationType as number) ?? null;
        formData.dateTimeSign = (data.dateTimeSign as string) ?? '';
        formData.dataStartTime = (data.dataStartTime as string) ?? '';
      }

      if (data.type === 2) {
        formData.dbType = (data.dbType as number) ?? 1;
        formData.account = (data.account as string) ?? '';
        formData.password = (data.password as string) ?? '';
        formData.dataName = (data.dataName as string) ?? '';
        formData.databaseName = (data.databaseName as string) ?? '';
      }

      // 解析 mapper
      let parsed: MapperItem[] = [];
      try {
        parsed = JSON.parse((data.mapper as string) ?? '[]');
      } catch {
        parsed = [];
      }
      mapperList.value = Array.isArray(parsed) ? parsed : [];
    } else {
      Object.assign(formData, { ...DEFAULT_FORM, systemCode: generateSystemCode() });
      mapperList.value = [];
    }
  } finally {
    formLoading.value = false;
  }
}

/**
 * 关闭弹窗并重置内部状态（currentStep、mapperList）
 */
function closeDialog(): void {
  dialogVisible.value = false;
  currentStep.value = 0;
  mapperList.value = [];
}

// ===== 步骤切换 =====
/**
 * 下一步：校验第一步基础表单（含 JSON 字段格式校验），通过后切换到第二步字段映射
 */
async function nextStep(): Promise<void> {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  // 校验 JSON 字段
  if (formData.type === 1) {
    const jsonFields: Array<{ key: 'reqHeader' | 'reqBody' | 'reqParam'; name: string }> = [
      { key: 'reqHeader', name: '请求头' },
      { key: 'reqBody', name: '请求体' },
      { key: 'reqParam', name: '请求参数' },
    ];
    for (const { key, name } of jsonFields) {
      const val = formData[key];
      if (!val || !val.trim()) {
        ElMessage.error(`${name}不能为空`);
        return;
      }
      try {
        JSON.parse(val);
      } catch {
        ElMessage.error(`${name}必须是有效的JSON格式`);
        return;
      }
    }
  }
  currentStep.value = 1;
}

/**
 * 上一步：从字段映射回到基础表单
 */
function prevStep(): void {
  currentStep.value = 0;
}

// ===== 应用类型切换 =====
/**
 * 应用类型切换处理：清空非当前类型的字段，避免脏数据残留
 *
 * - type=1（RESTful接口）：清空数据库相关字段
 * - type=2（数据库）：清空 HTTP 相关字段
 */
function changeType(): void {
  nextTick(() => formRef.value?.clearValidate());
  if (formData.type === 1) {
    formData.dbType = 1;
    formData.account = '';
    formData.password = '';
    formData.dataName = '';
    formData.databaseName = '';
  } else if (formData.type === 2) {
    formData.protocol = '';
    formData.method = '';
    formData.reqBody = '';
    formData.reqHeader = '';
    formData.reqParam = '';
    formData.uri = '';
    formData.pagenation = 0;
    formData.pageParamLocation = 0;
    formData.pageFieldName = '';
    formData.pageSizeFieldName = '';
    formData.dateTimeSign = '';
    formData.dataStartTime = '';
  }
}

/**
 * 分页开关切换处理：重置分页相关字段（参数位置、页码字段、每页条数字段）
 */
function changePagenation(): void {
  formData.pageParamLocation = 0;
  formData.pageFieldName = '';
  formData.pageSizeFieldName = '';
}

/**
 * 选择数据刷新周期
 *
 * @param id 周期值（分钟，字符串形式）
 */
function clickPeriod(id: string): void {
  formData.period = id;
}

// ===== 字段映射操作 =====
/**
 * 添加一个新的字段映射项（key/value 均为空字符串）
 */
function handleAddMapper(): void {
  mapperList.value.push({ key: '', value: '' });
}

/**
 * 删除指定位置的字段映射项
 *
 * @param index 映射项索引
 */
function handleRemoveMapper(index: number): void {
  mapperList.value.splice(index, 1);
}

/**
 * 重置字段映射：弹出确认框，确认后清空所有映射项
 */
function handleResetMapper(): void {
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

/**
 * 交换两个映射项的位置
 *
 * @param indexA 索引 A
 * @param indexB 索引 B
 */
function swapItems(indexA: number, indexB: number): void {
  const temp = mapperList.value[indexA];
  mapperList.value[indexA] = mapperList.value[indexB];
  mapperList.value[indexB] = temp;
}

/**
 * 上移映射项：将指定索引的项与上一项交换位置
 *
 * @param index 当前项索引（为 0 时不操作）
 */
function handleMoveUp(index: number): void {
  if (index > 0) swapItems(index, index - 1);
}

/**
 * 下移映射项：将指定索引的项与下一项交换位置
 *
 * @param index 当前项索引（为最后一项时不操作）
 */
function handleMoveDown(index: number): void {
  if (index < mapperList.value.length - 1) swapItems(index, index + 1);
}

/**
 * 字段名（key）失焦处理：trim、校验重复、校验格式（字母/数字/下划线、不能以数字开头）
 *
 * @param index 映射项索引
 */
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

/**
 * 字段含义（value）失焦处理：仅 trim
 *
 * @param index 映射项索引
 */
function handleValueBlur(index: number): void {
  const item = mapperList.value[index];
  if (item.value) {
    item.value = item.value.trim();
  }
}

// ===== 校验字段映射 =====
/**
 * 校验字段映射列表的合法性
 *
 * 校验规则：
 * 1. 至少有一个映射项
 * 2. 字段名（key）和字段含义（value）不能为空
 * 3. 字段名格式合法（字母/数字/下划线，不能以数字开头）
 * 4. 字段名不能重复
 *
 * @returns 校验是否通过：true-通过，false-失败（同时弹出错误提示）
 */
function validateMapper(): boolean {
  if (mapperList.value.length === 0) {
    ElMessage.error('请至少添加一个字段映射');
    return false;
  }
  const keysSet = new Set<string>();
  for (let i = 0; i < mapperList.value.length; i++) {
    const item = mapperList.value[i];
    if (!item.key || !item.key.trim()) {
      ElMessage.error(`第 ${i + 1} 个映射的"字段名"不能为空`);
      return false;
    }
    if (!item.value || !item.value.trim()) {
      ElMessage.error(`第 ${i + 1} 个映射的"字段含义"不能为空`);
      return false;
    }
    const trimmedKey = item.key.trim();
    if (!KEY_REGEX.test(trimmedKey)) {
      ElMessage.error(`字段名"${trimmedKey}"只能包含字母、数字、下划线，且不能以数字开头`);
      return false;
    }
    if (keysSet.has(trimmedKey)) {
      ElMessage.error(`字段名"${trimmedKey}"重复，请使用唯一的字段名`);
      return false;
    }
    keysSet.add(trimmedKey);
  }
  return true;
}

// ===== 构建提交数据 =====
/**
 * 构建提交给后端的数据对象
 *
 * - 端口、周期转换为数字
 * - mapperList 序列化为 JSON 字符串（空列表时为空字符串）
 *
 * @returns 提交数据对象
 */
function buildSubmitData(): Record<string, unknown> {
  return {
    name: formData.name,
    systemName: formData.systemName,
    systemCode: formData.systemCode,
    uniqueId: formData.uniqueId,
    type: formData.type,
    scope: formData.scope,
    ip: formData.ip,
    port: Number(formData.port),
    period: Number(formData.period),
    protocol: formData.protocol,
    uri: formData.uri,
    method: formData.method,
    reqHeader: formData.reqHeader,
    reqBody: formData.reqBody,
    reqParam: formData.reqParam,
    pagenation: formData.pagenation,
    pageParamLocation: formData.pageParamLocation,
    pageFieldName: formData.pageFieldName,
    pageSizeFieldName: formData.pageSizeFieldName,
    responseDataPath: formData.responseDataPath,
    pagenationType: formData.pagenationType,
    dateTimeSign: formData.dateTimeSign,
    dataStartTime: formData.dataStartTime,
    dbType: formData.dbType,
    account: formData.account,
    password: formData.password,
    dataName: formData.dataName,
    databaseName: formData.databaseName,
    mapper: mapperList.value.length > 0 ? JSON.stringify(mapperList.value) : '',
  };
}

// ===== 提交 =====
/**
 * 提交表单：先校验字段映射，通过后调用新增/更新接口，成功后触发 success 事件并关闭弹窗
 */
async function handleSubmit(): Promise<void> {
  if (!validateMapper()) return;
  submitLoading.value = true;
  try {
    const payload = buildSubmitData();
    const isCreate = formType.value === 'create';
    const res = isCreate ? await createCallableApp(payload) : await updateCallableApp(formData.id as string, payload);
    if (res.code === 0) {
      ElMessage.success(isCreate ? '新增成功' : '修改成功');
      emit('success');
      dialogVisible.value = false;
    } else {
      ElMessage.error(res.msg ?? (isCreate ? '新增失败，请稍后重试' : '修改失败，请稍后重试'));
    }
  } catch {
    ElMessage.error(formType.value === 'create' ? '新增失败，请稍后重试' : '修改失败，请稍后重试');
  } finally {
    submitLoading.value = false;
  }
}
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    :title="dialogTitle"
    width="800px"
    align-center
    append-to-body
    :close-on-click-modal="false"
    @close="closeDialog"
  >
    <div class="content-box">
      <!-- 第一步：基础表单 -->
      <div v-show="currentStep === 0" class="step-content">
        <el-form
          ref="formRef"
          v-loading="formLoading"
          :model="formData"
          :rules="baseRules"
          label-position="left"
          label-width="200px"
          style="width: 100%; padding: 0 30px; box-sizing: border-box"
        >
          <el-form-item label="名称" prop="name">
            <el-input v-model="formData.name" maxlength="100" show-word-limit placeholder="请输入" />
          </el-form-item>
          <el-form-item label="所属系统" prop="systemName">
            <el-input v-model="formData.systemName" maxlength="50" show-word-limit placeholder="请输入" />
          </el-form-item>
          <el-form-item label="系统编码" prop="systemCode">
            <el-input v-model="formData.systemCode" disabled maxlength="50" show-word-limit placeholder="自动生成" />
          </el-form-item>
          <el-form-item label="唯一标识字段" prop="uniqueId">
            <el-input v-model="formData.uniqueId" maxlength="50" show-word-limit />
          </el-form-item>
          <el-form-item label="应用类型" prop="type">
            <el-select v-model="formData.type" style="width: 100%" @change="changeType">
              <el-option v-for="item in interfaceTypeList" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="展示范围" prop="scope">
            <el-select v-model="formData.scope" style="width: 100%">
              <el-option v-for="item in scopeList" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>

          <!-- HTTP 类型字段 -->
          <template v-if="formData.type === 1">
            <el-form-item label="访问协议" prop="protocol">
              <el-select v-model="formData.protocol" filterable placeholder="示例：http" style="width: 100%">
                <el-option v-for="item in protocolList" :key="item.value" :label="item.value" :value="item.value" />
              </el-select>
            </el-form-item>
          </template>

          <el-form-item label="访问IP" prop="ip">
            <el-input v-model="formData.ip" maxlength="50" show-word-limit placeholder="示例：127.0.0.0" />
          </el-form-item>
          <el-form-item label="端口" prop="port">
            <el-input
              v-model="formData.port"
              maxlength="10"
              show-word-limit
              :placeholder="`示例：${protocolDefaultPort}`"
            />
          </el-form-item>

          <template v-if="formData.type === 1">
            <el-form-item label="接口URI" prop="uri">
              <el-input v-model="formData.uri" maxlength="200" show-word-limit placeholder="示例：/getList/task" />
            </el-form-item>
            <el-form-item label="请求方式" prop="method">
              <el-select v-model="formData.method" filterable placeholder="示例：GET" style="width: 100%">
                <el-option v-for="m in methodList" :key="m" :label="m" :value="m" />
              </el-select>
            </el-form-item>
            <el-form-item label="第一条数据开始时间" prop="dataStartTime">
              <el-date-picker
                v-model="formData.dataStartTime"
                type="datetime"
                placeholder="请选择日期时间"
                value-format="YYYY-MM-DD HH:mm:ss"
                style="width: 100%"
              />
            </el-form-item>
            <el-form-item label="时间字段标识" prop="dateTimeSign">
              <el-input v-model="formData.dateTimeSign" maxlength="50" show-word-limit placeholder="示例：createTime" />
            </el-form-item>
            <el-form-item label="请求Header" prop="reqHeader">
              <el-input
                v-model="formData.reqHeader"
                type="textarea"
                :rows="3"
                maxlength="2000"
                show-word-limit
                placeholder='示例：{"Content-Type": "application/json"}...，无则填{}'
              />
            </el-form-item>
            <el-form-item label="请求Body" prop="reqBody">
              <el-input
                v-model="formData.reqBody"
                type="textarea"
                :rows="3"
                maxlength="2000"
                show-word-limit
                placeholder='示例：{"id": "123456"}...，无则填{}'
              />
            </el-form-item>
            <el-form-item label="请求Params" prop="reqParam">
              <el-input
                v-model="formData.reqParam"
                type="textarea"
                :rows="3"
                maxlength="2000"
                show-word-limit
                placeholder='示例：{"id": "123456"}...，无则填{}'
              />
            </el-form-item>
            <el-form-item label="是否分页" prop="pagenation">
              <el-radio-group v-model="formData.pagenation" @change="changePagenation">
                <el-radio :value="0">不支持分页</el-radio>
                <el-radio :value="1">分页</el-radio>
              </el-radio-group>
            </el-form-item>
            <template v-if="formData.pagenation === 1">
              <el-form-item label="分页类型" prop="pagenationType">
                <el-select v-model="formData.pagenationType" clearable placeholder="请选择分页类型" style="width: 100%">
                  <el-option label="页码模式" :value="1" />
                  <el-option label="偏移模式" :value="2" />
                </el-select>
              </el-form-item>
              <el-form-item label="分页参数类型" prop="pageParamLocation">
                <el-radio-group v-model="formData.pageParamLocation">
                  <el-radio :value="0">Query参数</el-radio>
                  <el-radio :value="1">Body参数</el-radio>
                </el-radio-group>
              </el-form-item>
              <el-form-item label="页码字段" prop="pageFieldName">
                <el-input v-model="formData.pageFieldName" placeholder="示例：pageNum" />
              </el-form-item>
              <el-form-item label="每页条数字段" prop="pageSizeFieldName">
                <el-input v-model="formData.pageSizeFieldName" placeholder="示例：pageSize" />
              </el-form-item>
              <el-form-item label="响应数据路径" prop="responseDataPath">
                <el-input v-model="formData.responseDataPath" placeholder="示例：data.list" />
              </el-form-item>
            </template>
          </template>

          <!-- 数据库类型字段 -->
          <template v-if="formData.type === 2">
            <el-form-item label="表名/视图名" prop="dataName">
              <el-input v-model="formData.dataName" clearable placeholder="示例：data_name" />
            </el-form-item>
            <el-form-item label="数据库名" prop="databaseName">
              <el-input v-model="formData.databaseName" clearable placeholder="示例：database_name" />
            </el-form-item>
            <el-form-item label="数据库类型" prop="dbType">
              <el-select v-model="formData.dbType" style="width: 100%">
                <el-option v-for="item in dbTypeList" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="数据库账号" prop="account">
              <el-input v-model="formData.account" clearable placeholder="示例：account@1234" />
            </el-form-item>
            <el-form-item label="数据库密码" prop="password">
              <el-input
                v-model="formData.password"
                type="password"
                show-password
                clearable
                placeholder="示例：Aa@123456"
              />
            </el-form-item>
          </template>

          <el-form-item label="数据刷新周期" prop="period">
            <div class="cycle-list">
              <div
                v-for="item in periodList"
                :key="item.id"
                class="cycle-item"
                :class="{ 'active-cycle': item.id === formData.period }"
                @click="clickPeriod(item.id)"
              >
                {{ item.name }}
              </div>
            </div>
          </el-form-item>
        </el-form>
      </div>

      <!-- 第二步：字段映射配置 -->
      <div v-show="currentStep === 1" class="step-content">
        <div class="mapper-container">
          <div class="mapper-header">
            <el-button type="primary" size="small" @click="handleAddMapper">添加映射</el-button>
            <el-button size="small" :disabled="mapperList.length === 0" @click="handleResetMapper">清空所有</el-button>
            <span class="mapper-tip">提示：字段名(key)用于展示字段，字段含义(value)用于展示字段的列标题</span>
          </div>

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
                <el-button
                  plain
                  type="primary"
                  size="small"
                  circle
                  :disabled="index === 0"
                  @click="handleMoveUp(index)"
                >
                  <el-icon><Top /></el-icon>
                </el-button>
                <el-button
                  plain
                  type="primary"
                  size="small"
                  circle
                  :disabled="index === mapperList.length - 1"
                  @click="handleMoveDown(index)"
                >
                  <el-icon><Bottom /></el-icon>
                </el-button>
                <el-button plain type="danger" size="small" circle @click="handleRemoveMapper(index)">
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
            </div>
          </div>

          <el-empty
            v-if="mapperList.length === 0"
            description="暂无映射配置，请点击添加映射"
            :image-size="80"
            class="mapper-empty"
          />
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="closeDialog">取 消</el-button>
        <el-button v-if="currentStep > 0" @click="prevStep">上一步</el-button>
        <el-button v-if="currentStep === 0" type="primary" @click="nextStep">下一步</el-button>
        <el-button v-if="currentStep === 1" type="primary" :loading="submitLoading" @click="handleSubmit"
          >确 定</el-button
        >
      </div>
    </template>
  </el-dialog>
</template>

<style lang="less" scoped>
.content-box {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-height: 60vh;
  overflow-y: auto;
}

.step-content {
  width: 100%;
}

.mapper-container {
  display: flex;
  flex-direction: column;
  height: 400px;
  padding: 0 16px;
}

.mapper-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid @color-border-light;
  flex-wrap: wrap;
  gap: 8px;

  .mapper-tip {
    font-size: 12px;
    color: @color-text-placeholder;
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

.cycle-list {
  display: flex;
  align-items: center;
  margin-top: 9px;
  flex-wrap: wrap;

  .cycle-item {
    padding: 0 12px;
    height: 22px;
    line-height: 22px;
    text-align: center;
    font-size: 14px;
    font-weight: 400;
    border: 1px solid rgba(217, 217, 217, 1);
    cursor: pointer;
    margin-right: 8px;
    margin-bottom: 8px;

    &.active-cycle {
      color: rgba(38, 78, 209, 1);
      border-color: rgba(38, 78, 209, 1);
    }
  }
}
</style>
