import type { ApiResponse, HttpResult, PaginatedResult } from '#/axios';
import http from '@/utils/http';

/** 角色项 */
export interface RoleItem {
  id: string;
  name: string;
  status: number;
  remark?: string;
  gmtCreated?: string;
  gmtModified?: string;
  /** ICC 前台权限 ID 列表 */
  iccPrivJson?: string[];
  /** 后台权限 ID 列表 */
  adminPrivJson?: string[];
  /** CAPP H5 权限 ID 列表 */
  cappPrivJson?: string[];
  /** 数据权限（部门）列表 */
  orgPrivList?: Array<{ id: string; name?: string; code?: string; path?: string; children?: unknown[] }>;
  [key: string]: unknown;
}

/** 查询角色列表（分页，GET /api/role?name=&pageSize=10&pageNum=1） */
export function getRoleList(params: {
  name?: string;
  pageSize?: number;
  pageNum?: number;
}): HttpResult<PaginatedResult<RoleItem>> {
  return http.get<PaginatedResult<RoleItem>>('/api/role', { params });
}

/** 新增角色（POST /api/role） */
export function createRole(data: Partial<RoleItem>): Promise<ApiResponse<RoleItem>> {
  return http.post<RoleItem>('/api/role', data);
}

/** 更新角色（PUT /api/role） */
export function updateRole(data: Partial<RoleItem>): Promise<ApiResponse> {
  return http.put('/api/role', data);
}

/** 删除角色（POST /api/role/deleteBatch，body 为 ID 数组） */
export function deleteRole(data: string[]): Promise<ApiResponse> {
  return http.post('/api/role/deleteBatch', data);
}

/**
 * 批量为角色绑定用户（PUT /auth/v1/role/{roleId}/user）
 * @param roleId 角色 ID
 * @param userIds 用户 ID 数组
 */
export function setBatchRole(roleId: string, userIds: string[]): Promise<ApiResponse> {
  return http.put(`/auth/v1/role/${roleId}/user`, userIds);
}
