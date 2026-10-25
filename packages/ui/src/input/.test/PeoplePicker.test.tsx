// 人员与组织选择器：localPeopleSource（下级、搜索、岗位）；面板的下钻与面包屑、点行勾选、不能选的部门点行进去、
// 全选、max 换掉或勾满、移除与清空、搜索、“最近”；字段的对话框（确定写回、取消放弃）、Backspace、只选一个时显示名字
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '../../utils/.test/mount';
import { localPeopleSource, type PeopleEntry, type PeopleNode } from '../people';
import { PeoplePicker } from '../PeoplePicker';
import { PeoplePickerPanel } from '../PeoplePickerPanel';

const user = (id: string, name: string, description: string): PeopleNode => ({
  id,
  type: 'user',
  name,
  description,
});

const org: PeopleNode[] = [
  {
    id: 'buy',
    type: 'department',
    name: '采购部',
    children: [
      {
        id: 'source',
        type: 'department',
        name: '寻源组',
        children: [user('zhao', '赵一凡', '寻源组')],
      },
      user('lin', '林晓', '采购部 · 经理'),
      user('wu', '吴昊', '采购部 · 专员'),
    ],
  },
  {
    id: 'fin',
    type: 'department',
    name: '财务部',
    children: [user('wang', '王建国', '财务部 · 经理')],
  },
];
const positions: PeopleEntry[] = [{ id: 'buyer', type: 'position', name: '采购专员' }];
const source = localPeopleSource(org, positions);

const flush = async () => {
  for (let index = 0; index < 6; index++) await nextTick();
  await new Promise((resolve) => setTimeout(resolve));
};

beforeAll(() => {
  const proto = HTMLElement.prototype as unknown as Record<string, unknown>;
  proto.showPopover ??= () => {};
  proto.hidePopover ??= () => {};
});
afterEach(() => localStorage.clear());

const rows = (root: Element) => [...root.querySelectorAll<HTMLElement>('li')];
const row = (root: Element, name: string) =>
  rows(root).find((item) => item.textContent?.includes(name))!;
const buttonNamed = (root: Element, label: string) =>
  root.querySelector<HTMLElement>(`button[aria-label="${label}"]`)!;
const buttonText = (root: Element, text: string) =>
  [...root.querySelectorAll<HTMLElement>('button')].find((item) => item.textContent === text)!;

function panel(props: Record<string, unknown> = {}) {
  let value = _state<readonly PeopleEntry[]>([]);
  const root = mount(() => <PeoplePickerPanel source={source} _value={value} {...props} />);
  return { root, value: () => value, names: () => value.map((entry) => entry.name) };
}

describe('localPeopleSource', () => {
  it('下级：最上层与部门的下级，部门带 hasChildren；搜索按名字与说明；岗位单独给', async () => {
    const signal = new AbortController().signal;
    const top = await source.children(null, signal);
    expect(top.map((entry) => [entry.name, entry.hasChildren])).toEqual([
      ['采购部', true],
      ['财务部', true],
    ]);
    expect(top[0]).not.toHaveProperty('children');
    const buy = await source.children(top[0]!, signal);
    expect(buy.map((entry) => entry.name)).toEqual(['寻源组', '林晓', '吴昊']);
    expect((await source.search!('经理', signal)).map((entry) => entry.name)).toEqual([
      '林晓',
      '王建国',
    ]);
    expect((await source.search!('采购', signal)).map((entry) => entry.name)).toContain('采购专员');
    expect(await source.positions!(signal)).toEqual(positions);
  });
});

describe('PeoplePickerPanel', () => {
  it('下钻：“下级”进到部门，面包屑点“全部”回到最上层；只能选人员时点部门的整行也是进去', async () => {
    const { root } = panel();
    await flush();
    expect(rows(root).map((item) => item.textContent?.includes('采购部'))).toContain(true);
    buttonNamed(root, '进入采购部').click();
    await flush();
    expect(root.querySelector('nav [aria-current="location"]')!.textContent).toBe('采购部');
    expect(row(root, '林晓')).toBeDefined();
    row(root, '寻源组').click();
    await flush();
    expect([...root.querySelectorAll('nav li')].map((item) => item.textContent?.trim())).toEqual([
      '全部',
      '采购部',
      '寻源组',
    ]);
    buttonText(root, '全部').click();
    await flush();
    expect(row(root, '财务部')).toBeDefined();
  });

  it('点行勾选、再点取消；全选只管这一页能勾的；右边移除、清空', async () => {
    const { root, names } = panel();
    await flush();
    buttonNamed(root, '进入采购部').click();
    await flush();
    row(root, '林晓').click();
    await flush();
    expect(names()).toEqual(['林晓']);
    row(root, '林晓').click();
    await flush();
    expect(names()).toEqual([]);

    const all = [...root.querySelectorAll<HTMLElement>('label')].find((item) =>
      item.textContent?.includes('全选'),
    )!;
    all.querySelector('input')!.click();
    await flush();
    expect(names()).toEqual(['林晓', '吴昊']);
    buttonNamed(root, '移除林晓').click();
    await flush();
    expect(names()).toEqual(['吴昊']);
    buttonText(root, '清空').click();
    await flush();
    expect(names()).toEqual([]);
  });

  it('max=1 勾一个就换掉原来的；max=2 勾满之后其余的勾选框不可用', async () => {
    const single = panel({ max: 1 });
    await flush();
    buttonNamed(single.root, '进入采购部').click();
    await flush();
    row(single.root, '林晓').click();
    row(single.root, '吴昊').click();
    await flush();
    expect(single.names()).toEqual(['吴昊']);

    const capped = panel({ max: 2, types: ['user', 'department'] });
    await flush();
    row(capped.root, '采购部').click();
    row(capped.root, '财务部').click();
    await flush();
    expect(capped.names()).toEqual(['采购部', '财务部']);
    expect(capped.root.textContent).toContain('已选 2 / 2');
  });

  it('搜索：输入停下后列出结果，有字时不显示浏览方式与面包屑；勾过的记进“最近”', async () => {
    const { root, names } = panel({ recentKey: 'test' });
    await flush();
    const search = root.querySelector<HTMLInputElement>(
      'input[aria-label="搜索人员、部门、岗位"]',
    )!;
    search.value = '王';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 350));
    await flush();
    expect(root.querySelector('nav')).toBeNull();
    row(root, '王建国').click();
    await flush();
    expect(names()).toEqual(['王建国']);

    search.value = '';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    await flush();
    buttonText(root, '最近').click();
    await flush();
    expect(rows(root).filter((item) => item.textContent?.includes('王建国'))).toHaveLength(2);
    expect(JSON.parse(localStorage.getItem('vtp.people.recent.test')!)).toEqual([
      { id: 'wang', type: 'user', name: '王建国', description: '财务部 · 经理' },
    ]);
  });
});

describe('PeoplePicker', () => {
  it('对话框里改的是草稿：确定才写回，取消放弃；触发按钮上 Backspace 移除最后一个', async () => {
    let value = _state<readonly PeopleEntry[]>([{ id: 'lin', type: 'user', name: '林晓' }]);
    const root = mount(() => <PeoplePicker source={source} _value={value} aria-label="抄送" />);
    const trigger = root.querySelector<HTMLElement>('button[aria-label="抄送"]')!;
    expect(trigger.getAttribute('aria-haspopup')).toBe('dialog');
    trigger.click();
    await flush();
    const dialog = document.querySelector<HTMLDialogElement>('dialog')!;
    buttonNamed(dialog, '移除林晓').click();
    await flush();
    buttonText(dialog, '取消').click();
    await flush();
    expect(value.map((entry) => entry.name)).toEqual(['林晓']);

    trigger.click();
    await flush();
    buttonNamed(dialog, '进入财务部').click();
    await flush();
    row(dialog, '王建国').click();
    await flush();
    buttonText(dialog, '确定').click();
    await flush();
    expect(value.map((entry) => entry.name)).toEqual(['林晓', '王建国']);

    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true }));
    await flush();
    expect(value.map((entry) => entry.name)).toEqual(['林晓']);
  });

  it('只选一个时触发框里直接是名字，没有标签', () => {
    const root = mount(() => (
      <PeoplePicker
        source={source}
        _value={[{ id: 'lin', type: 'user', name: '林晓' }]}
        max={1}
        aria-label="经办人"
      />
    ));
    expect(root.querySelector('button[aria-label="经办人"]')!.textContent).toBe('林晓');
    expect(root.querySelector('[aria-hidden="true"] button')).toBeNull();
  });
});
