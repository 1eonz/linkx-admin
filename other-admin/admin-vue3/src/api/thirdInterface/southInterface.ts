import type { ApiResponse, HttpResult, PaginatedResult } from '#/axios';
import http from '@/utils/http';

/**
 * 可调用应用类型：1-HTTP、2-数据库
 */
export type CallableAppType = 1 | 2;

/**
 * 可见范围：0-私有、1-公开、2-指定部门
 */
export type CallableAppScope = 0 | 1 | 2;

/** 可调用应用项 */
export interface CallableApp {
  id: string;
  /** 应用名称 */
  name: string;
  /** 系统名称 */
  systemName?: string;
  /** 系统编码 */
  systemCode?: string;
  /** 唯一标识 */
  uniqueId?: string;
  /** 应用类型：1-HTTP、2-数据库 */
  type: CallableAppType;
  /** 可见范围：0-私有、1-公开、2-指定部门 */
  scope: CallableAppScope;
  /** 协议（HTTP 类型时使用，如 http/https） */
  protocol?: string;
  /** IP 地址 */
  ip?: string;
  /** 端口号 */
  port?: number;
  /** URI 路径 */
  uri?: string;
  /** 请求方法（HTTP 类型时使用） */
  method?: string;
  /** 请求头 */
  reqHeader?: string;
  /** 请求体 */
  reqBody?: string;
  /** 请求参数 */
  reqParam?: string;
  /** 数据起始时间 */
  dataStartTime?: string;
  /** 时间标识 */
  dateTimeSign?: string;
  /** 是否分页 */
  pagenation?: number;
  /** 分页类型 */
  pagenationType?: string;
  /** 分页参数位置 */
  pageParamLocation?: string;
  /** 页码字段名 */
  pageFieldName?: string;
  /** 每页条数字段名 */
  pageSizeFieldName?: string;
  /** 响应数据路径 */
  responseDataPath?: string;
  /** 数据名称 */
  dataName?: string;
  /** 数据库名称 */
  databaseName?: string;
  /** 数据库类型 */
  dbType?: string;
  /** 数据库账号 */
  account?: string;
  /** 数据库密码 */
  password?: string;
  /** 周期 */
  period?: string;
  /** 字段映射配置 */
  mapper?: string;
  /** 创建时间 */
  gmtCreated?: string;
  [key: string]: unknown;
}

/** 可调用应用分页查询参数 */
export interface CallableAppListQuery {
  page: number;
  pageSize: number;
  /** 应用名称 */
  name?: string;
}

/** 字段映射更新参数 */
export interface CallableAppMapperUpdate {
  /** 字段映射 JSON 字符串 */
  mapper: string;
}

// ===== 可调用应用 CRUD =====

/** 可调用应用分页（GET /third/v1/app/callable） */
export function getCallableAppList(params: CallableAppListQuery): HttpResult<PaginatedResult<CallableApp>> {
  return http.get<PaginatedResult<CallableApp>>('/third/v1/app/callable', { params });
}

/** 可调用应用详情（GET /third/v1/app/callable/{id}） */
export function getCallableAppDetail(id: string): HttpResult<CallableApp> {
  return http.get<CallableApp>(`/third/v1/app/callable/${id}`);
}

/** 新增可调用应用（POST /third/v1/app/callable） */
export function createCallableApp(data: Partial<CallableApp>): HttpResult<string> {
  return http.post<string>('/third/v1/app/callable', data);
}

/** 更新可调用应用（PUT /third/v1/app/callable/{id}） */
export function updateCallableApp(id: string, data: Partial<CallableApp>): Promise<ApiResponse> {
  return http.put<string>(`/third/v1/app/callable/${id}`, data);
}

/** 删除可调用应用（DELETE /third/v1/app/callable/{id}） */
export function deleteCallableApp(id: string): Promise<ApiResponse> {
  return http.delete<string>(`/third/v1/app/callable/${id}`);
}

/** 更新字段映射（PUT /third/v1/app/callable/{id}/mapper） */
export function updateCallableAppMapper(id: string, data: CallableAppMapperUpdate): Promise<ApiResponse> {
  return http.put<string>(`/third/v1/app/callable/${id}/mapper`, data);
}
