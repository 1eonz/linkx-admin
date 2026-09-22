import type { ApiResponse, HttpResult, PaginatedResult } from '#/axios';
import http from '@/utils/http';

/** 部门节点（queryDepartment / queryDepartmentTree 通用结构） */
export interface DepartmentNode {
  id: string;
  code: string;
  name: string;
  children?: DepartmentNode[];
  [key: string]: unknown;
}

/** 用户所属部门（queryUserByIdCard 返回结构） */
export interface UserDepartment {
  departmentId: string;
  departmentCode: string;
  departmentName: string;
  [key: string]: unknown;
}

/** queryUserByIdCard 返回数据 */
export interface UserByIdCardData {
  userDepartments?: UserDepartment[];
  [key: string]: unknown;
}

/** queryUserByPage 返回的完整用户信息（含 userDepartments） */
export interface QueryUserByPageItem {
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
  isBinding?: number;
  userDepartments?: Array<{
    id: string;
    departmentCode: string;
    departmentName: string;
  }>;
  [key: string]: unknown;
}

/** 警单类型项（getPolicetickettypes 返回） */
export interface PoliceTicketType {
  id: string;
  tag: string;
  [key: string]: unknown;
}

/** 协同岗列表项 */
export interface CollaborationItem {
  id: string;
  postName: string;
  iconUrl?: string;
  type?: number;
  policeTicketTypes?: PoliceTicketType[];
  ticketTypeNames?: string;
  typeIds?: string[];
  orgId?: string;
  orgName?: string;
  orgCode?: string;
  relatedUserIds?: string | string[];
  relatedUserNames?: string | string[];
  operatorName?: string;
  operationType?: number;
  source?: number;
  updateTime?: string;
  createTime?: string;
  gmtCreated?: string;
  gmtModified?: string;
  importUserName?: string;
  /** 挂靠弹窗中是否已挂靠（后端返回） */
  selected?: boolean;
  /** 默认协同岗弹窗中前端标记是否已存在 */
  disabled?: boolean;
  [key: string]: unknown;
}

/** 协同岗列表查询参数 */
export interface CollaborationListQuery {
  postName?: string;
  orgId?: string;
  orgName?: string;
  relatedUserNames?: string;
  startTime?: string;
  endTime?: string;
  /** 排除人员核查岗位（0=排除） */
  type?: number;
  /** 挂靠筛选类型（'coopLevel' | 'functionalDepartment'） */
  selectionType?: string;
  /** 挂靠筛选 id */
  selectionId?: string;
  pageNum: number;
  pageSize: number;
}

/** 编辑记录项 */
export interface CollaborationEditItem {
  id: string;
  postName: string;
  orgName?: string;
  relatedUserNames?: string;
  operatorName?: string;
  operationType?: number;
  operationTypeName?: string;
  content?: string;
  operateTime?: string;
  [key: string]: unknown;
}

/** 上下岗记录项 */
export interface AttendanceItem {
  id: string;
  postName: string;
  orgName?: string;
  personName?: string;
  relatedUserNames?: string;
  type?: number;
  lastPeopleNum?: number;
  lastPeople?: string;
  switchType?: number;
  createTime?: string;
  [key: string]: unknown;
}

/** 在岗人员项（getOnDutyUsersByPostId 返回） */
export interface OnDutyUser {
  id: string;
  userId: string;
  name: string;
  idCard?: string;
  departmentName?: string;
  departmentCode?: string;
  [key: string]: unknown;
}

// ===== H5 协同 API =====

/**
 * 使用身份证查询当前用户所属组织
 * GET /collaboration/post/queryUserByIdCard
 */
export function queryUserByIdCard(params: { idCard: string }): HttpResult<UserByIdCardData> {
  return http.get<UserByIdCardData>('/collaboration/v1/post/queryUserByIdCard', { params });
}

/**
 * 查询协同岗部门（懒加载用，按 parentCode 查询下一级）
 * GET /collaboration/post/queryDepartment
 */
export function queryDepartment(params: { parentCode?: string } = {}): HttpResult<DepartmentNode[]> {
  return http.get<DepartmentNode[]>('/collaboration/v1/post/queryDepartment', { params });
}

/**
 * 查询协同岗部门-一次性加载（同步加载整棵树）
 * GET /collaboration/organization/tree
 */
export function queryDepartmentTree(params: { parentCode?: string } = {}): HttpResult<DepartmentNode> {
  return http.get<DepartmentNode>('/collaboration/v1/organization/tree', { params });
}

/**
 * 按部门分页查询用户（GET /collaboration/post/queryUserByPage）
 * 用于：ColForm 弹窗中根据组织查询人员列表
 */
export function queryUserByPage(params: {
  code?: string;
  privString?: string;
  includeChildren?: number;
  pageNum: number;
  pageSize: number;
  name?: string;
  type?: number;
}): HttpResult<PaginatedResult<QueryUserByPageItem>> {
  return http.get<PaginatedResult<QueryUserByPageItem>>('/collaboration/v1/post/queryUserByPage', { params });
}

/**
 * 查询协同岗（不分组）
 * GET /collaboration/post/queryUser
 */
export function queryUser(params: Record<string, unknown> = {}): HttpResult<unknown> {
  return http.get<unknown>('/collaboration/v1/post/queryUser', { params });
}

/**
 * 根据用户 id 查询用户权限
 * GET /auth/role/byUserId
 */
export function queryRoleAuthByUserId(params: { userId: string }): HttpResult<unknown> {
  return http.get<unknown>('/auth/v1/role/byUserId', { params });
}

/**
 * 根据用户 id 查询部门树
 * GET /collaboration/im/users/tree
 */
export function getDeptTreeByUserId(params: { userId: string }): HttpResult<unknown> {
  return http.get<unknown>('/collaboration/v1/im/users/tree', { params });
}

/**
 * 协同岗列表分页查询（GET /collaboration/post/page）
 * 直接返回 { records, total }（不在 data 字段下）
 */
export function getCollaborationPage(params: CollaborationListQuery): HttpResult<PaginatedResult<CollaborationItem>> {
  return http.get<PaginatedResult<CollaborationItem>>('/collaboration/v1/post/page', { params });
}

/**
 * 新增协同岗（POST /collaboration/post/save）
 */
export function createCollaboration(data: Partial<CollaborationItem>): HttpResult<string> {
  return http.post<string>('/collaboration/v1/post/save', data);
}

/**
 * 修改协同岗（POST /collaboration/post/update）
 */
export function updateCollaboration(data: Partial<CollaborationItem>): HttpResult<string> {
  return http.post<string>('/collaboration/v1/post/update', data);
}

/**
 * 删除协同岗（DELETE /collaboration/post/delete/{id}）
 */
export function deleteCollaboration(id: string): Promise<ApiResponse> {
  return http.delete<string>(`/collaboration/v1/post/delete/${id}`);
}

/**
 * 批量删除协同岗（DELETE /collaboration/post/deleteBatch）
 * DELETE + body（id 数组）
 */
export function delBatchCollaboration(data: string[]): Promise<ApiResponse> {
  return http.delete<string>('/collaboration/v1/post/deleteBatch', { data });
}

/**
 * 查询协同岗是否重名（GET /collaboration/post/queryByName）
 */
export function querySameName(params: { name: string; id?: string }): HttpResult<boolean> {
  return http.get<boolean>('/collaboration/v1/post/queryByName', { params });
}

/**
 * 同步老协同岗数据（GET /collaboration/post/syncPostFromIm）
 */
export function syncPostFromIm(params: Record<string, unknown> = {}): HttpResult<boolean> {
  return http.get<boolean>('/collaboration/v1/post/syncPostFromIm', { params });
}

/**
 * 获取同步状态（GET /collaboration/post/getImSyncStatus）
 */
export function getImSyncStatus(params: Record<string, unknown> = {}): HttpResult<boolean> {
  return http.get<boolean>('/collaboration/v1/post/getImSyncStatus', { params });
}

/**
 * 获取同步进度（GET /collaboration/post/getProcess）
 * 用于 pageLoadingUtils 轮询：返回 data=true 表示完成
 */
export function getProcess(params: Record<string, unknown> = {}): HttpResult<boolean> {
  return http.get<boolean>('/collaboration/v1/post/getProcess', { params });
}

/**
 * 协同岗编辑记录分页（GET /collaboration/post/log/page）
 * 返回 { records, total }（直接业务字段）
 */
export function getCollaborationEditPage(
  params: CollaborationListQuery,
): HttpResult<PaginatedResult<CollaborationEditItem>> {
  return http.get<PaginatedResult<CollaborationEditItem>>('/collaboration/v1/post/log/page', { params });
}

/**
 * 导出协同岗编辑记录（GET /collaboration/post/log/export）
 * responseType=arraybuffer，返回二进制流
 */
export function exportCollaborationEditPage(params: CollaborationListQuery): HttpResult<ArrayBuffer> {
  return http.get<ArrayBuffer>('/collaboration/v1/post/log/export', {
    params,
    responseType: 'arraybuffer',
  });
}

/**
 * 上下岗记录分页（GET /collaboration/attendance/page）
 * 返回 { records, total }（直接业务字段）
 */
export function getAttendancePage(params: CollaborationListQuery): HttpResult<PaginatedResult<AttendanceItem>> {
  return http.get<PaginatedResult<AttendanceItem>>('/collaboration/v1/attendance/page', { params });
}

/**
 * 导出上下岗记录（GET /collaboration/attendance/export）
 * responseType=arraybuffer
 */
export function exportAttendance(params: CollaborationListQuery): HttpResult<ArrayBuffer> {
  return http.get<ArrayBuffer>('/collaboration/v1/attendance/export', {
    params,
    responseType: 'arraybuffer',
  });
}

/**
 * 上传协同岗图标（POST /collaboration/post/upload/icon）
 * multipart/form-data
 */
export function uploadColTmp(file: FormData): HttpResult<{ iconUrl: string; fileId: string }> {
  return http.post<{ iconUrl: string; fileId: string }>('/collaboration/v1/post/upload/icon', file);
}

/**
 * 下载协同岗图标（GET /collaboration/post/downloadIcon）
 */
export function downloadColIcon(params: { iconUrl: string }): HttpResult<unknown> {
  return http.get<unknown>('/collaboration/v1/post/downloadIcon', { params });
}

/**
 * 查询协同岗在岗人员列表（GET /collaboration/attendance/getOnline）
 * 用于：下岗弹窗
 */
export function getOnDutyUsersByPostId(postId: string): HttpResult<OnDutyUser[]> {
  return http.get<OnDutyUser[]>('/collaboration/v1/attendance/getOnline', { params: { postId } });
}

/**
 * 判断是否为最后一个在岗人员（GET /collaboration/attendance/getLastNum）
 * 返回 data.lastPeopleNum === 1 表示最后一个
 */
export function getLastNum(userId: string): HttpResult<{ lastPeopleNum: number }> {
  return http.get<{ lastPeopleNum: number }>('/collaboration/v1/attendance/getLastNum', { params: { userId } });
}

/**
 * 管理员强制下岗（POST /collaboration/attendance/admin/offline）
 * API 内部注入 switchType=3（管理员操作）
 */
export function offDutyUser(data: {
  userId: string;
  userName: string;
  postId: string;
  postName: string;
}): HttpResult<string> {
  // 注入 switchType: 3（管理员操作下岗）
  return http.post<string>('/collaboration/v1/attendance/admin/offline', { ...data, switchType: 3 });
}
