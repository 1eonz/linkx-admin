/**
 * 客户端环境信息工具模块
 * 提供浏览器、操作系统、屏幕尺寸等信息的解析与缓存
 */

// 客户端类型枚举：1=PC浏览器 2=PC WebView2 3=App H5 4=Admin后台 5=RESTful开放接口 6=JS-SDK开放接口
export const CLIENT_TYPE = {
  PC: '1',
  CS: '2',
  H5: '3',
  ADMIN: '4',
  RESTFUL: '5',
  JS_SDK: '6',
} as const;

// 模块加载时计算一次并缓存，会话内浏览器/OS/屏幕不变
const _cachedBrowserInfo = _parseBrowserInfo();
const _cachedOSInfo = _parseOSInfo();
const _cachedScreenInfo = _parseScreenInfo();

function _parseBrowserInfo(): string {
  const ua = navigator.userAgent;
  const edgeMatch = ua.match(/Edg\/(\d+)/);
  if (edgeMatch) return `Edge ${edgeMatch[1]}`;
  const chromeMatch = ua.match(/Chrome\/(\d+)/);
  if (chromeMatch) return `Chrome ${chromeMatch[1]}`;
  const criosMatch = ua.match(/CriOS\/(\d+)/);
  if (criosMatch) return `Chrome ${criosMatch[1]}`;
  const fxiosMatch = ua.match(/FxiOS\/(\d+)/);
  if (fxiosMatch) return `Firefox ${fxiosMatch[1]}`;
  const safariMatch = ua.match(/Safari\/(\d+)/);
  if (safariMatch) return `Safari ${safariMatch[1]}`;
  const firefoxMatch = ua.match(/Firefox\/(\d+)/);
  if (firefoxMatch) return `Firefox ${firefoxMatch[1]}`;
  return '';
}

function _parseOSInfo(): string {
  const ua = navigator.userAgent;
  const winMatch = ua.match(/Windows NT (\d+\.?\d*)/);
  if (winMatch) {
    const ver = winMatch[1];
    const map: Record<string, string> = { '10.0': '10', '6.3': '8.1', '6.2': '8', '6.1': '7' };
    return `Windows ${map[ver] || ver}`;
  }
  const macMatch = ua.match(/Mac OS X (\d+[._]\d+)/);
  if (macMatch) return `macOS ${macMatch[1].replace('_', '.')}`;
  const androidMatch = ua.match(/Android (\d+\.?\d*)/);
  if (androidMatch) return `Android ${androidMatch[1]}`;
  const iosMatch = ua.match(/iPhone OS (\d+_\d+)/);
  if (iosMatch) return `iOS ${iosMatch[1].replace('_', '.')}`;
  return '';
}

function _parseScreenInfo(): string {
  if (typeof window === 'undefined') return '';
  return `${window.screen.width}x${window.screen.height}`;
}

export function getBrowserInfo(): string {
  return _cachedBrowserInfo;
}

export function getOSInfo(): string {
  return _cachedOSInfo;
}

export function getScreenInfo(): string {
  return _cachedScreenInfo;
}
