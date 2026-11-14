// SearchField：type="search" 的 TextField，带搜索图标与清空；_value 每敲一个字都更新，
// onSearch 只在停手、回车、清空时调用，同一个词不重复
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '../../utils/.test/mount';
import { SearchField } from '../SearchField';

function type(input: HTMLInputElement, text: string) {
  input.value = text;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}
const enter = (input: HTMLInputElement) =>
  input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('SearchField', () => {
  it('type="search"，默认的名称与占位文字是“搜索”，有内容时有清空按钮', async () => {
    let keyword = _state('');
    const root = mount(() => <SearchField _value={keyword} />);
    const input = root.querySelector('input')!;
    expect(input.type).toBe('search');
    expect(input.getAttribute('aria-label')).toBe('搜索');
    expect(input.placeholder).toBe('搜索');
    expect(root.querySelector('button')).toBeNull();
    type(input, '支架');
    await nextTick();
    expect(keyword).toBe('支架');
    expect(root.querySelector('button')).not.toBeNull();
  });

  it('onSearch：打字等停手，回车立即，清空立即；同一个词不重复', async () => {
    const onSearch = vi.fn();
    let keyword = _state('');
    const root = mount(() => <SearchField _value={keyword} onSearch={onSearch} />);
    const input = root.querySelector('input')!;
    type(input, '支');
    type(input, '支架');
    await nextTick();
    // 每敲一个字 _value 都更新，但还没到该查的时候
    expect(keyword).toBe('支架');
    expect(onSearch).not.toHaveBeenCalled();
    vi.advanceTimersByTime(300);
    expect(onSearch.mock.calls).toEqual([['支架']]);

    type(input, '支架 M8');
    enter(input);
    expect(onSearch.mock.calls.at(-1)).toEqual(['支架 M8']);
    // 回车之后停手的那次不再重复
    vi.advanceTimersByTime(300);
    enter(input);
    expect(onSearch).toHaveBeenCalledTimes(2);

    type(input, '');
    expect(onSearch.mock.calls.at(-1)).toEqual(['']);
    expect(onSearch).toHaveBeenCalledTimes(3);
  });

  it('父级从外面改了值（重置）：不触发 onSearch，之后再输入同样的词照常触发', async () => {
    const onSearch = vi.fn();
    let keyword = _state('');
    const root = mount(() => <SearchField _value={keyword} onSearch={onSearch} delay={0} />);
    const input = root.querySelector('input')!;
    type(input, '盖板');
    expect(onSearch).toHaveBeenCalledTimes(1);
    keyword = '';
    await nextTick();
    await nextTick();
    expect(input.value).toBe('');
    expect(onSearch).toHaveBeenCalledTimes(1);
    type(input, '盖板');
    expect(onSearch).toHaveBeenCalledTimes(2);
  });
});
