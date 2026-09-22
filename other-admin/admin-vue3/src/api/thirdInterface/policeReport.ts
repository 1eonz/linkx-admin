import type { ApiResponse, HttpResult, PaginatedResult } from '#/axios';
import http from '@/utils/http';

/**
 * 警单平台对接 - 接口定义
 *
 * 涵盖：警单对接（Dock）、警单管理（Policeticket）、警单类型（Policetickettype）三类资源
 * 注意：警单类型 list 接口 `getPolicetickettypes` 已在 `@/api/policeReport/dock.ts` 定义，此处不重复
 */

// ===== 警单对接（Dock） =====

/** 警单对接项 */
export interface DockItem {
  /** 主键 */
  id?: string;
  /** 名称 */
  name: string;
  /** 系统名称 */
  systemName: string;
  /** 系统编码 */
  systemCode: string;
  /** 协议 */
  schema: string;
  /** IP */
  ip: string;
  /** 端口 */
  port: number | string;
  /** 路径 */
  path: string;
  /** 请求方法 */
  method: string;
  /** 请求头（JSON 字符串） */
  headers?: string;
  /** 请求体（JSON 字符串） */
  body?: string;
  /** 请求参数（JSON 字符串） */
  params?: string;
  /** 表单映射脚本 */
  script?: string;
  /** 执行周期（毫秒） */
  executePeriod: number;
  /** 状态：0-禁用、1-启用 */
  status: 0 | 1;
  /** 创建时间 */
  gmtCreated?: string;
  [key: string]: unknown;
}

/** 警单对接分页查询参数 */
export interface DockListQuery {
  /** 页码 */
  current: number;
  /** 每页条数 */
  size: number;
  /** 系统名称 */
  systemName?: string;
  /** IP */
  ip?: string;
  /** 路径 */
  path?: string;
}

/** 警单对接启用/禁用参数 */
export interface DockEnablePayload {
  id: string;
  status: 0 | 1;
}

/**
 * 警单对接分页查询（GET /collaboration/v1/poltclients/page）
 */
export function getDockPage(params: DockListQuery): HttpResult<PaginatedResult<DockItem>> {
  return http.get<PaginatedResult<DockItem>>('/collaboration/v1/poltclients/page', { params });
}

/**
 * 新增警单对接（POST /collaboration/v1/poltclients）
 */
export function saveDock(data: Partial<DockItem>): HttpResult<string> {
  return http.post<string>('/collaboration/v1/poltclients', data);
}

/**
 * 更新警单对接（PUT /collaboration/v1/poltclients）
 */
export function updateDock(data: Partial<DockItem>): Promise<ApiResponse> {
  return http.put<string>('/collaboration/v1/poltclients', data);
}

/**
 * 删除警单对接（DELETE /collaboration/v1/poltclients/{id}）
 */
export function deleteDock(id: string): Promise<ApiResponse> {
  return http.delete<string>(`/collaboration/v1/poltclients/${id}`);
}

/**
 * 启用/禁用警单对接（PUT /collaboration/v1/poltclients/enable）
 */
export function changeDockEnable(data: DockEnablePayload): Promise<ApiResponse> {
  return http.put<string>('/collaboration/v1/poltclients/enable', data);
}

// ===== 警单管理（Policeticket） =====

/** 警单管理项 */
export interface PoliceticketItem {
  /** 主键 */
  id: string;
  /** 警单编号 */
  code: string;
  /** 警单名称 */
  name: string;
  /** 警单内容 */
  content?: string;
  /** 警单标签 */
  tag?: string;
  /** 来源 */
  source?: string;
  /** 创建时间 */
  createTime?: string;
  /** 来源标识（用于详情展示） */
  origin?: string;
  [key: string]: unknown;
}

/** 警单管理分页查询参数 */
export interface PoliceticketListQuery {
  /** 页码 */
  current: number;
  /** 每页条数 */
  size: number;
  /** 警单编号 */
  code?: string;
  /** 警单名称 */
  name?: string;
}

/**
 * 警单管理分页查询（GET /collaboration/v1/policeticket/page）
 */
export function getPoliceticketPage(
  params: PoliceticketListQuery,
): HttpResult<PaginatedResult<PoliceticketItem>> {
  return http.get<PaginatedResult<PoliceticketItem>>('/collaboration/v1/policeticket/page', { params });
}

/**
 * 警单详情（GET /collaboration/v1/policeticket/{id}）
 */
export function getPoliceticketById(id: string): HttpResult<PoliceticketItem> {
  return http.get<PoliceticketItem>(`/collaboration/v1/policeticket/${id}`);
}

// ===== 警单类型（Policetickettype） =====

/** 警单类型项 */
export interface PoliceticketTypeItem {
  /** 主键 */
  id?: string;
  /** 类型标签 */
  tag: string;
  /** 创建时间 */
  gmtCreated?: string;
  [key: string]: unknown;
}

/** 警单类型分页查询参数 */
export interface PoliceticketTypeListQuery {
  /** 页码 */
  pagenum: number;
  /** 每页条数 */
  pagesize: number;
  /** 标签 */
  tag?: string;
}

/**
 * 警单类型分页查询（GET /collaboration/v1/policetickettype/page）
 */
export function getPolicetickettypesPage(
  params: PoliceticketTypeListQuery,
): HttpResult<PaginatedResult<PoliceticketTypeItem>> {
  return http.get<PaginatedResult<PoliceticketTypeItem>>('/collaboration/v1/policetickettype/page', {
    params,
  });
}

/**
 * 新增警单类型（POST /collaboration/v1/policetickettype）
 */
export function savePolicetickettype(data: { tag: string }): HttpResult<string> {
  return http.post<string>('/collaboration/v1/policetickettype', data);
}

/**
 * 更新警单类型（PUT /collaboration/v1/policetickettype）
 */
export function updatePolicetickettype(data: Partial<PoliceticketTypeItem>): Promise<ApiResponse> {
  return http.put<string>('/collaboration/v1/policetickettype', data);
}

/**
 * 删除警单类型（DELETE /collaboration/v1/policetickettype/{id}）
 */
export function deletePolicetickettype(id: string): Promise<ApiResponse> {
  return http.delete<string>(`/collaboration/v1/policetickettype/${id}`);
}
