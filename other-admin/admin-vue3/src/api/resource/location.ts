import type { HttpResult } from '#/axios';
import http from '@/utils/http';

/** 位置项 */
export interface LocationItem {
  id: string;
  /** 组织编码 */
  departmentCode: string;
  /** 组织名称 */
  departmentName: string;
  /** 经纬度（格式：经度,纬度） */
  location: string;
  [key: string]: unknown;
}

/** 位置列表查询参数 */
export interface LocationListQuery {
  pageNum: number;
  pageSize: number;
  deptName?: string;
}

/**
 * 位置列表（GET /collaboration/dept/location/list）
 */
export function getLocationList(params: LocationListQuery): HttpResult<LocationItem[]> {
  return http.get<LocationItem[]>('/collaboration/v1/dept/location/list', { params });
}

/**
 * 新增位置（POST /collaboration/dept/location/save）
 */
export function createLocation(data: Omit<LocationItem, 'id'>): HttpResult<string> {
  return http.post<string>('/collaboration/v1/dept/location/save', data);
}

/**
 * 更新位置（POST /collaboration/dept/location/save，与新增同 URL，靠是否带 id 区分）
 */
export function updateLocation(data: LocationItem): HttpResult<string> {
  return http.post<string>('/collaboration/v1/dept/location/save', data);
}

/**
 * 删除位置（POST /collaboration/dept/location/delete/{id}）
 */
export function deleteLocation(id: string): HttpResult<string> {
  return http.post<string>(`/collaboration/v1/dept/location/delete/${id}`);
}
