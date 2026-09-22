import type { ApiResponse, HttpResult, PaginatedResult } from '#/axios';
import http from '@/utils/http';

/** 预警通知对象类型：1=用户，2=群组 */
export type TargetType = 1 | 2;

/** 预警关系项（列表行） */
export interface WarningRelationItem {
  id: string;
  /** 业务对象 ID（任务逾期=orgId，无人值守=cooperId/postId） */
  businessId: string;
  /** 业务对象名称（任务逾期=orgName，无人值守=postName） */
  businessName: string;
  /** 父级组织名称 */
  orgName?: string;
  /** 通知对象类型 */
  targetType?: TargetType;
  /** 通知对象 ID */
  targetId?: string;
  /** 通知对象名称 */
  targetName?: string;
  /** 通知对象身份证号 */
  idCard?: string;
  [key: string]: unknown;
}

/** 列表查询参数 */
export interface WarningListQuery {
  /** 分类：1=任务逾期，2=无人值守 */
  classify: 1 | 2;
  pageNum: number;
  pageSize: number;
  businessName?: string;
  targetType?: TargetType;
  targetName?: string;
}

/** 新增载荷 */
export interface CreateWarningPayload {
  classify: 1 | 2;
  businessId: string;
  businessName: string;
  orgName?: string;
  targetType: TargetType;
  /** 多个 ID 用逗号分隔 */
  targetIds: string;
  targetNames: string[];
  idCard: string;
}

/** 更新载荷 */
export interface UpdateWarningPayload {
  classify: 1 | 2;
  id: string;
  businessId: string;
  businessName: string;
  orgName?: string;
  targetType: TargetType;
  targetId: string;
  targetName: string;
  idCard: string;
}

/** 分页查询预警关系列表（GET /api/warning/ralation/page） */
export function getWarningRelationList(params: WarningListQuery): HttpResult<PaginatedResult<WarningRelationItem>> {
  return http.get<PaginatedResult<WarningRelationItem>>('/api/warning/ralation/page', { params });
}

/** 新增预警关系（POST /api/warning/ralation/create） */
export function createWarningRelation(data: CreateWarningPayload): HttpResult<string> {
  return http.post<string>('/api/warning/ralation/create', data);
}

/** 更新预警关系（POST /api/warning/ralation/update） */
export function updateWarningRelation(data: UpdateWarningPayload): HttpResult<string> {
  return http.post<string>('/api/warning/ralation/update', data);
}

/** 批量删除预警关系（DELETE /api/warning/ralation/delete/list） */
export function deleteWarningRelation(ids: string[]): Promise<ApiResponse> {
  return http.delete<string>('/api/warning/ralation/delete/list', { data: ids });
}

// ===== 通知对象查询接口 =====

/** 用户查询项 */
export interface UserOption {
  id: string;
  name: string;
  idCard?: string;
  [key: string]: unknown;
}

/** 群组查询项 */
export interface GroupOption {
  groupId: string;
  groupName: string;
  [key: string]: unknown;
}

/** 用户查询参数 */
export interface UserQueryParams {
  deptId?: string;
  includeChildren?: number;
  pageNum: number;
  pageSize: number;
  keywords?: string;
}

/** 群组查询参数 */
export interface GroupQueryParams {
  type: number;
  key: number;
  pageNum: number;
  pageSize: number;
  keywords?: string;
}

/** 查询用户（GET /collaboration/v1/im/queryUser） */
export function queryUserInfo(params: UserQueryParams): HttpResult<PaginatedResult<UserOption>> {
  return http.get<PaginatedResult<UserOption>>('/collaboration/v1/im/queryUser', { params });
}

/** 查询群组（GET /collaboration/v1/im/query/group/type） */
export function queryGroupInfo(params: GroupQueryParams): HttpResult<PaginatedResult<GroupOption>> {
  return http.get<PaginatedResult<GroupOption>>('/collaboration/v1/im/query/group/type', { params });
}
