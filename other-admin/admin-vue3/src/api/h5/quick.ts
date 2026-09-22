import type { ApiResponse, HttpResult, PaginatedResult } from '#/axios';
import http from '@/utils/http';

/** 标签项 */
export interface LabelItem {
  id: string;
  name: string;
  type?: number;
  scope?: number;
  icon?: string;
  color?: string;
  parentId?: string;
  level?: number;
  children?: LabelItem[];
  [key: string]: unknown;
}

/** 标签列表查询参数 */
export interface LabelListQuery {
  name?: string;
  pageNum?: number;
  pageSize?: number;
  [key: string]: unknown;
}

/**
 * 标签列表（GET /collaboration/label/list）
 */
export function labelList(params: LabelListQuery = {}): HttpResult<LabelItem[]> {
  return http.get<LabelItem[]>('/collaboration/v1/label/list', { params });
}

/**
 * 新增/修改标签（POST /collaboration/label/save）
 * 新增和修改共用 save 接口（按是否有 id 区分）
 */
export function labelSave(data: Partial<LabelItem>): HttpResult<string> {
  return http.post<string>('/collaboration/v1/label/save', data);
}

/**
 * 修改标签（POST /collaboration/label/update）
 */
export function labelUpdate(data: Partial<LabelItem>): HttpResult<string> {
  return http.post<string>('/collaboration/v1/label/update', data);
}

/**
 * 标签详情（GET /collaboration/label/detail/{id}）
 * idCard 可选，存在时附加 query
 */
export function labelDetail(id: string, idCard?: string): HttpResult<LabelItem> {
  const config = idCard ? { params: { idCard } } : {};
  return http.get<LabelItem>(`/collaboration/v1/label/detail/${id}`, config);
}

/**
 * 删除标签（DELETE /collaboration/label/delete/{id}）
 */
export function labelDelete(id: string): Promise<ApiResponse> {
  return http.delete<string>(`/collaboration/v1/label/delete/${id}`);
}

/**
 * 批量删除标签（DELETE /collaboration/label/delete/list）
 * DELETE + body（id 数组）
 */
export function labelBatchDelete(ids: string[]): Promise<ApiResponse> {
  return http.delete<string>('/collaboration/v1/label/delete/list', { data: ids });
}

/**
 * 绑定标签用户（POST /collaboration/label/binding/user）
 */
export function bindLabelUser(data: Record<string, unknown>): HttpResult<string> {
  return http.post<string>('/collaboration/v1/label/binding/user', data);
}
