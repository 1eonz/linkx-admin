import type { HttpResult } from '#/axios';
import http from '@/utils/http';

/** 开放数据授权配置（6 项开关，0=关闭 1=开放） */
export interface OpenDataGrant {
  /** 用户数据 */
  users: number;
  /** 群组数据 */
  groups: number;
  /** 消息数据 */
  msg: number;
  /** H5 数据 */
  h5: number;
  /** 智能体数据 */
  agent: number;
  /** 协同岗用户（仅服务器侧授权有此字段） */
  coopUser?: number;
}

/** 开放数据统计 */
export interface OpenDataStatistic {
  users?: { coopUserCount?: number };
  groups?: { coopGroupCount?: number; normalGroupCount?: number };
  msg?: { coopMsg?: number };
  h5?: { count?: number };
  agent?: { count?: number };
}

/** 协同岗数据项（入局详情用） */
export interface CoopDataItem {
  id: string;
  postName: string;
  orgName?: string;
  relatedUserNames?: string;
  relatedUserIds?: string[] | string;
  iconUrl?: string;
}

/**
 * 查询服务器开放数据授权（GET /node/v1/p2p/servers/{peerId}/opendata/grant）
 */
export function getServerOpenDataGrant(peerId: string): HttpResult<OpenDataGrant> {
  return http.get<OpenDataGrant>(`/node/v1/p2p/servers/${peerId}/opendata/grant`);
}

/**
 * 更新服务器开放数据授权（POST /node/v1/p2p/servers/{peerId}/opendata/grant）
 */
export function updateServerOpenDataGrant(peerId: string, data: OpenDataGrant): HttpResult<string> {
  return http.post<string>(`/node/v1/p2p/servers/${peerId}/opendata/grant`, data);
}

/**
 * 查询开放数据统计（GET /node/v1/p2p/{peerId}/opendata/statistic）
 */
export function getOpenDataStatistic(peerId: string): HttpResult<OpenDataStatistic> {
  return http.get<OpenDataStatistic>(`/node/v1/p2p/${peerId}/opendata/statistic`);
}

/**
 * 查询协同岗数据（GET /node/v1/p2p/{peerId}/opendata/coop/search）
 */
export function searchCoopData(peerId: string, params: Record<string, unknown>): HttpResult<CoopDataItem[]> {
  return http.get<CoopDataItem[]>(`/node/v1/p2p/${peerId}/opendata/coop/search`, { params });
}
