// DatePicker 与 DateRangePicker 的快捷选项：点了写回并关闭、当前值对应的那一项按下、超出范围的不可用；
// DatePicker 的“今天”（选月份时“本月”）；DateRangePicker 的自定义快捷区间（函数时按当时算）；
// 不可选的时间：TimeField、DateField 键入时出错，TimePicker 的列表里不可用
import { beforeAll, describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { todayIso } from '../../utils/data/date';
import { mount } from '../../utils/.test/mount';
import { DatePicker } from '../DatePicker';
import { DateField } from '../DateField';
import { DateRangePicker } from '../DateRangePicker';
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
        value={_bind(value)}
        open={_bind(open)}
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
        <DatePicker value={_bind(day)} granularity="minute" open aria-label="开始时间" />
        <DatePicker value={_bind(month)} granularity="month" open aria-label="账期" />
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
    mount(() => <DatePicker open showToday={false} aria-label="日期" />);
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
        value={_bind(range)}
        open={_bind(open)}
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
        <TimeField value="12:30" isTimeUnavailable={lunch} aria-label="时间" />
        <DateField
          value="2026-10-24T12:15"
          granularity="minute"
          // 周六只上午营业
          isTimeUnavailable={(_, time, date) => date === '2026-10-24' && time.hour >= 12}
          aria-label="预约"
        />
        <DateField
          value="2026-10-23T12:15"
          granularity="minute"
          isTimeUnavailable={(_, time, date) => date === '2026-10-24' && time.hour >= 12}
          aria-label="预约"
        />
        <TimePicker
          value="09:00"
          min="11:00"
          max="13:00"
          step={30}
          isTimeUnavailable={lunch}
          open
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
