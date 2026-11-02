// AppShell：品牌格在顶栏最前面、header 的内容在它之后；没有侧栏时品牌格不与侧栏对齐；
// 顶栏的导航、页脚、侧栏收起成图标栏；全屏：不显示顶栏和左侧栏，右上角退出，Esc 也退出
import { Plane } from '@lucide/icons';
import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { hasStyles, mount } from '../../utils/.test/mount';
import { AppShell, AppShellBrand, appShellStyles } from '../AppShell';

describe('AppShell', () => {
  it('brand 在顶栏的内容之前；有侧栏时品牌格与侧栏同宽对齐', () => {
    const root = mount(() => (
      <AppShell brand={<span>采购管理平台</span>} header={<span>页签</span>} sidebar={<nav />}>
        正文
      </AppShell>
    ));
    const header = root.querySelector('header')!;
    const texts = [...header.children].map((child) => child.textContent).filter(Boolean);
    expect(texts).toEqual(['采购管理平台', '页签']);
    const brand = [...header.children].find((child) => child.textContent === '采购管理平台')!;
    expect(hasStyles(brand, appShellStyles.brandRail)).toBe(true);
    expect(hasStyles(header, appShellStyles.headerWithBrand)).toBe(true);
  });

  it('没有侧栏：品牌格照常排在行内', () => {
    const root = mount(() => <AppShell brand={<span>品牌</span>}>正文</AppShell>);
    const header = root.querySelector('header')!;
    const brand = [...header.children].find((child) => child.textContent === '品牌')!;
    expect(hasStyles(brand, appShellStyles.brandRail)).toBe(false);
  });

  it('顶栏结束边有全屏按钮：进入后隐藏顶栏和左侧栏，写回 _fullscreen；退出按钮、Esc 都能退出', async () => {
    let fullscreen = _state(false);
    const root = mount(() => (
      <AppShell
        _fullscreen={fullscreen}
        brand={<span>品牌</span>}
        header={<span>工具</span>}
        sidebar={<nav aria-label="导航" />}
        propsSidebar={{ class: 'sidebar' }}
      >
        正文
      </AppShell>
    ));
    const header = root.querySelector('header')!;
    const sidebar = root.querySelector('.sidebar')!;
    const enter = header.querySelector<HTMLButtonElement>('button[aria-label="全屏"]')!;
    expect(enter.parentElement!.lastElementChild).toBe(enter);
    expect(hasStyles(header, appShellStyles.hidden)).toBe(false);

    enter.click();
    await nextTick();
    expect(fullscreen).toBe(true);
    expect(hasStyles(header, appShellStyles.hidden)).toBe(true);
    expect(hasStyles(sidebar, appShellStyles.hidden)).toBe(true);
    const exit = root.querySelector<HTMLButtonElement>('button[aria-label="退出全屏"]')!;
    exit.click();
    await nextTick();
    expect(fullscreen).toBe(false);
    expect(hasStyles(header, appShellStyles.hidden)).toBe(false);
    expect(root.querySelector('button[aria-label="退出全屏"]')).toBeNull();

    enter.click();
    await nextTick();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await nextTick();
    expect(fullscreen).toBe(false);
  });

  it('fullscreenable 关掉：没有全屏按钮', () => {
    const root = mount(() => <AppShell fullscreenable={false}>正文</AppShell>);
    expect(root.querySelector('button[aria-label="全屏"]')).toBeNull();
  });
});

it('部件属性：header 内容格、主体、侧栏与右栏的滚动区域', () => {
  const root = mount(() => (
    <AppShell
      header={<span>页签</span>}
      sidebar={<nav />}
      aside={<span>目录</span>}
      propsHeaderContent={{ class: 'header-content' }}
      propsBody={{ class: 'body' }}
      propsSidebarScroll={{ class: 'sidebar-scroll' }}
      propsAsideScroll={{ class: 'aside-scroll' }}
    >
      正文
    </AppShell>
  ));
  expect(root.querySelector('.header-content')!.textContent).toBe('页签');
  expect(root.querySelector('.body main')).not.toBeNull();
  expect(root.querySelector('.sidebar-scroll nav')).not.toBeNull();
  expect(root.querySelector('.aside-scroll')!.textContent).toContain('目录');
});

describe('AppShellBrand', () => {
  it('链到首页：图标是装饰，名字是链接的名称', () => {
    const link = mount(() => (
      <AppShellBrand href="/" icon={Plane}>
        采购管理平台
      </AppShellBrand>
    )).querySelector('a')!;
    expect(link.getAttribute('href')).toBe('/');
    expect(link.textContent).toBe('采购管理平台');
    expect(link.querySelector('svg')!.getAttribute('aria-hidden')).toBe('true');
  });
});

describe('AppShell 的导航、页脚与收起', () => {
  it('nav 在品牌之后、工具之前；footer 在正文下面', () => {
    const root = mount(() => (
      <AppShell
        brand={<span>品牌</span>}
        nav={<span>顶部导航</span>}
        header={<span>工具</span>}
        footer={<span>版权</span>}
      >
        正文
      </AppShell>
    ));
    const header = root.querySelector('header')!;
    expect([...header.children].map((child) => child.textContent).filter(Boolean)).toEqual([
      '品牌',
      '顶部导航',
      '工具',
    ]);
    const main = root.querySelector('main')!;
    expect(main.nextElementSibling!.tagName).toBe('FOOTER');
    expect(main.nextElementSibling!.textContent).toBe('版权');
  });

  it('sidebarCollapsible：宽屏时“收起侧栏”把侧栏收成图标栏，品牌只剩标志，写回 sidebarCollapsed', async () => {
    const matchMedia = window.matchMedia;
    // 宽屏
    window.matchMedia = ((query: string) => ({
      matches: true,
      media: query,
      addEventListener() {},
      removeEventListener() {},
    })) as unknown as typeof window.matchMedia;
    let collapsed = _state(false);
    const root = mount(() => (
      <AppShell
        brand={
          <AppShellBrand href="/" icon={Plane}>
            采购管理平台
          </AppShellBrand>
        }
        sidebar={<nav aria-label="导航" />}
        sidebarCollapsible
        _sidebarCollapsed={collapsed}
      >
        正文
      </AppShell>
    ));
    await nextTick();
    const toggle = root.querySelector<HTMLButtonElement>('button[aria-label="收起侧栏"]')!;
    toggle.click();
    await nextTick();
    expect(collapsed).toBe(true);
    expect(root.querySelector('button[aria-label="展开侧栏"]')).not.toBeNull();
    const name = root.querySelector('header a span')!;
    expect(name.textContent).toBe('采购管理平台');
    expect(name.className).not.toBe('');
    window.matchMedia = matchMedia;
  });
});
