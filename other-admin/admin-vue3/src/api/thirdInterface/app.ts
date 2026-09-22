import type { ApiResponse, HttpResult, PaginatedResult } from '#/axios';
import http from '@/utils/http';

/**
 * 应用类型：0-H5应用、1-App应用、3-前置应用
 */
export type AppType = 0 | 1 | 3;

/**
 * 业务区域：1-一类区、2-二类区、3-三类区
 */
export type AppZone = 1 | 2 | 3;

/**
 * 上架状态：0-上架、1-下架（active-value=0）
 */
export type AppStatus = 0 | 1;

/** 应用项 */
export interface AppItem {
  id: string;
  /** 应用名称 */
  name: string;
  /** 应用图标 */
  icon?: string;
  /** 应用类型 */
  type: AppType;
  /** H5 链接（type=1 时必填） */
  url?: string;
  /** Android 安装包路径（type=0 时必填） */
  packageAndroid?: string;
  /** 鸿蒙安装包路径（type=3 时必填） */
  packageHm?: string;
  /** Android 启动 Activity */
  activity?: string;
  /** 鸿蒙 appId */
  appId?: string;
  /** 启动参数 */
  params?: string;
  /** 可见范围：部门 id 数组 */
  scope: number[];
  /** 可见范围名称列表（编辑回显用） */
  scopeList?: Array<{ id: number; name: string }>;
  /** 上架区域 */
  zone: AppZone;
  /** 前置应用 id */
  prerequisite?: string;
  /** 排序值 */
  sort: number;
  /** 上架状态 */
  status: AppStatus;
  /** 是否官方应用 */
  official?: number;
  /** 创建时间 */
  createTime?: string;
  [key: string]: unknown;
}

/** 应用分类项 */
export interface AppGroup {
  id: string;
  /** 分类名称 */
  name: string;
  /** 排序值 */
  sort: number;
  /** 绑定的应用列表 */
  appList?: AppItem[];
  /** 绑定的应用 id 列表 */
  appIds?: string[];
  /** 分类类型：1-内置、2-自定义 */
  type: 1 | 2;
  /** 创建时间 */
  gmtCreated?: string;
  /** 创建人 */
  createUser?: string;
  [key: string]: unknown;
}

/** 应用分页查询参数 */
export interface AppListQuery {
  pageNum: number;
  pageSize: number;
  /** 应用名称 */
  name?: string;
}

/** 应用分类分页查询参数 */
export interface AppGroupListQuery {
  pageNum?: number;
  pageSize?: number;
  /** 分类名称 */
  name?: string;
  /** 分类类型：1-内置、2-自定义 */
  type?: number;
}

/** 上架状态更新参数 */
export interface AppStatusUpdate {
  id: string;
  status: AppStatus;
}

/** 前置应用选项 */
export interface AppPrerequisiteOption {
  id: string;
  name: string;
  [key: string]: unknown;
}

// ===== 应用 CRUD =====

/** 应用分页（GET /api/content/app/info/page） */
export function getInfoPage(params: AppListQuery): HttpResult<PaginatedResult<AppItem>> {
  return http.get<PaginatedResult<AppItem>>('/api/content/app/info/page', { params });
}

/** 应用详情（GET /api/content/app/info/get?id=xxx） */
export function getInfo(id: string): HttpResult<AppItem> {
  return http.get<AppItem>('/api/content/app/info/get', { params: { id } });
}

/** 新增应用（POST /api/content/app/info/create） */
export function createInfo(data: Partial<AppItem>): HttpResult<string> {
  return http.post<string>('/api/content/app/info/create', data);
}

/** 更新应用（PUT /api/content/app/info/update） */
export function updateInfo(data: Partial<AppItem>): Promise<ApiResponse> {
  return http.put<string>('/api/content/app/info/update', data);
}

/** 更新上架状态（PUT /api/content/app/info/update_status） */
export function updateStatus(data: AppStatusUpdate): Promise<ApiResponse> {
  return http.put<string>('/api/content/app/info/update_status', data);
}

/** 删除应用（DELETE /api/content/app/info/delete?id=xxx） */
export function deleteInfo(id: string): Promise<ApiResponse> {
  return http.delete<string>('/api/content/app/info/delete', { params: { id } });
}

/** 前置应用列表（GET /api/content/app/info/prerequisite） */
export function getPrerequisiteList(): HttpResult<AppPrerequisiteOption[]> {
  return http.get<AppPrerequisiteOption[]>('/api/content/app/info/prerequisite');
}

/**
 * 应用列表（用于分类编辑弹窗「选择应用」字段）
 *
 * 分页拉取应用，调用方按 status === 0 && type !== 3 过滤可绑定应用。
 *
 * @param params 分页参数
 */
export function getAppList(params: AppListQuery): HttpResult<PaginatedResult<AppItem>> {
  return http.get<PaginatedResult<AppItem>>('/api/content/app/info/page', { params });
}

// ===== 应用分类 CRUD =====

/** 分类分页（GET /third/v1/apps/groups）
 * 注：后端实际返回 AppGroup[] 数组（非分页结构）
 */
export function getGroupPage(params: AppGroupListQuery): HttpResult<AppGroup[]> {
  return http.get<AppGroup[]>('/third/v1/apps/groups', { params });
}

/** 新增分类（POST /third/v1/apps/groups/app） */
export function createGroup(data: Partial<AppGroup>): HttpResult<string> {
  return http.post<string>('/third/v1/apps/groups/app', data);
}

/** 更新分类（PUT /third/v1/apps/groups/app） */
export function updateGroup(data: Partial<AppGroup>): Promise<ApiResponse> {
  return http.put<string>('/third/v1/apps/groups/app', data);
}

/** 删除分类（DELETE /third/v1/apps/groups/{id}） */
export function deleteGroup(id: string): Promise<ApiResponse> {
  return http.delete<string>(`/third/v1/apps/groups/${id}`);
}

// ===== 图片上传 =====

/**
 * 上传应用图标（POST /api/resource/person/uploadTmp，multipart/form-data）
 *
 * 注意：接口返回的 data 可能是字符串或字符串数组，调用方需自行兼容处理。
 */
export function uploadAppIcon(file: File): HttpResult<string | string[]> {
  const formData = new FormData();
  formData.append('file', file);
  return http.post<string | string[]>('/api/resource/person/uploadTmp', formData);
}
