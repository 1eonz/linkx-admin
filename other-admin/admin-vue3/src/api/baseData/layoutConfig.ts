/**
 * 布局配置（layoutConfig）模块 API
 *
 * 包含两部分：
 * 1. 系统配置（getSystemConfig / setSystemConfig）—— 直接从 @/api/h5/archivedTable 复用，避免重复定义
 * 2. App 板块 CRUD 接口（/api/layout/app/sections）
 * 3. 运维统计导出（/dashboard/v1/statistic/login/export）
 */
import type { ApiResponse, HttpResult } from '#/axios';
import type { SystemConfigItem } from '@/api/h5/archivedTable';
import http from '@/utils/http';

// 复用已有系统配置 API 与类型，避免重复定义
export { getSystemConfig, setSystemConfig } from '@/api/h5/archivedTable';
export type { SystemConfigItem };

/** 板块类型：1=轮播图 / 2=常用应用 / 3=协同群组 / 4=三方网页 / 5=分割条 / 6=消息列表 */
export type LayoutSectionType = 1 | 2 | 3 | 4 | 5 | 6;

/** 协同群组按钮配置项 */
export interface GroupButtonConfig {
  /** 按钮类型：1=自定义建群 / 2=一键建群 / 3=职能建群 / 4=一键调度 */
  type: 1 | 2 | 3 | 4;
  /** 按钮名称 */
  name: string;
  /** 是否启用：'true' 启用 / 'false' 禁用 */
  enable: 'true' | 'false';
}

/** App H5 板块项 */
export interface LayoutSection {
  /** 板块 ID（新增时由后端生成） */
  id?: string;
  /** 板块名称 */
  name: string;
  /** 板块类型 */
  type: LayoutSectionType;
  /** 跳转 URL（type=4 三方网页使用） */
  url?: string;
  /** 自定义配置（JSON 字符串，按 type 不同结构不同） */
  custom?: string;
  /** 是否显示：0=隐藏 / 1=显示 */
  show: 0 | 1;
  /** 排序值 */
  sort: number;
  /** 创建时间 */
  gmtCreated?: string;
  [key: string]: unknown;
}

/** PC 端页签项 */
export interface PcNavTab {
  /** 页签名称 */
  name: string;
  /** 跳转 URL */
  url: string;
  /** 排序值 */
  order: number;
  /** 打开方式：0=iframe 嵌入 / 1=弹窗 */
  openWay: 0 | 1;
  [key: string]: unknown;
}

/** 板块列表查询参数 */
export interface SectionListQuery {
  /** 是否显示过滤：0/1，可选 */
  show?: 0 | 1;
}

/**
 * 板块列表（GET /api/layout/app/sections）
 * @param params 查询参数（含 show 字段）
 */
export function getSectionList(params: SectionListQuery): HttpResult<LayoutSection[]> {
  return http.get<LayoutSection[]>('/api/layout/app/sections', { params });
}

/**
 * 板块详情（GET /api/layout/app/sections/{sectionId}）
 */
export function getSectionDetail(sectionId: string | number): HttpResult<LayoutSection> {
  return http.get<LayoutSection>(`/api/layout/app/sections/${sectionId}`);
}

/**
 * 新增板块（POST /api/layout/app/sections）
 */
export function createSection(data: LayoutSection): HttpResult<string> {
  return http.post<string>('/api/layout/app/sections', data);
}

/**
 * 更新板块（PUT /api/layout/app/sections/{sectionId}）
 */
export function updateSection(
  sectionId: string | number,
  data: LayoutSection,
): Promise<ApiResponse<string>> {
  return http.put<string>(`/api/layout/app/sections/${sectionId}`, data);
}

/**
 * 删除板块（DELETE /api/layout/app/sections/{sectionId}）
 */
export function deleteSection(sectionId: string | number): Promise<ApiResponse<string>> {
  return http.delete<string>(`/api/layout/app/sections/${sectionId}`);
}

/**
 * 导出登录统计数据（GET /dashboard/v1/statistic/login/export）
 * 返回 ArrayBuffer，配合 responseType: 'arraybuffer' 使用以生成 Excel 文件
 */
export function exportLoginStatistic(params: {
  startTime: string;
  endTime: string;
}): HttpResult<ArrayBuffer> {
  return http.get<ArrayBuffer>('/dashboard/v1/statistic/login/export', {
    params,
    responseType: 'arraybuffer',
  } as never);
}
