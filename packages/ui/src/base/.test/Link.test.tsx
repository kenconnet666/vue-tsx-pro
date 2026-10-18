import { describe, expect, it } from 'vitest';
import { mount } from '../../utils/.test/mount';
import { Provider } from '../../config/Provider';
import { enUS } from '../../config/lang/en-US';
import { Link } from '../Link';

describe('Link', () => {
  it('普通链接：只有 href，没有 target 与 rel', () => {
    const a = mount(() => <Link href="/orders">订单</Link>).querySelector('a')!;
    expect(a.getAttribute('href')).toBe('/orders');
    expect(a.hasAttribute('target')).toBe(false);
    expect(a.textContent).toBe('订单');
  });

  it('外部链接：新窗口打开、rel 防止 window.opener，带图标（对读屏隐藏）与当前语言的读屏提示', () => {
    const a = mount(() => (
      <Link href="https://example.com" external>
        文档
      </Link>
    )).querySelector('a')!;
    expect(a.getAttribute('target')).toBe('_blank');
    expect(a.getAttribute('rel')).toBe('noopener noreferrer');
    expect(a.querySelector('svg')!.getAttribute('aria-hidden')).toBe('true');
    expect(a.textContent).toBe('文档（在新窗口打开）');

    const english = mount(() => (
      <Provider lang={enUS}>
        <Link href="https://example.com" external>
          Docs
        </Link>
      </Provider>
    )).querySelector('a')!;
    expect(english.textContent).toBe('Docs (opens in a new window)');
  });
});
