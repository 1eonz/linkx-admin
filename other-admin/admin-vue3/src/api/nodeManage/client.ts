import type { ApiResponse, HttpResult, PaginatedResult } from '#/axios';
import http from '@/utils/http';

/** 客户端节点项 */
export interface ClientItem {
  id: string;
  /** 节点标识（P2P 协议层，用于 update） */
  peerId: string;
  /** IP 地址 */
  ip: string;
  /** 端口 */
  port: number;
  /** 节点名称 */
  name?: string;
  /** 标签 */
  tag?: string;
  /** 备注 */
  remark?: string;
  /** 授权状态：1=已授权，其他=未授权 */
  grant?: number;
  /** 是否过期 */
  expired?: boolean;
  /** 授权人 */
  grantUserName?: string;
  /** 授权时间 */
  grantTime?: string;
  /** 授权有效期（时间戳） */
  expiredIn?: number;
  /** 会话 ID */
  session?: string;
  /** 连接状态值（0-7） */
  status?: number;
  /** 连接状态描述 */
  statusDesc?: string;
  /** 最后活跃时间 */
  lastSeen?: string;
  /** 创建时间 */
  gmtCreated?: string;
  [key: string]: unknown;
}

/** 客户端列表查询参数 */
export interface ClientListQuery {
  pageNum: number;
  pageSize: number;
  keyword?: string;
}

/** 客户端更新载荷（编辑/授权共用） */
export interface ClientUpdatePayload {
  name?: string;
  remark?: string;
  tag?: string;
  /** 授权状态：1=已授权，0=未授权 */
  grant?: number;
  /** 授权有效期（grant=1 时必填） */
  expiredIn?: number;
}

/**
 * 查询客户端列表（GET /node/v1/p2p/clients）
 */
export function getClients(params: ClientListQuery): HttpResult<PaginatedResult<ClientItem>> {
  return http.get<PaginatedResult<ClientItem>>('/node/v1/p2p/clients', { params });
}

/**
 * 更新客户端（POST /node/v1/p2p/clients/{peerId}）
 * 同时承载「编辑」（name/remark/tag）和「授权」（grant/expiredIn）两类操作
 */
export function updateClient(peerId: string, data: ClientUpdatePayload): HttpResult<string> {
  return http.post<string>(`/node/v1/p2p/clients/${peerId}`, data);
}

/**
 * 删除客户端（DELETE /node/v1/p2p/clients/{id}）
 */
export function deleteClient(id: string): Promise<ApiResponse> {
  return http.delete<string>(`/node/v1/p2p/clients/${id}`);
}
