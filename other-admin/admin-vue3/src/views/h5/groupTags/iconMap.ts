import type { LxIconName } from 'lx-ui';

const legacyIconMap: Record<string, LxIconName> = {
  'fas fa-home': 'home',
  'fas fa-user': 'user',
  'fas fa-users': 'people',
  'fas fa-cog': 'setting',
  'fas fa-tags': 'tag',
  'fas fa-tag': 'tag',
  'fas fa-bell': 'bell',
  'fas fa-calendar': 'calendar',
  'fas fa-map-marker-alt': 'map-pin',
  'fas fa-phone': 'phone',
  'fas fa-camera': 'camera',
  'fas fa-image': 'image',
  'fas fa-folder': 'folder',
  'fas fa-link': 'link',
  'fas fa-lock': 'lock',
  'fas fa-star': 'star',
  'fas fa-check': 'check',
  'fas fa-edit': 'edit',
  'fas fa-trash': 'delete',
  'fas fa-download': 'download',
  'fas fa-upload': 'upload',
};

/** 将历史 Font Awesome 类名映射为本地可渲染图标，接口仍保留旧类名。 */
export function getGroupTagIcon(icon: string): LxIconName {
  return legacyIconMap[icon] ?? 'tag';
}
