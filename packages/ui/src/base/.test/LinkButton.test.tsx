// LinkButton：外部链接、经 router 跳转、不可用时去掉 href
import { describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { Provider } from '../../config/Provider';
import { mount } from '../../utils/.test/mount';
import { LinkButton } from '../LinkButton';

const first = <T extends Element>(root: Element, selector: string) =>
  root.querySelector<T>(selector)!;

describe('LinkButton', () => {
  it('渲染 a；external 时新窗口打开、带外链图标与读屏提示', () => {
    const root = mount(() => (
      <LinkButton href="https://example.com" external>
        文档
      </LinkButton>
    ));
    const link = first<HTMLAnchorElement>(root, 'a');
    expect([link.target, link.rel]).toEqual(['_blank', 'noopener noreferrer']);
    expect(link.querySelector('svg')).not.toBeNull();
    expect(link.textContent).toContain('（在新窗口打开）');
  });

  it('站内链接经 router 跳转；disabled 时去掉 href，保留 role="link" 与 aria-disabled', async () => {
    const navigate = vi.fn();
    let disabled = _state(false);
    const root = mount(() => (
      <Provider router={{ navigate }}>
        <LinkButton href="/orders" disabled={disabled}>
          订单
        </LinkButton>
      </Provider>
    ));
    const link = () => first<HTMLAnchorElement>(root, 'a');
    link().dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }));
    expect(navigate).toHaveBeenCalledWith('/orders');

    disabled = true;
    await nextTick();
    expect(link().hasAttribute('href')).toBe(false);
    expect([link().getAttribute('role'), link().getAttribute('aria-disabled')]).toEqual([
      'link',
      'true',
    ]);
  });
});
