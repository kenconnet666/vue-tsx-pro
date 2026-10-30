// 选择类：Picker（点选、方向键、拖动对齐、联动重置）、DatePicker（月份天数修正、范围）、TimePicker（步长）、
// Cascader（逐级选到完成）、省市区数据、Calendar（区间与确认）、DropdownMenu（展开、选择、收起）
import { describe, expect, it, vi } from 'vitest';
import { nextTick, ref } from 'vue';
import { areaOptions } from '../../area';
import { mount } from '../../utils/.test/mount';
import { measureAs, touch, WithHost } from '../../utils/.test/touch';
import { Calendar, type CalendarValue } from '../Calendar';
import { Cascader, findPath } from '../Cascader';
import { DatePicker, TimePicker } from '../DatePicker';
import { DropdownItem, DropdownMenu } from '../DropdownMenu';
import { Picker, resolveColumns, type PickerOption, type PickerValue } from '../Picker';

const wait = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms));
const fruits: PickerOption[] = ['苹果', '香蕉', '橙子', '葡萄', '西瓜'].map((text, index) => ({
  text,
  value: index,
  disabled: index === 2,
}));
const cascade: PickerOption[] = [
  {
    text: '浙江',
    value: 'zj',
    children: [
      { text: '杭州', value: 'hz' },
      { text: '宁波', value: 'nb' },
    ],
  },
  { text: '江苏', value: 'js', children: [{ text: '南京', value: 'nj' }] },
];

describe('Picker', () => {
  it('点一项选中；方向键跳过禁用的项；确认给出值与选项', async () => {
    const value = ref<PickerValue[]>([0]);
    const onConfirm = vi.fn();
    const root = mount(() => (
      <Picker columns={fruits} _value={value.value} onConfirm={onConfirm} />
    ));
    const items = root.querySelectorAll<HTMLElement>('[role="option"]');
    items[1]!.click();
    await nextTick();
    expect(value.value).toEqual([1]);
    root
      .querySelector('[role="listbox"]')!
      .dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    await nextTick();
    expect(value.value).toEqual([3]);
    root.querySelectorAll<HTMLButtonElement>('button')[1]!.click();
    expect(onConfirm).toHaveBeenCalledWith({ values: [3], options: [fruits[3]] });
  });

  it('拖动按行高对齐：往上拖两行，第二项禁用时停在最近的可选项', async () => {
    const value = ref<PickerValue[]>([0]);
    // 5 行可见，列高 220px → 一行 44px
    const root = mount(() => (
      <WithHost host={{ measure: measureAs({ height: 220 }) }}>
        <Picker columns={fruits} _value={value.value} showToolbar={false} />
      </WithHost>
    ));
    await wait();
    // 慢慢拖（每步隔 50ms）：速度低于惯性的门槛，只按拖动的距离对齐
    vi.useFakeTimers();
    const column = root.querySelector('[role="listbox"]')!;
    touch(column, 'touchstart', 100, 200);
    for (let step = 1; step <= 8; step++) {
      vi.advanceTimersByTime(50);
      touch(column, 'touchmove', 100, 200 - step * 11);
    }
    touch(column, 'touchend', 100, 112);
    vi.useRealTimers();
    await nextTick();
    // 拖了两行（88px）到第 2 项，它是禁用的橙子：对齐到最近的可选项
    expect(value.value).toEqual([3]);
  });

  it('联动：换了上一级，下一级重置到第一个', async () => {
    expect(resolveColumns(cascade, ['zj', 'nb']).values).toEqual(['zj', 'nb']);
    const value = ref<PickerValue[]>(['zj', 'nb']);
    const root = mount(() => <Picker columns={cascade} _value={value.value} />);
    const lists = root.querySelectorAll('[role="listbox"]');
    lists[0]!.querySelectorAll<HTMLElement>('[role="option"]')[1]!.click();
    await nextTick();
    expect(value.value).toEqual(['js', 'nj']);
  });
});

describe('DatePicker / TimePicker', () => {
  it('从 3 月 31 日换到 2 月时日子修正成 2 月的最后一天；超出范围的年份不出现', async () => {
    const date = ref(new Date(2024, 2, 31));
    const root = mount(() => (
      <DatePicker
        _value={date.value}
        minDate={new Date(2020, 0, 1)}
        maxDate={new Date(2025, 11, 31)}
      />
    ));
    const [years, months] = root.querySelectorAll('[role="listbox"]');
    expect(years!.querySelectorAll('[role="option"]')).toHaveLength(6);
    months!.querySelectorAll<HTMLElement>('[role="option"]')[1]!.click();
    await nextTick();
    expect(date.value.getMonth()).toBe(1);
    expect(date.value.getDate()).toBe(29);
  });

  it('时间按步长：15 分钟一档', async () => {
    const time = ref('09:20');
    const root = mount(() => <TimePicker _value={time.value} minuteStep={15} />);
    const minutes = root
      .querySelectorAll('[role="listbox"]')[1]!
      .querySelectorAll('[role="option"]');
    expect([...minutes].map((item) => item.textContent)).toEqual(['00分', '15分', '30分', '45分']);
    (minutes[2] as HTMLElement).click();
    await nextTick();
    expect(time.value).toBe('09:30');
  });
});

describe('Cascader / 省市区', () => {
  it('逐级选：选了有下一级的项换到下一级，选到最后完成；按值找回路径', async () => {
    const value = ref<string | number | undefined>(undefined);
    const onFinish = vi.fn();
    const root = mount(() => (
      <Cascader options={cascade} _value={value.value} onFinish={onFinish} />
    ));
    const option = (text: string) =>
      [...root.querySelectorAll<HTMLElement>('[role="option"]')].find(
        (item) => item.textContent === text,
      )!;
    option('浙江').click();
    await nextTick();
    expect(root.querySelectorAll('[role="tab"]')).toHaveLength(2);
    option('宁波').click();
    await nextTick();
    expect(value.value).toBe('nb');
    expect(
      onFinish.mock.calls[0]![0].selectedOptions.map((item: PickerOption) => item.text),
    ).toEqual(['浙江', '宁波']);
    expect(findPath(cascade, 'nj').map((item) => item.value)).toEqual(['js', 'nj']);
  });

  it('省市区：省、市、区三级；直辖市补上市一级', () => {
    const provinces = areaOptions();
    expect(provinces.length).toBeGreaterThan(30);
    const zhejiang = provinces.find((item) => item.text === '浙江省')!;
    const hangzhou = zhejiang.children!.find((item) => item.text === '杭州市')!;
    expect(hangzhou.children!.some((item) => item.text === '西湖区')).toBe(true);
    expect(areaOptions({ depth: 1 })[0]!.children).toBeUndefined();
  });
});

describe('Calendar', () => {
  it('区间：先点开始再点结束，中间的日子标出来；确认写回 [开始, 结束]', async () => {
    const value = ref<CalendarValue | null>(null);
    const root = mount(() => (
      <Calendar
        type="range"
        _value={value.value}
        minDate={new Date(2026, 9, 1)}
        maxDate={new Date(2026, 9, 31)}
      />
    ));
    const day = (n: number) =>
      [...root.querySelectorAll<HTMLElement>('[role="gridcell"]')].find(
        (cell) =>
          cell.textContent!.startsWith(String(n)) &&
          cell.textContent!.replace(/\D/g, '') === String(n),
      )!;
    day(3).click();
    await nextTick();
    const confirm = root.querySelector<HTMLButtonElement>('button')!;
    expect(confirm.disabled).toBe(true);
    day(6).click();
    await nextTick();
    expect(day(3).textContent).toContain('开始');
    expect(day(6).textContent).toContain('结束');
    confirm.click();
    await nextTick();
    expect((value.value as Date[]).map((date) => date.getDate())).toEqual([3, 6]);
  });
});

describe('DropdownMenu', () => {
  it('点标题展开，选了一项写回并收起；标题显示选中的', async () => {
    const sort = ref<string | number | undefined>('default');
    const root = mount(() => (
      <WithHost host={{ measure: measureAs({ top: 0, height: 48 }) }}>
        <DropdownMenu>
          <DropdownItem
            _value={sort.value}
            options={[
              { text: '综合排序', value: 'default' },
              { text: '销量优先', value: 'sales' },
            ]}
          />
        </DropdownMenu>
      </WithHost>
    ));
    // 各项在挂上时登记，菜单的标题下一轮才画出来
    await nextTick();
    const title = root.querySelector<HTMLButtonElement>('button[aria-haspopup]')!;
    expect(title.textContent).toBe('综合排序');
    title.click();
    await wait();
    await nextTick();
    const items = document.body.querySelectorAll<HTMLElement>('[role="menuitemradio"]');
    expect(items).toHaveLength(2);
    items[1]!.click();
    await nextTick();
    expect(sort.value).toBe('sales');
    expect(title.getAttribute('aria-expanded')).toBe('false');
    expect(title.textContent).toBe('销量优先');
  });
});
