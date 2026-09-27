import type { ApiResponse, HttpResult, PaginatedResult } from '#/axios';
import http from '@/utils/http';

/** 三方应用列表查询参数 */
export interface ThirdAppListQuery {
  pageNum: number;
  pageSize: number;
  clientName?: string;
}

/** Vue2 北向接入页使用的同接口查询字段。 */
export interface NorthboundAppListQuery {
  pageNum: number;
  pageSize: number;
  systemName?: string;
}

/** 三方应用表单字段 */
export interface ThirdAppForm {
  id?: string;
  clientName: string;
  clientId: string;
  clientSecret: string;
  clientType?: string;
  tokenTime: number | string;
  refreshTokenTime: number | string;
  status: number;
  remark?: string;
}

/** 三方应用列表项 */
export interface ThirdAppItem extends ThirdAppForm {
  id: string;
}

/** Vue2 北向接入页沿用的同接口字段，和三方应用列表的 clientName 字段分开保留。 */
export interface NorthboundAppForm {
  id?: string;
  systemName: string;
  clientId: string;
  clientSecret: string;
  clientType?: string;
  tokenTime: number | string;
  refreshTokenTime: number | string;
  status: number;
  expired?: string;
  remark?: string;
}

/** 北向接入列表补充的授权及审计字段。 */
export interface NorthboundAppItem extends NorthboundAppForm {
  id: string;
  grantTime?: string;
  grantUserName?: string;
  gmtCreated?: string;
  gmtModified?: string;
}

/**
 * 三方应用列表（POST /collaboration/v1/client/list）
 */
function postClientList<TItem>(data: ThirdAppListQuery | NorthboundAppListQuery): HttpResult<PaginatedResult<TItem>> {
  return http.post<PaginatedResult<TItem>>('/collaboration/v1/client/list', data);
}

export function collaborationList(data: ThirdAppListQuery): HttpResult<PaginatedResult<ThirdAppItem>> {
  return postClientList<ThirdAppItem>(data);
}

/** 北向接入页面沿用相同 URL，但查询字段是 Vue2 契约中的 systemName。 */
export function northboundAppList(data: NorthboundAppListQuery): HttpResult<PaginatedResult<NorthboundAppItem>> {
  return postClientList<NorthboundAppItem>(data);
}

/**
 * 新增三方应用（POST /collaboration/v1/client/create）
 * 注：URL 末尾保留一个空格，避免改动接口契约
 */
function postClientCreate(data: ThirdAppForm | NorthboundAppForm): HttpResult<string> {
  return http.post<string>('/collaboration/v1/client/create ', data);
}

export function collaborationCreate(data: ThirdAppForm): HttpResult<string> {
  return postClientCreate(data);
}

export function northboundAppCreate(data: NorthboundAppForm): HttpResult<string> {
  return postClientCreate(data);
}

/**
 * 修改三方应用（PUT /collaboration/v1/client/update）
 */
function putClientUpdate(data: ThirdAppForm | NorthboundAppForm): Promise<ApiResponse> {
  return http.put<string>('/collaboration/v1/client/update', data);
}

export function collaborationUpdate(data: ThirdAppForm): Promise<ApiResponse> {
  return putClientUpdate(data);
}

export function northboundAppUpdate(data: NorthboundAppForm): Promise<ApiResponse> {
  return putClientUpdate(data);
}

/**
 * 删除三方应用（DELETE /collaboration/v1/client/delete?id=xxx）
 * 通过 URL query 传 id
 */
export function collaborationDelete(id: string | number): Promise<ApiResponse> {
  return http.delete<string>(`/collaboration/v1/client/delete?id=${id}`);
}

/**
 * 三方应用详情（GET /collaboration/v1/client/detail?id=xxx）
 */
export function collaborationDetail(id: string | number): HttpResult<ThirdAppItem> {
  return http.get<ThirdAppItem>(`/collaboration/v1/client/detail?id=${id}`);
}
