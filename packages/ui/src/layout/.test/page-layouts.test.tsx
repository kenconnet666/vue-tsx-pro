// 页面布局：AsideLayout 的两栏与侧栏名称、ViewportFill 的竖排（高度在浏览器里量）
import { describe, expect, it } from 'vitest';
import { mount, styleTextOf } from '../../utils/.test/mount';
import { AsideLayout } from '../AsideLayout';
import { ViewportFill } from '../ViewportFill';

describe('AsideLayout', () => {
  it('主栏是子元素、侧栏是 aside（带名称）；按容器宽度排', () => {
    const root = mount(() => (
      <AsideLayout aside={<p>收益</p>} asideLabel="收益与关闭">
        <p>概览</p>
      </AsideLayout>
    ));
    const aside = root.querySelector('aside')!;
    expect(aside.getAttribute('aria-label')).toBe('收益与关闭');
    expect(aside.textContent).toBe('收益');
    expect(aside.previousElementSibling!.textContent).toBe('概览');
    expect(styleTextOf(aside.parentElement!)).toContain('26rem');
  });
});

describe('ViewportFill', () => {
  it('里面竖排，高度写在行内的 CSS 变量里（视口高度减去顶边）', () => {
    const root = mount(() => (
      <ViewportFill gap="md">
        <p>查询栏</p>
        <p>表格</p>
      </ViewportFill>
    ));
    const element = root.firstElementChild as HTMLElement;
    expect(element.children).toHaveLength(2);
    expect(styleTextOf(element)).toContain('100dvh');
  });
});
