// Cascader：触发框显示整条路径；一列一列往下点、叶子选中后关闭；changeOnSelect 每一级都能选；
// 键盘 ↓ → Enter；懒加载下一级；搜索整条路径
import { beforeAll, describe, expect, it } from 'vitest';
import { nextTick, reactive } from 'vue';
import { mount } from '../../utils/.test/mount';
import { Cascader } from '../Cascader';

interface Region {
  code: string;
  name: string;
  children?: Region[];
  leaf?: boolean;
}

const regions: Region[] = [
  {
    code: 'zj',
    name: '浙江',
    children: [
      {
        code: 'hz',
        name: '杭州',
        children: [
          { code: 'xh', name: '西湖区' },
          { code: 'bj', name: '滨江区' },
        ],
      },
      { code: 'nb', name: '宁波', children: [{ code: 'yz', name: '鄞州区' }] },
    ],
  },
  { code: 'js', name: '江苏', children: [{ code: 'sz', name: '苏州', children: [] }] },
];

const accessors = {
  getKey: (region: Region) => region.code,
  getLabel: (region: Region) => region.name,
  getChildren: (region: Region) => region.children,
};

// happy-dom 没有 popover API
beforeAll(() => {
  const proto = HTMLElement.prototype as unknown as Record<string, unknown>;
  proto.showPopover ??= () => {};
  proto.hidePopover ??= () => {};
});

const flush = async () => {
  for (let index = 0; index < 5; index++) await nextTick();
};
const column = (level: number) =>
  [...document.querySelectorAll<HTMLElement>('[role="listbox"]')][level]!;
const optionTexts = (level: number) =>
  [...column(level).querySelectorAll('[role="option"]')].map((option) => option.textContent);
const option = (level: number, text: string) =>
  [...column(level).querySelectorAll<HTMLElement>('[role="option"]')].find(
    (item) => item.textContent === text,
  )!;
const key = (target: HTMLElement, name: string) =>
  target.dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true }));

describe('Cascader', () => {
  it('触发框显示整条路径；showAllLevels={false} 只显示最后一级', () => {
    const root = mount(() => (
      <>
        <Cascader items={regions} {...accessors} _value={['zj', 'hz', 'xh']} aria-label="地区" />
        <Cascader
          items={regions}
          {...accessors}
          _value={['zj', 'hz', 'xh']}
          showAllLevels={false}
          aria-label="地区"
        />
      </>
    ));
    const [all, last] = root.querySelectorAll('button[role="combobox"]');
    expect(all!.textContent).toBe('浙江 / 杭州 / 西湖区');
    expect(last!.textContent).toBe('西湖区');
  });

  it('点有下一级的项展开下一列，点叶子选中路径并关闭', async () => {
    let path = _state<readonly string[] | null>(null);
    let open = _state(false);
    const root = mount(() => (
      <Cascader
        items={regions}
        {...accessors}
        _value={_bind(path)}
        _open={_bind(open)}
        aria-label="地区"
      />
    ));
    root.querySelector<HTMLButtonElement>('button[role="combobox"]')!.click();
    await flush();
    expect(open).toBe(true);
    expect(optionTexts(0)).toEqual(['浙江', '江苏']);
    option(0, '浙江').click();
    await flush();
    expect(optionTexts(1)).toEqual(['杭州', '宁波']);
    // 默认只能选叶子：点浙江只是展开
    expect(path).toBeNull();
    option(1, '杭州').click();
    await flush();
    option(2, '滨江区').click();
    await flush();
    expect(path).toEqual(['zj', 'hz', 'bj']);
    expect(open).toBe(false);
  });

  it('changeOnSelect：点有下一级的项也选中它，弹出层不关', async () => {
    let path = _state<readonly string[] | null>(null);
    let open = _state(true);
    mount(() => (
      <Cascader
        items={regions}
        {...accessors}
        _value={_bind(path)}
        _open={_bind(open)}
        changeOnSelect
        aria-label="地区"
      />
    ));
    await flush();
    option(0, '浙江').click();
    await flush();
    expect(path).toEqual(['zj']);
    expect(open).toBe(true);
    expect(option(0, '浙江').getAttribute('aria-selected')).toBe('true');
  });

  it('键盘：↓ 移动并显示下一列，→ 进入下一级，Enter 选中叶子', async () => {
    let path = _state<readonly string[] | null>(null);
    mount(() => (
      <Cascader items={regions} {...accessors} _value={_bind(path)} _open aria-label="地区" />
    ));
    await flush();
    const first = column(0);
    first.dispatchEvent(new FocusEvent('focus'));
    await flush();
    expect(first.getAttribute('aria-activedescendant')).toBe(option(0, '浙江').id);
    key(first, 'ArrowDown');
    await flush();
    expect(first.getAttribute('aria-activedescendant')).toBe(option(0, '江苏').id);
    expect(optionTexts(1)).toEqual(['苏州']);
    key(first, 'ArrowUp');
    key(first, 'ArrowRight');
    await flush();
    expect(column(1).getAttribute('aria-activedescendant')).toBe(option(1, '杭州').id);
    key(column(1), 'ArrowRight');
    await flush();
    key(column(2), 'ArrowDown');
    key(column(2), 'Enter');
    await flush();
    expect(path).toEqual(['zj', 'hz', 'bj']);
  });

  it('懒加载：进入还没有下一级的节点时取回来，期间列表忙', async () => {
    const data = reactive<Region[]>([{ code: 'gd', name: '广东', leaf: false }]);
    let resolve!: () => void;
    const loaded: string[] = [];
    mount(() => (
      <Cascader
        items={data}
        {...accessors}
        hasChildren={(region) => region.leaf === false || !!region.children?.length}
        loadChildren={(region) => {
          loaded.push(region.code);
          return new Promise<void>((done) => {
            resolve = () => {
              region.children = [{ code: 'sz', name: '深圳' }];
              done();
            };
          });
        }}
        _open
        aria-label="地区"
      />
    ));
    await flush();
    option(0, '广东').click();
    await flush();
    expect(loaded).toEqual(['gd']);
    expect(column(1).getAttribute('aria-busy')).toBe('true');
    resolve();
    await flush();
    expect(optionTexts(1)).toEqual(['深圳']);
  });

  it('searchable：按整条路径搜索，只列叶子；Enter 选中高亮的一条', async () => {
    let path = _state<readonly string[] | null>(null);
    mount(() => (
      <Cascader
        items={regions}
        {...accessors}
        _value={_bind(path)}
        _open
        searchable
        aria-label="地区"
      />
    ));
    await flush();
    const input = document.querySelector<HTMLInputElement>('input[type="search"]')!;
    input.value = '杭州';
    input.dispatchEvent(new Event('input'));
    await flush();
    expect(optionTexts(0)).toEqual(['浙江 / 杭州 / 西湖区', '浙江 / 杭州 / 滨江区']);
    key(input, 'ArrowDown');
    key(input, 'Enter');
    await flush();
    expect(path).toEqual(['zj', 'hz', 'bj']);
  });
});
