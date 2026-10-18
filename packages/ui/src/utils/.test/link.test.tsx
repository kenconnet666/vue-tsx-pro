// 路由适配：只拦普通左键点击的站内链接
import { _component } from '@vue-tsx-pro/tsx';
import { describe, expect, it, vi } from 'vitest';
import { Provider } from '../../config/Provider';
import { useRouterLink } from '../link';
import { mount } from './mount';

const RouterAnchor = _component(({ href, target }: { href: string; target?: string }) => {
  const link = useRouterLink();
  return () => (
    <a
      href={href}
      target={target}
      onClick={link.onClick}
      aria-current={link.isActive(href) ? 'page' : undefined}
    >
      x
    </a>
  );
});

const click = (anchor: Element, init: MouseEventInit = {}) => {
  const event = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0, ...init });
  anchor.dispatchEvent(event);
  return event;
};

describe('useRouterLink', () => {
  it('站内链接的普通点击交给路由，阻止页面跳转；isActive 决定当前页', () => {
    const navigate = vi.fn();
    const root = mount(() => (
      <Provider router={{ navigate, isActive: (href) => href === '/orders' }}>
        <RouterAnchor href="/orders" />
        <RouterAnchor href="/users" />
      </Provider>
    ));
    const [orders, users] = root.querySelectorAll('a');
    expect(click(orders!).defaultPrevented).toBe(true);
    expect(navigate).toHaveBeenCalledWith('/orders');
    expect(orders!.getAttribute('aria-current')).toBe('page');
    expect(users!.hasAttribute('aria-current')).toBe(false);
  });

  it('修饰键、新窗口、外部链接、没有配置路由时都交给浏览器', () => {
    const navigate = vi.fn();
    const root = mount(() => (
      <>
        <Provider router={{ navigate }}>
          <RouterAnchor href="/a" />
          <RouterAnchor href="/b" target="_blank" />
          <RouterAnchor href="https://example.com/c" />
        </Provider>
        <RouterAnchor href="/d" />
      </>
    ));
    const [a, b, c, d] = root.querySelectorAll('a');
    // 测试里阻止真正的跳转，只看组件有没有拦
    root.addEventListener('click', (event) => event.preventDefault());
    click(a!, { ctrlKey: true });
    click(b!);
    click(c!);
    click(d!);
    expect(navigate).not.toHaveBeenCalled();
  });
});
