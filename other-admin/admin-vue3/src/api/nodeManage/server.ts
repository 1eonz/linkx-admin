import type { ApiResponse, HttpResult, PaginatedResult } from '#/axios';
import http from '@/utils/http';

/** 服务器节点项 */
export interface ServerItem {
  id: string;
  /** IP 地址 */
  ip: string;
  /** 端口（固定 30017） */
  port: number;
  /** 节点名称 */
  name?: string;
  /** 标签 */
  tag?: string;
  /** 备注 */
  remark?: string;
  /** 创建人 */
  createUserName?: string;
  /** 创建时间 */
  gmtCreated?: string;
  /** 连接状态值（0-7，见 ConnectionStatusDot 映射） */
  status?: number;
  /** 连接状态描述 */
  statusDesc?: string;
  /** 节点标识（P2P 协议层） */
  peerId?: string;
  [key: string]: unknown;
}

/** 服务器列表查询参数 */
export interface ServerListQuery {
  pageNum: number;
  pageSize: number;
  keyword?: string;
}

/** 服务器新增/编辑载荷 */
export interface ServerPayload {
  ip: string;
  port: number;
  name?: string;
  tag?: string;
  remark?: string;
}

/**
 * 查询服务器列表（GET /node/v1/p2p/servers）
 */
export function getServers(params: ServerListQuery): HttpResult<PaginatedResult<ServerItem>> {
  return http.get<PaginatedResult<ServerItem>>('/node/v1/p2p/servers', { params });
}

/**
 * 新增服务器（POST /node/v1/p2p/servers）
 */
export function createServer(data: ServerPayload): HttpResult<string> {
  return http.post<string>('/node/v1/p2p/servers', data);
}

/**
 * 更新服务器（PUT /node/v1/p2p/servers/{id}）
 */
export function updateServer(id: string, data: ServerPayload): Promise<ApiResponse> {
  return http.put<string>(`/node/v1/p2p/servers/${id}`, data);
}

/**
 * 删除服务器（DELETE /node/v1/p2p/servers/{id}）
 */
export function deleteServer(id: string): Promise<ApiResponse> {
  return http.delete<string>(`/node/v1/p2p/servers/${id}`);
}
