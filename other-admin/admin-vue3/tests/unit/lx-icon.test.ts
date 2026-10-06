import { mount } from '@vue/test-utils';
import {
  getLxIconPaths,
  LxIcon,
  LxSidebar,
  LX_ICON_ALIASES,
  LX_ICON_29_NAMES,
  LX_ICON_NAMES,
  LX_ICON_MOTION_NAMES,
  LX_ICON_P0_NAMES,
  LX_ICON_P1_NAMES,
  LX_ICONS,
  resolveLxIconName,
  type LxIconName,
  type LxMenuItem,
} from 'lx-ui';
import { describe, expect, it } from 'vitest';

describe('LxIcon reference names', () => {
  it('covers the 94 standard shapes and two compatibility aliases', () => {
    expect(Object.keys(LX_ICONS)).toHaveLength(94);
    expect(Object.keys(LX_ICON_ALIASES)).toEqual(['date', 'eye-on']);
    expect(LX_ICON_NAMES).toHaveLength(96);
    expect(LX_ICON_NAMES.every((name) => getLxIconPaths(name)?.length)).toBe(true);
  });

  it.each([
    ['date', 'calendar'],
    ['eye-on', 'eye'],
  ])('resolves %s to the existing %s drawing', (alias, canonical) => {
    expect(resolveLxIconName(alias)).toBe(canonical);
    expect(getLxIconPaths(alias)).toEqual(getLxIconPaths(canonical));
  });

  it('renders aliases and exposes an accessible fallback for unknown runtime names', () => {
    const alias = mount(LxIcon, { props: { name: 'eye-on' } });
    expect(alias.attributes('data-icon-name')).toBe('eye-on');
    expect(alias.attributes('data-lx-motion')).toBe('eye');
    expect(alias.findAll('path').map((path) => path.attributes('d'))).toEqual(getLxIconPaths('eye'));

    const dateAlias = mount(LxIcon, { props: { name: 'date' } });
    expect(dateAlias.attributes('data-lx-motion')).toBe('calendar');

    // 通过类型边界模拟外部数据进入组件后的运行时脏值。
    const unknownName = 'unknown-icon' as unknown as LxIconName;
    const unknown = mount(LxIcon, { props: { name: unknownName } });
    expect(unknown.attributes('data-icon-invalid')).toBe('true');
    expect(unknown.attributes('aria-label')).toBe('未知图标：unknown-icon');
    expect(unknown.attributes('role')).toBe('img');
    expect(unknown.find('title').text()).toBe('未知图标：unknown-icon');
    expect(unknown.findAll('path').map((path) => path.attributes('d'))).toEqual(getLxIconPaths('circle-question'));

    const malformedName = JSON.parse('{"toString":1}') as unknown as LxIconName;
    const malformed = mount(LxIcon, { props: { name: malformedName } });
    expect(malformed.attributes('data-icon-invalid')).toBe('true');
    expect(malformed.attributes('data-icon-name')).toBe('');
    expect(malformed.attributes('aria-label')).toBe('未知图标');
    expect(malformed.findAll('path').map((path) => path.attributes('d'))).toEqual(getLxIconPaths('circle-question'));

    alias.unmount();
    dateAlias.unmount();
    unknown.unmount();
    malformed.unmount();
  });

  it('uses known fallback icons for unknown permission-menu icon names', () => {
    // 模拟权限接口返回的 JSON 菜单中出现非字符串图标值。
    const items = JSON.parse(
      '[{"key":"malformed-item","title":"畸形菜单","icon":{"toString":1}},{"key":"malformed-group","title":"畸形分组","icon":{"toString":1},"children":[{"key":"child","title":"子菜单"}]}]',
    ) as unknown as LxMenuItem[];
    const sidebar = mount(LxSidebar, {
      props: {
        showFooter: false,
        items,
      },
    });

    expect(sidebar.findAll('.lx-sidebar-item .lx-icon')[0].attributes('data-icon-name')).toBe('dashboard');
    expect(sidebar.findAll('.lx-sidebar-group__head .lx-icon')[0].attributes('data-icon-name')).toBe('cube');

    sidebar.unmount();
  });

  it('marks each P0 icon for its reference motion', () => {
    expect(LX_ICON_P0_NAMES).toEqual([
      'delete',
      'edit',
      'plus',
      'refresh',
      'undo',
      'download',
      'upload',
      'eye',
      'loading',
      'more',
      'folder',
      'folder-open',
      'warning',
    ]);

    expect(LX_ICON_MOTION_NAMES).toHaveLength(69);
    expect(LX_ICON_P1_NAMES).toHaveLength(27);
    expect(LX_ICON_29_NAMES).toHaveLength(29);
    expect(LX_ICON_MOTION_NAMES).toEqual(
      expect.arrayContaining([...LX_ICON_P0_NAMES, ...LX_ICON_P1_NAMES, ...LX_ICON_29_NAMES]),
    );

    for (const name of LX_ICON_MOTION_NAMES) {
      const icon = mount(LxIcon, { props: { name } });
      expect(icon.attributes('data-lx-motion')).toBe(resolveLxIconName(name));
      icon.unmount();
    }
  });

  it('keeps the explicit spin state on motion-enabled icons', () => {
    const spinning = mount(LxIcon, { props: { name: 'plus', spin: true } });

    expect(spinning.classes()).toContain('is-spinning');

    spinning.unmount();
  });
});
