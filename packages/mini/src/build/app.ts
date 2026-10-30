/**
 * app.json 里按平台不同的字段：窗口的标题字段名、微信独有的深浅色、位置权限的用途说明与地理位置接口的声明
 */
import type { MiniBuildOptions } from './index.ts';
import type { Platform } from './platforms.ts';

/** 精确位置的接口：与模糊位置 getFuzzyLocation 不能同时声明（微信编译时报错） */
const PRECISE_LOCATION = [
  'getLocation',
  'onLocationChange',
  'startLocationUpdate',
  'startLocationUpdateBackground',
];

/** 微信 app.json 独有的字段：深浅色、位置权限的用途说明、地理位置接口的声明 */
export function wechatAppFields(options: MiniBuildOptions): Record<string, unknown> {
  const fields: Record<string, unknown> = {};
  if (options.darkmode) fields.darkmode = true;
  const { location, fuzzyLocation } = options.permissions ?? {};
  if (location || fuzzyLocation)
    fields.permission = {
      ...(location ? { 'scope.userLocation': { desc: location } } : {}),
      ...(fuzzyLocation ? { 'scope.userFuzzyLocation': { desc: fuzzyLocation } } : {}),
    };
  const infos = options.requiredPrivateInfos;
  if (infos?.length) {
    const precise = infos.filter((name) => PRECISE_LOCATION.includes(name));
    if (precise.length && infos.includes('getFuzzyLocation'))
      throw new Error(
        `requiredPrivateInfos 里 getFuzzyLocation 与精确位置的接口（${precise.join('、')}）互斥，只能留一类`,
      );
    fields.requiredPrivateInfos = infos;
  }
  return fields;
}

/** app.json 的 window 按微信的字段写；支付宝的标题字段叫 defaultTitle，补上 */
export function windowConfig(platform: Platform, window: Record<string, unknown> = {}) {
  if (platform.name !== 'my' || window.navigationBarTitleText === undefined) return window;
  return { ...window, defaultTitle: window.navigationBarTitleText };
}
