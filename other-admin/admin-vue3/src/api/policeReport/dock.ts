import type { HttpResult } from '#/axios';
import http from '@/utils/http';

/** 警单类型项 */
export interface PoliceTicketTypeItem {
  id: string;
  tag: string;
  [key: string]: unknown;
}

/**
 * 查询警单类型列表（GET /collaboration/v1/policetickettype/list）
 */
export function getPolicetickettypes(params: Record<string, unknown> = {}): HttpResult<PoliceTicketTypeItem[]> {
  return http.get<PoliceTicketTypeItem[]>('/collaboration/v1/policetickettype/list', { params });
}
