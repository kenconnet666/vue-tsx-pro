// TagsInput：回车、分隔符、粘贴加入；重复与上限；退格删最后一个；不可用（建议列表用原生 popover，见浏览器测试）
import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '../../utils/.test/mount';
import { TagsInput } from '../TagsInput';

async function type(input: HTMLInputElement, text: string) {
  input.value = text;
  input.dispatchEvent(new Event('input'));
  await nextTick();
}
const press = (input: HTMLInputElement, key: string) =>
  input.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
const tags = (root: Element) =>
  [...root.querySelectorAll('[data-tag]')].map((tag) => tag.textContent);

describe('TagsInput', () => {
  it('回车加入并清空输入；重复的不加；输入框为空时退格删掉最后一个', async () => {
    let value = _state<string[]>([]);
    const root = mount(() => <TagsInput _value={value} aria-label="关键词" />);
    const input = root.querySelector('input')!;
    await type(input, ' vue ');
    press(input, 'Enter');
    await nextTick();
    expect(value).toEqual(['vue']);
    expect(input.value).toBe('');
    await type(input, 'vue');
    press(input, 'Enter');
    expect(value).toEqual(['vue']);
    await type(input, '');
    press(input, 'Backspace');
    await nextTick();
    expect(value).toEqual([]);
  });

  it('失焦时把没确认的文字加成标签；acceptOnBlur={false} 时文字留在框里', async () => {
    let value = _state<string[]>([]);
    let kept = _state<string[]>([]);
    const root = mount(() => (
      <>
        <TagsInput _value={value} aria-label="关键词" />
        <TagsInput _value={kept} acceptOnBlur={false} aria-label="备注" />
      </>
    ));
    const [accepting, keeping] = root.querySelectorAll('input');
    await type(accepting!, '销售');
    accepting!.dispatchEvent(new FocusEvent('blur'));
    await nextTick();
    expect([value, accepting!.value]).toEqual([['销售'], '']);
    await type(keeping!, '草稿');
    keeping!.dispatchEvent(new FocusEvent('blur'));
    await nextTick();
    expect([kept, keeping!.value]).toEqual([[], '草稿']);
  });

  it('输入分隔符时加入前面的部分；粘贴按分隔符与换行拆开；max 之外不加', async () => {
    let value = _state<string[]>([]);
    const root = mount(() => <TagsInput _value={value} max={3} aria-label="x" />);
    const input = root.querySelector('input')!;
    await type(input, 'a，b');
    expect(value).toEqual(['a']);
    expect(input.value).toBe('b');
    const paste = new Event('paste', { cancelable: true }) as ClipboardEvent;
    Object.defineProperty(paste, 'clipboardData', { value: { getData: () => 'c\nd;e' } });
    input.dispatchEvent(paste);
    expect(paste.defaultPrevented).toBe(true);
    expect(value).toEqual(['a', 'c', 'd']);
    await nextTick();
    expect(tags(root)).toEqual(['a', 'c', 'd']);
  });

  it('有建议时回车：允许自己输入的加打的字（不变成第一条建议），只能从建议里选的选第一条', async () => {
    let free = _state<string[]>([]);
    let strict = _state<string[]>([]);
    const root = mount(() => (
      <>
        <TagsInput _value={free} items={['javascript', 'java']} aria-label="技能" />
        <TagsInput
          _value={strict}
          items={['javascript', 'java']}
          allowCustomValue={false}
          aria-label="语言"
        />
      </>
    ));
    const [first, second] = root.querySelectorAll('input');
    await type(first!, 'jav');
    await nextTick();
    press(first!, 'Enter');
    await nextTick();
    expect(free).toEqual(['jav']);
    // 要选建议：按 ↓ 再回车
    await type(first!, 'javas');
    await nextTick();
    press(first!, 'ArrowDown');
    press(first!, 'Enter');
    await nextTick();
    expect(free).toEqual(['jav', 'javascript']);

    await type(second!, 'jav');
    await nextTick();
    press(second!, 'Enter');
    await nextTick();
    expect(strict).toEqual(['javascript']);
  });

  it('只读时粘贴不加标签；从建议里选的也受 max 限制', async () => {
    let locked = _state<string[]>(['a']);
    let cities = _state<string[]>(['北京']);
    const root = mount(() => (
      <>
        <TagsInput _value={locked} readonly aria-label="只读" />
        <TagsInput _value={cities} max={1} items={['北京', '上海']} aria-label="城市" />
      </>
    ));
    const [first, second] = root.querySelectorAll('input');
    const paste = new Event('paste', { cancelable: true }) as ClipboardEvent;
    Object.defineProperty(paste, 'clipboardData', { value: { getData: () => 'b,c' } });
    first!.dispatchEvent(paste);
    expect(locked).toEqual(['a']);

    await type(second!, '上');
    await nextTick();
    const option = [...document.querySelectorAll<HTMLElement>('[role="option"]')].find((item) =>
      item.textContent!.includes('上海'),
    )!;
    option.click();
    await nextTick();
    expect(cities).toEqual(['北京']);
  });

  it('异步搜索（filter={false}）：还没有建议时也是 combobox；没有 items、也不是异步时不是', () => {
    const root = mount(() => (
      <>
        <TagsInput items={[]} filter={false} loading aria-label="话题" />
        <TagsInput aria-label="关键词" />
      </>
    ));
    const [remote, free] = root.querySelectorAll('input');
    expect(remote!.getAttribute('role')).toBe('combobox');
    expect(remote!.getAttribute('aria-expanded')).toBe('false');
    expect(free!.hasAttribute('role')).toBe(false);
  });

  it('不可用：输入框 disabled，外壳 aria-disabled（标签在外壳里），标签没有移除按钮', () => {
    const root = mount(() => <TagsInput _value={['a', 'b']} disabled aria-label="x" />);
    const input = root.querySelector('input')!;
    expect(input.disabled).toBe(true);
    expect(input.parentElement!.getAttribute('aria-disabled')).toBe('true');
    expect(root.querySelector('[data-tag] button')).toBeNull();
  });
});
