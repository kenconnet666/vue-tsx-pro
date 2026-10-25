// DatePicker 与 DateRangePicker 的快捷选项：点了写回并关闭、当前值对应的那一项按下、超出范围的不可用；
// DatePicker 的“今天”（选月份时“本月”）；DateRangePicker 的自定义快捷区间（函数时按当时算）；
// 不可选的时间：TimeField、DateField 键入时出错，TimePicker 的列表里不可用
import { beforeAll, describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { todayIso } from '../../utils/data/date';
import { mount } from '../../utils/.test/mount';
import { DatePicker } from '../DatePicker';
import { DateField } from '../DateField';
import { RangeCalendar } from '../RangeCalendar';
import { DateRangePicker } from '../DateRangePicker';
import { QuarterCalendar } from '../QuarterCalendar';
import { TimeField } from '../TimeField';
import { TimePicker } from '../TimePicker';
import type { DateRange } from '../../utils/data/date';

// happy-dom 没有 popover API
beforeAll(() => {
  const proto = HTMLElement.prototype as unknown as Record<string, unknown>;
  proto.showPopover ??= () => {};
  proto.hidePopover ??= () => {};
});

const flush = async () => {
  for (let index = 0; index < 4; index++) await nextTick();
};
const button = (text: string) =>
  [...document.querySelectorAll<HTMLButtonElement>('[role="dialog"] button')].find(
    (item) => item.textContent === text,
  )!;

describe('DatePicker', () => {
  it('快捷选项：点了写回并关闭；当前值那一项按下；超出范围的不可用', async () => {
    let value = _state<string | null>('2026-10-01');
    let open = _state(true);
    mount(() => (
      <DatePicker
        _value={_bind(value)}
        _open={_bind(open)}
        max="2026-12-31"
        presets={[
          { label: '国庆', value: '2026-10-01' },
          { label: '元旦', value: () => '2027-01-01' },
          { label: '月底', value: '2026-10-31' },
        ]}
        aria-label="日期"
      />
    ));
    await flush();
    expect(button('国庆').getAttribute('aria-pressed')).toBe('true');
    expect(button('元旦').disabled).toBe(true);
    button('月底').click();
    await flush();
    expect(value).toBe('2026-10-31');
    expect(open).toBe(false);
  });

  it('“今天”写回今天（带时间的粒度补 00:00）；选月份时是“本月”', async () => {
    let day = _state<string | null>(null);
    let month = _state<string | null>(null);
    mount(() => (
      <>
        <DatePicker _value={_bind(day)} granularity="minute" _open aria-label="开始时间" />
        <DatePicker _value={_bind(month)} granularity="month" _open aria-label="账期" />
      </>
    ));
    await flush();
    button('今天').click();
    button('本月').click();
    await flush();
    expect(day).toBe(`${todayIso()}T00:00`);
    expect(month).toBe(todayIso().slice(0, 7));
  });

  it('showToday={false} 时没有“今天”', async () => {
    mount(() => <DatePicker _open showToday={false} aria-label="日期" />);
    await flush();
    expect(button('今天')).toBeUndefined();
  });
});

describe('DateRangePicker', () => {
  it('自定义快捷区间与内置的名字混用；点了写回区间并关闭', async () => {
    let range = _state<DateRange<string> | null>(null);
    let open = _state(true);
    mount(() => (
      <DateRangePicker
        _value={_bind(range)}
        _open={_bind(open)}
        presets={[
          'today',
          { label: '第三季度', value: { start: '2026-07-01', end: '2026-09-30' } },
          { label: '上个结算周期', value: () => ({ start: '2026-09-26', end: '2026-10-25' }) },
        ]}
        aria-label="区间"
      />
    ));
    await flush();
    expect(button('今天')).toBeDefined();
    button('第三季度').click();
    await flush();
    expect(range).toEqual({ start: '2026-07-01', end: '2026-09-30' });
    expect(open).toBe(false);
    open = true;
    await flush();
    expect(button('第三季度').getAttribute('aria-pressed')).toBe('true');
  });
});

describe('不可选的时间', () => {
  it('TimeField、DateField：键入不可选的时刻时外壳出错；TimePicker 的列表里那几项不可用', async () => {
    const lunch = (_: string, time: { hour: number }) => time.hour === 12;
    const root = mount(() => (
      <>
        <TimeField _value="12:30" isTimeUnavailable={lunch} aria-label="时间" />
        <DateField
          _value="2026-10-24T12:15"
          granularity="minute"
          // 周六只上午营业
          isTimeUnavailable={(_, time, date) => date === '2026-10-24' && time.hour >= 12}
          aria-label="预约"
        />
        <DateField
          _value="2026-10-23T12:15"
          granularity="minute"
          isTimeUnavailable={(_, time, date) => date === '2026-10-24' && time.hour >= 12}
          aria-label="预约"
        />
        <TimePicker
          _value="09:00"
          min="11:00"
          max="13:00"
          step={30}
          isTimeUnavailable={lunch}
          _open
          aria-label="开会"
        />
      </>
    ));
    await flush();
    // 各个外壳（前四个子元素）：只有周五那个预约不出错
    expect(
      [...root.children].slice(0, 4).map((shell) => shell.hasAttribute('data-invalid')),
    ).toEqual([true, true, false, true]);
    const options = [...document.querySelectorAll<HTMLElement>('[role="option"]')].map(
      (option) => `${option.textContent}:${option.getAttribute('aria-disabled') ?? 'false'}`,
    );
    expect(options).toEqual([
      '11:00:false',
      '11:30:false',
      '12:00:true',
      '12:30:true',
      '13:00:false',
    ]);
  });
});

describe('按月、按年与日期时间的区间', () => {
  const cell = (date: string) =>
    document.querySelector<HTMLButtonElement>(
      `[role="dialog"] [data-date="${date}"], [data-date="${date}"]`,
    )!;

  it('RangeCalendar 按月选：写回整月（开始那月的 1 日到结束那月的最后一天）', async () => {
    let range = _state<DateRange<string> | null>({ start: '2026-01-01', end: '2026-01-31' });
    mount(() => <RangeCalendar _value={_bind(range)} granularity="month" aria-label="预算期间" />);
    await flush();
    cell('2026-03-01').click();
    await flush();
    cell('2026-05-01').click();
    await flush();
    expect(range).toEqual({ start: '2026-03-01', end: '2026-05-31' });
  });

  it('DateRangePicker 按月：值是 YYYY-MM；快捷区间截成月', async () => {
    let range = _state<DateRange<string> | null>(null);
    let open = _state(true);
    const root = mount(() => (
      <DateRangePicker
        _value={_bind(range)}
        _open={_bind(open)}
        granularity="month"
        presets={[{ label: '上半年', value: { start: '2026-01-01', end: '2026-06-30' } }]}
        aria-label="预算期间"
      />
    ));
    await flush();
    // 两组分段都只有年、月
    expect(root.querySelectorAll('[data-type="day"]')).toHaveLength(0);
    cell('2026-02-01').click();
    await flush();
    cell('2026-04-01').click();
    await flush();
    expect(range).toEqual({ start: '2026-02', end: '2026-04' });
    open = true;
    await flush();
    button('上半年').click();
    await flush();
    expect(range).toEqual({ start: '2026-01', end: '2026-06' });
  });

  it('DateRangePicker 日期时间：日历选日期，开始补 00:00、结束补 23:59，已经填了的时间不变', async () => {
    let range = _state<DateRange<string> | null>({
      start: '2026-10-05T08:30',
      end: '2026-10-06T18:00',
    });
    mount(() => (
      <DateRangePicker _value={_bind(range)} granularity="minute" _open aria-label="维护窗口" />
    ));
    await flush();
    cell('2026-10-10').click();
    await flush();
    cell('2026-10-12').click();
    await flush();
    expect(range).toEqual({ start: '2026-10-10T08:30', end: '2026-10-12T18:00' });
    range = null;
    await flush();
  });
});

describe('选季度、选周', () => {
  it('DatePicker granularity="quarter"：季度面板选一格写回 YYYY-Qn，“本季度”', async () => {
    let quarter = _state<string | null>('2026-Q2');
    let open = _state(true);
    mount(() => (
      <DatePicker
        _value={_bind(quarter)}
        _open={_bind(open)}
        granularity="quarter"
        max="2026-08-15"
        aria-label="考核季度"
      />
    ));
    await flush();
    const cell = (key: string) =>
      document.querySelector<HTMLButtonElement>(`[data-quarter="${key}"]`)!;
    expect(cell('2026-Q2').hasAttribute('data-selected')).toBe(true);
    // 第四季度整段晚于 max：不可用
    expect(cell('2026-Q4').getAttribute('aria-disabled')).toBe('true');
    // 第三季度有一部分在范围内：可选
    cell('2026-Q3').click();
    await flush();
    expect(quarter).toBe('2026-Q3');
    expect(open).toBe(false);
  });

  it('DatePicker granularity="week"：日历按 ISO 周排（周一开始、有周数），点哪天都写回它那一周', async () => {
    let week = _state<string | null>('2026-W43');
    mount(() => <DatePicker _value={_bind(week)} granularity="week" _open aria-label="周报" />);
    await flush();
    const weekday = document.querySelector('[role="dialog"] thead th:not(:first-child)')!;
    expect(weekday.textContent).toBe('一');
    // 已选那一周的周一是已选的那一格
    expect(
      document
        .querySelector('[role="dialog"] [data-date="2026-10-19"]')!
        .hasAttribute('data-selected'),
    ).toBe(true);
    document.querySelector<HTMLButtonElement>('[role="dialog"] [data-date="2026-10-29"]')!.click();
    await flush();
    expect(week).toBe('2026-W44');
  });
});

describe('季度、周的区间', () => {
  const quarter = (key: string) =>
    document.querySelector<HTMLButtonElement>(`[data-quarter="${key}"]`)!;

  it('DateRangePicker granularity="quarter"：季度面板先选开始、再选结束（可以跨年翻页）', async () => {
    let range = _state<DateRange<string> | null>(null);
    let open = _state(true);
    mount(() => (
      <DateRangePicker
        _value={_bind(range)}
        _open={_bind(open)}
        granularity="quarter"
        aria-label="对比区间"
      />
    ));
    await flush();
    quarter(`${new Date().getFullYear()}-Q3`).click();
    await flush();
    // 翻到下一年再选结束
    document
      .querySelector<HTMLButtonElement>('[role="dialog"] button[aria-label="下一年"]')!
      .click();
    await flush();
    const next = new Date().getFullYear() + 1;
    quarter(`${next}-Q2`).click();
    await flush();
    expect(range).toEqual({ start: `${next - 1}-Q3`, end: `${next}-Q2` });
    expect(open).toBe(false);
  });

  it('QuarterCalendar 的键盘：←→ 移动（到头换年）、Page Down 换年、Enter 选中', async () => {
    let value = _state<string | null>('2026-Q4');
    mount(() => <QuarterCalendar _value={_bind(value)} aria-label="季度" />);
    await flush();
    const grid = document.querySelector<HTMLElement>('[role="grid"]')!;
    quarter('2026-Q4').focus();
    const press = async (key: string) => {
      grid.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
      await flush();
    };
    await press('ArrowRight');
    expect(document.activeElement).toBe(quarter('2027-Q1'));
    await press('PageUp');
    expect(document.activeElement).toBe(quarter('2026-Q1'));
    (document.activeElement as HTMLButtonElement).click();
    await flush();
    expect(value).toBe('2026-Q1');
  });

  it('DateRangePicker granularity="week"：日历选两天，写回它们各自所在的周', async () => {
    let range = _state<DateRange<string> | null>({ start: '2026-W40', end: '2026-W41' });
    mount(() => (
      <DateRangePicker _value={_bind(range)} granularity="week" _open aria-label="周区间" />
    ));
    await flush();
    const day = (date: string) =>
      document.querySelector<HTMLButtonElement>(`[role="dialog"] [data-date="${date}"]`)!;
    day('2026-10-21').click();
    await flush();
    day('2026-10-29').click();
    await flush();
    expect(range).toEqual({ start: '2026-W43', end: '2026-W44' });
  });
});
