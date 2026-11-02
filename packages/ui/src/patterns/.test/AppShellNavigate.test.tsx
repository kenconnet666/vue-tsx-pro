// 窄屏的抽屉里点了导航项：抽屉自己关上（docked 的窄屏抽屉，不用再按 Esc 或点外面）
import { beforeAll, describe, expect, it } from 'vitest';
import { createSSRApp, nextTick } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { mount } from '../../utils/.test/mount';
import { NavItem, NavList } from '../../navigation/NavList';
import { AppShell } from '../AppShell';

beforeAll(() => {
  const proto = HTMLElement.prototype as unknown as Record<string, unknown>;
  proto.showPopover ??= () => {};
  proto.hidePopover ??= () => {};
  proto.showModal ??= function (this: HTMLElement) {
    this.setAttribute('open', '');
  };
  proto.close ??= function (this: HTMLElement) {
    this.removeAttribute('open');
  };
});

describe('AppShell 窄屏的侧栏抽屉', () => {
  it('点了导航项（链接）后自动关上', async () => {
    let open = _state(true);
    const root = mount(() => (
      <AppShell
        _sidebarOpen={open}
        sidebar={
          <NavList aria-label="站点">
            <NavItem href="/orders">订单</NavItem>
          </NavList>
        }
      >
        正文
      </AppShell>
    ));
    await nextTick();
    const link = root.ownerDocument.querySelector<HTMLAnchorElement>('dialog a[href]')!;
    expect(link).not.toBeNull();
    link.click();
    await nextTick();
    expect(open).toBe(false);
  });

  it('开关没有交给父级绑定时也一样：打开后点导航项就关上', async () => {
    const root = mount(() => (
      <AppShell
        sidebar={
          <NavList aria-label="站点">
            <NavItem href="/orders">订单</NavItem>
          </NavList>
        }
      >
        正文
      </AppShell>
    ));
    const dialog = () => root.ownerDocument.querySelector<HTMLElement>('dialog')!;
    const menu = root.querySelector<HTMLElement>('button[aria-label="打开导航"]')!;
    menu.click();
    await nextTick();
    await nextTick();
    expect(menu.getAttribute('aria-expanded')).toBe('true');
    expect(dialog().hasAttribute('open')).toBe(true);
    dialog().querySelector<HTMLAnchorElement>('a[href]')!.click();
    await nextTick();
    await nextTick();
    expect(dialog().hasAttribute('open')).toBe(false);
  });

  it('水合后的页面：抽屉第一次打开时也有导航内容', async () => {
    const shell = () => (
      <AppShell
        sidebar={
          <NavList aria-label="站点">
            <NavItem href="/orders">订单</NavItem>
          </NavList>
        }
      >
        正文
      </AppShell>
    );
    const root = document.createElement('div');
    document.body.append(root);
    root.innerHTML = await renderToString(createSSRApp(shell));
    createSSRApp(shell).mount(root);
    await nextTick();
    root.querySelector<HTMLElement>('button[aria-label="打开导航"]')!.click();
    await nextTick();
    await nextTick();
    expect(root.querySelector('dialog a[href]')).not.toBeNull();
  });
});
