// @vitest-environment node
// 服务端渲染时 <html>、<body> 的属性：主题的类与变量、data-theme、语言与方向，首屏就是这套主题
import { renderStyleTag } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { describe, expect, it } from 'vitest';
import { createUi } from '../createUi';
import { enUS } from '../lang/en-US';
import { darkTheme } from '../theme/dark';
import { lightTheme } from '../theme/light';

describe('createUi().documentAttrs', () => {
  it('给出主题的类、变量、data-theme 与语言；跟随系统的主题在服务端按亮色给', () => {
    const { html, body } = createUi({
      theme: { light: lightTheme, dark: darkTheme },
      lang: enUS,
      paintDocument: true,
    }).documentAttrs();
    expect(html['data-theme']).toBe(lightTheme.name);
    expect(html.lang).toBe(enUS.code);
    expect(html.dir).toBe('ltr');
    expect(html.class).toBeTruthy();
    // 变量在主题的类里，行内只有 color-scheme
    expect(html.style).toMatch(/color-scheme:light/);
    expect(body.class).toBeTruthy();
    // 这些类的规则能经 renderStyleTag 输出（把整页 HTML 交给它）
    const page = `<html class="${html.class}"><body class="${body.class}"></body></html>`;
    for (const name of html.class!.split(' ')) expect(renderStyleTag(page)).toContain(`.${name}`);
  });

  it('什么都没传时不改页面根元素', () => {
    expect(createUi().documentAttrs()).toEqual({ html: {}, body: {} });
  });
});
