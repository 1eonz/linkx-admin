import type { LxSidebarMode, LxStatus } from '../../tokens';

/** 侧边栏菜单项（业务方从权限菜单接口映射后传入） */
export interface LxMenuItem {
  /** 唯一标识（约定为路由 name） */
  key: string;
  /** 显示标题 */
  title: string;
  /** 图标名（LxIcon 内置集） */
  icon?: string;
  /** 路由地址（直达项使用；分组项忽略） */
  path?: string;
  /** 二级菜单；为空即直达项 */
  children?: LxMenuItem[];
  /** 角标：数字显示计数；rail 态退化为圆点 */
  badge?: number | string;
  /** 角标语义色 */
  badgeType?: LxStatus;
  /** 置灰不可点 */
  disabled?: boolean;
  /** 业务透传（如权限标识），组件不消费 */
  meta?: Record<string, unknown>;
}

/** LxSidebar Props（文档：doc/lx-ui/demo/LXSIDEBAR.md） */
export interface LxSidebarProps {
  /** 形态：expanded=252px 完整导航 / rail=64px 图标轨道。支持 v-model:mode */
  mode?: LxSidebarMode;
  /** 菜单树 */
  items?: LxMenuItem[];
  /** 激活项 key（受控，建议绑定 route.name） */
  activeKey?: string;
  /** 品牌标题（rail 态自动隐藏） */
  title?: string;
  /** 品牌副标题 */
  subtitle?: string;
  /** 移动端抽屉模式（overlay + 遮罩 + Esc 关闭） */
  mobile?: boolean;
  /** 是否渲染底部状态区（SLA 仪表 + 节点徽章 + 切换按钮） */
  showFooter?: boolean;
  /** SLA 仪表数值（0-100） */
  slaValue?: number;
  /** 底部节点徽章文案 */
  nodeLabel?: string;
  /** 节点状态 */
  nodeStatus?: LxStatus;
}

/** rail 态 tooltip 浮层数据（容器统一管理，Teleport 到 body） */
export interface LxRailTip {
  visible: boolean;
  x: number;
  y: number;
  content: string;
  subItems?: LxMenuItem[];
  activeKey?: string;
}
