// @vitest-environment node
// 服务端渲染时 <html>、<body> 的属性：主题的类与变量、data-theme、语言与方向，首屏就是这套主题
import { css, renderStyleTag } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { Window } from 'happy-dom';
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

  it('data-theme-classes 记下写在 <html> 上的主题类', () => {
    const { html } = createUi({ theme: lightTheme }).documentAttrs();
    expect(html['data-theme-classes']).toBe(html.class);
  });
});

describe('createUi().themeClassBoot', () => {
  const ui = createUi({ theme: lightTheme, paintDocument: true });

  /** 按首屏的样子摆好 <html>，执行防闪烁脚本（themeBootScript 已写好 data-theme），返回根元素 */
  function boot(chosen: string) {
    const { html } = ui.documentAttrs();
    const root = new Window().document.documentElement;
    root.className = html.class!;
    root.dataset.themeClasses = html['data-theme-classes']!;
    root.dataset.theme = chosen;
    // oxlint-disable-next-line no-implied-eval -- 要验证的就是生成的脚本文本
    new Function('document', ui.themeClassBoot({ light: lightTheme, dark: darkTheme }).script)({
      documentElement: root,
    });
    return root;
  }
  const darkClasses = () => css.attrs(...darkTheme.styles).class!.split(' ');
  const lightClasses = () => css.attrs(...lightTheme.styles).class!.split(' ');

  it('换成用户的主题，不留下服务端主题独有的类，并更新 data-theme-classes', () => {
    const root = boot('dark');
    for (const name of darkClasses()) expect(root.classList.contains(name)).toBe(true);
    const only = lightClasses().filter((name) => !darkClasses().includes(name));
    expect(only.length).toBeGreaterThan(0);
    for (const name of only) expect(root.classList.contains(name)).toBe(false);
    expect(root.dataset.themeClasses).toBe(root.className);
  });

  it('data-theme 不在候选表里时不动', () => {
    const root = boot('custom');
    expect(root.className).toBe(ui.documentAttrs().html.class);
  });

  it('候选主题的规则能经 include 进首屏样式', () => {
    const { classes } = ui.themeClassBoot({ light: lightTheme, dark: darkTheme });
    const tag = renderStyleTag('<html></html>', { include: classes });
    for (const name of darkClasses()) expect(tag).toContain(`.${name}`);
  });

  it('主题名不能截断内联脚本', () => {
    const { script } = ui.themeClassBoot({ '</script><b>': lightTheme });
    expect(script).not.toContain('</script>');
  });
});
