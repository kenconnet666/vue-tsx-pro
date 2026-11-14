// PageHeader：header 里面包屑、返回、标题（hgroup）、标记、说明、操作；返回是按钮或链接
import { describe, expect, it, vi } from 'vitest';
import { mount } from '../../utils/.test/mount';
import { PageHeader } from '../PageHeader';

describe('PageHeader', () => {
  it('标题是 h1、和说明在 hgroup 里；面包屑、标记、操作各在自己的部件里；children 排在最后', () => {
    const root = mount(() => (
      <PageHeader
        breadcrumbs={[{ label: '采购单', href: '/orders' }, { label: 'PO-0187' }]}
        title="PO-0187"
        description="华辰精密 · 2026-10-20 下单"
        meta={<span>已到货</span>}
        actions={<button>催单</button>}
        data-x="1"
      >
        <div data-summary="">摘要</div>
      </PageHeader>
    ));
    const header = root.querySelector('header')!;
    expect(header.getAttribute('data-x')).toBe('1');
    expect(header.querySelector('nav ol')!.textContent).toContain('采购单');
    const group = header.querySelector('hgroup')!;
    expect(group.querySelector('h1')!.textContent).toBe('PO-0187');
    expect(group.querySelector('p')!.textContent).toBe('华辰精密 · 2026-10-20 下单');
    expect(header.querySelector('[data-part="meta"]')!.textContent).toBe('已到货');
    expect(header.querySelector('[data-part="actions"] button')!.textContent).toBe('催单');
    expect(header.lastElementChild!.hasAttribute('data-summary')).toBe(true);
    // 没给返回：不出返回按钮
    expect(header.querySelector('[data-part="back"]')).toBeNull();
  });

  it('只有标题时没有面包屑、说明、标记、操作的空壳；headingLevel 改级别', () => {
    const root = mount(() => <PageHeader title="概览" headingLevel={2} />);
    const header = root.querySelector('header')!;
    expect(header.querySelector('h2')!.textContent).toBe('概览');
    expect(header.querySelector('nav')).toBeNull();
    expect(header.querySelector('p')).toBeNull();
    expect(header.querySelector('[data-part="meta"]')).toBeNull();
    expect(header.querySelector('[data-part="actions"]')).toBeNull();
  });

  it('返回：onBack 是按钮，backHref 是链接（点击也调用 onBack），名称是“返回”', () => {
    const onBack = vi.fn();
    const root = mount(() => (
      <>
        <PageHeader title="详情" onBack={onBack} />
        <PageHeader title="详情" backHref="/orders" onBack={onBack} />
      </>
    ));
    const [button, link] = root.querySelectorAll<HTMLElement>('[data-part="back"]');
    expect(button!.tagName).toBe('BUTTON');
    expect(button!.getAttribute('aria-label')).toBe('返回');
    button!.click();
    expect(onBack).toHaveBeenCalledTimes(1);
    expect(link!.tagName).toBe('A');
    expect(link!.getAttribute('href')).toBe('/orders');
    link!.addEventListener('click', (event) => event.preventDefault());
    link!.click();
    expect(onBack).toHaveBeenCalledTimes(2);
  });
});
