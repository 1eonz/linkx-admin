import type { HttpResult } from '#/axios';
import http from '@/utils/http';

/** 全局配置项 */
export interface GlobalsItem {
  id: string;
  name: string;
  value: string;
  remark: string;
  remarkEn?: string;
  status: number;
  [key: string]: unknown;
}

/** 新增/修改全局配置项载荷 */
export type GlobalsPayload = GlobalsItem;

/**
 * 查询全局配置（POST /base/v1/globals/getGlobalsList）
 * 用于：登录后拉取并写入 localStorage.globalConfig
 */
export function queryGlobalsList(): HttpResult<Record<string, unknown>> {
  return http.post<Record<string, unknown>>('/base/v1/globals/getGlobalsList');
}

/**
 * 全局配置列表（POST /api/globals/list）
 */
export function getGlobalsList(): HttpResult<GlobalsItem[]> {
  return http.post<GlobalsItem[]>('/api/globals/list');
}

/**
 * 新增全局配置项（POST /api/globals/create）
 */
export function createGlobals(data: GlobalsPayload): HttpResult<string> {
  return http.post<string>('/api/globals/create', data);
}

/**
 * 修改全局配置项（POST /api/globals/update）
 */
export function updateGlobals(data: GlobalsPayload): HttpResult<string> {
  return http.post<string>('/api/globals/update', data);
}

/**
 * 删除全局配置项（POST /api/globals/delete?id=xxx）
 * 通过 params 传 id，返回 data 为 'success' 字符串
 */
export function deleteGlobals(id: string | number): HttpResult<string> {
  return http.post<string>('/api/globals/delete', {}, { params: { id } });
}
