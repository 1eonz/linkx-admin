import type { ApiResponse, HttpResult, PaginatedResult } from '#/axios';
import http from '@/utils/http';

/**
 * ICP 通信服务 - 协议类型
 * 1: http / 2: https / 3: ws / 4: wss / 5: tcp / 6: udp
 */
export type IcpProtocol = 1 | 2 | 3 | 4 | 5 | 6;

/** ICP 服务器配置 */
export interface IcpServerConfig {
  /** 主键 id（编辑时回填，保存时提交） */
  id?: string;
  /** 协议类型 */
  protocol: IcpProtocol;
  /** IP 地址 */
  ip: string;
  /** 端口 */
  port: number;
  /** WebSocket 服务地址（wss/ws 完整 url） */
  wssUrl: string;
  /** 用户名 */
  username: string;
  /** 密码 */
  password: string;
  /** 关联组织 id */
  departmentId?: string;
  /** 关联组织名称 */
  departmentName?: string;
  /** 摄像头层级 id */
  cameraLevelId?: string;
  /** 摄像头层级名称 */
  cameraLevelName?: string;
  /** 环境（0:默认） */
  environment?: number;
  /** 状态（1:启用 0:禁用） */
  status?: number;
  /** 备注 */
  remark?: string;
  [key: string]: unknown;
}

/** ICP 树节点（部门/摄像头层级通用） */
export interface IcpTreeNode {
  /** 节点 id */
  id: string;
  /** 节点名称 */
  label: string;
  /** 子节点 */
  children?: IcpTreeNode[];
  /** 父节点 id */
  parentId?: string;
  [key: string]: unknown;
}

/** 按部门查询人员列表项 */
export interface IcpUserItem {
  /** 用户 id */
  id: string;
  /** 姓名 */
  name?: string;
  /** 身份证号 */
  idCard?: string;
  /** 部门名称 */
  departmentName?: string;
  /** 部门编码 */
  departmentCode?: string;
  /** 直属领导姓名 */
  directLeaderName?: string;
  /** 直属领导 id */
  directLeaderId?: string;
  [key: string]: unknown;
}

/** 按部门查询人员分页参数 */
export interface IcpUserPageQuery {
  /** 部门名称 */
  departmentName?: string;
  /** 部门编码 */
  departmentCode?: string;
  /** 部门 id（privString） */
  privString?: string;
  /** 是否包含子部门（1:是 0:否） */
  isChildren?: number;
  /** 姓名 */
  name?: string;
  /** 身份证号 */
  idCard?: string;
  pageNum: number;
  pageSize: number;
}

/** 部门批量设备权限请求体 */
export interface BatchDeptOrgPrivReq {
  /** 部门编码列表 */
  deptCodes: string[];
  /** 权限 key 列表 */
  privs: string[];
  /** 是否包含子部门 */
  isChildren: number;
}

/** 部门批量摄像头权限请求体 */
export interface BatchDeptCameraPrivReq {
  /** 部门编码列表 */
  deptCodes: string[];
  /** 权限 key 列表 */
  privs: string[];
  /** 是否包含子部门 */
  isChildren: number;
}

// ===== 服务器配置 =====

/** 获取服务器配置（GET /api/icp/server/config） */
export function getServerConfig(): HttpResult<IcpServerConfig> {
  return http.get<IcpServerConfig>('/api/icp/server/config');
}

/** 更新服务器配置（PUT /api/icp/server/config） */
export function updateServerConfig(data: IcpServerConfig): Promise<ApiResponse> {
  return http.put<string>('/api/icp/server/config', data);
}

// ===== 树查询 =====

/** 摄像头层级选择树（GET /icp/v1/camera-level/tree/select） */
export function getIcpCameraSelectTree(): HttpResult<IcpTreeNode[]> {
  return http.get<IcpTreeNode[]>('/proxy/icp/v1/camera-level/tree/select');
}

/** 部门选择树（GET /icp/v1/department/tree/select） */
export function getIcpDeptSelectTree(): HttpResult<IcpTreeNode[]> {
  return http.get<IcpTreeNode[]>('/proxy/icp/v1/department/tree/select');
}

/** 摄像头层级授权树（GET /icp/v1/camera-level/tree）— 用于授权弹窗，字段 levelNumber/nodeName */
export function getIcpCameraTree(): HttpResult<IcpTreeNode[]> {
  return http.get<IcpTreeNode[]>('/proxy/icp/v1/camera-level/tree');
}

/** 部门授权树（GET /icp/v1/department/tree）— 用于授权弹窗，字段 departmentid/departmentname */
export function getIcpDepartmentTree(): HttpResult<IcpTreeNode[]> {
  return http.get<IcpTreeNode[]>('/proxy/icp/v1/department/tree');
}

// ===== 部门默认权限 =====

/** 部门摄像头权限（GET /icp/v1/camera/priv/dept/{deptCode}） */
export function getDeptCameraPriv(deptCode: string): HttpResult<string[]> {
  return http.get<string[]>(`/proxy/icp/v1/camera/priv/dept/${encodeURIComponent(deptCode)}`);
}

/** 部门设备权限（GET /icp/v1/imuser/priv/dept/{deptCode}） */
export function getDeptOrgPriv(deptCode: string): HttpResult<string[]> {
  return http.get<string[]>(`/proxy/icp/v1/imuser/priv/dept/${encodeURIComponent(deptCode)}`);
}

// ===== 按部门查人员 =====

/** 按部门查询人员分页（GET /auth/v1/user/page/dept） */
export function getUserPageByDept(params: IcpUserPageQuery): HttpResult<PaginatedResult<IcpUserItem>> {
  return http.get<PaginatedResult<IcpUserItem>>('/auth/v1/user/page/dept', { params });
}

// ===== 用户权限 =====

/** 用户设备权限（GET /icp/v1/imuser/priv/{userId}） */
export function getImuserPriv(userId: string): HttpResult<string[]> {
  return http.get<string[]>(`/proxy/icp/v1/imuser/priv/${encodeURIComponent(userId)}`);
}

/** 设置用户设备权限（PUT /icp/v1/imuser/priv/{userId}） */
export function setImuserPriv(userId: string, keys: string[]): Promise<ApiResponse> {
  return http.put<string>(`/proxy/icp/v1/imuser/priv/${encodeURIComponent(userId)}`, keys);
}

/** 用户摄像头权限（GET /icp/v1/camera/priv/{userId}） */
export function getCameraPriv(userId: string): HttpResult<string[]> {
  return http.get<string[]>(`/proxy/icp/v1/camera/priv/${encodeURIComponent(userId)}`);
}

/** 设置用户摄像头权限（PUT /icp/v1/camera/priv/{userId}） */
export function setCameraPriv(userId: string, keys: string[]): Promise<ApiResponse> {
  return http.put<string>(`/proxy/icp/v1/camera/priv/${encodeURIComponent(userId)}`, keys);
}

// ===== 批量部门授权 =====

/** 批量设置部门设备权限（PUT /icp/v1/imuser/priv/dept） */
export function batchSetDeptOrgPriv(data: BatchDeptOrgPrivReq): Promise<ApiResponse> {
  return http.put<string>('/proxy/icp/v1/imuser/priv/dept', data);
}

/** 批量设置部门摄像头权限（PUT /icp/v1/camera/priv/dept） */
export function batchSetDeptCameraPriv(data: BatchDeptCameraPrivReq): Promise<ApiResponse> {
  return http.put<string>('/proxy/icp/v1/camera/priv/dept', data);
}
