import type { ApiResponse } from '#/axios';
import http from '@/utils/http';

/** 用户完整信息（含 userDepartments，用于 setRole 绑定） */
export interface PersonFullItem {
  id: string;
  name: string;
  code?: string;
  avatar?: string;
  gender?: number;
  mobile?: string;
  email?: string;
  isdn?: string;
  idCard?: string;
  district?: string;
  directLeaderId?: string;
  directLeaderName?: string;
  userDepartments?: Array<{
    id: string;
    departmentCode: string;
    departmentName: string;
  }>;
  [key: string]: unknown;
}

/** 角色信息（getUserRoleByUserId 返回） */
export interface UserRoleInfo {
  id: string;
  name: string;
  [key: string]: unknown;
}

/** queryUserByPage 查询参数 */
export interface QueryUserByPageParams {
  code?: string;
  pageNum: number;
  pageSize: number;
  name?: string;
}

// ===== Person 资源 API =====

/**
 * 查询用户角色（PUT /auth/v1/user/{id}/role）
 * 用 PUT 查询
 */
export function getUserRoleByUserId(id: string): Promise<ApiResponse<UserRoleInfo>> {
  return http.put(`/auth/v1/user/${id}/role`, {});
}

/**
 * 绑定角色（新增人员时调用，POST /auth/v1/user）
 */
export function bindRole(data: { roleId: string; imUsers: Array<Record<string, unknown>> }): Promise<ApiResponse> {
  return http.post('/auth/v1/user', data);
}

/**
 * 设置单个用户的角色（PUT /auth/v1/user/{userId}/role/{roleId}）
 */
export function setRole(data: { userId: string; roleId: string }): Promise<ApiResponse> {
  return http.put(`/auth/v1/user/${data.userId}/role/${data.roleId}`, data);
}

/**
 * 批量设置角色（PUT /auth/v1/role/{roleId}/user，body 为 userIds 数组）
 */
export function setBatchRole(data: { userIds: string[]; roleId: string }): Promise<ApiResponse> {
  return http.put(`/auth/v1/role/${data.roleId}/user`, data.userIds);
}
