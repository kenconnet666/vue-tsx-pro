// PaginationBar：起始边的范围文字（没有数据、自定义），页码写回 page，换每页条数回到第 1 页，跳页；只有一页时不显示跳页
import { beforeAll, describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '../../utils/.test/mount';
import { PaginationBar } from '../PaginationBar';

const flush = async () => {
  for (let index = 0; index < 5; index++) await nextTick();
};

// happy-dom 没有 popover API
beforeAll(() => {
  const proto = HTMLElement.prototype as unknown as Record<string, unknown>;
  proto.showPopover ??= () => {};
  proto.hidePopover ??= () => {};
});

describe('PaginationBar', () => {
  it('范围文字：第几到第几条、共几条；没有数据时只说共 0 条；showTotal 可以给函数', () => {
    const root = mount(() => (
      <>
        <PaginationBar _page={2} _pageSize={20} total={1286} class="a" />
        <PaginationBar total={0} class="b" />
        <PaginationBar
          _page={3}
          _pageSize={10}
          total={25}
          showTotal={({ from, to }) => `${from}-${to} · 勾选跨页保留`}
          class="c"
        />
      </>
    ));
    const text = (name: string) => root.querySelector(`.${name} > span`)!.textContent;
    expect(text('a')).toBe('第 21–40 条，共 1,286 条');
    expect(text('b')).toBe('共 0 条');
    expect(text('c')).toBe('21-25 · 勾选跨页保留');
  });

  it('点页码写回 page；换每页条数写回 pageSize 并回到第 1 页', async () => {
    let page = _state(1);
    let pageSize = _state(10);
    const root = mount(() => (
      <PaginationBar
        _page={page}
        _pageSize={pageSize}
        total={320}
        propsSizeSelect={{ _open: true }}
      />
    ));
    root.querySelector<HTMLButtonElement>('button[aria-label="第 3 页"]')!.click();
    await nextTick();
    expect(page).toBe(3);
    expect(root.textContent).toContain('第 21–30 条');

    const option = [...document.querySelectorAll<HTMLElement>('[role="option"]')].find(
      (item) => item.textContent === '50 条/页',
    )!;
    option.click();
    await flush();
    expect(pageSize).toBe(50);
    expect(page).toBe(1);
  });

  it('跳页：输入页码后跳过去（夹在总页数内）；只有一页时不显示', async () => {
    let page = _state(1);
    const root = mount(() => (
      <>
        <PaginationBar _page={page} total={95} showSizeSelect={false} class="many" />
        <PaginationBar total={8} class="single" />
      </>
    ));
    const input = root.querySelector<HTMLInputElement>('.many input[aria-label="跳到第几页"]')!;
    input.dispatchEvent(new FocusEvent('focus'));
    input.value = '42';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new FocusEvent('blur'));
    await flush();
    expect(page).toBe(10);
    expect(root.querySelector('.many [role="combobox"]')).toBeNull();
    expect(root.querySelector('.single input')).toBeNull();
  });
});
