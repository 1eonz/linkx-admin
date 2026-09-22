import type { ApiResponse, HttpResult, PaginatedResult } from '#/axios';
import http from '@/utils/http';

/** 排班类型查询参数 */
export interface DutyTypeListQuery {
  pageNum: number;
  pageSize: number;
  name?: string;
}

/** 排班类型项 */
export interface DutyTypeItem {
  /** 排班类型标识（主键，0 为内置默认类型，不可删除） */
  type: string;
  /** 排班类型名称 */
  name: string;
  /** 创建时间 */
  gmtCreated?: string;
  [key: string]: unknown;
}

/**
 * 分页查询排班类型列表（GET /collaboration/duty/type/page）
 */
export function getDutyTypes(params: DutyTypeListQuery): HttpResult<PaginatedResult<DutyTypeItem>> {
  return http.get<PaginatedResult<DutyTypeItem>>('/collaboration/v1/duty/type/page', { params });
}

/**
 * 查询所有排班类型（GET /collaboration/duty/type/all）
 */
export function getAllDutyTypes(): HttpResult<DutyTypeItem[]> {
  return http.get<DutyTypeItem[]>('/collaboration/v1/duty/type/all');
}

/**
 * 排班类型详情（GET /collaboration/duty/type/{type}）
 */
export function getDutyTypeDetail(type: string | number): HttpResult<DutyTypeItem> {
  return http.get<DutyTypeItem>(`/collaboration/v1/duty/type/${type}`);
}

/**
 * 创建排班类型（POST /collaboration/duty/type）
 */
export function createDutyType(data: { name: string }): HttpResult<string> {
  return http.post<string>('/collaboration/v1/duty/type', data);
}

/**
 * 更新排班类型（PUT /collaboration/duty/type/{type}）
 */
export function updateDutyType(type: string | number, data: { name: string }): Promise<ApiResponse> {
  return http.put<string>(`/collaboration/v1/duty/type/${type}`, data);
}

/**
 * 删除排班类型（DELETE /collaboration/duty/type/{type}）
 */
export function deleteDutyType(type: string | number): Promise<ApiResponse> {
  return http.delete<string>(`/collaboration/v1/duty/type/${type}`);
}
