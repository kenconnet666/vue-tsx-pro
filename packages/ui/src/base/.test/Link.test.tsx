import { describe, expect, it } from 'vitest';
import { mount } from '../../utils/.test/mount';
import { Provider } from '../../config/Provider';
import { enUS } from '../../config/lang/en-US';
import { Card } from '../../display/Card';
import { Link, LinkUnderlineScope } from '../Link';

describe('Link', () => {
  it('下划线：容器（LinkUnderlineScope、卡片页头）给的默认是 hover，显式写的优先，正文里照旧', () => {
    const root = mount(() => (
      <>
        <Link href="/a">正文</Link>
        <Link href="/b" underline="hover">
          显式悬停
        </Link>
        <LinkUnderlineScope underline="hover">
          <Link href="/c">容器里</Link>
          <Link href="/d" underline="always">
            容器里显式
          </Link>
        </LinkUnderlineScope>
        <Card header={<Link href="/e">页头</Link>}>
          <Link href="/f">卡片正文</Link>
        </Card>
      </>
    ));
    const cls = (href: string) => root.querySelector(`a[href="${href}"]`)!.className;
    expect(cls('/c')).toBe(cls('/b'));
    expect(cls('/d')).toBe(cls('/a'));
    expect(cls('/e')).toBe(cls('/b'));
    expect(cls('/f')).toBe(cls('/a'));
    expect(cls('/a')).not.toBe(cls('/b'));
  });

  it('普通链接：只有 href，没有 target 与 rel', () => {
    const a = mount(() => <Link href="/orders">订单</Link>).querySelector('a')!;
    expect(a.getAttribute('href')).toBe('/orders');
    expect(a.hasAttribute('target')).toBe(false);
    expect(a.textContent).toBe('订单');
  });

  it('外部链接的 target、rel 是默认值：使用方可以改，同 LinkButton', () => {
    const root = mount(() => (
      <Link href="https://example.com" external rel="noopener noreferrer nofollow">
        外部
      </Link>
    ));
    const link = root.querySelector('a')!;
    expect([link.rel, link.target]).toEqual(['noopener noreferrer nofollow', '_blank']);
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
