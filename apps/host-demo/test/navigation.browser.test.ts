// 导航组件在真实浏览器里：键盘焦点移动、切换、步骤（演示页 /base；无障碍由 base 的 axe 检查覆盖）
import { userEvent } from 'vitest/browser';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { nextTick, type App } from 'vue';
import { createMemoryHistory } from 'vue-router';
import { createHostApp } from '../src/app';

let app: App;
let root: HTMLElement;

beforeEach(async () => {
  const host = createHostApp(createMemoryHistory());
  await host.router.push('/base');
  await host.router.isReady();
  root = document.createElement('div');
  document.body.append(root);
  app = host.app;
  app.mount(root);
});
afterEach(() => {
  app.unmount();
  root.remove();
});

const $ = <T extends HTMLElement = HTMLElement>(selector: string) =>
  root.querySelector<T>(selector)!;
const all = <T extends HTMLElement = HTMLElement>(selector: string) => [
  ...root.querySelectorAll<T>(selector),
];

describe('Tabs', () => {
  const tabs = () => all('.tabs-demo [role="tab"]');
  const visiblePanel = () => all('.tabs-demo [role="tabpanel"]').find((panel) => !panel.hidden)!;

  it('Tab 进入当前标签，方向键切换（跳过不可用），面板跟着变；Tab 再按一次进入面板', async () => {
    tabs()[0]!.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(tabs()[1]);
    expect(visiblePanel().textContent).toBe('已付款的订单');
    await userEvent.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(tabs()[3]);
    await userEvent.keyboard('{Tab}');
    expect(document.activeElement).toBe(visiblePanel());
  });

  it('下划线样式：指示条滑到当前标签下方，与它等宽', async () => {
    const indicator = $('.tabs-demo [role="tablist"] > [aria-hidden="true"]');
    const aligned = () => {
      const bar = indicator.getBoundingClientRect();
      const tab = tabs()[1]!.getBoundingClientRect();
      return Math.abs(bar.left - tab.left) < 1 && Math.abs(bar.width - tab.width) < 1;
    };
    expect(aligned()).toBe(false);
    tabs()[1]!.click();
    await nextTick();
    await expect.poll(aligned).toBe(true);
    expect(getComputedStyle(indicator).backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
  });

  it('manual：方向键只移动焦点，Enter 才切换', async () => {
    const soft = all('.tabs-soft-demo [role="tab"]');
    soft[0]!.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(soft[1]);
    expect(soft[1]!.getAttribute('aria-selected')).toBe('false');
    await userEvent.keyboard('{Enter}');
    expect(soft[1]!.getAttribute('aria-selected')).toBe('true');
  });
});

describe('Toolbar', () => {
  it('整组一个 Tab 位置，方向键在按钮之间移动并循环', async () => {
    const buttons = all('.toolbar-demo button');
    buttons[0]!.focus();
    await userEvent.keyboard('{ArrowLeft}');
    expect(document.activeElement).toBe(buttons.at(-1));
    expect(buttons.filter((button) => button.tabIndex === 0)).toEqual([buttons.at(-1)]);
  });
});

describe('Steps', () => {
  it('下一步推进当前步骤；点击已完成的步骤回去', async () => {
    const current = () => $('.steps-demo [aria-current="step"]').textContent;
    expect(current()).toContain('确认订单');
    $('.steps-next').click();
    await nextTick();
    expect(current()).toContain('支付');
    $('.steps-demo li button').click();
    await nextTick();
    expect(current()).toContain('填写信息');
  });
});

describe('Breadcrumbs · Pagination · NavList', () => {
  it('面包屑折叠后点开菜单列出被折叠的各级，焦点进入菜单；当前页仍是最后一项', async () => {
    const crumbs = $('.breadcrumbs-demo');
    const menu = crumbs.querySelector<HTMLElement>('[role="menu"]')!;
    expect(menu.matches(':popover-open')).toBe(false);
    crumbs.querySelector('button')!.click();
    await expect.poll(() => menu.matches(':popover-open')).toBe(true);
    const link = [...menu.querySelectorAll('a')].find((a) => a.textContent === '组件');
    expect(link).toBeDefined();
    await expect.poll(() => menu.contains(document.activeElement)).toBe(true);
    expect(crumbs.querySelector('[aria-current="page"]')!.textContent).toBe('面包屑');
  });

  it('分页：下一页、点页码，当前页跟着变', async () => {
    const current = () => $('.pagination-demo [aria-current="page"]').textContent;
    expect(current()).toBe('3');
    all('.pagination-demo button')
      .find((b) => b.getAttribute('aria-label') === '下一页')!
      .click();
    await nextTick();
    expect(current()).toBe('4');
    all('.pagination-demo button')
      .find((b) => b.textContent === '16')!
      .click();
    await nextTick();
    expect(current()).toBe('16');
  });

  it('侧边导航：路由适配判断当前页（/base），分组点开后显示子项', async () => {
    const nav = $('.navlist-demo');
    expect(nav.querySelector('[aria-current="page"]')!.textContent).toBe('基础组件');
    const trigger = nav.querySelector<HTMLButtonElement>('button[aria-expanded]')!;
    trigger.click();
    await nextTick();
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    const child = nav.querySelector<HTMLAnchorElement>('a[href="/profile/42"]')!;
    await expect.poll(() => child.getBoundingClientRect().height).toBeGreaterThan(0);
  });
});
