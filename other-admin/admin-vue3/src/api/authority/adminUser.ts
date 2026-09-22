import type { ApiResponse, HttpResult, PaginatedResult } from '#/axios';
import http from '@/utils/http';

/** 管理员用户项 */
export interface AdminUserItem {
  id: string;
  /** 用户名称（业务标识，不支持中文和空格） */
  idCard: string;
  /** 状态：0=正常，1=禁用 */
  status: number;
  /** 创建时间 */
  gmtCreated?: string;
  /** 数据权限 ID 数组 */
  orgIds?: string[];
  /** 数据权限详情 */
  orgList?: Array<{ id: string; name: string; path?: string }>;
  [key: string]: unknown;
}

/** 管理员用户列表查询参数 */
export interface AdminUserListQuery {
  pageNum: number;
  pageSize: number;
  name?: string;
}

/** 新增/编辑管理员用户载荷 */
export interface AdminUserPayload {
  idCard: string;
  orgIds: string[];
  orgList: Array<{ id: string; name: string; path?: string }>;
  id?: string;
  status?: number;
}

/**
 * 管理员用户列表（GET /auth/v1/user/adminuser/page）
 */
export function getAdminUserList(params: AdminUserListQuery): HttpResult<PaginatedResult<AdminUserItem>> {
  return http.get<PaginatedResult<AdminUserItem>>('/auth/v1/user/adminuser/page', { params });
}

/**
 * 新增管理员用户（POST /auth/v1/user/adminuser）
 */
export function createAdminUser(data: AdminUserPayload): Promise<ApiResponse> {
  return http.post('/auth/v1/user/adminuser', data);
}

/**
 * 更新管理员用户（PUT /auth/v1/user/adminuser）
 * 支持全量更新（含 orgIds/orgList）和状态更新（仅 id + status）
 */
export function updateAdminUser(data: Partial<AdminUserPayload>): Promise<ApiResponse> {
  return http.put('/auth/v1/user/adminuser', data);
}

/**
 * 管理员用户详情（GET /auth/v1/user/adminuser/{id}）
 */
export function getAdminUserById(id: string): Promise<ApiResponse<AdminUserItem>> {
  return http.get<AdminUserItem>(`/auth/v1/user/adminuser/${id}`);
}

/**
 * 删除管理员用户（DELETE /auth/v1/user/adminuser/{id}）
 */
export function deleteAdminUser(id: string): Promise<ApiResponse> {
  return http.delete(`/auth/v1/user/adminuser/${id}`);
}
