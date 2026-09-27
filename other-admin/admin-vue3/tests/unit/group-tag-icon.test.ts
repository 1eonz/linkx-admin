import { describe, expect, it } from 'vitest';

import { getGroupTagIcon } from '@/views/h5/groupTags/iconMap';

describe('GroupTags legacy icon mapping', () => {
  it.each([
    ['fas fa-home', 'home'],
    ['fas fa-user', 'user'],
    ['fas fa-users', 'people'],
    ['fas fa-cog', 'setting'],
    ['fas fa-tags', 'tag'],
    ['fas fa-tag', 'tag'],
    ['fas fa-bell', 'bell'],
    ['fas fa-calendar', 'calendar'],
    ['fas fa-map-marker-alt', 'map-pin'],
    ['fas fa-phone', 'phone'],
    ['fas fa-camera', 'camera'],
    ['fas fa-image', 'image'],
    ['fas fa-folder', 'folder'],
    ['fas fa-link', 'link'],
    ['fas fa-lock', 'lock'],
    ['fas fa-star', 'star'],
    ['fas fa-check', 'check'],
    ['fas fa-edit', 'edit'],
    ['fas fa-trash', 'delete'],
    ['fas fa-download', 'download'],
    ['fas fa-upload', 'upload'],
  ])('maps %s to the lx-ui icon %s', (legacyName, lxIconName) => {
    expect(getGroupTagIcon(legacyName)).toBe(lxIconName);
  });

  it('uses the tag icon for values outside the known legacy set', () => {
    expect(getGroupTagIcon('unknown legacy icon')).toBe('tag');
  });
});
