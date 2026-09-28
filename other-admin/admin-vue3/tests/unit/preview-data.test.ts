import { describe, expect, it } from 'vitest';

import { getPreviewData } from '../../mock/preview-data';

describe('协同岗编辑表单预览 Mock', () => {
  it('为警单类型选择器提供与预览协同岗记录一致的 id 和标签', () => {
    const result = getPreviewData(
      'GET',
      '/collaboration/v1/policetickettype/list',
      new URL('http://localhost/linkx/admin/collaboration/v1/policetickettype/list'),
      undefined,
    );

    expect(result).toEqual({
      handled: true,
      data: [
        { id: 'ticket-001', tag: '治安警情' },
        { id: 'ticket-002', tag: '巡逻动态' },
      ],
    });
  });
});
