import type { ApiResponse, HttpResult, PaginatedResult } from '#/axios';
import http from '@/utils/http';

/** 已归档群组项 */
export interface ArchivedGroupItem {
  groupId: string;
  /** 群组名称 */
  groupName?: string;
  /** 标签 */
  tagName?: string;
  /** 关联内容 */
  taskName?: string;
  /** 所属部门 */
  departmentName?: string;
  /** 归档人 */
  archiveUserName?: string;
  /** 归档位置 */
  archivedFile?: string;
  /** 归档时间 */
  archivedTime?: string;
  [key: string]: unknown;
}

/** 列表查询参数 */
export interface ArchivedGroupListQuery {
  startTime?: string;
  endTime?: string;
  pageNum: number;
  pageSize: number;
  keywords?: string;
}

/** 系统配置项 */
export interface SystemConfigItem {
  id: string;
  key: string;
  value: string;
  [key: string]: unknown;
}

/** 分页查询已归档群组（GET /collaboration/groups/archive/list） */
export function getArchivePage(params: ArchivedGroupListQuery): HttpResult<PaginatedResult<ArchivedGroupItem>> {
  return http.get<PaginatedResult<ArchivedGroupItem>>('/collaboration/v1/groups/archive/list', { params });
}

/** 下载进度回调参数类型 */
export interface DownloadProgressEvent {
  loaded: number;
  total?: number;
}

/** 下载请求配置 */
export interface DownloadConfig {
  /** 下载进度回调 */
  onDownloadProgress?: (progressEvent: DownloadProgressEvent) => void;
  /** AbortSignal，用于取消下载（传给 http.post 的 abort 字段） */
  abort?: AbortSignal;
}

/**
 * 下载归档文件（POST /collaboration/groups/archive/download）
 *
 * 注意：后端期望请求体直接是 JSON 字符串（如 `"[123,456]"`），而非 `{ groupIds: "..." }` 包装。
 * 本函数接收字符串数组，内部 JSON.stringify 后作为 body 发送。
 *
 * 返回 ArrayBuffer，配合 responseType: 'arraybuffer' 使用。
 */
export function getArchiveDownload(
  groupIds: string[],
  config?: DownloadConfig,
): HttpResult<ArrayBuffer> {
  return http.post<ArrayBuffer>('/collaboration/v1/groups/archive/download', JSON.stringify(groupIds), {
    responseType: 'arraybuffer',
    headers: { 'Content-Type': 'application/json' } as never,
    onDownloadProgress: config?.onDownloadProgress,
    abort: config?.abort,
  } as never);
}

/**
 * 删除已归档群组（POST /collaboration/groups/archive/delete）
 *
 * 注意：后端期望请求体直接是 JSON 字符串（如 `"[123,456]"`）。
 * 本函数接收字符串数组，内部 JSON.stringify 后作为 body 发送。
 */
export function deleteArchive(groupIds: string[]): HttpResult<string> {
  return http.post<string>('/collaboration/v1/groups/archive/delete', JSON.stringify(groupIds), {
    headers: { 'Content-Type': 'application/json' } as never,
  } as never);
}

/** 同步/查询差异群组（POST /collaboration/im/pull/history/group） */
export function pullHistoryGroup(params: { sync: 0 | 1 }): HttpResult<string> {
  return http.post<string>('/collaboration/v1/im/pull/history/group', {}, { params });
}

/** 获取系统配置（GET /api/system/config） */
export function getSystemConfig(): HttpResult<SystemConfigItem[]> {
  return http.get<SystemConfigItem[]>('/api/system/config');
}

/** 更新系统配置（PUT /api/system/config） */
export function setSystemConfig(data: Partial<SystemConfigItem>): Promise<ApiResponse> {
  return http.put<string>('/api/system/config', data);
}
