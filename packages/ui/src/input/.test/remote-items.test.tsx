// 远程选项（load）：打开才请求、搜索词停下 300 ms 再请求且只采用最后一次；结果代替 items；
// 已选项换出结果后仍显示文字；加载失败有提示。Select、Combobox、TreeSelect 共用（remote-items.ts）
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '../../utils/.test/mount';
import { Combobox } from '../Combobox';
import { Select } from '../Select';
import { TreeSelect } from '../TreeSelect';

interface User {
  id: string;
  name: string;
}
const users: User[] = [
  { id: 'u1', name: '林小满' },
  { id: 'u2', name: '周一航' },
  { id: 'u3', name: '许知远' },
];
const toOption = (user: User) => ({ value: user.id, label: user.name });

/** 假接口：按名字包含搜索词筛选；每次调用记下搜索词与 signal */
function fakeLoad() {
  const calls: { query: string; signal: AbortSignal }[] = [];
  let fail = false;
  const load = vi.fn((query: string, signal: AbortSignal) => {
    calls.push({ query, signal });
    return fail
      ? Promise.reject(new Error('down'))
      : Promise.resolve(users.filter((user) => user.name.includes(query)));
  });
  return { load, calls, failNext: () => (fail = true) };
}

const settle = async () => {
  for (let index = 0; index < 4; index++) await Promise.resolve();
  await nextTick();
};
const optionTexts = (root: Element) =>
  [...root.querySelectorAll('[role="option"]')].map((option) => option.textContent);

// happy-dom 没有 Popover API：这里只测请求，弹层的显示与键盘交给浏览器测试
beforeAll(() => {
  Object.assign(HTMLElement.prototype, {
    showPopover() {},
    hidePopover() {},
    togglePopover: () => true,
  });
});
beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('Select 的 load', () => {
  it('关着不请求；打开立即按空搜索词请求，结果代替 items', async () => {
    const api = fakeLoad();
    let open = _state(false);
    const root = mount(() => (
      <Select
        load={api.load}
        toOption={toOption}
        searchable
        open={_bind(open)}
        aria-label="负责人"
      />
    ));
    await settle();
    expect(api.calls).toHaveLength(0);
    open = true;
    await settle();
    expect(api.calls.map((call) => call.query)).toEqual(['']);
    expect(optionTexts(root)).toEqual(['林小满', '周一航', '许知远']);
  });

  it('搜索词停下 300 ms 再请求，只采用最后一次；选中的项换出结果后触发框仍显示文字', async () => {
    const api = fakeLoad();
    let open = _state(true);
    let search = _state('');
    let owner = _state<string | null>(null);
    const root = mount(() => (
      <Select
        load={api.load}
        toOption={toOption}
        searchable
        open={_bind(open)}
        search={_bind(search)}
        value={_bind(owner)}
        aria-label="负责人"
      />
    ));
    await settle();
    owner = 'u1';
    await settle();
    search = '周';
    await nextTick();
    vi.advanceTimersByTime(100);
    search = '周一';
    await nextTick();
    vi.advanceTimersByTime(300);
    await settle();
    expect(api.calls.map((call) => call.query)).toEqual(['', '周一']);
    expect(optionTexts(root)).toEqual(['周一航']);
    expect(root.querySelector('button[role="combobox"]')!.textContent).toBe('林小满');
  });

  it('加载失败：列表里提示“加载失败，请重试”', async () => {
    const api = fakeLoad();
    api.failNext();
    const root = mount(() => (
      <Select load={api.load} toOption={toOption} open aria-label="负责人" />
    ));
    await settle();
    expect(root.querySelector('[popover]')!.textContent).toContain('加载失败，请重试');
  });
});

describe('Combobox 的 load', () => {
  it('输入停下 300 ms 后按输入请求', async () => {
    const api = fakeLoad();
    let open = _state(true);
    let text = _state('');
    const root = mount(() => (
      <Combobox
        load={api.load}
        toOption={toOption}
        open={_bind(open)}
        inputValue={_bind(text)}
        aria-label="负责人"
      />
    ));
    await settle();
    const input = root.querySelector('input')!;
    input.focus();
    text = '许';
    await nextTick();
    vi.advanceTimersByTime(300);
    await settle();
    expect(api.calls.map((call) => call.query)).toEqual(['', '许']);
    expect(optionTexts(root)).toEqual(['许知远']);
  });
});

describe('TreeSelect 的 load', () => {
  interface Org {
    id: string;
    name: string;
    children?: Org[];
  }
  const tree: Org[] = [
    { id: 'hq', name: '总部', children: [{ id: 'cost', name: '成本管理部' }] },
    { id: 'buy', name: '采购部' },
  ];

  // 行是虚拟滚动的，happy-dom 量不出高度不渲染：结果的显示与展开见浏览器测试
  it('服务端搜索：打开时与搜索词停下后按搜索词请求', async () => {
    const calls: string[] = [];
    const load = (query: string) => {
      calls.push(query);
      return Promise.resolve(query ? [tree[0]!] : tree);
    };
    let search = _state('');
    mount(() => (
      <TreeSelect
        load={load}
        getKey={(org: Org) => org.id}
        getLabel={(org) => org.name}
        getChildren={(org) => org.children}
        searchable
        open
        search={_bind(search)}
        aria-label="部门"
      />
    ));
    await settle();
    search = '成本';
    await nextTick();
    vi.advanceTimersByTime(300);
    await settle();
    expect(calls).toEqual(['', '成本']);
  });
});
