/**
 * 通用模板：每种元素一套模板，按层级展开（小程序的模板不能递归调用自己），
 * 节点数据的 t 选模板（运行时见 page.ts）。层数用完后，更深的子节点交给递归的自定义组件 vtp-comp：
 * 它的模板从第 0 层重新开始，所以嵌套多深都能画（同 Taro 的 comp）。
 */
import { TEMPLATE_DEPTH as DEPTH } from '../elements.ts';
import type { NativeEventName, Platform } from './platforms.ts';

/** base 模板文件（base.wxml / base.axml） */
export function baseTemplate(platform: Platform): string {
  const on = (names: readonly NativeEventName[]) =>
    names.map((name) => `${platform.event(name)}="eh"`).join(' ');
  // 所有节点都收点击与按压（:active）；touchmove 只有 lock（catch，挡住滚动）、touch（bind，手势；横滑时换成 catch）两种收，
  // 普通节点滚动时不往逻辑层发事件
  const tapEvents = on(['tap', 'longpress', 'touchstart', 'touchend', 'touchcancel']);
  const common = `id="{{i.id}}" class="{{i.c}}" style="{{sd[i.st]}}" data-s="{{i.s}}" ${platform.a11y}`;
  // 输入框与多行输入共有的：长度上限、禁用（含只读）、聚焦、键盘确认键的文字；输入、确认、聚焦、失焦
  const field = `maxlength="{{i.maxlength || -1}}" disabled="{{i.dis}}" focus="{{i.af}}" confirm-type="{{i.ct || 'done'}}"`;
  const inputEvents = on(['input', 'confirm', 'focus', 'blur']);
  const templates: string[] = [];
  for (let level = 0; level < DEPTH; level++) {
    const children =
      level + 1 < DEPTH
        ? `${loop(platform, 'i.cn')}<template is="{{'vtp_' + item.t + '_${level + 1}'}}" data="{{i: item, sd: sd}}"/></block>`
        : `${loop(platform, 'i.cn')}<vtp-comp i="{{item}}" sd="{{sd}}"/></block>`;
    const view = (type: string, events: string) =>
      `<template name="vtp_${type}_${level}"><view ${common} ${events}>${children}</view></template>`;
    templates.push(
      view('v', tapEvents),
      view('lock', `${tapEvents} ${on(['touchmove'])}`),
      view('touch', `${tapEvents} ${platform.touchMove}`),
      `<template name="vtp_btn_${level}"><button ${platform.openButton} ${common} ${tapEvents}>${children}</button></template>`,
      `<template name="vtp_x_${level}">{{i.v}}</template>`,
      `<template name="vtp_n_${level}"><block></block></template>`,
      `<template name="vtp_svg_${level}"><view ${common} ${tapEvents}/></template>`,
      `<template name="vtp_image_${level}"><image src="{{i.src}}" mode="{{i.mode || 'scaleToFill'}}" lazy-load="{{i.lz}}" ${common} ${tapEvents} ${on(['load', 'error'])}/></template>`,
      `<template name="vtp_input_${level}"><input value="{{i.value}}" placeholder="{{i.placeholder}}" type="{{i.type || 'text'}}" password="{{i.pw}}" ${field} ${common} ${tapEvents} ${inputEvents}/></template>`,
      `<template name="vtp_textarea_${level}"><textarea value="{{i.value}}" placeholder="{{i.placeholder}}" auto-height="{{i.ah}}" ${field} ${common} ${tapEvents} ${inputEvents}/></template>`,
    );
  }
  return templates.join('\n');
}

/** 递归组件 vtp-comp 的模板：引入 base，从第 0 层画传进来的节点 */
export function componentTemplate(platform: Platform): string {
  return [
    `<import src="../../base.${platform.template}"/>`,
    // 属性还没传进来的第一帧 i 是空对象，不画
    `<block ${platform.directive}:if="{{i.t}}"><template is="{{'vtp_' + i.t + '_0'}}" data="{{i: i, sd: sd}}"/></block>`,
  ].join('\n');
}

/** 页面模板：引入 base，从根节点的子节点开始渲染 */
export function pageTemplate(platform: Platform): string {
  return [
    `<import src="../../base.${platform.template}"/>`,
    // 样式字典在页面数据里叫 ss，传给模板时换个名字：写成 ss: ss 时微信的模板里取不到
    `${loop(platform, 'root.cn')}<template is="{{'vtp_' + item.t + '_0'}}" data="{{i: item, sd: ss}}"/></block>`,
  ].join('\n');
}

const loop = (platform: Platform, list: string) =>
  `<block ${platform.directive}:for="{{${list}}}" ${platform.directive}:key="s">`;
