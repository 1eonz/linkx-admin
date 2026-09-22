import type { ApiResponse, HttpResult, PaginatedResult } from '#/axios';
import http from '@/utils/http';

/** 值班列表查询参数 */
export interface ScheduleListQuery {
  startDate?: string;
  endDate?: string;
  userId?: string;
  userName?: string;
  dutyType?: string | number;
  pageNum: number;
  pageSize: number;
}

/** 值班日历查询参数 */
export interface ScheduleCalendarQuery {
  startDate?: string;
  endDate?: string;
  userId?: string;
  userName?: string;
  dutyType?: string | number;
  month: string;
}

/** 值班信息项（列表/日历共用） */
export interface ScheduleItem {
  id: string;
  userId?: string;
  userName?: string;
  departmentName?: string;
  postName?: string;
  dutyType?: string;
  dutyTypeName?: string;
  dutyStartDate?: string;
  dutyStartTime?: string;
  dutyEndDate?: string;
  dutyEndTime?: string;
  dutyContent?: string;
  gmtCreated?: string;
  gmtModified?: string;
  importUserName?: string;
  [key: string]: unknown;
}

/** 导入响应数据（errorMap + successList） */
export interface ImportResultData {
  errorMap: Record<string, string[]>;
  successList: ScheduleItem[];
  [key: string]: unknown;
}

/**
 * 导入值班信息（POST /collaboration/duty/schedule/import）
 * 使用 FormData 上传文件
 */
export function uploadDutyInformationFile(formData: FormData): HttpResult<ImportResultData> {
  return http.post<ImportResultData>('/collaboration/v1/duty/schedule/import', formData);
}

/**
 * 下载值班信息导入模板（GET /collaboration/duty/schedule/template）
 * responseType=blob，返回二进制流
 * 注：返回结构为 { data: ArrayBuffer, headers: Record<string,string> }
 */
export function exportDutyInformationTemplate(): HttpResult<ArrayBuffer> {
  return http.get<ArrayBuffer>('/collaboration/v1/duty/schedule/template', {
    responseType: 'arraybuffer',
  });
}

/**
 * 获取日历模式列表（GET /collaboration/duty/schedule/calendar）
 * 返回的 data 是按日期 key 的 map（{ 'YYYY-MM-DD': ScheduleItem[] }）
 */
export function getScheduleCalendar(params: ScheduleCalendarQuery): HttpResult<Record<string, ScheduleItem[]>> {
  return http.get<Record<string, ScheduleItem[]>>('/collaboration/v1/duty/schedule/calendar', { params });
}

/**
 * 获取值班列表分页（GET /collaboration/duty/schedule/page）
 * 返回 { records, total }
 */
export function getSchedulePage(params: ScheduleListQuery): HttpResult<PaginatedResult<ScheduleItem>> {
  return http.get<PaginatedResult<ScheduleItem>>('/collaboration/v1/duty/schedule/page', { params });
}

/**
 * 批量删除排班信息（DELETE /collaboration/duty/schedule/deleteBatch）
 * DELETE + body（id 数组）
 */
export function delBatchSchedule(data: string[]): Promise<ApiResponse> {
  return http.delete('/collaboration/v1/duty/schedule/deleteBatch', { data });
}
