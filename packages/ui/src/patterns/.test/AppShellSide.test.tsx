// AppShell 的抽屉方向（sidebarSide）与布局偏好（layout）、LayoutSwitcher
import { beforeAll, describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { createLayoutPreference } from '../../config/layout/preference';
import { hasStyles, mount } from '../../utils/.test/mount';
import { AppShell, appShellStyles } from '../AppShell';
import { LayoutSwitcher } from '../LayoutSwitcher';

beforeAll(() => {
  const proto = HTMLElement.prototype as unknown as Record<string, unknown>;
  proto.showPopover ??= () => {};
  proto.hidePopover ??= () => {};
});

const panelOf = (root: HTMLElement) => root.querySelector<HTMLElement>('[id$="-sidebar"]')!;
const key = (target: Element, name: string) =>
  target.dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true }));

describe('AppShell sidebarSide', () => {
  it('start 是默认：品牌格按抽屉的宽度，“菜单”在品牌格里', () => {
    const root = mount(() => (
      <AppShell sidebarMode="overlay" brand={<span>品牌</span>} sidebar={<nav />}>
        正文
      </AppShell>
    ));
    expect(hasStyles(panelOf(root), appShellStyles.overlayStart)).toBe(true);
    const brand = [...root.querySelector('header')!.children].find((c) =>
      c.textContent?.includes('品牌'),
    )!;
    expect(hasStyles(brand, appShellStyles.brandOverlay)).toBe(true);
    expect(brand.querySelector('button')!.textContent).toBe('菜单');
  });

  it('end：抽屉在结束边，“菜单”移到顶栏的结束边，手柄在抽屉的起始边', async () => {
    let width = _state(256);
    const root = mount(() => (
      <AppShell
        sidebarMode="overlay"
        sidebarSide="end"
        _sidebarWidth={width}
        brand={<span>品牌</span>}
        header={<span>页签</span>}
        sidebar={<nav />}
      >
        正文
      </AppShell>
    ));
    const header = root.querySelector('header')!;
    expect(hasStyles(panelOf(root), appShellStyles.overlayEnd)).toBe(true);
    const children = [...header.children];
    const toggle = header.querySelector('button')!;
    expect(children.indexOf(toggle)).toBe(children.length - 1);
    // 品牌格不再按抽屉的宽度
    const brand = children.find((c) => c.textContent?.includes('品牌'))!;
    expect(hasStyles(brand, appShellStyles.brandOverlay)).toBe(false);
    // 起始边的手柄往起始方向拖是变宽，键盘 → 是变窄
    const handle = root.querySelector<HTMLElement>('[role="separator"]')!;
    expect(handle.getAttribute('aria-orientation')).toBe('vertical');
    key(handle, 'ArrowRight');
    await nextTick();
    expect(width).toBe(240);
  });

  it('top / bottom：盖满宽度，调的是高度（↑ / ↓，夹在 96–640），小节排成多列', async () => {
    let height = _state(320);
    const root = mount(() => (
      <AppShell sidebarMode="overlay" sidebarSide="top" _sidebarHeight={height} sidebar={<nav />}>
        正文
      </AppShell>
    ));
    const panel = panelOf(root);
    expect(hasStyles(panel, appShellStyles.overlayTop)).toBe(true);
    const handle = root.querySelector<HTMLElement>('[role="separator"]')!;
    expect(handle.getAttribute('aria-orientation')).toBe('horizontal');
    expect(handle.getAttribute('aria-label')).toBe('调整导航高度');
    expect(handle.getAttribute('aria-valuenow')).toBe('320');
    key(handle, 'ArrowDown');
    await nextTick();
    expect(height).toBe(336);
    height = 100;
    await nextTick();
    key(handle, 'ArrowUp');
    await nextTick();
    expect(height).toBe(96);
    handle.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    await nextTick();
    expect(height).toBe(320);
  });

  it('bottom：抽屉在底部，手柄在上边（往上是变高）', async () => {
    let height = _state(320);
    const root = mount(() => (
      <AppShell
        sidebarMode="overlay"
        sidebarSide="bottom"
        _sidebarHeight={height}
        sidebar={<nav />}
      >
        正文
      </AppShell>
    ));
    expect(hasStyles(panelOf(root), appShellStyles.overlayBottom)).toBe(true);
    const handle = root.querySelector<HTMLElement>('[role="separator"]')!;
    key(handle, 'ArrowUp');
    await nextTick();
    expect(height).toBe(336);
  });

  it('上下抽屉里点了链接总是收起；左右抽屉在宽屏时不收', async () => {
    let open = _state(true);
    const top = mount(() => (
      <AppShell
        sidebarMode="overlay"
        sidebarSide="top"
        _sidebarOpen={open}
        sidebar={<a href="#a">去 A</a>}
      >
        正文
      </AppShell>
    ));
    panelOf(top).querySelector('a')!.click();
    await nextTick();
    expect(open).toBe(false);
  });

  it('“菜单”的图标随方向变，Esc 收起、焦点回到“菜单”', async () => {
    let open = _state(true);
    const root = mount(() => (
      <AppShell
        sidebarMode="overlay"
        sidebarSide="bottom"
        _sidebarOpen={open}
        sidebar={<a href="#a">去 A</a>}
      >
        正文
      </AppShell>
    ));
    const toggle = [...root.querySelectorAll('button')].find((b) => b.textContent === '菜单')!;
    const icon = () => toggle.querySelector('svg')!.innerHTML;
    // 底部的面板：横线在下面（M3 15h18），收起的图标有向下的箭头
    const openIcon = icon();
    expect(openIcon).toContain('M3 15h18');
    toggle.focus();
    key(panelOf(root), 'Escape');
    await nextTick();
    expect(open).toBe(false);
    expect(document.activeElement).toBe(toggle);
    expect(icon()).toContain('M3 15h18');
    expect(icon()).not.toBe(openIcon);
  });
});

describe('AppShell layout', () => {
  it('形式、方向、开关与宽度都从 layout 读、写回 layout', async () => {
    const layout = createLayoutPreference({
      storageKey: false,
      defaults: { mode: 'overlay', side: 'end', open: false },
    });
    const root = mount(() => (
      <AppShell layout={layout} brand={<span>品牌</span>} sidebar={<nav />}>
        正文
      </AppShell>
    ));
    const panel = panelOf(root);
    expect(hasStyles(panel, appShellStyles.overlayEnd)).toBe(true);
    expect(panel.inert).toBe(true);

    const toggle = [...root.querySelectorAll('button')].find((b) => b.textContent === '菜单')!;
    toggle.click();
    await nextTick();
    expect(layout.open).toBe(true);
    expect(panel.inert).toBe(false);
    toggle.click();
    await nextTick();
    expect(layout.open).toBe(false);

    layout.side = 'top';
    await nextTick();
    expect(hasStyles(panel, appShellStyles.overlayTop)).toBe(true);

    layout.side = 'start';
    layout.open = true;
    await nextTick();
    const handle = root.querySelector<HTMLElement>('[role="separator"]')!;
    key(handle, 'ArrowRight');
    await nextTick();
    expect(layout.width).toBe(272);
  });

  it('layout 的 mode 是 docked：侧栏占一列，没有抽屉', async () => {
    const layout = createLayoutPreference({ storageKey: false, defaults: { mode: 'docked' } });
    const root = mount(() => (
      <AppShell layout={layout} sidebar={<nav aria-label="站点" />}>
        正文
      </AppShell>
    ));
    expect(root.querySelector('[id$="-sidebar"]')).toBeNull();
    layout.mode = 'overlay';
    await nextTick();
    expect(root.querySelector('[id$="-sidebar"]')).not.toBeNull();
  });
});

describe('LayoutSwitcher', () => {
  it('弹出两组单选：选了方向就写回 layout；固定时方向不可选', async () => {
    const layout = createLayoutPreference({ storageKey: false, defaults: { mode: 'overlay' } });
    mount(() => <LayoutSwitcher layout={layout} lazy={false} />);
    const trigger = document.querySelector<HTMLElement>('button[aria-label="布局"]')!;
    expect(trigger).not.toBeNull();
    trigger.click();
    await nextTick();
    await nextTick();
    const items = [...document.querySelectorAll<HTMLElement>('[role="menuitemradio"]')];
    expect(items.map((item) => item.textContent)).toEqual([
      '固定',
      '抽屉',
      '左侧',
      '右侧',
      '顶部',
      '底部',
    ]);
    items.find((item) => item.textContent === '底部')!.click();
    await nextTick();
    expect(layout.side).toBe('bottom');
    expect(layout.mode).toBe('overlay');

    layout.mode = 'docked';
    await nextTick();
    trigger.click();
    await nextTick();
    await nextTick();
    const sides = [...document.querySelectorAll<HTMLElement>('[role="menuitemradio"]')].slice(2);
    expect(sides.every((item) => (item as HTMLButtonElement).disabled)).toBe(true);
  });
});
