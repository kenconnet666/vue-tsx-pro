/**
 * 通用模板：每种元素一套模板，按层级展开（小程序的模板不能递归调用自己），
 * 节点数据的 t 选模板（运行时见 page.ts）。层数够组件库的嵌套深度；更深的部分暂不渲染。
 */
import type { Platform } from './platforms.ts';

/** 模板展开的层数 */
export const DEPTH = 24;

/** base 模板文件（base.wxml / base.axml） */
export function baseTemplate(platform: Platform): string {
  const touch = ['tap', 'touchstart', 'touchend', 'touchcancel'] as const;
  const events = touch.map((name) => `${platform.event(name)}="eh"`).join(' ');
  const common = `class="{{i.c}}" style="{{i.st}}" data-s="{{i.s}}" ${events}`;
  const templates: string[] = [];
  for (let level = 0; level < DEPTH; level++) {
    const children =
      level + 1 < DEPTH
        ? `${loop(platform, 'i.cn')}<template is="{{'vtp_' + item.t + '_${level + 1}'}}" data="{{i: item}}"/></block>`
        : '';
    templates.push(
      `<template name="vtp_v_${level}"><view ${common}>${children}</view></template>`,
      `<template name="vtp_x_${level}">{{i.v}}</template>`,
      `<template name="vtp_n_${level}"><block></block></template>`,
      `<template name="vtp_svg_${level}"><view ${common}/></template>`,
      `<template name="vtp_image_${level}"><image src="{{i.src}}" mode="scaleToFill" ${common}/></template>`,
      `<template name="vtp_input_${level}"><input value="{{i.value}}" placeholder="{{i.placeholder}}" ${platform.event('input')}="eh" ${common}/></template>`,
    );
  }
  return templates.join('\n');
}

/** 页面模板：引入 base，从根节点的子节点开始渲染 */
export function pageTemplate(platform: Platform): string {
  return [
    `<import src="../../base.${platform.template}"/>`,
    `${loop(platform, 'root.cn')}<template is="{{'vtp_' + item.t + '_0'}}" data="{{i: item}}"/></block>`,
  ].join('\n');
}

const loop = (platform: Platform, list: string) =>
  `<block ${platform.directive}:for="{{${list}}}" ${platform.directive}:key="s">`;
