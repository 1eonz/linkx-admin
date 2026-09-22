/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BASE_API: string;
  readonly VITE_PUBLIC_PATH: string;
  readonly VITE_PROXY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue';

  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>;
  export default component;
}

// less :export 导出的 JS 对象类型声明
// 与 src/styles/variables.less 末尾 :export 块一一对应
// 注意：less 文件不提供 default export，业务代码使用 `import * as variables from '...'`
declare module '*.less' {
  export const menuText: string;
  export const menuActiveText: string;
  export const menuBg: string;
  export const menuHover: string;
  export const subMenuBg: string;
  export const sideBarWidth: string;
  // 新增导出：供 template 内联属性使用
  export const colorPrimary: string;
  export const colorTextPrimary: string;
  export const colorTextRegular: string;
  export const colorTextSecondary: string;
  export const colorBorder: string;
  export const colorBgCard: string;
  export const colorBgHover: string;
  export const colorSuccess: string;
  export const colorWarning: string;
  export const colorDanger: string;
  export const colorInfo: string;
}
