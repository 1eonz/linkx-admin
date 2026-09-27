import { mount } from '@vue/test-utils';
import {
  getLxIconPaths,
  LxIcon,
  LX_ICON_ALIASES,
  LX_ICON_29_NAMES,
  LX_ICON_NAMES,
  LX_ICON_MOTION_NAMES,
  LX_ICON_P0_NAMES,
  LX_ICON_P1_NAMES,
  LX_ICONS,
  resolveLxIconName,
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

  it('renders aliases and leaves unknown names empty', () => {
    const alias = mount(LxIcon, { props: { name: 'eye-on' } });
    expect(alias.attributes('data-icon-name')).toBe('eye-on');
    expect(alias.attributes('data-lx-motion')).toBe('eye');
    expect(alias.findAll('path').map((path) => path.attributes('d'))).toEqual(getLxIconPaths('eye'));

    const dateAlias = mount(LxIcon, { props: { name: 'date' } });
    expect(dateAlias.attributes('data-lx-motion')).toBe('calendar');

    const unknown = mount(LxIcon, { props: { name: 'unknown-icon' } });
    expect(unknown.findAll('path')).toHaveLength(0);

    alias.unmount();
    dateAlias.unmount();
    unknown.unmount();
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
});
