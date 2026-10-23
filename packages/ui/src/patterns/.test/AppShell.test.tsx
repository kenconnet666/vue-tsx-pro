// AppShell：品牌格在顶栏最前面、header 的内容在它之后；没有侧栏时品牌格不与侧栏对齐；
// overlay 的抽屉：不占正文的列，品牌格里的“菜单”开关、Esc、宽度手柄；顶栏的导航、页签区、页脚、侧栏收起成图标栏
import { Plane } from '@lucide/icons';
import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { hasStyles, mount } from '../../utils/.test/mount';
import { AppShell, AppShellBrand, appShellStyles } from '../AppShell';

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

  it('overlay：侧栏不占正文的列；“菜单”固定在品牌格里，开关都是它；Esc 收起、焦点回到“菜单”', async () => {
    let open = _state(false);
    const root = mount(() => (
      <AppShell
        sidebarMode="overlay"
        sidebarOpen={_bind(open)}
        brand={<span>品牌</span>}
        header={<span>页签</span>}
        sidebar={<a href="#a">导航项</a>}
      >
        正文
      </AppShell>
    ));
    const header = root.querySelector('header')!;
    const panel = root.querySelector<HTMLElement>('[id$="-sidebar"]')!;
    expect(root.querySelector('main')!.previousElementSibling).toBeNull();
    expect(panel.inert).toBe(true);
    const toggle = [...header.querySelectorAll('button')].find((b) => b.textContent === '菜单')!;
    expect(toggle.previousElementSibling!.textContent).toBe('品牌');
    expect(toggle.getAttribute('aria-controls')).toBe(panel.id);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');

    toggle.click();
    await nextTick();
    expect(open).toBe(true);
    expect(panel.inert).toBe(false);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');

    toggle.focus();
    panel.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await nextTick();
    expect(open).toBe(false);
    expect(document.activeElement).toBe(toggle);
  });

  it('overlay：抽屉的宽度手柄用 ← / → 调整、夹在 16–480 之间，写回 sidebarWidth；双击回到初始宽度', async () => {
    let width = _state(256);
    const root = mount(() => (
      <AppShell sidebarMode="overlay" sidebarOpen sidebarWidth={_bind(width)} sidebar={<nav />}>
        正文
      </AppShell>
    ));
    const handle = root.querySelector<HTMLElement>('[role="separator"]')!;
    expect(handle.getAttribute('aria-label')).toBe('调整导航宽度');
    handle.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    await nextTick();
    expect(width).toBe(272);
    width = 470;
    await nextTick();
    handle.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    await nextTick();
    expect(width).toBe(480);
    handle.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    await nextTick();
    expect(width).toBe(256);
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
        联合降本管理
      </AppShellBrand>
    )).querySelector('a')!;
    expect(link.getAttribute('href')).toBe('/');
    expect(link.textContent).toBe('联合降本管理');
    expect(link.querySelector('svg')!.getAttribute('aria-hidden')).toBe('true');
  });
});

describe('AppShell 的导航、页签区、页脚与收起', () => {
  it('nav 在品牌之后、工具之前；tabs 在正文上面、footer 在正文下面', () => {
    const root = mount(() => (
      <AppShell
        brand={<span>品牌</span>}
        nav={<span>顶部导航</span>}
        header={<span>工具</span>}
        tabs={<span>页签</span>}
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
    expect(main.previousElementSibling!.textContent).toBe('页签');
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
            联合降本管理
          </AppShellBrand>
        }
        sidebar={<nav aria-label="导航" />}
        sidebarCollapsible
        sidebarCollapsed={_bind(collapsed)}
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
    expect(name.textContent).toBe('联合降本管理');
    expect(name.className).not.toBe('');
    window.matchMedia = matchMedia;
  });
});
