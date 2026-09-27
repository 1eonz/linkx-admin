import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createGroupTag,
  deleteGroupTag,
  deleteGroupTags,
  getGroupTag,
  getGroupTagPage,
  updateGroupTag,
} from '@/api/h5/groupTags';

const { httpDelete, httpGet, httpPost, httpPut } = vi.hoisted(() => ({
  httpDelete: vi.fn(),
  httpGet: vi.fn(),
  httpPost: vi.fn(),
  httpPut: vi.fn(),
}));

vi.mock('@/utils/http', () => ({
  default: {
    delete: httpDelete,
    get: httpGet,
    post: httpPost,
    put: httpPut,
  },
}));

describe('group tag API contracts', () => {
  beforeEach(() => vi.clearAllMocks());

  it('preserves the Vue2 page, detail and save endpoints', () => {
    httpGet.mockReturnValue(Promise.resolve({ code: 0 }));
    httpPost.mockReturnValue(Promise.resolve({ code: 0 }));
    httpPut.mockReturnValue(Promise.resolve({ code: 0 }));

    getGroupTagPage({ pageNum: 2, pageSize: 10, name: '值班' });
    getGroupTag('tag/1');
    createGroupTag({ name: '标签', icon: 'fas fa-tag', color: '#409eff' });
    updateGroupTag({ id: 'tag/1', name: '新标签', icon: 'fas fa-tag', color: '#409eff' });

    expect(httpGet).toHaveBeenNthCalledWith(1, '/collaboration/v1/tags/page', {
      params: { pageNum: 2, pageSize: 10, name: '值班' },
    });
    expect(httpGet).toHaveBeenNthCalledWith(2, '/collaboration/v1/tags/tag%2F1');
    expect(httpPost).toHaveBeenCalledWith('/collaboration/v1/tags', {
      name: '标签',
      icon: 'fas fa-tag',
      color: '#409eff',
    });
    expect(httpPut).toHaveBeenCalledWith('/collaboration/v1/tags/tag%2F1', {
      id: 'tag/1',
      name: '新标签',
      icon: 'fas fa-tag',
      color: '#409eff',
    });
  });

  it('preserves single and batch delete semantics', () => {
    httpDelete.mockResolvedValue({ code: 0 });

    deleteGroupTag('tag/1');
    deleteGroupTags(['tag/1', 'tag/2']);

    expect(httpDelete).toHaveBeenNthCalledWith(1, '/collaboration/v1/tags/tag%2F1');
    expect(httpDelete).toHaveBeenNthCalledWith(2, '/collaboration/v1/tags/delete/list', {
      data: ['tag/1', 'tag/2'],
    });
  });
});
