// 列表状态与 Listbox：分组排序、移动跳过不可用项、单选 / 多选、键盘与 aria-activedescendant
import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '../../utils/.test/mount';
import { Listbox } from '../Listbox';
import { createListState, handleListKeydown, type ListboxOption } from '../list-state';

const fruits: ListboxOption[] = [
  { value: 'apple', label: 'Apple', group: '常见' },
  { value: 'durian', label: 'Durian', group: '热带' },
  { value: 'banana', label: 'Banana', group: '常见', disabled: true },
  { value: 'cherry', label: 'Cherry', group: '常见' },
];

describe('createListState', () => {
  it('按分组排序；移动跳过不可用项，到头停住；类型搜索', () => {
    let selected: readonly string[] = [];
    const list = createListState({
      options: () => fruits,
      selected: () => selected,
      mode: () => 'single',
      onChange: (next) => (selected = next),
    });
    expect(list.options.map((option) => option.value)).toEqual([
      'apple',
      'banana',
      'cherry',
      'durian',
    ]);
    list.move(1);
    expect(list.active).toBe('apple');
    list.move(1);
    expect(list.active).toBe('cherry');
    list.move('last');
    list.move(1);
    expect(list.active).toBe('durian');
    expect(list.typeahead('c')).toBe(true);
    expect(list.active).toBe('cherry');
    expect(list.select('banana')).toBe(false);
    expect(list.select('cherry')).toBe(true);
    expect(selected).toEqual(['cherry']);
  });

  it('键盘：Enter / 空格选中；homeEnd: false 时不处理 Home / End', () => {
    let selected: readonly string[] = ['apple'];
    const list = createListState({
      options: () => fruits,
      selected: () => selected,
      mode: () => 'multiple',
      onChange: (next) => (selected = next),
    });
    const key = (name: string, options = {}) =>
      handleListKeydown(list, new KeyboardEvent('keydown', { key: name }), options);
    list.activateDefault();
    expect(list.active).toBe('apple');
    expect(key('End')).toBe(true);
    expect(key(' ', { space: true })).toBe(true);
    expect(selected).toEqual(['apple', 'durian']);
    expect(key('Home', { homeEnd: false })).toBe(false);
    expect(key('x')).toBe(false);
  });
});

describe('Listbox', () => {
  it('role="listbox"，分组带标题；获得焦点后高亮已选项，方向键移动、Enter 选中', async () => {
    let value = _state<string | undefined>('cherry');
    const root = mount(() => <Listbox items={fruits} value={_bind(value)} aria-label="水果" />);
    const listbox = root.querySelector<HTMLElement>('[role="listbox"]')!;
    expect(root.querySelectorAll('[role="group"]')).toHaveLength(2);
    expect(listbox.tabIndex).toBe(0);
    listbox.dispatchEvent(new FocusEvent('focus'));
    await nextTick();
    const active = () => document.getElementById(listbox.getAttribute('aria-activedescendant')!);
    expect(active()!.textContent).toBe('Cherry');
    listbox.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    listbox.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await nextTick();
    expect(value).toBe('durian');
    expect(active()!.getAttribute('aria-selected')).toBe('true');
  });

  it('多选：点击切换，aria-multiselectable；没有选项时显示空状态', async () => {
    let picked = _state<string[]>([]);
    const root = mount(() => (
      <>
        <Listbox items={fruits} type="multiple" value={_bind(picked)} aria-label="水果" />
        <Listbox items={[]} aria-label="空" />
      </>
    ));
    const [multi, blank] = root.querySelectorAll<HTMLElement>('[role="listbox"]');
    expect(multi!.getAttribute('aria-multiselectable')).toBe('true');
    const options = multi!.querySelectorAll<HTMLElement>('[role="option"]');
    options[0]!.click();
    options[2]!.click();
    await nextTick();
    expect(picked).toEqual(['apple', 'cherry']);
    options[1]!.click(); // 不可用
    expect(picked).toEqual(['apple', 'cherry']);
    expect(blank!.textContent).toContain('没有选项');
  });
});
