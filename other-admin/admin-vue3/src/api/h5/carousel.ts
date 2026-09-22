import type { ApiResponse, HttpResult, PaginatedResult } from '#/axios';
import http from '@/utils/http';

/** 轮播图项 */
export interface CarouselItem {
  id: string;
  /** 标题 */
  title?: string;
  /** 图片 URL */
  pciUrl?: string;
  /** 公众号 ID */
  officialAccountId?: string;
  /** 公众号名称 */
  officialAccountName?: string;
  /** 文章 ID */
  articleId?: string;
  /** 跳转链接 */
  url?: string;
  /** 排序值 */
  sort?: number;
  [key: string]: unknown;
}

/** 公众号选项 */
export interface OfficialAccountOption {
  id: string;
  name?: string;
  [key: string]: unknown;
}

/** 文章项 */
export interface ArticleItem {
  id: string;
  title: string;
  /** 文章内容 URL */
  contentUrl?: string;
  [key: string]: unknown;
}

/** 列表查询参数 */
export interface CarouselListQuery {
  pageNum: number;
  pageSize: number;
  title?: string;
}

/** 分页查询轮播图列表（GET /api/content/carousel/page） */
export function getCarouselPage(params: CarouselListQuery): HttpResult<PaginatedResult<CarouselItem>> {
  return http.get<PaginatedResult<CarouselItem>>('/api/content/carousel/page', { params });
}

/** 查询轮播图详情（GET /api/content/carousel/get?id=xxx） */
export function getCarousel(id: string): HttpResult<CarouselItem> {
  return http.get<CarouselItem>('/api/content/carousel/get', { params: { id } });
}

/** 公众号下拉数据（GET /collaboration/v1/post/officialAccounts/page） */
export function officialAccountsSelect(params: { pageNum: number; pageSize: number }): HttpResult<PaginatedResult<OfficialAccountOption>> {
  return http.get<PaginatedResult<OfficialAccountOption>>('/collaboration/v1/post/officialAccounts/page', { params });
}

/** 文章列表（GET /collaboration/v1/post/articles/page） */
export function getArticleList(params: { pageNum: number; pageSize: number; officialAccountId: string; isDel?: boolean }): HttpResult<PaginatedResult<ArticleItem>> {
  return http.get<PaginatedResult<ArticleItem>>('/collaboration/v1/post/articles/page', { params });
}

/** 新增轮播图（POST /api/content/carousel/create） */
export function createCarousel(data: Partial<CarouselItem>): HttpResult<string> {
  return http.post<string>('/api/content/carousel/create', data);
}

/** 更新轮播图（PUT /api/content/carousel/update） */
export function updateCarousel(data: Partial<CarouselItem>): Promise<ApiResponse> {
  return http.put<string>('/api/content/carousel/update', data);
}

/** 删除轮播图（DELETE /api/content/carousel/delete?id=xxx） */
export function deleteCarousel(id: string): Promise<ApiResponse> {
  return http.delete<string>('/api/content/carousel/delete', { params: { id } });
}

/** 上传轮播图（POST /api/content/carousel/uploadBatch，multipart/form-data） */
export function uploadCarouselImage(file: File): HttpResult<string | string[]> {
  const formData = new FormData();
  formData.append('file', file);
  return http.post<string | string[]>('/api/content/carousel/uploadBatch', formData);
}
