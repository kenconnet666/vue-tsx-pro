// AppShell：品牌格在顶栏最前面、header 的内容在它之后；没有侧栏时品牌格不与侧栏对齐
import { describe, expect, it } from 'vitest';
import { hasStyles, mount } from '../../utils/.test/mount';
import { AppShell, appShellStyles } from '../AppShell';

describe('AppShell', () => {
  it('brand 在顶栏的内容之前；有侧栏时品牌格与侧栏同宽对齐', () => {
    const root = mount(() => (
      <AppShell brand={<span>联合降本管理</span>} header={<span>页签</span>} sidebar={<nav />}>
        正文
      </AppShell>
    ));
    const header = root.querySelector('header')!;
    const texts = [...header.children].map((child) => child.textContent).filter(Boolean);
    expect(texts).toEqual(['联合降本管理', '页签']);
    const brand = [...header.children].find((child) => child.textContent === '联合降本管理')!;
    expect(hasStyles(brand, appShellStyles.brandRail)).toBe(true);
    expect(hasStyles(header, appShellStyles.headerWithBrand)).toBe(true);
  });

  it('没有侧栏：品牌格照常排在行内', () => {
    const root = mount(() => <AppShell brand={<span>品牌</span>}>正文</AppShell>);
    const header = root.querySelector('header')!;
    const brand = [...header.children].find((child) => child.textContent === '品牌')!;
    expect(hasStyles(brand, appShellStyles.brandRail)).toBe(false);
  });
});
