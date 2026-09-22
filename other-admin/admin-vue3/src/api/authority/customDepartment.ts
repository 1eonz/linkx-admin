import type { ApiResponse, HttpResult, PaginatedResult } from '#/axios';
import http from '@/utils/http';

/**
 * 自定义组织树节点（组织）
 * - isOrg=true 表示组织节点
 * - isLeaf=false 组织节点一定有子节点（部门）
 */
export interface OrganizationItem {
  id: string;
  name: string;
  /** 值班类型（组织关联的 dutyType） */
  dutyType?: string;
  /** 标识：组织节点 */
  isOrg: true;
  /** 组织节点非叶子 */
  isLeaf: false;
  [key: string]: unknown;
}

/**
 * 自定义部门节点（部门/单位）
 * - type=1 单位 / type=2 部门
 * - isOrg=false 表示部门节点
 */
export interface DepartmentItem {
  id: string;
  name: string;
  /** 部门编码 */
  code: string;
  /** 1=单位 / 2=部门 */
  type: 1 | 2;
  /** 父节点 id（组织 id 或上级部门 id） */
  parentId: string;
  /** 所属组织 id */
  departmentCustomId: string;
  /** 标识：部门节点 */
  isOrg: false;
  /** 是否叶子节点 */
  isLeaf: boolean;
  /** 是否有子节点 */
  hasChildren: boolean;
  [key: string]: unknown;
}

/** 树节点联合类型（el-tree 数据通用） */
export type CustomDepartmentTreeNode = OrganizationItem | DepartmentItem;

/**
 * 节点绑定的警员项
 */
export interface CustomDepartmentUserItem {
  id: string;
  userId: string;
  userName: string;
  mobile?: string;
  departmentName?: string;
  operateTime?: string;
  [key: string]: unknown;
}

/**
 * 可绑定警员项（PoliceSelectDialog 使用）
 */
export interface AvailableUserItem {
  id: string;
  name: string;
  idCard?: string;
  departmentName?: string;
  departmentCode?: string;
  /** 所属部门 id（用于绑定参数 departmentId） */
  departmentId?: string;
  mobile?: string;
  [key: string]: unknown;
}

/**
 * 绑定警员载荷项（{ users: [{ departmentCode, departmentId, id }] } 结构）
 */
export interface BindUserItem {
  /** 部门编码 */
  departmentCode?: string;
  /** 部门 id */
  departmentId?: string;
  /** 警员 id */
  id: string;
}

/** 绑定警员载荷 */
export interface BindUsersPayload {
  /** 警员列表 */
  users: BindUserItem[];
}

/** 组织新建/编辑载荷 */
export interface OrganizationPayload {
  name: string;
  dutyType?: string;
}

/** 部门新建/编辑载荷 */
export interface DepartmentPayload {
  name: string;
  code: string;
  /** 1=单位 / 2=部门 */
  type: 1 | 2;
  parentId: string;
  /** 所属组织 id */
  departmentCustomId: string;
}

/** 懒加载子节点参数 */
export interface NodeChildrenQuery {
  /** 父节点 id（组织下为 0，部门下为自身 id） */
  parentId: string;
  /** 所属组织 id */
  departmentCustomId: string;
}

/** 可绑定警员分页查询参数 */
export interface AvailableUserQuery {
  pageNum: number;
  pageSize: number;
  name?: string;
  idCard?: string;
  departmentCode?: string;
  privString?: string;
}

/** 节点绑定警员分页查询参数 */
export interface CustomDepartmentUserQuery {
  pageNum: number;
  pageSize: number;
  userName?: string;
}

// ===== 组织树 API =====

/**
 * 获取组织树（根节点列表）
 * GET /auth/v1/custom-department/tree
 */
export function getOrganizationTree(): HttpResult<OrganizationItem[]> {
  return http.get<OrganizationItem[]>('/auth/v1/custom-department/tree');
}

/**
 * 新建组织
 * POST /auth/v1/custom-department/tree
 */
export function createOrganization(data: OrganizationPayload): Promise<ApiResponse<string>> {
  return http.post<string>('/auth/v1/custom-department/tree', data);
}

/**
 * 编辑组织
 * PUT /auth/v1/custom-department/tree/{id}
 */
export function updateOrganization(id: string, data: OrganizationPayload): Promise<ApiResponse> {
  return http.put(`/auth/v1/custom-department/tree/${id}`, data);
}

/**
 * 删除组织
 * DELETE /auth/v1/custom-department/tree/{id}
 */
export function deleteOrganization(id: string): Promise<ApiResponse> {
  return http.delete(`/auth/v1/custom-department/tree/${id}`);
}

// ===== 部门节点 API =====

/**
 * 懒加载子节点（组织下挂部门 / 部门下挂子部门）
 * GET /auth/v1/custom-department/node
 */
export function getCustomDepartmentChildren(
  params: NodeChildrenQuery,
): HttpResult<DepartmentItem[]> {
  return http.get<DepartmentItem[]>('/auth/v1/custom-department/node', { params });
}

/**
 * 新建部门
 * POST /auth/v1/custom-department/node
 */
export function createCustomDepartment(data: DepartmentPayload): Promise<ApiResponse<string>> {
  return http.post<string>('/auth/v1/custom-department/node', data);
}

/**
 * 编辑部门
 * PUT /auth/v1/custom-department/node/{id}
 */
export function updateCustomDepartment(id: string, data: DepartmentPayload): Promise<ApiResponse> {
  return http.put(`/auth/v1/custom-department/node/${id}`, data);
}

/**
 * 删除部门
 * DELETE /auth/v1/custom-department/node/{id}
 */
export function deleteCustomDepartment(id: string): Promise<ApiResponse> {
  return http.delete(`/auth/v1/custom-department/node/${id}`);
}

// ===== 节点-警员绑定 API =====

/**
 * 节点绑定的警员分页
 * GET /auth/v1/custom-department/node/{id}/user/page
 */
export function getCustomDepartmentUserPage(
  id: string,
  params: CustomDepartmentUserQuery,
): HttpResult<PaginatedResult<CustomDepartmentUserItem>> {
  return http.get<PaginatedResult<CustomDepartmentUserItem>>(
    `/auth/v1/custom-department/node/${id}/user/page`,
    { params },
  );
}

/**
 * 批量绑定警员
 * POST /auth/v1/custom-department/node/{id}/user
 * @param id - 部门节点 id
 * @param data - { users: [{ departmentCode, departmentId, id }] } 结构
 */
export function bindCustomDepartmentUsers(
  id: string,
  data: BindUsersPayload,
): Promise<ApiResponse> {
  return http.post(`/auth/v1/custom-department/node/${id}/user`, data);
}

/**
 * 解绑警员
 * DELETE /auth/v1/custom-department/node/{id}/user
 */
export function unbindCustomDepartmentUsers(
  id: string,
  params: { userIds: string[] },
): Promise<ApiResponse> {
  return http.delete(`/auth/v1/custom-department/node/${id}/user`, { params });
}

// ===== 可绑定警员 API =====

/**
 * 可绑定警员分页
 * GET /auth/v1/custom-department/available-user/page
 */
export function getAvailableUsers(
  params: AvailableUserQuery,
): HttpResult<PaginatedResult<AvailableUserItem>> {
  return http.get<PaginatedResult<AvailableUserItem>>(
    '/auth/v1/custom-department/available-user/page',
    { params },
  );
}

// ===== 管理员-警员绑定 API（Navbar 绑定警员用） =====

/** 管理员已绑定的警员信息 */
export interface BindUserInfo {
  id: string;
  imUserId: string;
  imUserName: string;
  [key: string]: unknown;
}

/**
 * 查询当前管理员绑定的警员
 * GET /auth/v1/user/adminuser/bind/im-user
 */
export function getBindUser(): HttpResult<BindUserInfo | null> {
  return http.get<BindUserInfo | null>('/auth/v1/user/adminuser/bind/im-user');
}

/**
 * 绑定警员（管理员绑定 IM 用户）
 * PUT /auth/v1/user/adminuser/bind/im-user
 * @param data - { imUserId: string }
 */
export function bindUser(data: { imUserId: string }): Promise<ApiResponse> {
  return http.put('/auth/v1/user/adminuser/bind/im-user', data);
}

/**
 * 解绑警员（管理员解绑 IM 用户）
 * DELETE /auth/v1/user/adminuser/im-user
 */
export function unbindUser(): Promise<ApiResponse> {
  return http.delete('/auth/v1/user/adminuser/im-user');
}
