// PageHeader：标题级别、面包屑、返回（链接或按钮）、操作与底部内容
import { describe, expect, it, vi } from 'vitest';
import { mount } from '../../utils/.test/mount';
import { PageHeader } from '../PageHeader';

describe('PageHeader', () => {
  it('标题是 h1；面包屑、标题旁内容、说明、操作、底部都在', () => {
    const root = mount(() => (
      <PageHeader
        title="降本任务"
        meta={<span class="count">128 项</span>}
        description="两条渠道汇入的任务"
        breadcrumbs={[{ label: '联合降本', href: '/' }, { label: '降本任务' }]}
        actions={<button>新建</button>}
      >
        <div class="tabs">页签</div>
      </PageHeader>
    ));
    expect(root.querySelector('h1')!.textContent).toBe('降本任务');
    expect(root.querySelector('nav')).not.toBeNull();
    expect(root.querySelector('.count')!.textContent).toBe('128 项');
    expect(root.textContent).toContain('两条渠道汇入的任务');
    expect(root.querySelector('button')!.textContent).toBe('新建');
    expect(root.querySelector('.tabs')).not.toBeNull();
  });

  it('back 是地址时是返回链接，是函数时是按钮；headingLevel 换标题级别', () => {
    const link = mount(() => <PageHeader title="详情" back="/tasks" />);
    const anchor = link.querySelector('a')!;
    expect(anchor.getAttribute('href')).toBe('/tasks');
    expect(anchor.getAttribute('aria-label')).toBe('返回');

    const onBack = vi.fn();
    const button = mount(() => <PageHeader title="详情" back={onBack} headingLevel={2} />);
    button.querySelector<HTMLButtonElement>('button[aria-label="返回"]')!.click();
    expect(onBack).toHaveBeenCalledOnce();
    expect(button.querySelector('h2')!.textContent).toBe('详情');
  });
});

it('部件属性：标题块、标题文字、标题一行', () => {
  const root = mount(() => (
    <PageHeader
      title="降本任务"
      description="说明"
      back={() => {}}
      propsTitleBlock={{ class: 'block' }}
      propsTitleText={{ class: 'text' }}
      propsTitleLine={{ class: 'line' }}
    />
  ));
  const block = root.querySelector('.block')!;
  expect(block.querySelector('button')).not.toBeNull();
  expect(block.querySelector('.text > .line h1')!.textContent).toBe('降本任务');
  expect(root.querySelector('.text')!.textContent).toContain('说明');
});
