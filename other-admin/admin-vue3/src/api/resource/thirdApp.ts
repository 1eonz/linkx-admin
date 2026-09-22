import type { ApiResponse, HttpResult, PaginatedResult } from '#/axios';
import http from '@/utils/http';

/** 三方应用列表查询参数 */
export interface ThirdAppListQuery {
  pageNum: number;
  pageSize: number;
  clientName?: string;
}

/** 三方应用表单字段 */
export interface ThirdAppForm {
  id?: string;
  clientName: string;
  clientId: string;
  clientSecret: string;
  clientType?: string;
  tokenTime: number | string;
  refreshTokenTime: number | string;
  status: number;
  remark?: string;
}

/** 三方应用列表项 */
export interface ThirdAppItem extends ThirdAppForm {
  id: string;
}

/**
 * 三方应用列表（POST /collaboration/v1/client/list）
 */
export function collaborationList(data: ThirdAppListQuery): HttpResult<PaginatedResult<ThirdAppItem>> {
  return http.post<PaginatedResult<ThirdAppItem>>('/collaboration/v1/client/list', data);
}

/**
 * 新增三方应用（POST /collaboration/v1/client/create）
 * 注：URL 末尾保留一个空格，避免改动接口契约
 */
export function collaborationCreate(data: ThirdAppForm): HttpResult<string> {
  return http.post<string>('/collaboration/v1/client/create ', data);
}

/**
 * 修改三方应用（PUT /collaboration/v1/client/update）
 */
export function collaborationUpdate(data: ThirdAppForm): Promise<ApiResponse> {
  return http.put<string>('/collaboration/v1/client/update', data);
}

/**
 * 删除三方应用（DELETE /collaboration/v1/client/delete?id=xxx）
 * 通过 URL query 传 id
 */
export function collaborationDelete(id: string | number): Promise<ApiResponse> {
  return http.delete<string>(`/collaboration/v1/client/delete?id=${id}`);
}

/**
 * 三方应用详情（GET /collaboration/v1/client/detail?id=xxx）
 */
export function collaborationDetail(id: string | number): HttpResult<ThirdAppItem> {
  return http.get<ThirdAppItem>(`/collaboration/v1/client/detail?id=${id}`);
}
