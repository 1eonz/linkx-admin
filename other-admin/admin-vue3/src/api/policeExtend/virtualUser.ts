import type { ApiResponse, HttpResult } from '#/axios';
import http from '@/utils/http';

/** 虚拟用户项 */
export interface VirtualUserItem {
  id: string;
  /** 用户名称 */
  userName: string;
  /** 通讯号码 */
  contactNumber?: string;
  /** 应用 ID */
  appId: string;
  /** 应用密钥 */
  appSecret: string;
  /** 是否默认用户（0 否 / 1 是） */
  defaultUser: number;
  /** 备注 */
  remark?: string;
  /** 创建时间 */
  createdAt?: string;
  /** 创建人 ID（隐藏字段，提交时携带） */
  createdBy?: string;
  /** 关联智能体 ID（关联后回填，用于下拉 disabled 判断） */
  agentId?: string;
  /** 是否已被其他智能体关联（前端下拉禁用用，仅 UI 状态） */
  isBound?: boolean;
  [key: string]: unknown;
}

/** 虚拟用户表单（新增/编辑共用） */
export type VirtualUserForm = Omit<VirtualUserItem, 'id' | 'createdAt'> & { id?: string };

/**
 * 查询虚拟用户列表（GET /collaboration/v1/im/users/virtual）
 * 注意：后端返回数组结构，非分页
 */
export function getVirtualUserList(params: { userName?: string }): HttpResult<VirtualUserItem[]> {
  return http.get<VirtualUserItem[]>('/collaboration/v1/im/users/virtual', { params });
}

/**
 * 新增虚拟用户（POST /collaboration/v1/im/users/virtual）
 */
export function addVirtualUser(data: VirtualUserForm): HttpResult<string> {
  return http.post<string>('/collaboration/v1/im/users/virtual', data);
}

/**
 * 更新虚拟用户（PUT /collaboration/v1/im/users/virtual/{id}）
 */
export function updateVirtualUser(data: VirtualUserForm): Promise<ApiResponse> {
  return http.put<string>(`/collaboration/v1/im/users/virtual/${data.id}`, data);
}

/**
 * 删除虚拟用户（DELETE /collaboration/v1/im/users/virtual/{id}）
 */
export function deleteVirtualUser(id: string): Promise<ApiResponse> {
  return http.delete<string>(`/collaboration/v1/im/users/virtual/${id}`);
}
