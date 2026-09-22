import type { ApiResponse, HttpResult } from '#/axios';
import http from '@/utils/http';

/** 协同岗层级节点 */
export interface CoopLevelNode {
  id: string;
  name: string;
  /** 是否有子节点（后端明确返回 false 才是叶子） */
  hasChildren?: boolean;
  /** 前端规范化字段：是否叶子节点 */
  isLeaf?: boolean;
  [key: string]: unknown;
}

/** 层级下的协同岗成员 */
export interface CoopLevelMember {
  id: string;
  /** 后端 uid 字段（删除时使用） */
  uid: string;
  name: string;
  orgName?: string;
  relatedUserNames?: string;
  operateTime?: string;
  [key: string]: unknown;
}

/** 协同岗层级成员分页数据 */
export interface CoopLevelMemberPage {
  records?: CoopLevelMember[];
  total?: number | string;
  [key: string]: unknown;
}

/** 层级创建参数 */
export interface CreateCoopLevelParams {
  name: string;
  parentId: string | number;
}

/** 层级成员查询参数 */
export interface CoopLevelMemberQuery {
  pageNum: number;
  pageSize: number;
  orgId?: string;
}

/** 层级成员搜索参数 */
export interface CoopLevelMemberSearchParams {
  pageNum: number;
  pageSize: number;
  orgId?: string;
  name?: string;
  levelId: string;
  startTime?: string;
  endTime?: string;
}

// ===== 协同岗层级 API =====

/**
 * 查询指定协同岗层级的子层级
 * GET /collaboration/v1/cooplevels/{levelId}/children
 */
export function getCoopLevelChildren(levelId: string | number): HttpResult<CoopLevelNode[]> {
  return http.get<CoopLevelNode[]>(`/collaboration/v1/cooplevels/${levelId}/children`);
}

/**
 * 创建协同岗层级节点
 * POST /collaboration/v1/cooplevels
 */
export function createCoopLevel(data: CreateCoopLevelParams): HttpResult<string> {
  return http.post<string>('/collaboration/v1/cooplevels', data);
}

/**
 * 修改协同岗层级属性
 * PUT /collaboration/v1/cooplevels/{coopLevelId}
 */
export function updateCoopLevel(coopLevelId: string, data: { name: string }): Promise<ApiResponse<void>> {
  return http.put<void>(`/collaboration/v1/cooplevels/${coopLevelId}`, data);
}

/**
 * 删除协同岗层级节点
 * DELETE /collaboration/v1/cooplevels/{coopLevelId}
 */
export function deleteCoopLevel(coopLevelId: string): Promise<ApiResponse<void>> {
  return http.delete<void>(`/collaboration/v1/cooplevels/${coopLevelId}`);
}

/**
 * 获取指定协同岗层级下的协同岗用户列表
 * GET /collaboration/v1/cooplevels/{levelId}/member
 */
export function getCoopLevelMembers(levelId: string, params: CoopLevelMemberQuery): HttpResult<CoopLevelMemberPage> {
  return http.get<CoopLevelMemberPage>(`/collaboration/v1/cooplevels/${levelId}/member`, { params });
}

/**
 * 获取指定协同岗层级下的协同岗用户列表（可搜索）
 * GET /collaboration/v1/cooplevels/member
 */
export function getCoopLevelMembersBySearch(params: CoopLevelMemberSearchParams): HttpResult<CoopLevelMemberPage> {
  return http.get<CoopLevelMemberPage>('/collaboration/v1/cooplevels/member', { params });
}

/**
 * 更新指定协同岗层级下的协同岗用户列表
 * PUT /collaboration/v1/cooplevels/{levelId}/member
 * @param data 协同岗用户ID列表（uid 字符串数组）
 */
export function updateCoopLevelMembers(levelId: string, data: string[]): Promise<ApiResponse<void>> {
  return http.put<void>(`/collaboration/v1/cooplevels/${levelId}/member`, data);
}

/**
 * 删除协同岗层级下的用户
 * DELETE /collaboration/v1/cooplevels/member
 * @param data 协同岗用户uid列表（字符串数组）
 */
export function deleteCoopLevelMembers(data: string[]): Promise<ApiResponse<void>> {
  return http.delete<void>('/collaboration/v1/cooplevels/member', { data });
}
