// 列表状态、Listbox 与 Select：分组排序、移动跳过不可用项、单选 / 多选、键盘与 aria-activedescendant、大量选项
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '../../utils/.test/mount';
import { Listbox } from '../Listbox';
import { Select } from '../Select';
import { useListState, handleListKeydown, type ListboxOption } from '../list-state';

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

describe('useListState', () => {
  it('按分组排序；移动跳过不可用项，到头停住；类型搜索', () => {
    let selected: readonly string[] = [];
    const list = useListState({
      items: () => fruits,
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
    const list = useListState({
      items: () => fruits,
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
    let value = _state<string | null>('cherry');
    const root = mount(() => <Listbox items={fruits} _value={value} aria-label="水果" />);
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
        <Listbox items={fruits} selectionMode="multiple" _value={picked} aria-label="水果" />
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

  it('toOption：任意形状的数据直接传给 items，渲染函数拿到原始数据', async () => {
    const users = [
      { id: 7, name: '张三', active: true },
      { id: 9, name: '李四', active: false },
    ];
    let picked = _state<string | null>(null);
    const root = mount(() => (
      <Listbox
        items={users}
        toOption={(user) => ({ value: String(user.id), label: user.name, disabled: !user.active })}
        _value={picked}
        aria-label="成员"
      >
        {(user, { selected }) => `${user.name}#${user.id}${selected ? '✓' : ''}`}
      </Listbox>
    ));
    await nextTick();
    const options = root.querySelectorAll<HTMLElement>('[role="option"]');
    expect([...options].map((option) => option.textContent)).toEqual(['张三#7', '李四#9']);
    expect(options[1]!.getAttribute('aria-disabled')).toBe('true');
    options[0]!.click();
    await nextTick();
    expect(picked).toBe('7');
    expect(options[0]!.textContent).toBe('张三#7✓');
  });

  it('字符串列表：值与文字都是它，不用 toOption', async () => {
    let picked = _state<string | null>(null);
    const root = mount(() => (
      <Listbox items={['设计', '研发']} _value={picked} aria-label="部门" />
    ));
    await nextTick();
    const options = root.querySelectorAll<HTMLElement>('[role="option"]');
    expect([...options].map((option) => option.textContent)).toEqual(['设计', '研发']);
    options[1]!.click();
    await nextTick();
    expect(picked).toBe('研发');
  });

  it('onPick：点击与 Enter 都会调用，再选已选的那项也会（弹层里的列表据此关闭）', async () => {
    const picks: string[] = [];
    const root = mount(() => (
      <Listbox
        items={['09:00', '09:30']}
        _value="09:00"
        required
        onPick={(value) => picks.push(value)}
        aria-label="时间"
      />
    ));
    await nextTick();
    root.querySelectorAll<HTMLElement>('[role="option"]')[0]!.click();
    const list = root.querySelector<HTMLElement>('[role="listbox"]')!;
    list.dispatchEvent(new FocusEvent('focus'));
    list.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    list.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(picks).toEqual(['09:00', '09:30']);
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

describe('Select', () => {
  it('性能：三万个选项全部选中时挂载在 1 秒内', async () => {
    // 触发框取已选项时曾经对每个选项在已选值里逐个 includes（O(n²)）
    const items = Array.from({ length: 30_000 }, (_, index) => ({
      value: String(index),
      label: `选项 ${index}`,
    }));
    const start = performance.now();
    const root = mount(() => (
      <Select
        items={items}
        selectionMode="multiple"
        _value={items.map((item) => item.value)}
        renderValue={(selected) => `已选 ${selected.length} 项`}
        aria-label="很多"
      />
    ));
    await nextTick();
    expect(performance.now() - start).toBeLessThan(1000);
    expect(root.textContent).toContain('已选 30000 项');
  });
});
