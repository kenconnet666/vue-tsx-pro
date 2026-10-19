// 列表状态与 Listbox：分组排序、移动跳过不可用项、单选 / 多选、键盘与 aria-activedescendant
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '../../utils/.test/mount';
import { Listbox } from '../Listbox';
import { createListState, handleListKeydown, type ListboxOption } from '../list-state';

// happy-dom 不排版：给滚动容器一个 300px 的视口（选项是虚拟滚动的）
const clientHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientHeight')!;
beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', { get: () => 300 });
});
afterAll(() => {
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', clientHeight);
});

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
  it('role="listbox"，组名经 aria-describedby 交给组里的选项；获得焦点后高亮已选项，方向键移动、Enter 选中', async () => {
    let value = _state<string | undefined>('cherry');
    const root = mount(() => <Listbox items={fruits} value={_bind(value)} aria-label="水果" />);
    await nextTick();
    const listbox = root.querySelector<HTMLElement>('[role="listbox"]')!;
    const apple = root.querySelector<HTMLElement>('[role="option"]')!;
    expect(document.getElementById(apple.getAttribute('aria-describedby')!)!.textContent).toBe(
      '常见',
    );
    expect([apple.getAttribute('aria-setsize'), apple.getAttribute('aria-posinset')]).toEqual([
      '4',
      '1',
    ]);
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
    await nextTick();
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

  it('虚拟滚动：一千个选项只渲染看得见的一部分；loading 且没有选项时显示骨架行', async () => {
    const many = Array.from({ length: 1000 }, (_, index) => ({
      value: String(index),
      label: `选项 ${index}`,
    }));
    const root = mount(() => (
      <>
        <Listbox items={many} aria-label="很多" />
        <Listbox items={[]} loading aria-label="加载中" />
      </>
    ));
    await nextTick();
    const [long, pending] = root.querySelectorAll<HTMLElement>('[role="listbox"]');
    const rendered = long!.querySelectorAll('[role="option"]').length;
    expect(rendered).toBeGreaterThan(0);
    expect(rendered).toBeLessThan(40);
    expect(pending!.getAttribute('aria-busy')).toBe('true');
    expect(pending!.querySelectorAll('[aria-hidden="true"]').length).toBeGreaterThan(0);
  });
});
