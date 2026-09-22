/**
 * 设计令牌入口：CSS 变量 + 主题切换 + 共享类型（融合自 lx-tokens 包）
 */
import './variables.css';

export * from './types';

export type LxTheme = 'light' | 'hud';

const HUD_CLASS = 'lx-theme-hud';

/** 切换主题（挂载到 <html>，运行时生效） */
export function setTheme(theme: LxTheme): void {
  document.documentElement.classList.toggle(HUD_CLASS, theme === 'hud');
}

/** 读取当前主题 */
export function getTheme(): LxTheme {
  return document.documentElement.classList.contains(HUD_CLASS) ? 'hud' : 'light';
}
