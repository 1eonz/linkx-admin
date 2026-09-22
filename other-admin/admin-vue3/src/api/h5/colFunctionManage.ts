import type { ApiResponse, HttpResult } from '#/axios';
import http from '@/utils/http';

/** 职能分类节点 */
export interface FunctionalDeptNode {
  id: string;
  name: string;
  /** 是否有子节点（后端明确返回 false 才是叶子） */
  hasChildren?: boolean;
  /** 前端规范化字段：是否叶子节点 */
  isLeaf?: boolean;
  [key: string]: unknown;
}

/** 职能分类下的协同岗成员 */
export interface FunctionalDeptMember {
  id: string;
  /** 后端 uid 字段（删除/切换勾选时使用） */
  uid: string;
  name: string;
  orgName?: string;
  relatedUserNames?: string;
  operateTime?: string;
  /** 是否默认勾选（0/1） */
  checked?: number;
  [key: string]: unknown;
}

/** 职能分类成员分页数据 */
export interface FunctionalDeptMemberPage {
  records?: FunctionalDeptMember[];
  total?: number | string;
  [key: string]: unknown;
}

/** 职能分类创建参数 */
export interface CreateFunctionaldeptsParams {
  name: string;
  parentId: string | number;
  creator?: string;
}

/** 职能分类成员查询参数 */
export interface FunctionaldeptsMemberQuery {
  orgId?: string;
  pageNum: number;
  pageSize: number;
}

/** 挂靠协同岗参数项（updateFunctionaldeptsMembers 入参数组元素） */
export interface UpdateFunctionaldeptsMemberItem {
  userId: string;
  checked: number;
  sort: number;
  creator?: string;
  updater?: string;
}

/** 删除协同岗参数项（deleteFunctionaldeptsMembers 入参数组元素） */
export interface DeleteFunctionaldeptsMemberItem {
  id: string;
  postName: string;
  departmentName: string;
}

/** 切换默认勾选参数项（checkedFunctionaldeptsMembers 入参数组元素） */
export interface CheckedFunctionaldeptsMemberItem {
  id: string;
  checked: number;
  sort: number;
  updater?: string;
  postName: string;
  departmentName: string;
}

/** 新增默认协同岗参数 */
export interface CreateDefaultCoopParams {
  creator?: string;
  userIds: string[];
}

/** 默认协同岗列表项 */
export interface DefaultCoopItem {
  id: string;
  /** 后端 uid 字段（删除时使用） */
  uid: string;
  name: string;
  orgName?: string;
  relatedUserNames?: string;
  operateTime?: string;
  [key: string]: unknown;
}

/** 默认协同岗分页数据 */
export interface DefaultCoopPage {
  records?: DefaultCoopItem[];
  total?: number | string;
  [key: string]: unknown;
}

/** 默认协同岗分页查询参数 */
export interface DefaultCoopPageQuery {
  orgId?: string;
  pageNum: number;
  pageSize: number;
}

// ===== 职能部门 API =====

/**
 * 查询指定职能分类的子层级
 * GET /collaboration/v1/functionaldepts/{levelId}/children
 */
export function getFunctionaldeptsChildren(levelId: string | number): HttpResult<FunctionalDeptNode[]> {
  return http.get<FunctionalDeptNode[]>(`/collaboration/v1/functionaldepts/${levelId}/children`);
}

/**
 * 创建职能分类节点
 * POST /collaboration/v1/functionaldepts
 */
export function createFunctionaldepts(data: CreateFunctionaldeptsParams): Promise<ApiResponse<void>> {
  return http.post<void>('/collaboration/v1/functionaldepts', data);
}

/**
 * 修改职能分类属性
 * PUT /collaboration/v1/functionaldepts/{coopLevelId}
 */
export function updateFunctionaldepts(coopLevelId: string, data: { name: string }): Promise<ApiResponse<void>> {
  return http.put<void>(`/collaboration/v1/functionaldepts/${coopLevelId}`, data);
}

/**
 * 删除职能分类节点
 * DELETE /collaboration/v1/functionaldepts/{coopLevelId}
 */
export function deleteFunctionaldepts(coopLevelId: string): Promise<ApiResponse<void>> {
  return http.delete<void>(`/collaboration/v1/functionaldepts/${coopLevelId}`);
}

/**
 * 获取指定职能分类下的协同岗用户列表
 * GET /collaboration/v1/functionaldepts/{levelId}/coop
 */
export function getFunctionaldeptsMembers(
  levelId: string,
  params: FunctionaldeptsMemberQuery,
): HttpResult<FunctionalDeptMemberPage> {
  return http.get<FunctionalDeptMemberPage>(`/collaboration/v1/functionaldepts/${levelId}/coop`, { params });
}

/**
 * 更新指定职能分类下的协同岗用户列表（挂靠）
 * PUT /collaboration/v1/functionaldepts/{levelId}/coop
 */
export function updateFunctionaldeptsMembers(
  levelId: string,
  data: UpdateFunctionaldeptsMemberItem[],
): Promise<ApiResponse<void>> {
  return http.put<void>(`/collaboration/v1/functionaldepts/${levelId}/coop`, data);
}

/**
 * 删除职能分类下的协同岗用户
 * DELETE /collaboration/v1/functionaldepts/coop
 */
export function deleteFunctionaldeptsMembers(data: DeleteFunctionaldeptsMemberItem[]): Promise<ApiResponse<void>> {
  return http.delete<void>('/collaboration/v1/functionaldepts/coop', { data });
}

/**
 * 修改协同岗是否默认勾选
 * PUT /collaboration/v1/functionaldepts/checked/coop
 */
export function checkedFunctionaldeptsMembers(data: CheckedFunctionaldeptsMemberItem[]): Promise<ApiResponse<void>> {
  return http.put<void>('/collaboration/v1/functionaldepts/checked/coop', data);
}

/**
 * 新增默认协同岗（批量）
 * POST /collaboration/v1/functionaldepts/default/coop/batch
 */
export function creatDefaultCoop(data: CreateDefaultCoopParams): Promise<ApiResponse<void>> {
  return http.post<void>('/collaboration/v1/functionaldepts/default/coop/batch', data);
}

/**
 * 获取默认协同岗分页列表
 * GET /collaboration/v1/functionaldepts/default/coop/page
 */
export function pageDefaultCoop(params: DefaultCoopPageQuery): HttpResult<DefaultCoopPage> {
  return http.get<DefaultCoopPage>('/collaboration/v1/functionaldepts/default/coop/page', { params });
}

/**
 * 删除默认协同岗
 * DELETE /collaboration/v1/functionaldepts/default/coop/{id}
 */
export function deleteDefaultCoop(id: string): Promise<ApiResponse<void>> {
  return http.delete<void>(`/collaboration/v1/functionaldepts/default/coop/${id}`);
}
