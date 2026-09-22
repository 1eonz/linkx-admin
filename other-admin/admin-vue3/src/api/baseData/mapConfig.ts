import type { HttpResult, PaginatedResult } from '#/axios';
import http from '@/utils/http';

/**
 * 地图配置项
 */
export interface MapItem {
  id?: string;
  /** 地图名称 */
  name: string;
  /** 地图类型：AMap/Arcgis/BMap/MineMap/MapAbc/OpenLayers */
  mapType: string;
  /** 地图数据类型：0=栅格 1=矢量 */
  type: 0 | 1;
  /** 激活状态：0=未激活 1=已激活 */
  activation: 0 | 1;
  /** 配置 JSON 字符串 */
  configuration: string;
  /** 创建时间 */
  gmtCreated?: string;
  [key: string]: unknown;
}

/**
 * 底图文件项
 */
export interface BaseMapItem {
  id: string;
  /** 文件名 */
  name: string;
  /** 文件大小 */
  size: string;
  /** 上传时间 */
  created: string;
  /** 瓦片地址 */
  tiles?: string;
  [key: string]: unknown;
}

/**
 * 地理编码可选项
 */
export interface GeoOption {
  id: string;
  /** 名称（直接作为 value 使用） */
  name: string;
  /** 类型：geocode / inversecode / poi */
  type: string;
  [key: string]: unknown;
}

/**
 * 地理编码配置
 */
export interface GeoConfig {
  /** 正向地理编码 */
  geocode: string;
  /** 逆地理编码 */
  inversecode: string;
  /** POI 搜索 */
  poi: string;
  [key: string]: unknown;
}

/**
 * 行政区划项
 */
export interface DivisionItem {
  /** 区域名称 */
  name: string;
  [key: string]: unknown;
}

/** 地图分页查询参数 */
export interface MapPageQuery {
  pageNum: number;
  pageSize: number;
}

/** 底图分页查询参数 */
export interface BaseMapPageQuery {
  pageNum: number;
  pageSize: number;
}

/** 地理编码类型 */
export type GeoType = 'geocode' | 'inversecode' | 'poi';

/**
 * 分页查询地图（POST /api/map/selectPageMap）
 */
export function selectPageMap(params: MapPageQuery): HttpResult<PaginatedResult<MapItem>> {
  return http.post<PaginatedResult<MapItem>>('/api/map/selectPageMap', params);
}

/**
 * 新增地图（POST /api/map/createMap）
 */
export function createMap(data: MapItem): HttpResult<string> {
  return http.post<string>('/api/map/createMap', data);
}

/**
 * 更新地图（含激活切换）（POST /api/map/updateMap）
 */
export function updateMap(data: MapItem): HttpResult<string> {
  return http.post<string>('/api/map/updateMap', data);
}

/**
 * 删除地图（POST /api/map/deleteMap?id=xxx）
 */
export function deleteMap(id: string | number): HttpResult<string> {
  return http.post<string>(`/api/map/deleteMap?id=${id}`, {});
}

/**
 * 分页查询底图文件（POST /api/map/selectPageBaseMap）
 */
export function selectPageBaseMap(params: BaseMapPageQuery): HttpResult<PaginatedResult<BaseMapItem>> {
  return http.post<PaginatedResult<BaseMapItem>>('/api/map/selectPageBaseMap', params);
}

/**
 * 删除底图文件（POST /api/map/deleteBaseMap?id=xxx）
 */
export function deleteBaseMap(id: string | number): HttpResult<string> {
  return http.post<string>(`/api/map/deleteBaseMap?id=${id}`, {});
}

/**
 * 上传底图（POST /api/map/uploadBaseMap，FormData，timeout=300000ms）
 * 注：底图文件较大，单独设置 5 分钟超时
 */
export function uploadBaseMap(file: File): HttpResult<string> {
  const formData = new FormData();
  formData.append('file', file);
  return http.post<string>('/api/map/uploadBaseMap', formData, { timeout: 300000 } as never);
}

/**
 * 初始化底图（POST /api/map/initBaseMap）
 */
export function initBaseMap(): HttpResult<string> {
  return http.post<string>('/api/map/initBaseMap', {});
}

/**
 * 查询地理编码可选项（POST /api/map/selectListGeo）
 * @param params 包含 type 字段
 */
export function selectListGeo(params: { type: GeoType }): HttpResult<string[]> {
  return http.post<string[]>('/api/map/selectListGeo', params);
}

/**
 * 更新地理编码（POST /api/map/updateGeo）
 */
export function updateGeo(data: GeoConfig): HttpResult<string> {
  return http.post<string>('/api/map/updateGeo', data);
}

/**
 * 查询选中的地理编码（POST /api/map/selectGeo）
 */
export function selectGeo(): HttpResult<GeoConfig> {
  return http.post<GeoConfig>('/api/map/selectGeo', { id: null });
}

/**
 * 查询行政区划（POST /api/map/selectDivision）
 */
export function selectDivision(): HttpResult<DivisionItem> {
  return http.post<DivisionItem>('/api/map/selectDivision', {});
}

/**
 * 更新行政区划（POST /api/map/updateDivision）
 * 当传入 nodeId 时用于导出/下载行政区划，返回 ArrayBuffer（geojson 文件）
 * @param params 含 nodeId 字段
 */
export function updateDivision(params: { nodeId: string }): HttpResult<ArrayBuffer> {
  return http.post<ArrayBuffer>('/api/map/updateDivision', {}, {
    params,
    responseType: 'arraybuffer',
  } as never);
}
