// 值的类型：日期组件接受 ISO 字符串与 DateValue（TimeField 接受 Time），写回时保持传入的类型
import {
  CalendarDate,
  CalendarDateTime,
  parseZonedDateTime,
  Time,
  type ZonedDateTime,
} from '@internationalized/date';
import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '../../utils/.test/mount';
import type { DateRange } from '../../utils/data/date';
import { Calendar } from '../Calendar';
import { DateField } from '../DateField';
import { RangeCalendar } from '../RangeCalendar';
import { TimeField } from '../TimeField';

const click = async (root: HTMLElement, date: string) => {
  root.querySelector<HTMLButtonElement>(`[data-date="${date}"]`)!.click();
  await nextTick();
};
const press = async (key: string) => {
  document.activeElement!.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
  await nextTick();
  await nextTick();
};

describe('Calendar', () => {
  it('CalendarDate 进、CalendarDate 出；min 也可以是 CalendarDate', async () => {
    let value = _state.raw<CalendarDate | null>(new CalendarDate(2026, 10, 20));
    const root = mount(() => (
      <Calendar value={_bind(value)} min={new CalendarDate(2026, 10, 10)} />
    ));
    expect(root.querySelector('[data-date="2026-10-05"]')!.getAttribute('aria-disabled')).toBe(
      'true',
    );
    await click(root, '2026-10-22');
    expect(value).toBeInstanceOf(CalendarDate);
    expect(value!.toString()).toBe('2026-10-22');
  });

  it('CalendarDateTime 选了另一天，时间不变', async () => {
    let value = _state.raw<CalendarDateTime | null>(new CalendarDateTime(2026, 10, 20, 9, 30));
    const root = mount(() => <Calendar value={_bind(value)} />);
    await click(root, '2026-10-22');
    expect(value!.toString()).toBe('2026-10-22T09:30:00');
  });

  it('一开始为空：valueType="dateValue" 写 CalendarDate，默认写 ISO 字符串', async () => {
    let object = _state.raw<CalendarDate | null>(null);
    let text = _state<string | null>(null);
    const root = mount(() => (
      <>
        <div class="a">
          <Calendar value={_bind(object)} valueType="dateValue" defaultFocused="2026-10-01" />
        </div>
        <div class="b">
          <Calendar value={_bind(text)} defaultFocused="2026-10-01" />
        </div>
      </>
    ));
    await click(root.querySelector('.a')!, '2026-10-03');
    await click(root.querySelector('.b')!, '2026-10-03');
    expect(object).toBeInstanceOf(CalendarDate);
    expect(text).toBe('2026-10-03');
  });
});

describe('RangeCalendar', () => {
  it('ZonedDateTime 的区间：两端保留时区与时间', async () => {
    const at = (iso: string) => parseZonedDateTime(`${iso}T15:00[Asia/Tokyo]`);
    let value = _state.raw<DateRange<ZonedDateTime> | null>({
      start: at('2026-10-01'),
      end: at('2026-10-02'),
    });
    const root = mount(() => <RangeCalendar value={_bind(value)} />);
    await click(root, '2026-10-05');
    await click(root, '2026-10-08');
    expect(value!.end.toString()).toBe('2026-10-08T15:00:00+09:00[Asia/Tokyo]');
  });
});

describe('DateField、TimeField', () => {
  it('DateField：ZonedDateTime 改了月份，时区与时间不丢', async () => {
    let value = _state.raw<ZonedDateTime | null>(
      parseZonedDateTime('2026-10-20T08:00[America/New_York]'),
    );
    const root = mount(() => <DateField value={_bind(value)} aria-label="日期" />);
    root.querySelector<HTMLElement>('[data-type="month"]')!.focus();
    await press('ArrowUp');
    expect(value!.toString()).toBe('2026-11-20T08:00:00-05:00[America/New_York]');
  });

  it('TimeField：Time 进、Time 出', async () => {
    let value = _state.raw<Time | null>(new Time(9, 30));
    const root = mount(() => <TimeField value={_bind(value)} aria-label="时间" />);
    expect(root.querySelector('[role="group"]')!.textContent).toBe('09:30');
    root.querySelector<HTMLElement>('[data-type="hour"]')!.focus();
    await press('ArrowUp');
    expect(value).toBeInstanceOf(Time);
    expect(value!.toString()).toBe('10:30:00');
  });
});
