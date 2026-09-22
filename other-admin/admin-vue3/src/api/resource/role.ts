import type { ApiResponse, HttpResult, PaginatedResult } from '#/axios';
import type { RoleItem } from '@/api/permission/role';
import http from '@/utils/http';

interface RoleListQuery {
  name?: string;
  pageSize?: number;
  pageNum?: number;
}

/**
 * 角色列表（GET /api/role）
 * 用于：setRole 弹窗、setBatchRole 弹窗中获取可选角色
 */
export function getRoleList(params: RoleListQuery): HttpResult<PaginatedResult<RoleItem>> {
  return http.get<PaginatedResult<RoleItem>>('/api/role', { params });
}
