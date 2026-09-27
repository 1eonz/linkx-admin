import type { ApiResponse, HttpResult, PaginatedResult } from '#/axios';
import http from '@/utils/http';

/** 群组标签接口返回的标签项。 */
export interface GroupTag {
  id: string | number;
  name: string;
  icon: string;
  color: string;
}

/** 群组标签分页查询参数。 */
export interface GroupTagPageQuery {
  pageNum: number;
  pageSize: number;
  name?: string;
}

/** 查询标签分页。 */
export function getGroupTagPage(params: GroupTagPageQuery): HttpResult<PaginatedResult<GroupTag>> {
  return http.get<PaginatedResult<GroupTag>>('/collaboration/v1/tags/page', { params });
}

/** 查询标签详情。 */
export function getGroupTag(id: string | number): HttpResult<GroupTag> {
  return http.get<GroupTag>(`/collaboration/v1/tags/${encodeURIComponent(String(id))}`);
}

/** 新增标签。 */
export function createGroupTag(data: Omit<GroupTag, 'id'>): HttpResult<unknown> {
  return http.post<unknown>('/collaboration/v1/tags', data);
}

/** 修改标签。 */
export function updateGroupTag(data: GroupTag): Promise<ApiResponse<unknown>> {
  return http.put<unknown>(`/collaboration/v1/tags/${encodeURIComponent(String(data.id))}`, data);
}

/** 删除单个标签。 */
export function deleteGroupTag(id: string | number): Promise<{ code: number; msg: string }> {
  return http.delete<unknown>(`/collaboration/v1/tags/${encodeURIComponent(String(id))}`);
}

/** 批量删除标签。 */
export function deleteGroupTags(ids: Array<string | number>): Promise<{ code: number; msg: string }> {
  return http.delete<unknown>('/collaboration/v1/tags/delete/list', { data: ids });
}
