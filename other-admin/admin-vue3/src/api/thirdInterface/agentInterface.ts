import type { ApiResponse, HttpResult, PaginatedResult } from '#/axios';
import http from '@/utils/http';
import { getServiceFile } from '@/utils/index';

/**
 * AI 智能体部署配置（separatedDeploy=true 时分组部署）
 */
export interface DeploySettings {
  /** 是否分离部署（true: AI 服务与前端分组部署） */
  separatedDeploy: boolean;
  /** AI 服务地址（后端） */
  groupAiHost: string;
  /** AI 前端地址（分离部署时必填） */
  groupAiFrontendHost?: string;
  [key: string]: unknown;
}

/**
 * AI 智能体审批配置
 */
export interface AiagentSettings {
  /** 是否启用审批 */
  approvalEnabled: boolean;
  /** 审批子模式：0=系统内置 / 1=外部系统 */
  approvalSubMode?: 0 | 1;
  /** 外部审批系统 URL（approvalSubMode=1 时必填） */
  approvalSystemUrl?: string;
  [key: string]: unknown;
}

/**
 * 智能体优先级：0=高 / 1=中 / 2=低
 */
export type AiagentPriority = 0 | 1 | 2;

/** HTTP 方法 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

/**
 * 智能体条目
 */
export interface AiagentItem {
  id: string;
  /** 智能体名称 */
  name: string;
  /** 描述 */
  desc: string;
  /** 头像 URL */
  avatarUrl: string;
  /** 调用 URL */
  url: string;
  /** 访问 token */
  token: string;
  /** 自定义请求头（JSON 字符串） */
  header?: string;
  /** 查询参数（JSON 字符串） */
  query?: string;
  /** 请求体（JSON 字符串） */
  body?: string;
  /** HTTP 方法 */
  httpMethod?: HttpMethod;
  /** 优先级 */
  priority: AiagentPriority;
  /** 分类 id 列表 */
  categoryIds: string[];
  /** 分类名称（回显用） */
  categoryName?: string;
  /** 是否限制范围：0=全员 / 1=受限 */
  isRestricted: 0 | 1;
  /** 语音支持能力：0=不支持 / 1=支持 */
  audio?: 0 | 1;
  /** 语音文件类型（扩展名数组，如 ['.mp3', '.aac']） */
  audioType?: string[];
  /** 视频支持能力：0=不支持 / 1=支持 */
  video?: 0 | 1;
  /** 视频文件类型（扩展名数组） */
  videoType?: string[];
  /** 图片支持能力：0=不支持 / 1=支持 */
  image?: 0 | 1;
  /** 图片文件类型（扩展名数组） */
  imageType?: string[];
  /** 文档支持能力：0=不支持 / 1=支持 */
  document?: 0 | 1;
  /** 文档文件类型（扩展名数组） */
  documentType?: string[];
  /** 文件接口 id */
  fileInterfaceId?: string;
  /** 参数脚本 */
  paramScript?: string;
  /** 响应脚本 */
  respScript?: string;
  /** 虚拟用户 id */
  virtualUserId?: string;
  [key: string]: unknown;
}

/**
 * 智能体分类
 */
export interface AgentCategory {
  id?: string;
  name: string;
  [key: string]: unknown;
}

/**
 * 智能体查询记录
 */
export interface AiagentRecord {
  id: string;
  /** 查询人姓名 */
  userName: string;
  /** 查询人身份证号 */
  identityCardNumber: string;
  /** 智能体名称 */
  agentName: string;
  /** 部门名称 */
  departmentName: string;
  /** 查询内容 */
  queryContent: string;
  /** 查询时间 */
  time: string;
  /** 响应内容 */
  responseContent?: string;
  [key: string]: unknown;
}

/**
 * 文件接口项
 */
export interface AgentFileItem {
  id: string;
  /** 接口名称 */
  name: string;
  /** HTTP 方法 */
  method: HttpMethod;
  /** IP 地址 */
  ip: string;
  /** 端口 */
  port: number;
  /** URI 路径 */
  uri: string;
  /** 自定义请求头（JSON 字符串） */
  header?: string;
  /** 查询参数（JSON 字符串） */
  query?: string;
  /** 请求体（JSON 字符串） */
  body?: string;
  /** 响应文件字段名 */
  reponseFileFiled?: string;
  /** 描述 */
  desc: string;
  [key: string]: unknown;
}

// ===== 部署配置 =====

/** 获取部署配置（GET /api/globals/ai/deploy） */
export function getDeploySettings(): HttpResult<DeploySettings> {
  return http.get<DeploySettings>('/api/globals/ai/deploy');
}

/** 更新部署配置（PUT /api/globals/ai/deploy） */
export function updateDeploySettings(data: DeploySettings): Promise<ApiResponse> {
  return http.put<string>('/api/globals/ai/deploy', data);
}

// ===== 审批配置 =====

/** 获取审批配置（GET /XA-ics-agent/proxy/ai/v1/aiagent/management/settings） */
export function getAiagentSettings(): HttpResult<AiagentSettings> {
  return http.get<AiagentSettings>('/XA-ics-agent/proxy/ai/v1/aiagent/management/settings');
}

/** 更新审批配置（PUT /XA-ics-agent/proxy/ai/v1/aiagent/management/settings） */
export function updateAiagentSettings(data: AiagentSettings): Promise<ApiResponse> {
  return http.put<string>('/XA-ics-agent/proxy/ai/v1/aiagent/management/settings', data);
}

// ===== 智能体导入导出 =====

/**
 * 导入智能体（POST /XA-ics-agent/proxy/ai/v1/aiagent/management/import，multipart/form-data）
 */
export function importAiagent(file: File): HttpResult<unknown> {
  const formData = new FormData();
  formData.append('file', file);
  return http.post<unknown>('/XA-ics-agent/proxy/ai/v1/aiagent/management/import', formData);
}

/**
 * 下载智能体导入模板（GET /XA-ics-agent/proxy/ai/v1/aiagent/management/template）
 *
 * 返回 ArrayBuffer，调用方通过 getServiceFile 触发浏览器下载。
 */
export function exportAiagentTemplate(): HttpResult<ArrayBuffer> {
  return http.get<ArrayBuffer>('/XA-ics-agent/proxy/ai/v1/aiagent/management/template', {
    responseType: 'arraybuffer',
  } as never);
}

/** 触发浏览器下载智能体导入模板 */
export async function downloadAiagentTemplate(filename = '智能体导入模板.xlsx'): Promise<void> {
  const res = await exportAiagentTemplate();
  if (!res || res.code !== 0 || !res.data) {
    return;
  }
  getServiceFile(new Blob([res.data as unknown as ArrayBuffer]), filename);
}

// ===== 智能体 CRUD =====

/**
 * 智能体分页（GET /XA-ics-agent/proxy/ai/v1/aiagent/management/page）
 *
 * 注意：分页参数为 pageNo/pageSize（与后端约定）
 */
export function getAiagentPage(params: {
  pageNo: number;
  pageSize: number;
  name?: string;
  categoryId?: string;
}): HttpResult<PaginatedResult<AiagentItem>> {
  return http.get<PaginatedResult<AiagentItem>>('/XA-ics-agent/proxy/ai/v1/aiagent/management/page', { params });
}

/** 新增智能体（POST /XA-ics-agent/proxy/ai/v1/aiagent/management） */
export function addAiagent(data: Partial<AiagentItem>): HttpResult<string> {
  return http.post<string>('/XA-ics-agent/proxy/ai/v1/aiagent/management', data);
}

/** 更新智能体（PUT /XA-ics-agent/proxy/ai/v1/aiagent/management/{id}） */
export function updateAiagent(id: string, data: Partial<AiagentItem>): Promise<ApiResponse> {
  return http.put<string>(`/XA-ics-agent/proxy/ai/v1/aiagent/management/${encodeURIComponent(id)}`, data);
}

/** 删除智能体（DELETE /XA-ics-agent/proxy/ai/v1/aiagent/management/{id}） */
export function deleteAiagent(id: string): Promise<ApiResponse> {
  return http.delete<string>(`/XA-ics-agent/proxy/ai/v1/aiagent/management/${encodeURIComponent(id)}`);
}

// ===== 文件上传 =====

/**
 * 上传图标/文件（POST /XA-ics-agent/admin-api/proxy/ai/v1/infra/file/upload，multipart/form-data）
 */
export function uploadAgentFile(file: File): HttpResult<string> {
  const formData = new FormData();
  formData.append('file', file);
  return http.post<string>('/XA-ics-agent/admin-api/proxy/ai/v1/infra/file/upload', formData);
}

// ===== 智能体分类 =====

/** 分类列表（GET /XA-ics-agent/proxy/ai/v1/aiagent/management/category/list） */
export function queryCategory(): HttpResult<AgentCategory[]> {
  return http.get<AgentCategory[]>('/XA-ics-agent/proxy/ai/v1/aiagent/management/category/list');
}

/**
 * 批量增删分类（POST /XA-ics-agent/proxy/ai/v1/aiagent/management/category/saveOrUpdate/batch）
 *
 * 后端根据 item 是否有 id 决定新增/更新；列表外的现有分类会被删除。
 */
export function createCategory(data: AgentCategory[]): HttpResult<string> {
  return http.post<string>('/XA-ics-agent/proxy/ai/v1/aiagent/management/category/saveOrUpdate/batch', data);
}

/** 删除分类（DELETE /XA-ics-agent/proxy/ai/v1/aiagent/management/category/{id}） */
export function deleteCategory(id: string): Promise<ApiResponse> {
  return http.delete<string>(`/XA-ics-agent/proxy/ai/v1/aiagent/management/category/${encodeURIComponent(id)}`);
}

// ===== 查询记录 =====

/**
 * 查询记录分页（GET /XA-ics-agent/proxy/ai/v1/aiagent/management/record）
 */
export function getAiagentRecordPage(params: {
  pageNo: number;
  pageSize: number;
  userName?: string;
  identityCardNumber?: string;
  content?: string;
  agentName?: string;
  startTime?: string;
  endTime?: string;
}): HttpResult<PaginatedResult<AiagentRecord>> {
  return http.get<PaginatedResult<AiagentRecord>>('/XA-ics-agent/proxy/ai/v1/aiagent/management/record', {
    params,
  });
}

/** 删除查询记录（DELETE /XA-ics-agent/proxy/ai/v1/aiagent/management/record/{id}） */
export function deleteAiagentRecord(id: string): Promise<ApiResponse> {
  return http.delete<string>(`/XA-ics-agent/proxy/ai/v1/aiagent/management/record/${encodeURIComponent(id)}`);
}

/**
 * 导出查询记录（GET /XA-ics-agent/proxy/ai/v1/aiagent/management/record/export，arraybuffer）
 *
 * 注意：返回类型为 ArrayBuffer，调用方使用 getServiceFile 触发下载。
 */
export function exportAiagentRecord(params: {
  userName?: string;
  identityCardNumber?: string;
  content?: string;
  agentName?: string;
  startTime?: string;
  endTime?: string;
  ids?: string;
}): HttpResult<ArrayBuffer> {
  return http.get<ArrayBuffer>('/XA-ics-agent/proxy/ai/v1/aiagent/management/record/export', {
    params,
    responseType: 'arraybuffer',
  } as never);
}

/** 触发浏览器下载查询记录 */
export async function downloadAiagentRecord(
  params: {
    userName?: string;
    identityCardNumber?: string;
    content?: string;
    agentName?: string;
    startTime?: string;
    endTime?: string;
    ids?: string;
  },
  filename = '查询记录.xlsx',
): Promise<void> {
  const res = await exportAiagentRecord(params);
  if (!res || res.code !== 0 || !res.data) {
    return;
  }
  getServiceFile(new Blob([res.data as unknown as ArrayBuffer]), filename);
}

// ===== 文件接口 =====

/** 文件接口列表（GET /XA-ics-agent/proxy/ai/v1/aiagent/attachment-config/list） */
export function getAgentFileList(): HttpResult<AgentFileItem[]> {
  return http.get<AgentFileItem[]>('/XA-ics-agent/proxy/ai/v1/aiagent/attachment-config/list');
}

/** 新增文件接口（POST /XA-ics-agent/proxy/ai/v1/aiagent/attachment-config/create） */
export function createAgentFile(data: Partial<AgentFileItem>): HttpResult<string> {
  return http.post<string>('/XA-ics-agent/proxy/ai/v1/aiagent/attachment-config/create', data);
}

/** 更新文件接口（PUT /XA-ics-agent/proxy/ai/v1/aiagent/attachment-config/update） */
export function updateAgentFile(data: Partial<AgentFileItem>): Promise<ApiResponse> {
  return http.put<string>('/XA-ics-agent/proxy/ai/v1/aiagent/attachment-config/update', data);
}

/** 删除文件接口（DELETE /XA-ics-agent/proxy/ai/v1/aiagent/attachment-config/delete/{id}） */
export function deleteAgentFile(id: string): Promise<ApiResponse> {
  return http.delete<string>(
    `/XA-ics-agent/proxy/ai/v1/aiagent/attachment-config/delete/${encodeURIComponent(id)}`,
  );
}
