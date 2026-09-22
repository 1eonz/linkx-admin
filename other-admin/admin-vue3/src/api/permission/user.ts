import type { ApiResponse, HttpResult, PaginatedResult } from '#/axios';
import http from '@/utils/http';

/** 人员项 */
export interface UserItem {
  id: string;
  name: string;
  idCard: string;
  phoneNum?: string;
  departmentName?: string;
  departmentCode?: string;
  status?: number;
  avatar?: string;
  [key: string]: unknown;
}

/** 人员列表查询参数 */
export interface PersonListQuery {
  pageNum: number;
  pageSize: number;
  departmentName?: string;
  departmentCode?: string;
  privString?: string;
  name?: string;
  idCard?: string;
}

// ===== 人员接口 =====

/**
 * 人员列表（GET /auth/v1/user/page）
 */
export function getPersonList(params: PersonListQuery): HttpResult<PaginatedResult<UserItem>> {
  return http.get<PaginatedResult<UserItem>>('/auth/v1/user/page', { params });
}

/**
 * 删除人员（DELETE /auth/v1/user?ids=xxx）
 * DELETE + query ids（逗号分隔的 id 串）
 */
export function deletePerson(ids: string): Promise<ApiResponse> {
  return http.delete('/auth/v1/user', { params: { ids } });
}

/**
 * 更新人员状态（PUT /auth/v1/user/{id}/status/{status}）
 * 路径参数 id + status
 */
export function updatePersonStatus(id: string, status: number): Promise<ApiResponse> {
  return http.put(`/auth/v1/user/${id}/status/${status}`, {});
}

/**
 * 创建人员（POST /api/executor）
 */
export function createPerson(data: Partial<UserItem>): Promise<ApiResponse> {
  return http.post('/api/executor', data);
}

/**
 * 人员详情（GET /api/executor/byId?id=xxx）
 */
export function getPersonById(id: string): Promise<ApiResponse<UserItem>> {
  return http.get<UserItem>('/api/executor/byId', { params: { id } });
}

/**
 * 更新人员（PUT /api/executor）
 */
export function updatePerson(data: Partial<UserItem>): Promise<ApiResponse> {
  return http.put('/api/executor', data);
}

/**
 * 修改人员密码（PUT /auth/v1/user/{id}/pwd）
 * data 包含 password + repeatNewPwd
 */
export function updatePersonPwd(data: { id: string; password: string; repeatNewPwd: string }): Promise<ApiResponse> {
  return http.put(`/auth/v1/user/${data.id}/pwd`, { password: data.password, repeatNewPwd: data.repeatNewPwd });
}
