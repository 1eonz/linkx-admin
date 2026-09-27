/**
 * LxUI 内置图标集 — 24x24 / stroke 1.5 / round cap（自绘几何简化版）
 * 规范：图标尺寸收敛 16/18/20px 三档（DESIGN-SPEC §6）
 */
export const LX_ICONS = {
  // —— 侧边栏菜单 ——
  dashboard: ['M4 4h7v7H4z', 'M13 4h7v4h-7z', 'M13 11h7v9h-7z', 'M4 14h7v6H4z'],
  team: [
    'M9 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7z',
    'M3 20c0-3 2.7-5.5 6-5.5s6 2.5 6 5.5',
    'M16 4.5a3.5 3.5 0 010 6.8',
    'M17.5 14.8c2 .8 3.5 2.7 3.5 5.2',
  ],
  bell: [
    'M18 9a6 6 0 10-12 0c0 5-2 6-2 6h16s-2-1-2-6',
    'M10.3 20a2 2 0 003.4 0',
  ],
  calendar: [
    'M7 3v3',
    'M17 3v3',
    'M4 8.5h16',
    'M5 5h14a1 1 0 011 1v13a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1z',
  ],
  setting: [
    'M4 7h16',
    'M4 12h16',
    'M4 17h16',
    'M10.5 7a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0',
    'M16.5 12a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0',
    'M8.5 17a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0',
  ],
  shield: ['M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z', 'M9 12l2 2 4-4'],
  cube: [
    'M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z',
    'M12 12l8-4.5',
    'M12 12v9',
    'M12 12L4 7.5',
  ],
  server: ['M4 5h16v5H4z', 'M4 14h16v5H4z', 'M7.5 7.5h.01', 'M7.5 16.5h.01'],
  key: [
    'M14 3a6 6 0 00-5.6 8.3L3 16.7V21h4.3l1.2-1.2v-2.1h2.1l1.4-1.4A6 6 0 1014 3z',
    'M16.5 7.5h.01',
  ],
  'map-pin': [
    'M10.5 17a6.5 6.5 0 100-13 6.5 6.5 0 000 13z',
    'M15.5 15.5L21 21',
  ],
  camera: [
    'M5 5h9a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z',
    'M16 10.5l5-3v9l-5-3',
  ],
  alert: ['M12 4L2.5 20h19L12 4z', 'M12 10v4', 'M12 17.5h.01'],
  // —— 交互 ——
  'chevron-down': ['M6 9l6 6 6-6'],
  'chevron-right': ['M9 6l6 6-6 6'],
  'chevron-left': ['M15 6l-6 6 6 6'],
  'chevrons-left': ['M11 17l-5-5 5-5', 'M18 17l-5-5 5-5'],
  check: ['M5 13l4 4L19 7'],
  search: ['M16 16l4.5 4.5', 'M10.5 17a6.5 6.5 0 100-13 6.5 6.5 0 000 13z'],
  x: ['M6 6l12 12', 'M18 6L6 18'],
  menu: ['M4 6h16', 'M4 12h16', 'M4 18h16'],
  user: ['M12 12a4 4 0 100-8 4 4 0 000 8z', 'M4 20c0-3.5 3.6-6 8-6s8 2.5 8 6'],
  pulse: ['M3 12h4l3-8 4 16 3-8h4'],
  // —— 反馈提示 ——
  'circle-check': ['M12 21a9 9 0 100-18 9 9 0 000 18z', 'M8 12l3 3 5-5.5'],
  'circle-x': ['M12 21a9 9 0 100-18 9 9 0 000 18z', 'M9 9l6 6', 'M15 9l-6 6'],
  'circle-alert': [
    'M12 21a9 9 0 100-18 9 9 0 000 18z',
    'M12 8v5',
    'M12 16.5h.01',
  ],
  report: ['M12 3l9.5 16.5h-19L12 3z', 'M7.5 14.5L9 10l2 3 2-4 2 5.5'],

  // —— P0 高频核心 ——
  delete: ['M5 7h14', 'M9 7V4h6v3', 'M7 7l1 13h8l1-13', 'M10 11v5', 'M14 11v5'],
  edit: [
    'M4 16.5V20h3.5L19 8.5 15.5 5 4 16.5z',
    'M13.5 7l3.5 3.5',
    'M19.5 3.5a1.5 1.5 0 010 2.1l-1 1-3.5-3.5 1-1a1.5 1.5 0 012.1 0z',
  ],
  plus: ['M12 5v14', 'M5 12h14'],
  minus: ['M5 12h14'],
  refresh: [
    'M20 11a8 8 0 00-14.9-3.8L3 10',
    'M3 5v5h5',
    'M4 13a8 8 0 0014.9 3.8L21 14',
    'M21 19v-5h-5',
  ],
  undo: ['M9 7H4v5', 'M4 12a8 8 0 111.9 5.2'],
  download: ['M12 3v12', 'M7 11l5 5 5-5', 'M4 20h16'],
  upload: ['M12 15V3', 'M7 7l5-5 5 5', 'M4 20h16'],
  eye: [
    'M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z',
    'M12 15.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7z',
  ],
  loading: ['M20 12a8 8 0 10-2.3 5.7', 'M20 5v7h-7'],
  more: ['M5 12h.01', 'M12 12h.01', 'M19 12h.01'],
  folder: [
    'M3 6a2 2 0 012-2h5l2 2h7a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V6z',
  ],
  'folder-open': [
    'M3 7a2 2 0 012-2h5l2 2h7a2 2 0 012 2v2H7a2 2 0 00-1.8 1.1L3 18V7z',
    'M3 18l2.2-5.1A2 2 0 017 11h14l-2.3 7.1A2 2 0 0116.8 20H5a2 2 0 01-2-2z',
  ],
  warning: ['M12 3L2.5 20h19L12 3z', 'M12 9v5', 'M12 17.5h.01'],

  // —— P1 业务语义 ——
  people: [
    'M8.5 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7z',
    'M2.5 20c0-3 2.7-5.5 6-5.5s6 2.5 6 5.5',
    'M16 4.5a3.5 3.5 0 010 6.8',
    'M17 14.8c2 .7 3.5 2.6 3.5 5.2',
  ],
  file: ['M6 3h8l4 4v14H6z', 'M14 3v5h5', 'M9 13h6', 'M9 17h6'],
  'file-check': ['M6 3h8l4 4v14H6z', 'M14 3v5h5', 'M9 15l2 2 4-4'],
  star: [
    'M12 3l2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3z',
  ],
  tag: ['M4 5v6l9 9 7-7-9-9H4z', 'M8 8h.01'],
  image: ['M4 5h16v14H4z', 'M7 15l3-3 2 2 2-3 3 4', 'M8 9h.01'],
  video: ['M4 6h11v12H4z', 'M15 10l5-3v10l-5-3'],
  mobile: [
    'M7 3h10a1 1 0 011 1v16a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1z',
    'M10 18h4',
  ],
  link: [
    'M10 13.5l4-4',
    'M7.5 17.5l-1 1a3.5 3.5 0 01-5-5l3-3a3.5 3.5 0 015 0',
    'M16.5 6.5l1-1a3.5 3.5 0 015 5l-3 3a3.5 3.5 0 01-5 0',
  ],
  share: [
    'M18 8a3 3 0 100-6 3 3 0 000 6z',
    'M6 15a3 3 0 100-6 3 3 0 000 6z',
    'M18 22a3 3 0 100-6 3 3 0 000 6z',
    'M8.6 10.5l6.8-3.2',
    'M8.6 13.5l6.8 3.2',
  ],
  'arrow-up': ['M12 19V5', 'M6 11l6-6 6 6'],
  'arrow-down': ['M12 5v14', 'M6 13l6 6 6-6'],
  'arrow-left': ['M19 12H5', 'M11 6l-6 6 6 6'],
  'arrow-right': ['M5 12h14', 'M13 6l6 6-6 6'],
  'caret-down': ['M6 9l6 6 6-6z'],
  close: ['M12 3a9 9 0 100 18 9 9 0 000-18z', 'M9 9l6 6', 'M15 9l-6 6'],
  switch: ['M8 7h8', 'M8 7l-3 3 3 3', 'M16 17H8', 'M16 17l3-3-3-3'],
  power: ['M12 3v9', 'M7.1 6.1a7 7 0 109.8 0'],
  clock: ['M12 21a9 9 0 100-18 9 9 0 000 18z', 'M12 7v5l3 2'],
  grid: ['M4 4h6v6H4z', 'M14 4h6v6h-6z', 'M4 14h6v6H4z', 'M14 14h6v6h-6z'],
  list: [
    'M8 6h12',
    'M8 12h12',
    'M8 18h12',
    'M4 6h.01',
    'M4 12h.01',
    'M4 18h.01',
  ],
  copy: [
    'M8 8h11v12H8z',
    'M5 16H4a1 1 0 01-1-1V4a1 1 0 011-1h11a1 1 0 011 1v1',
  ],
  phone: ['M6 3l3 2-2 4a13 13 0 008 8l4-2 2 3-2 3c-7 0-16-9-16-16l3-2z'],
  email: ['M3 5h18v14H3z', 'M3 6l9 7 9-7'],
  lock: ['M6 10h12v10H6z', 'M8 10V7a4 4 0 018 0v3', 'M12 14v2'],
  unlock: ['M6 10h12v10H6z', 'M9 10V7a4 4 0 017.5-1.5', 'M12 14v2'],

  // —— P2 通用补充 ——
  'eye-off': [
    'M3 3l18 18',
    'M10.6 10.6a2 2 0 002.8 2.8',
    'M9.9 5.2A10.8 10.8 0 0112 5c6 0 9.5 7 9.5 7a17.2 17.2 0 01-3.1 3.8',
    'M6.2 6.2C3.8 8 2.5 12 2.5 12s3.5 7 9.5 7c1 0 1.9-.2 2.7-.5',
  ],
  filter: ['M4 5h16l-6.5 7v5l-3 2v-7L4 5z'],
  sort: ['M8 5h12', 'M8 12h8', 'M8 19h4', 'M4 5h.01', 'M4 12h.01', 'M4 19h.01'],
  fullscreen: ['M8 3H3v5', 'M16 3h5v5', 'M21 16v5h-5', 'M3 16v5h5'],
  'fullscreen-exit': ['M9 3v6H3', 'M15 3v6h6', 'M9 21v-6H3', 'M15 21v-6h6'],
  printer: [
    'M6 9V3h12v6',
    'M6 17H4a2 2 0 01-2-2v-4a2 2 0 012-2h16a2 2 0 012 2v4a2 2 0 01-2 2h-2',
    'M6 14h12v7H6z',
  ],
  info: ['M12 21a9 9 0 100-18 9 9 0 000 18z', 'M12 10v6', 'M12 7h.01'],
  'circle-question': [
    'M12 21a9 9 0 100-18 9 9 0 000 18z',
    'M9.8 9a2.3 2.3 0 114.1 1.4c-.9.9-1.9 1.3-1.9 2.6',
    'M12 16.5h.01',
  ],
  history: ['M4 12a8 8 0 108-8 8.5 8.5 0 00-6 2.5', 'M4 4v5h5', 'M12 7v5l3 2'],
  message: ['M4 5h16v11H8l-4 4V5z', 'M8 9h8', 'M8 12h5'],
  password: [
    'M5 7h14v12H5z',
    'M8 7V5a4 4 0 018 0v2',
    'M9 13h.01',
    'M12 13h.01',
    'M15 13h.01',
  ],
  'id-card': [
    'M3 5h18v14H3z',
    'M7 10a2 2 0 100-4 2 2 0 000 4z',
    'M5 16c.5-2 3.5-2 4 0',
    'M12 9h6',
    'M12 13h6',
  ],
  logout: ['M10 5H5v14h5', 'M14 8l4 4-4 4', 'M18 12H8'],
  home: ['M3 11l9-8 9 8', 'M5 10v10h14V10', 'M9 20v-6h6v6'],
  language: [
    'M4 5h8',
    'M8 3v2',
    'M5 9c1.5 2 3.5 3.5 6 4.5',
    'M5 14l3-5 3 5',
    'M14 5h6',
    'M17 5c0 5-2 9-5 12',
    'M14 12h5',
  ],
  screenshot: [
    'M4 8V4h4',
    'M16 4h4v4',
    'M20 16v4h-4',
    'M8 20H4v-4',
    'M8 8h8v8H8z',
  ],
  wifi: [
    'M3 8a14 14 0 0118 0',
    'M6 12a9 9 0 0112 0',
    'M9 16a4 4 0 016 0',
    'M12 20h.01',
  ],
  cloud: ['M7 18h10a4 4 0 000-8 6 6 0 00-11.7 1.5A3.5 3.5 0 007 18z'],
  database: [
    'M4 5c0-1.1 3.6-2 8-2s8 .9 8 2-3.6 2-8 2-8-.9-8-2z',
    'M4 5v7c0 1.1 3.6 2 8 2s8-.9 8-2V5',
    'M4 12v7c0 1.1 3.6 2 8 2s8-.9 8-2v-7',
  ],
  terminal: ['M4 5h16v14H4z', 'M7 9l3 3-3 3', 'M12 15h4'],
  cpu: [
    'M9 9h6v6H9z',
    'M9 3v3',
    'M15 3v3',
    'M9 18v3',
    'M15 18v3',
    'M3 9h3',
    'M3 15h3',
    'M18 9h3',
    'M18 15h3',
  ],
  pin: ['M8 3h8l-1 6 3 3v2h-5v7l-1 1-1-1v-7H6v-2l3-3-1-6z'],
  'zoom-in': [
    'M11 19a8 8 0 100-16 8 8 0 000 16z',
    'M21 21l-4.5-4.5',
    'M11 8v6',
    'M8 11h6',
  ],
  'zoom-out': [
    'M11 19a8 8 0 100-16 8 8 0 000 16z',
    'M21 21l-4.5-4.5',
    'M8 11h6',
  ],
  drag: [
    'M8 5h.01',
    'M8 12h.01',
    'M8 19h.01',
    'M16 5h.01',
    'M16 12h.01',
    'M16 19h.01',
  ],
  save: ['M5 3h12l2 2v16H5z', 'M8 3v6h8V3', 'M8 14h8v7H8z'],
  export: ['M12 3v12', 'M7 10l5 5 5-5', 'M4 20h16', 'M16 4h4v4'],
  'location-arrow': ['M21 3L10 14', 'M21 3l-4 18-7-7-7-3L21 3z'],
} as const satisfies Record<string, readonly string[]>

export type LxIconSourceName = keyof typeof LX_ICONS

/** 设计清单中的旧名称映射到现有图形，避免同义图标重复维护 SVG。 */
export const LX_ICON_ALIASES = {
  date: 'calendar',
  'eye-on': 'eye',
} as const satisfies Record<string, LxIconSourceName>

export type LxIconAliasName = keyof typeof LX_ICON_ALIASES
export type LxIconName = LxIconSourceName | LxIconAliasName

export const LX_ICON_P0_NAMES = [
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
] as const satisfies readonly LxIconName[]

export const LX_ICON_P1_NAMES = [
  'people',
  'file',
  'file-check',
  'star',
  'tag',
  'image',
  'video',
  'mobile',
  'link',
  'share',
  'arrow-up',
  'arrow-down',
  'arrow-left',
  'arrow-right',
  'caret-down',
  'close',
  'switch',
  'power',
  'clock',
  'grid',
  'list',
  'copy',
  'phone',
  'email',
  'lock',
  'unlock',
  'date',
] as const satisfies readonly LxIconName[]

export const LX_ICON_29_NAMES = [
  'minus',
  'eye-on',
  'eye-off',
  'filter',
  'sort',
  'fullscreen',
  'fullscreen-exit',
  'printer',
  'info',
  'circle-question',
  'history',
  'message',
  'password',
  'id-card',
  'logout',
  'home',
  'language',
  'screenshot',
  'wifi',
  'cloud',
  'database',
  'terminal',
  'cpu',
  'pin',
  'zoom-in',
  'zoom-out',
  'drag',
  'save',
  'export',
] as const satisfies readonly LxIconName[]

export const LX_ICON_MOTION_NAMES: readonly LxIconName[] = [
  ...new Set<LxIconName>([
    ...LX_ICON_P0_NAMES,
    ...LX_ICON_P1_NAMES,
    ...LX_ICON_29_NAMES,
  ]),
]

export const LX_ICON_NAMES: LxIconName[] = [
  ...(Object.keys(LX_ICONS) as LxIconSourceName[]),
  ...(Object.keys(LX_ICON_ALIASES) as LxIconAliasName[]),
]

const isSourceName = (name: string): name is LxIconSourceName =>
  Object.prototype.hasOwnProperty.call(LX_ICONS, name)

const isAliasName = (name: string): name is LxIconAliasName =>
  Object.prototype.hasOwnProperty.call(LX_ICON_ALIASES, name)

export const resolveLxIconName = (
  name: string,
): LxIconSourceName | undefined => {
  if (isSourceName(name)) return name
  if (isAliasName(name)) return LX_ICON_ALIASES[name]
  return undefined
}

export const getLxIconPaths = (name: string): readonly string[] | undefined => {
  const sourceName = resolveLxIconName(name)
  return sourceName ? LX_ICONS[sourceName] : undefined
}
