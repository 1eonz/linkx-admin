import type { ApiResponse, HttpResult } from '#/axios';
import type { MenuItem } from '#/menu';
import http from '@/utils/http';

/** 获取菜单列表（applicationId 传空字符串表示全部） */
export function getMenuList(data: { applicationId: string }): HttpResult<MenuItem[]> {
  return http.post<MenuItem[]>('/api/menu/list', data);
}

/** 更新菜单 */
export function updateMenu(data: Partial<MenuItem>): Promise<ApiResponse> {
  return http.post('/api/menu/update', data);
}

/** 移动菜单节点 */
export function moveNode(data: { id: string; parentId: string; sort?: number }): Promise<ApiResponse> {
  return http.post('/api/menu/move', data);
}

/** 获取子菜单 */
export function getMenuChildren(data: { id: string }): Promise<ApiResponse<MenuItem[]>> {
  return http.post('/api/menu/getChildren', data);
}

/** 删除菜单 */
export function deleteMenu(id: string): Promise<ApiResponse> {
  return http.post('/api/menu/delete', null, { params: { id } });
}

/** 根据 ID 获取菜单 */
export function getMenuById(id: string): Promise<ApiResponse<MenuItem>> {
  return http.post('/api/menu/id', null, { params: { id } });
}

/** 新增菜单 */
export function createMenu(data: Partial<MenuItem>): Promise<ApiResponse<MenuItem>> {
  return http.post('/api/menu/create', data);
}
